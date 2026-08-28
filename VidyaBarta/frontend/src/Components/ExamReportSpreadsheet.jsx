import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FaTable, FaFileExcel, FaFilePdf, FaSave, FaUpload, FaSearch, 
  FaSpinner, FaCheckCircle, FaExclamationTriangle, FaEye, FaEdit, 
  FaArrowLeft, FaAward, FaGraduationCap 
} from 'react-icons/fa';

const GRADE_RULES = [
  { min: 90, grade: 'A1', gpa: '10.0', label: 'Outstanding' },
  { min: 80, grade: 'A2', gpa: '9.0', label: 'Excellent' },
  { min: 70, grade: 'B1', gpa: '8.0', label: 'Very Good' },
  { min: 60, grade: 'B2', gpa: '7.0', label: 'Good' },
  { min: 50, grade: 'C1', gpa: '6.0', label: 'Above Average' },
  { min: 40, grade: 'C2', gpa: '5.0', label: 'Average' },
  { min: 33, grade: 'D', gpa: '4.0', label: 'Pass' },
  { min: 0, grade: 'E/F', gpa: '0.0', label: 'Needs Improvement' },
];

const getGrade = (percentage) => {
  const p = parseFloat(percentage) || 0;
  for (const rule of GRADE_RULES) {
    if (p >= rule.min) return rule.grade;
  }
  return 'E/F';
};

const ExamReportSpreadsheet = ({ apiUrl, token, onBack }) => {
  // Selection states
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  
  // Data states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [marksGrid, setMarksGrid] = useState({}); // { [studentId_subject]: { theory: number, practical: number, max: number } }
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected student for report card preview modal
  const [previewStudent, setPreviewStudent] = useState(null);
  const gridRef = useRef(null);

  // 1. Fetch exams list on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/exams`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const examList = res.data || [];
        setExams(examList);
        if (examList.length > 0) {
          setSelectedExamId(examList[0].id);
          setSelectedClass(examList[0].class_level || '');
        }
      } catch (err) {
        console.error('Failed to load exams', err);
        setErrorMsg('Failed to load exams list');
      } finally {
        setLoading(false);
      }
    };
    if (apiUrl && token) fetchExams();
  }, [apiUrl, token]);

  // Current selected exam object
  const currentExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  // 2. Fetch exam timetable, students, and existing marks when selected exam/class changes
  useEffect(() => {
    if (!selectedExamId) return;

    const loadExamData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setSaveSuccess(false);

        // A. Fetch Exam Timetable (defines subjects, max marks, passing marks)
        const ttRes = await axios.get(`${apiUrl}/exams/${selectedExamId}/timetable?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ttData = ttRes.data || [];
        setTimetable(ttData);

        // B. Fetch existing Marks
        const mRes = await axios.get(`${apiUrl}/exams/${selectedExamId}/marks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const marksData = mRes.data || [];

        // C. Fetch Students for the class
        const targetClass = currentExam?.class_level || selectedClass || '';
        const parts = targetClass.split(' ');
        let stuUrl = `${apiUrl}/students?class_level=${encodeURIComponent(parts[0])}`;
        if (parts[1]) stuUrl += `&section=${encodeURIComponent(parts[1])}`;

        const sRes = await axios.get(stuUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const stuList = sRes.data.data || sRes.data || [];
        stuList.sort((a, b) => (parseInt(a.roll_number) || 9999) - (parseInt(b.roll_number) || 9999) || (a.name || '').localeCompare(b.name || ''));
        setStudents(stuList);

        // Build marks grid map: key = `${student_id}_${subject}`
        const grid = {};
        marksData.forEach(m => {
          const key = `${m.student_id}_${m.subject}`;
          grid[key] = {
            id: m.id,
            theory: m.marks_obtained !== null && m.marks_obtained !== undefined ? m.marks_obtained : '',
            practical: m.practical_marks_obtained !== null && m.practical_marks_obtained !== undefined ? m.practical_marks_obtained : '',
            max: m.max_marks || 100
          };
        });
        setMarksGrid(grid);
      } catch (err) {
        console.error('Failed to load exam details', err);
        setErrorMsg('Failed to load students and marks data for this exam.');
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, [selectedExamId, currentExam, apiUrl, token]);

  // Filter students based on section and search term
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSection = selectedSection === 'ALL' || (s.section || 'A').toUpperCase() === selectedSection.toUpperCase();
      const term = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        (s.name || s.student_name || '').toLowerCase().includes(term) ||
        String(s.roll_number || '').includes(term) ||
        (s.admission_id || s.admissionId || '').toLowerCase().includes(term);
      return matchSection && matchSearch;
    });
  }, [students, selectedSection, searchTerm]);

  // Unique sections available in student list
  const availableSections = useMemo(() => {
    const secs = new Set(students.map(s => (s.section || 'A').toUpperCase()));
    return ['ALL', ...Array.from(secs).sort()];
  }, [students]);

  // 3. Compute student row totals, percentages, grade, rank, and pass/fail
  const calculatedRows = useMemo(() => {
    if (!filteredStudents.length) return [];

    const computed = filteredStudents.map(student => {
      let totalObtained = 0;
      let totalMax = 0;
      let subjectsPassed = 0;
      let subjectsCount = timetable.length;
      let hasFailedSubject = false;

      const subjectScores = {};

      timetable.forEach(t => {
        const key = `${student.id}_${t.subject}`;
        const mark = marksGrid[key] || {};
        const th = parseFloat(mark.theory) || 0;
        const pr = parseFloat(mark.practical) || 0;
        const subTotal = th + pr;
        
        const subMax = parseFloat(t.total_marks || t.max_marks || 100);
        const passMarks = parseFloat(t.passing_marks || (subMax * 0.33));
        const isEntered = mark.theory !== '' && mark.theory !== undefined;

        if (isEntered) {
          totalObtained += subTotal;
          totalMax += subMax;
          if (subTotal >= passMarks) {
            subjectsPassed += 1;
          } else {
            hasFailedSubject = true;
          }
        }

        subjectScores[t.subject] = {
          theory: mark.theory ?? '',
          practical: mark.practical ?? '',
          total: subTotal,
          max: subMax,
          isPassed: subTotal >= passMarks,
          isEntered
        };
      });

      const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      const grade = getGrade(percentage);
      const isPassed = !hasFailedSubject && subjectsPassed === subjectsCount && totalMax > 0;
      const status = totalMax === 0 ? 'Not Entered' : isPassed ? 'PASSED' : subjectsPassed >= Math.ceil(subjectsCount / 2) ? 'COMPARTMENT' : 'FAILED';

      return {
        student,
        subjectScores,
        totalObtained,
        totalMax,
        percentage,
        grade,
        status,
        isPassed
      };
    });

    // Compute Ranks based on total obtained (descending)
    const sorted = [...computed].sort((a, b) => b.totalObtained - a.totalObtained);
    let rank = 1;
    sorted.forEach((item, idx) => {
      if (idx > 0 && item.totalObtained < sorted[idx - 1].totalObtained) {
        rank = idx + 1;
      }
      item.rank = item.totalMax > 0 ? rank : '-';
    });

    return computed;
  }, [filteredStudents, timetable, marksGrid]);

  // 4. Compute column-wise statistics for footer
  const columnStats = useMemo(() => {
    if (!timetable.length || !calculatedRows.length) return {};

    const stats = {};
    timetable.forEach(t => {
      let sum = 0;
      let count = 0;
      let highest = -Infinity;
      let lowest = Infinity;
      let passCount = 0;

      calculatedRows.forEach(row => {
        const score = row.subjectScores[t.subject];
        if (score && score.isEntered) {
          sum += score.total;
          count += 1;
          if (score.total > highest) highest = score.total;
          if (score.total < lowest) lowest = score.total;
          if (score.isPassed) passCount += 1;
        }
      });

      stats[t.subject] = {
        avg: count > 0 ? (sum / count).toFixed(1) : '-',
        highest: count > 0 ? highest : '-',
        lowest: count > 0 ? lowest : '-',
        passRate: count > 0 ? `${((passCount / count) * 100).toFixed(1)}%` : '-',
        enteredCount: count
      };
    });

    const totalMarksList = calculatedRows.filter(r => r.totalMax > 0).map(r => r.totalObtained);
    stats._overall = {
      avg: totalMarksList.length ? (totalMarksList.reduce((a, b) => a + b, 0) / totalMarksList.length).toFixed(1) : '-',
      highest: totalMarksList.length ? Math.max(...totalMarksList) : '-',
      lowest: totalMarksList.length ? Math.min(...totalMarksList) : '-',
      passedTotal: calculatedRows.filter(r => r.isPassed).length
    };

    return stats;
  }, [timetable, calculatedRows]);

  // Handle cell mark edit
  const handleCellChange = (studentId, subject, field, value) => {
    const key = `${studentId}_${subject}`;
    setMarksGrid(prev => {
      const current = prev[key] || { theory: '', practical: '', max: 100 };
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value === '' ? '' : Math.max(0, parseFloat(value) || 0)
        }
      };
    });
    setSaveSuccess(false);
  };

  // Keyboard navigation across the spreadsheet
  const handleKeyDown = (e, sIdx, subIdx, field) => {
    const totalStudents = filteredStudents.length;
    const totalSubjects = timetable.length;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (sIdx < totalStudents - 1) {
        const nextInput = document.getElementById(`cell-${sIdx + 1}-${subIdx}-${field}`);
        nextInput?.focus();
        nextInput?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (sIdx > 0) {
        const prevInput = document.getElementById(`cell-${sIdx - 1}-${subIdx}-${field}`);
        prevInput?.focus();
        prevInput?.select();
      }
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      if (e.key === 'ArrowRight' && e.target.selectionStart !== e.target.value.length) return;
      if (subIdx < totalSubjects - 1) {
        e.preventDefault();
        const rightInput = document.getElementById(`cell-${sIdx}-${subIdx + 1}-${field}`);
        rightInput?.focus();
        rightInput?.select();
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.target.selectionStart !== 0) return;
      if (subIdx > 0) {
        e.preventDefault();
        const leftInput = document.getElementById(`cell-${sIdx}-${subIdx - 1}-${field}`);
        leftInput?.focus();
        leftInput?.select();
      }
    }
  };

  // Handle Clipboard Paste from Excel / Google Sheets
  const handlePaste = (e, startSIdx, startSubIdx) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData || (!clipboardData.includes('\t') && !clipboardData.includes('\n'))) return;
    
    e.preventDefault();
    const rows = clipboardData.split(/\r\n|\n|\r/).filter(r => r.trim() !== '');
    
    setMarksGrid(prev => {
      const nextGrid = { ...prev };
      rows.forEach((rowStr, rOffset) => {
        const targetSIdx = startSIdx + rOffset;
        if (targetSIdx >= filteredStudents.length) return;
        const student = filteredStudents[targetSIdx];

        const cells = rowStr.split('\t');
        cells.forEach((cellVal, cOffset) => {
          const targetSubIdx = startSubIdx + cOffset;
          if (targetSubIdx >= timetable.length) return;
          const t = timetable[targetSubIdx];

          const val = parseFloat(cellVal.trim());
          if (!isNaN(val)) {
            const key = `${student.id}_${t.subject}`;
            nextGrid[key] = {
              ...(nextGrid[key] || {}),
              theory: val,
              max: t.total_marks || t.max_marks || 100
            };
          }
        });
      });
      return nextGrid;
    });
    setSaveSuccess(false);
  };

  // 5. Save all marks to Backend Database
  const handleSaveMarks = async () => {
    if (!selectedExamId) return;
    try {
      setSaving(true);
      setErrorMsg('');
      
      const payload = [];
      filteredStudents.forEach(student => {
        timetable.forEach(t => {
          const key = `${student.id}_${t.subject}`;
          const m = marksGrid[key];
          if (m && (m.theory !== '' || m.practical !== '')) {
            payload.push({
              student_id: student.id,
              subject: t.subject,
              marks_obtained: m.theory !== '' ? parseFloat(m.theory) : 0,
              practical_marks_obtained: m.practical !== '' ? parseFloat(m.practical) : null,
              max_marks: parseFloat(t.total_marks || t.max_marks || 100)
            });
          }
        });
      });

      if (payload.length === 0) {
        alert('No marks entered to save.');
        setSaving(false);
        return;
      }

      await axios.post(`${apiUrl}/exams/${selectedExamId}/marks/subject-teacher`, {
        marks: payload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save marks', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save marks to database.');
    } finally {
      setSaving(false);
    }
  };

  // 6. Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (!calculatedRows.length) return alert('No data to export.');

    const headers = ['Roll No', 'Admission ID', 'Student Name', 'Section'];
    timetable.forEach(t => {
      headers.push(`${t.subject} (Max ${t.total_marks || t.max_marks || 100})`);
    });
    headers.push('Total Obtained', 'Max Marks', 'Percentage (%)', 'Grade', 'Rank', 'Status');

    const sheetData = [
      [`${currentExam?.name || 'Exam'} - Class ${selectedClass || ''} Marksheet & Report`],
      [`Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Students: ${calculatedRows.length}`],
      [],
      headers
    ];

    calculatedRows.forEach(row => {
      const student = row.student;
      const rowData = [
        student.roll_number || '',
        student.admission_id || student.admissionId || '',
        student.name || student.student_name || '',
        student.section || 'A'
      ];

      timetable.forEach(t => {
        const score = row.subjectScores[t.subject];
        rowData.push(score && score.isEntered ? score.total : '-');
      });

      rowData.push(
        row.totalObtained,
        row.totalMax,
        row.percentage,
        row.grade,
        row.rank,
        row.status
      );

      sheetData.push(rowData);
    });

    sheetData.push([]);
    const avgRow = ['CLASS AVERAGE', '', '', ''];
    const highRow = ['HIGHEST SCORE', '', '', ''];
    const lowRow = ['LOWEST SCORE', '', '', ''];
    const passRow = ['PASS RATE (%)', '', '', ''];

    timetable.forEach(t => {
      const st = columnStats[t.subject] || {};
      avgRow.push(st.avg || '-');
      highRow.push(st.highest || '-');
      lowRow.push(st.lowest || '-');
      passRow.push(st.passRate || '-');
    });

    avgRow.push(columnStats._overall?.avg || '-', '', '', '', '', '');
    highRow.push(columnStats._overall?.highest || '-', '', '', '', '', '');
    lowRow.push(columnStats._overall?.lowest || '-', '', '', '', '', '');
    passRow.push(`${calculatedRows.length ? ((columnStats._overall?.passedTotal / calculatedRows.length) * 100).toFixed(1) : 0}%`, '', '', '', '', '');

    sheetData.push(avgRow, highRow, lowRow, passRow);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      ...timetable.map(() => ({ wch: 18 })),
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exam_Report');

    const fileName = `${(currentExam?.name || 'Exam').replace(/\s+/g, '_')}_Class_${selectedClass || 'All'}_Report.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 7. Import from Excel file (.xlsx)
  const handleImportExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length < 4) {
          alert('Invalid or empty template file.');
          return;
        }

        let headerRowIdx = -1;
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i].map(c => String(c).toLowerCase().trim());
          if (row.includes('roll no') || row.includes('student name') || row.includes('admission id')) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          alert('Could not detect header row (Roll No / Student Name / Subjects) in the Excel file.');
          return;
        }

        const headerRow = rawData[headerRowIdx];
        const subjectColMap = {};

        timetable.forEach(t => {
          const normSubject = t.subject.toLowerCase().replace(/[^a-z0-9]/g, '');
          headerRow.forEach((colName, cIdx) => {
            const normCol = String(colName).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normCol.startsWith(normSubject) || normSubject.startsWith(normCol)) {
              subjectColMap[cIdx] = t.subject;
            }
          });
        });

        const rollIdx = headerRow.findIndex(c => String(c).toLowerCase().includes('roll'));
        const nameIdx = headerRow.findIndex(c => String(c).toLowerCase().includes('name'));
        const admIdx = headerRow.findIndex(c => String(c).toLowerCase().includes('admission'));

        let importedCount = 0;
        setMarksGrid(prev => {
          const next = { ...prev };
          for (let r = headerRowIdx + 1; r < rawData.length; r++) {
            const row = rawData[r];
            if (!row || row.length === 0) continue;

            const roll = rollIdx !== -1 ? String(row[rollIdx] || '').trim() : '';
            const name = nameIdx !== -1 ? String(row[nameIdx] || '').toLowerCase().trim() : '';
            const adm = admIdx !== -1 ? String(row[admIdx] || '').toLowerCase().trim() : '';

            const matchedStudent = students.find(s => 
              (adm && (s.admission_id || s.admissionId || '').toLowerCase() === adm) ||
              (roll && String(s.roll_number || '').trim() === roll) ||
              (name && (s.name || s.student_name || '').toLowerCase() === name)
            );

            if (matchedStudent) {
              Object.entries(subjectColMap).forEach(([cIdx, subjectName]) => {
                const val = parseFloat(row[cIdx]);
                if (!isNaN(val)) {
                  const key = `${matchedStudent.id}_${subjectName}`;
                  next[key] = {
                    ...(next[key] || {}),
                    theory: val
                  };
                  importedCount++;
                }
              });
            }
          }
          return next;
        });

        alert(`Successfully imported marks for ${importedCount} subject entries from Excel! Click "Save Changes" to store them.`);
        setSaveSuccess(false);
      } catch (err) {
        console.error('Import error', err);
        alert('Failed to parse Excel file. Please ensure it follows standard format.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 8. Export Master Broadsheet PDF
  const handleExportBroadsheetPDF = () => {
    if (!calculatedRows.length) return alert('No data to export.');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HOLY NAME SCHOOL', 148, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`EXAMINATION BROADSHEET & MASTER TABULATION REPORT`, 148, 20, { align: 'center' });
    doc.text(`Exam: ${currentExam?.name || 'Examination'} | Class: ${selectedClass || ''} | Session: 2025-2026 | Generated: ${new Date().toLocaleDateString('en-GB')}`, 148, 26, { align: 'center' });

    const tableColumns = [
      'Roll',
      'Student Name',
      'Adm No',
      ...timetable.map(t => `${t.subject}\n(${t.total_marks || t.max_marks || 100})`),
      'Total',
      '%',
      'Grade',
      'Rank',
      'Result'
    ];

    const tableRows = calculatedRows.map(row => {
      const s = row.student;
      return [
        s.roll_number || '-',
        s.name || s.student_name || '-',
        s.admission_id || s.admissionId || '-',
        ...timetable.map(t => {
          const sc = row.subjectScores[t.subject];
          return sc && sc.isEntered ? sc.total : '-';
        }),
        `${row.totalObtained}/${row.totalMax}`,
        `${row.percentage}%`,
        row.grade,
        row.rank,
        row.status
      ];
    });

    const avgRow = ['Avg', 'CLASS AVERAGE', '-', ...timetable.map(t => columnStats[t.subject]?.avg || '-'), columnStats._overall?.avg || '-', '-', '-', '-', '-'];
    const highRow = ['Max', 'HIGHEST SCORE', '-', ...timetable.map(t => columnStats[t.subject]?.highest || '-'), columnStats._overall?.highest || '-', '-', '-', '-', '-'];
    tableRows.push(avgRow, highRow);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'left', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index >= calculatedRows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 18;
    if (finalY < 190) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Prepared by: __________________', 30, finalY);
      doc.text('Class Teacher: __________________', 130, finalY);
      doc.text('Principal: __________________', 230, finalY);
    }

    doc.save(`Broadsheet_${(currentExam?.name || 'Exam').replace(/\s+/g, '_')}_Class_${selectedClass || 'All'}.pdf`);
  };

  // 9. Batch Download All Individual Student Report Cards (PDF)
  const handleBatchReportCardsPDF = () => {
    if (!calculatedRows.length) return alert('No data to export.');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    calculatedRows.forEach((row, idx) => {
      if (idx > 0) doc.addPage();
      const s = row.student;

      doc.setDrawColor(20, 83, 45);
      doc.setLineWidth(1);
      doc.rect(10, 10, 190, 277);
      doc.setDrawColor(220, 252, 231);
      doc.rect(12, 12, 186, 273);

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 83, 45);
      doc.text('HOLY NAME SCHOOL', 105, 24, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Affiliated to Board of Secondary Education', 105, 30, { align: 'center' });
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('STUDENT PROGRESS REPORT CARD', 105, 38, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Academic Session 2025 - 2026 | ${currentExam?.name || 'Terminal Examination'}`, 105, 44, { align: 'center' });

      doc.setFillColor(248, 250, 252);
      doc.rect(16, 48, 178, 26, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(16, 48, 178, 26, 'S');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Student Name:`, 20, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.name || s.student_name || 'N/A'}`, 48, 55);

      doc.setFont('helvetica', 'bold');
      doc.text(`Admission No:`, 120, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.admission_id || s.admissionId || 'N/A'}`, 150, 55);

      doc.setFont('helvetica', 'bold');
      doc.text(`Class & Section:`, 20, 63);
      doc.setFont('helvetica', 'normal');
      doc.text(`${selectedClass || s.grade || 'N/A'} - ${s.section || 'A'}`, 48, 63);

      doc.setFont('helvetica', 'bold');
      doc.text(`Roll Number:`, 120, 63);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.roll_number || 'N/A'}`, 150, 63);

      doc.setFont('helvetica', 'bold');
      doc.text(`Guardian Name:`, 20, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.guardian_name || s.father_name || 'N/A'}`, 48, 70);

      doc.setFont('helvetica', 'bold');
      doc.text(`Attendance:`, 120, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`94%`, 150, 70);

      const cardColumns = ['Sl', 'Subject Name', 'Max Marks', 'Passing', 'Marks Obtained', 'Subject Grade', 'Remarks'];
      const cardRows = timetable.map((t, sIdx) => {
        const sc = row.subjectScores[t.subject];
        const subMax = t.total_marks || t.max_marks || 100;
        const passMarks = t.passing_marks || Math.ceil(subMax * 0.33);
        const obt = sc && sc.isEntered ? sc.total : '-';
        const subGrade = sc && sc.isEntered ? getGrade((obt / subMax) * 100) : '-';
        const remark = sc && sc.isEntered ? (obt >= passMarks ? 'Pass' : 'Needs Focus') : '-';

        return [sIdx + 1, t.subject, subMax, passMarks, obt, subGrade, remark];
      });

      autoTable(doc, {
        head: [cardColumns],
        body: cardRows,
        startY: 78,
        styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
        headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          1: { halign: 'left', fontStyle: 'bold' }
        }
      });

      const tableEnd = doc.lastAutoTable.finalY + 8;
      doc.setFillColor(240, 253, 244);
      doc.rect(16, tableEnd, 178, 30, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.rect(16, tableEnd, 178, 30, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 83, 45);
      doc.text(`Grand Total: ${row.totalObtained} / ${row.totalMax}`, 22, tableEnd + 10);
      doc.text(`Percentage: ${row.percentage}%`, 80, tableEnd + 10);
      doc.text(`Overall Grade: ${row.grade}`, 140, tableEnd + 10);

      doc.text(`Class Rank: ${row.rank}`, 22, tableEnd + 22);
      doc.text(`Final Result: ${row.status}`, 80, tableEnd + 22);
      doc.text(`Conduct: Excellent`, 140, tableEnd + 22);

      const gradeY = tableEnd + 36;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Grading Scale: A1 (90-100) | A2 (80-89) | B1 (70-79) | B2 (60-69) | C1 (50-59) | C2 (40-49) | D (33-39) | E/F (Below 33)', 105, gradeY, { align: 'center' });

      const sigY = gradeY + 24;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Class Teacher', 35, sigY);
      doc.text('Exam Controller', 105, sigY, { align: 'center' });
      doc.text('Principal', 165, sigY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('(Signature & Seal)', 165, sigY + 4);
    });

    doc.save(`ReportCards_${(currentExam?.name || 'Exam').replace(/\s+/g, '_')}_Class_${selectedClass || 'All'}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 animate-fade-in font-body-md">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <FaArrowLeft className="text-gray-600" />
              </button>
            )}
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <FaTable size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Exam Report & Marks Spreadsheet
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Excel-like interactive workspace to enter marks, calculate grades, and generate broadsheets & report cards.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Excel */}
          <label className="cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
            <FaUpload /> Import Excel
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" />
          </label>

          {/* Export Excel */}
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FaFileExcel /> Export Excel (.xlsx)
          </button>

          {/* Export Broadsheet PDF */}
          <button 
            onClick={handleExportBroadsheetPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FaFilePdf /> Broadsheet PDF
          </button>

          {/* Batch Report Cards */}
          <button 
            onClick={handleBatchReportCardsPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FaGraduationCap /> Report Cards (PDF)
          </button>

          {/* Save Marks Button */}
          <button 
            onClick={handleSaveMarks}
            disabled={saving || !isEditing}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm ${
              saveSuccess 
                ? 'bg-green-600 text-white' 
                : 'bg-primary hover:bg-primary/90 text-white disabled:opacity-50'
            }`}
          >
            {saving ? <FaSpinner className="animate-spin" /> : saveSuccess ? <FaCheckCircle /> : <FaSave />}
            {saving ? 'Saving...' : saveSuccess ? 'Saved to Database!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Alert notifications */}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200">
          <FaExclamationTriangle className="shrink-0" /> {errorMsg}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
          <FaCheckCircle className="shrink-0" /> Marks updated successfully in the school marks database.
        </div>
      )}

      {/* Filter / Selector Bar */}
      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
        {/* Exam Select */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select Examination</label>
          <select 
            value={selectedExamId} 
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              const ex = exams.find(x => x.id === e.target.value);
              if (ex) setSelectedClass(ex.class_level || '');
            }}
            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.name} (Class {e.class_level})</option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Section</label>
          <select 
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            {availableSections.map(sec => (
              <option key={sec} value={sec}>{sec === 'ALL' ? 'All Sections' : `Section ${sec}`}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search Student</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Roll, Name, Adm ID..." 
              className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs font-medium shadow-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          </div>
        </div>

        {/* Mode Toggle & Student Count */}
        <div className="flex items-center justify-between pt-4 sm:pt-0">
          <div>
            <span className="text-xs font-black text-gray-800">{filteredStudents.length} Students</span>
            <p className="text-[10px] text-gray-500">{timetable.length} Subjects Configured</p>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              isEditing ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {isEditing ? <FaEdit /> : <FaEye />} {isEditing ? 'Editing Mode' : 'View Only'}
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div className="relative border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-primary text-3xl" />
            <p className="text-sm font-semibold">Loading examination spreadsheet...</p>
          </div>
        ) : timetable.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-base font-bold text-gray-700 mb-1">No Exam Timetable / Subjects Found</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Please configure the timetable and subjects for this exam under <strong>Exam Management</strong> first.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-base font-bold text-gray-700">No students found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[620px] relative scrollbar-thin" ref={gridRef}>
            <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
              
              {/* Excel Column Letters Header */}
              <thead>
                <tr className="bg-gray-100 text-[10px] text-gray-400 font-mono border-b border-gray-200 select-none">
                  <th className="p-1.5 text-center w-10 border-r border-gray-200 bg-gray-100 sticky left-0 z-30">#</th>
                  <th className="p-1.5 text-center w-14 border-r border-gray-200">A</th>
                  <th className="p-1.5 text-center w-48 border-r border-gray-200 sticky left-10 bg-gray-100 z-20">B</th>
                  <th className="p-1.5 text-center w-24 border-r border-gray-200">C</th>
                  {timetable.map((t, idx) => (
                    <th key={t.id || idx} className="p-1.5 text-center border-r border-gray-200">
                      {String.fromCharCode(68 + idx)}
                    </th>
                  ))}
                  <th className="p-1.5 text-center w-20 border-r border-gray-200">TOT</th>
                  <th className="p-1.5 text-center w-16 border-r border-gray-200">%</th>
                  <th className="p-1.5 text-center w-14 border-r border-gray-200">GRD</th>
                  <th className="p-1.5 text-center w-14 border-r border-gray-200">RNK</th>
                  <th className="p-1.5 text-center w-24 border-r border-gray-200">STATUS</th>
                  <th className="p-1.5 text-center w-14">CARD</th>
                </tr>

                {/* Primary Column Header Row */}
                <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                  <th className="p-3 text-center border-r border-slate-700 sticky left-0 bg-slate-800 z-30 w-10">Sl</th>
                  <th className="p-3 border-r border-slate-700 text-center w-14">Roll</th>
                  <th className="p-3 border-r border-slate-700 sticky left-10 bg-slate-800 z-20 w-48">Student Name</th>
                  <th className="p-3 border-r border-slate-700 text-center w-24">Adm No</th>

                  {/* Dynamic Subject Headers */}
                  {timetable.map(t => (
                    <th key={t.id} className="p-3 border-r border-slate-700 text-center min-w-[110px]">
                      <div className="font-bold truncate" title={t.subject}>{t.subject}</div>
                      <div className="text-[9px] font-normal text-slate-300">
                        Max: {t.total_marks || t.max_marks || 100} | Pass: {t.passing_marks || Math.ceil((t.total_marks || t.max_marks || 100) * 0.33)}
                      </div>
                    </th>
                  ))}

                  <th className="p-3 border-r border-slate-700 text-center bg-slate-900 w-20">Total</th>
                  <th className="p-3 border-r border-slate-700 text-center bg-slate-900 w-16">%</th>
                  <th className="p-3 border-r border-slate-700 text-center bg-slate-900 w-14">Grade</th>
                  <th className="p-3 border-r border-slate-700 text-center bg-slate-900 w-14">Rank</th>
                  <th className="p-3 border-r border-slate-700 text-center bg-slate-900 w-24">Result</th>
                  <th className="p-3 text-center bg-slate-900 w-14">Card</th>
                </tr>
              </thead>

              {/* Student Rows & Editable Cells */}
              <tbody className="divide-y divide-gray-200">
                {calculatedRows.map((row, sIdx) => {
                  const s = row.student;
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors group">
                      
                      {/* Row Index */}
                      <td className="p-2 text-center text-gray-400 font-mono border-r border-gray-200 bg-gray-50/80 sticky left-0 z-10">
                        {sIdx + 1}
                      </td>

                      {/* Roll Number */}
                      <td className="p-2 text-center font-bold text-gray-700 border-r border-gray-200">
                        {s.roll_number || '-'}
                      </td>

                      {/* Student Name */}
                      <td className="p-2 border-r border-gray-200 sticky left-10 bg-white group-hover:bg-blue-50/40 z-10">
                        <div className="font-bold text-gray-900 truncate max-w-[180px]" title={s.name || s.student_name}>
                          {s.name || s.student_name}
                        </div>
                        <div className="text-[10px] text-gray-400">Sec: {s.section || 'A'}</div>
                      </td>

                      {/* Admission ID */}
                      <td className="p-2 text-center text-gray-500 font-mono text-[10px] border-r border-gray-200">
                        {s.admission_id || s.admissionId || '-'}
                      </td>

                      {/* Editable Subject Marks Cells */}
                      {timetable.map((t, subIdx) => {
                        const markKey = `${s.id}_${t.subject}`;
                        const markData = marksGrid[markKey] || { theory: '', practical: '' };
                        const subMax = parseFloat(t.total_marks || t.max_marks || 100);
                        const passMarks = parseFloat(t.passing_marks || (subMax * 0.33));
                        const val = markData.theory;
                        const isFailed = val !== '' && val !== undefined && parseFloat(val) < passMarks;

                        return (
                          <td 
                            key={t.id} 
                            className={`p-1 text-center border-r border-gray-200 ${
                              isFailed ? 'bg-red-50/60' : ''
                            }`}
                          >
                            {isEditing ? (
                              <input 
                                id={`cell-${sIdx}-${subIdx}-theory`}
                                type="number"
                                min="0"
                                max={subMax}
                                step="any"
                                value={val ?? ''}
                                onChange={(e) => handleCellChange(s.id, t.subject, 'theory', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, sIdx, subIdx, 'theory')}
                                onPaste={(e) => handlePaste(e, sIdx, subIdx)}
                                placeholder="--"
                                className={`w-full text-center py-1.5 px-1 font-bold text-xs rounded-lg border outline-none transition ${
                                  isFailed 
                                    ? 'border-red-300 text-red-700 bg-red-50/80 focus:ring-2 focus:ring-red-400' 
                                    : 'border-transparent hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent'
                                }`}
                              />
                            ) : (
                              <span className={`font-bold ${isFailed ? 'text-red-600' : 'text-gray-800'}`}>
                                {val !== '' && val !== undefined ? val : '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Calculated Total */}
                      <td className="p-2 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/50">
                        {row.totalObtained} <span className="text-[10px] text-gray-400 font-normal">/ {row.totalMax}</span>
                      </td>

                      {/* Calculated Percentage */}
                      <td className="p-2 text-center font-bold text-gray-900 border-r border-gray-200">
                        {row.totalMax > 0 ? `${row.percentage}%` : '-'}
                      </td>

                      {/* Grade Badge */}
                      <td className="p-2 text-center border-r border-gray-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          row.grade.startsWith('A') 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : row.grade.startsWith('B') 
                            ? 'bg-blue-100 text-blue-800' 
                            : row.grade.startsWith('C') 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.totalMax > 0 ? row.grade : '-'}
                        </span>
                      </td>

                      {/* Class Rank */}
                      <td className="p-2 text-center font-black text-gray-700 border-r border-gray-200">
                        {row.rank === 1 ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                            <FaAward /> 1st
                          </span>
                        ) : row.rank === 2 ? (
                          <span className="text-slate-600 font-bold">2nd</span>
                        ) : row.rank === 3 ? (
                          <span className="text-amber-800 font-bold">3rd</span>
                        ) : (
                          row.rank
                        )}
                      </td>

                      {/* Result Status */}
                      <td className="p-2 text-center border-r border-gray-200">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'PASSED' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : row.status === 'COMPARTMENT' 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : row.status === 'FAILED'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'text-gray-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>

                      {/* Individual Report Card Preview Trigger */}
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => setPreviewStudent(row)} 
                          title="Preview & Print Report Card"
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition"
                        >
                          <FaEye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Statistics & Summary Footer (Excel Aggregate Rows) */}
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-700 sticky bottom-0 z-20 shadow-md">
                
                {/* Average Row */}
                <tr className="border-b border-gray-200">
                  <td colSpan="4" className="p-2.5 text-right font-black text-slate-800 uppercase tracking-wider sticky left-0 bg-slate-100 border-r border-gray-200">
                    Class Average
                  </td>
                  {timetable.map(t => (
                    <td key={t.id} className="p-2 text-center text-slate-900 border-r border-gray-200 bg-slate-50">
                      {columnStats[t.subject]?.avg || '-'}
                    </td>
                  ))}
                  <td className="p-2 text-center text-slate-900 bg-slate-100 border-r border-gray-200">
                    {columnStats._overall?.avg || '-'}
                  </td>
                  <td colSpan="5" className="p-2 text-center text-[10px] text-gray-400 bg-slate-100">
                    Formula: AVERAGE(Scores)
                  </td>
                </tr>

                {/* Highest Mark Row */}
                <tr className="border-b border-gray-200 text-emerald-800">
                  <td colSpan="4" className="p-2 text-right font-bold uppercase tracking-wider sticky left-0 bg-emerald-50/80 border-r border-gray-200">
                    Highest Mark
                  </td>
                  {timetable.map(t => (
                    <td key={t.id} className="p-2 text-center font-bold border-r border-gray-200 bg-emerald-50/30">
                      {columnStats[t.subject]?.highest || '-'}
                    </td>
                  ))}
                  <td className="p-2 text-center font-black border-r border-gray-200 bg-emerald-50/60">
                    {columnStats._overall?.highest || '-'}
                  </td>
                  <td colSpan="5" className="p-2 text-center text-[10px] text-gray-400 bg-emerald-50/30">
                    Formula: MAX(Scores)
                  </td>
                </tr>

                {/* Pass Rate % Row */}
                <tr className="text-indigo-800">
                  <td colSpan="4" className="p-2 text-right font-bold uppercase tracking-wider sticky left-0 bg-indigo-50/80 border-r border-gray-200">
                    Pass Percentage
                  </td>
                  {timetable.map(t => (
                    <td key={t.id} className="p-2 text-center font-bold border-r border-gray-200 bg-indigo-50/30">
                      {columnStats[t.subject]?.passRate || '-'}
                    </td>
                  ))}
                  <td className="p-2 text-center font-black border-r border-gray-200 bg-indigo-50/60">
                    {calculatedRows.length ? `${((columnStats._overall?.passedTotal / calculatedRows.length) * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td colSpan="5" className="p-2 text-center text-[10px] text-gray-400 bg-indigo-50/30">
                    Formula: (Passed / Total) * 100
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Single Student Report Card Preview Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-base">
                <FaGraduationCap className="text-emerald-400" />
                Student Progress Report Card
              </div>
              <button 
                onClick={() => setPreviewStudent(null)} 
                className="text-gray-400 hover:text-white text-xl font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Card Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* School Banner */}
              <div className="text-center border-b pb-4">
                <h3 className="text-xl font-black text-emerald-900 tracking-tight">HOLY NAME SCHOOL</h3>
                <p className="text-xs text-gray-500 font-medium">{currentExam?.name || 'Examination'} • Session 2025-2026</p>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Student Name</span>
                  <span className="font-bold text-gray-800">{previewStudent.student.name || previewStudent.student.student_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Admission ID</span>
                  <span className="font-bold text-gray-800">{previewStudent.student.admission_id || previewStudent.student.admissionId || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Class & Sec</span>
                  <span className="font-bold text-gray-800">{selectedClass} - {previewStudent.student.section || 'A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Roll Number</span>
                  <span className="font-bold text-gray-800">{previewStudent.student.roll_number || '-'}</span>
                </div>
              </div>

              {/* Subject Scores Table */}
              <table className="w-full text-xs text-left border rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-white font-bold">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">Max Marks</th>
                    <th className="p-2.5 text-center">Passing</th>
                    <th className="p-2.5 text-center">Marks Obtained</th>
                    <th className="p-2.5 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timetable.map(t => {
                    const sc = previewStudent.subjectScores[t.subject];
                    const subMax = t.total_marks || t.max_marks || 100;
                    const passMarks = t.passing_marks || Math.ceil(subMax * 0.33);
                    const obt = sc && sc.isEntered ? sc.total : '-';
                    const grd = sc && sc.isEntered ? getGrade((obt / subMax) * 100) : '-';

                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-gray-800">{t.subject}</td>
                        <td className="p-2.5 text-center text-gray-500">{subMax}</td>
                        <td className="p-2.5 text-center text-gray-500">{passMarks}</td>
                        <td className="p-2.5 text-center font-bold text-gray-900">{obt}</td>
                        <td className="p-2.5 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            grd.startsWith('A') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>{grd}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Performance Summary Box */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Total Marks</span>
                  <span className="text-base font-black text-emerald-950">{previewStudent.totalObtained} / {previewStudent.totalMax}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Percentage</span>
                  <span className="text-base font-black text-emerald-950">{previewStudent.percentage}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Overall Rank</span>
                  <span className="text-base font-black text-emerald-950">{previewStudent.rank}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setPreviewStudent(null)} 
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamReportSpreadsheet;
