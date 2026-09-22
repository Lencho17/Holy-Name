import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { 
  FaFilePdf, FaFileExcel, FaGraduationCap, FaAward, FaSearch, 
  FaUserGraduate, FaChevronLeft, FaChevronRight, FaPrint, FaSpinner, 
  FaCheckCircle, FaExclamationTriangle, FaTable, FaEye, FaLayerGroup,
  FaCalendarCheck, FaSchool
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  exportStudentMarksheetToExcel, 
  exportBroadsheetExcelWithImage,
  loadImageBase64 
} from '../utils/excelImageExport';

export const MarksheetGenerator = ({ apiUrl, token }) => {
  const { globalClasses, schoolProfile } = useContext(SiteDataContext);

  const allClasses = useMemo(() => {
    return (globalClasses?.map(c => c.name) || [
      'Nursery', 'KG-I', 'KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
    ]);
  }, [globalClasses]);

  // Selection States
  const [selectedClass, setSelectedClass] = useState(allClasses[0] || 'I');
  const [selectedType, setSelectedType] = useState('annual'); 
  // 'ut1' | 'term1' | 'ut2' | 'term2' | 'combined' | 'annual'
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'broadsheet'
  const [studentIndex, setStudentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Data States
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch Class Marksheets Data
  const fetchClassData = async (classLevel) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axios.get(`${apiUrl}/exams/marksheets/class-data`, {
        params: { class_level: classLevel },
        headers: { Authorization: `Bearer ${token}` }
      });
      setClassData(res.data);
      setStudentIndex(0);
    } catch (err) {
      console.error('Failed to load class marksheet data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load class marksheet data');
      setClassData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiUrl && token && selectedClass) {
      fetchClassData(selectedClass);
    }
  }, [apiUrl, token, selectedClass]);

  // Filtered Students
  const studentsList = useMemo(() => {
    if (!classData?.students) return [];
    if (!searchTerm.trim()) return classData.students;
    const term = searchTerm.toLowerCase();
    return classData.students.filter(item => {
      const name = (item.student.student_name || item.student.name || '').toLowerCase();
      const adm = (item.student.admission_id || item.student.admissionId || '').toLowerCase();
      const roll = String(item.student.roll_number || '');
      return name.includes(term) || adm.includes(term) || roll.includes(term);
    });
  }, [classData, searchTerm]);

  const currentStudentItem = studentsList[studentIndex] || null;

  // Active Marksheet Title & Details
  const marksheetMeta = useMemo(() => {
    switch (selectedType) {
      case 'ut1':
        return {
          title: 'PERIODIC ASSESSMENT - I (UNIT TEST 1)',
          subTitle: 'First Periodic Evaluation & Progress Report',
          scale: 'Max Marks: 50 / Subject',
          key: 'ut1',
          color: 'blue'
        };
      case 'term1':
        return {
          title: 'TERMINAL ASSESSMENT - I (HALF YEARLY)',
          subTitle: 'Mid-Term Comprehensive Scholastic Evaluation',
          scale: 'Max Marks: 100 / Subject (Theory + Practical)',
          key: 'term1',
          color: 'purple'
        };
      case 'ut2':
        return {
          title: 'PERIODIC ASSESSMENT - II (UNIT TEST 2)',
          subTitle: 'Second Periodic Evaluation & Progress Report',
          scale: 'Max Marks: 50 / Subject',
          key: 'ut2',
          color: 'indigo'
        };
      case 'term2':
        return {
          title: 'TERMINAL ASSESSMENT - II (ANNUAL FINAL)',
          subTitle: 'Final Term Comprehensive Scholastic Evaluation',
          scale: 'Max Marks: 100 / Subject (Theory + Practical)',
          key: 'term2',
          color: 'teal'
        };
      case 'combined':
        return {
          title: 'COMBINED EVALUATION MARKSHEET (ALL 4 EXAMS)',
          subTitle: 'Comprehensive 4-Exam Cumulative Academic Transcript',
          scale: 'Tabulating UT1, Term 1, UT2, and Term 2 Side-by-Side',
          key: 'combined',
          color: 'amber'
        };
      case 'annual':
      default:
        return {
          title: 'ANNUAL PROGRESS & PROMOTION REPORT CARD',
          subTitle: 'Overall Annual Performance, Average Marks & Promotion Status',
          scale: 'Weighted / Normalized Average Score (100% Scale)',
          key: 'annual',
          color: 'emerald'
        };
    }
  }, [selectedType]);

  // Download PDF Marksheet for Student or Batch
  const handleDownloadPDF = async (isBatch = false) => {
    if (!classData || (!currentStudentItem && !isBatch)) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const schoolName = (schoolProfile?.name || 'HOLY NAME HIGHER SECONDARY SCHOOL').toUpperCase();
      const schoolAddress = schoolProfile?.officeAddress || schoolProfile?.address || 'Sivasagar, Assam - 785640';
      const affiliation = 'Affiliated to Board of Secondary Education | Recognized by Govt.';

      // Load School Logo Base64
      let logoBase64 = null;
      if (schoolProfile?.logo) {
        try {
          const imgData = await loadImageBase64(schoolProfile.logo);
          if (imgData?.base64) logoBase64 = imgData.base64;
        } catch (e) {
          console.warn('Could not load logo for PDF:', e);
        }
      }

      const studentsToPrint = isBatch ? studentsList : [currentStudentItem];

      studentsToPrint.forEach((item, sIdx) => {
        if (sIdx > 0) doc.addPage();
        const s = item.student;

        // Double Page Border
        doc.setDrawColor(20, 83, 45); // Dark Green
        doc.setLineWidth(1.2);
        doc.rect(8, 8, 194, 281);
        doc.setDrawColor(220, 252, 231); // Light Green inner line
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 190, 277);

        // Watermark Seal (Subtle)
        doc.setFontSize(45);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(241, 245, 249);
        doc.text('HOLY NAME', 105, 150, { align: 'center', angle: 30 });

        let currentY = 15;

        // School Logo
        if (logoBase64) {
          try {
            doc.addImage(logoBase64, 'PNG', 14, 13, 20, 20);
          } catch (err) {
            console.warn('Error placing logo in PDF:', err);
          }
        }

        // Header Text
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 83, 45);
        doc.text(schoolName, 105, currentY, { align: 'center' });
        currentY += 5;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const addrLines = doc.splitTextToSize(schoolAddress, 140);
        doc.text(addrLines, 105, currentY, { align: 'center' });
        currentY += (addrLines.length * 3.8) + 1;

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(affiliation, 105, currentY, { align: 'center' });
        currentY += 6;

        // Title Ribbon
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(14, currentY, 182, 10, 2, 2, 'F');
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(14, currentY, 182, 10, 2, 2, 'S');

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text(marksheetMeta.title, 105, currentY + 6.5, { align: 'center' });
        currentY += 13;

        // Student Info Card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, currentY, 182, 26, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, currentY, 182, 26, 2, 2, 'S');

        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);

        // Row 1
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', 18, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(`${s.student_name || s.name || 'N/A'}`, 45, currentY + 6);

        doc.setFont('helvetica', 'bold');
        doc.text('Admission ID:', 110, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(`${s.admission_id || s.admissionId || 'N/A'}`, 135, currentY + 6);

        // Row 2
        doc.setFont('helvetica', 'bold');
        doc.text('Class & Section:', 18, currentY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(`${selectedClass} - ${s.section || 'A'}`, 45, currentY + 14);

        doc.setFont('helvetica', 'bold');
        doc.text('Roll Number:', 110, currentY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(`${s.roll_number || 'N/A'}`, 135, currentY + 14);

        // Row 3
        doc.setFont('helvetica', 'bold');
        doc.text('Guardian Name:', 18, currentY + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(`${s.guardian_name || s.father_name || 'N/A'}`, 45, currentY + 22);

        doc.setFont('helvetica', 'bold');
        doc.text('Date of Birth:', 110, currentY + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(`${s.date_of_birth || 'N/A'}`, 135, currentY + 22);

        // Student Photo Box placeholder / photo
        doc.setDrawColor(203, 213, 225);
        doc.rect(170, currentY + 3, 20, 21);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('PASSPORT\nPHOTO', 180, currentY + 11, { align: 'center' });

        currentY += 29;

        // Table Content by Marksheet Type
        let tableHeaders = [];
        let tableBody = [];

        if (selectedType === 'ut1' || selectedType === 'ut2') {
          const examObj = selectedType === 'ut1' ? item.ut1 : item.ut2;
          tableHeaders = [['Sl', 'Subject Name', 'Max Marks', 'Pass Marks', 'Marks Obtained', 'Subject Grade', 'Remarks']];
          tableBody = (examObj?.subjects || []).map((sub, idx) => [
            idx + 1,
            sub.subject,
            sub.maxMarks,
            sub.passingMarks,
            sub.marksObtained != null ? sub.marksObtained : '—',
            sub.grade,
            sub.remarks
          ]);
        } else if (selectedType === 'term1' || selectedType === 'term2') {
          const examObj = selectedType === 'term1' ? item.term1 : item.term2;
          tableHeaders = [['Sl', 'Subject Name', 'Theory (Max)', 'Prac (Max)', 'Total Obtained', 'Grade', 'Remarks']];
          tableBody = (examObj?.subjects || []).map((sub, idx) => [
            idx + 1,
            sub.subject,
            sub.theoryMax != null ? `${sub.marksObtained ?? 0} / ${sub.theoryMax}` : '—',
            sub.practicalMax != null ? `${sub.practicalMarks ?? 0} / ${sub.practicalMax}` : '—',
            `${sub.totalObtained ?? '—'} / ${sub.maxMarks}`,
            sub.grade,
            sub.remarks
          ]);
        } else if (selectedType === 'combined') {
          tableHeaders = [['Sl', 'Subject Name', 'UT 1 (/50)', 'Term 1 (/100)', 'UT 2 (/50)', 'Term 2 (/100)', 'Grand Total', 'Percentage', 'Grade']];
          tableBody = (item.combined?.subjects || []).map((sub) => [
            sub.sl,
            sub.subject,
            sub.ut1,
            sub.term1,
            sub.ut2,
            sub.term2,
            sub.grandTotal,
            `${sub.percentage}%`,
            sub.grade
          ]);
        } else {
          // Annual Marksheet
          tableHeaders = [['Sl', 'Subject Name', 'UT Average', 'Term Average', 'Annual Score (/100)', 'Grade', 'Performance Level']];
          tableBody = (item.annual?.subjects || []).map((sub) => [
            sub.sl,
            sub.subject,
            sub.utAverage,
            sub.termAverage,
            sub.finalScore,
            sub.grade,
            sub.remarks
          ]);
        }

        autoTable(doc, {
          head: tableHeaders,
          body: tableBody,
          startY: currentY,
          margin: { left: 14, right: 14 },
          theme: 'grid',
          styles: {
            fontSize: 8.5,
            cellPadding: 2.2,
            halign: 'center',
            valign: 'middle',
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: 0.15
          },
          headStyles: {
            fillColor: [20, 83, 45],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: {
            1: { halign: 'left', fontStyle: 'bold' }
          }
        });

        currentY = doc.lastAutoTable.finalY + 6;

        // Summary Performance Box
        const summaryData = selectedType === 'combined' ? item.combined
          : selectedType === 'annual' ? item.annual
          : (selectedType === 'ut1' ? item.ut1 : selectedType === 'ut2' ? item.ut2 : selectedType === 'term1' ? item.term1 : item.term2);

        doc.setFillColor(240, 253, 244);
        doc.roundedRect(14, currentY, 182, 24, 2, 2, 'F');
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(14, currentY, 182, 24, 2, 2, 'S');

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 83, 45);
        doc.text(`Grand Total: ${summaryData?.totalObtained || 0} / ${summaryData?.totalMax || 0}`, 20, currentY + 7);
        doc.text(`Percentage: ${summaryData?.percentage || 0}%`, 85, currentY + 7);
        doc.text(`Overall Grade: ${summaryData?.overallGrade || '—'}`, 145, currentY + 7);

        doc.setFontSize(9);
        doc.text(`Class Rank: ${summaryData?.rank || '—'}`, 20, currentY + 17);
        doc.text(`Final Result: ${summaryData?.status || 'PASSED'}`, 85, currentY + 17);
        if (selectedType === 'annual') {
          doc.text(`${item.annual?.promotion || 'PROMOTED'}`, 145, currentY + 17);
        } else {
          doc.text(`Attendance: 95%`, 145, currentY + 17);
        }

        currentY += 28;

        // Grading Scale Key
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(
          'Grading Scale: A1 (90-100) | A2 (80-89) | B1 (70-79) | B2 (60-69) | C1 (50-59) | C2 (40-49) | D (33-39) | E (Below 33)',
          105,
          currentY,
          { align: 'center' }
        );

        // Official Signature Block at Bottom
        const sigY = 270;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);

        doc.text('Class Teacher', 30, sigY);
        doc.text('Examination Controller', 105, sigY, { align: 'center' });
        doc.text('Principal / Headmaster', 155, sigY);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('(Signature & Date)', 30, sigY + 4);
        doc.text('(Verified)', 105, sigY + 4, { align: 'center' });
        doc.text('(Signature & Seal)', 155, sigY + 4);
      });

      const fileSuffix = isBatch ? `Class_${selectedClass}_All` : (currentStudentItem?.student.student_name || 'Student');
      doc.save(`Marksheet_${selectedType.toUpperCase()}_${fileSuffix.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Download Excel Marksheet
  const handleDownloadExcel = async () => {
    if (!currentStudentItem) return;
    const summaryData = selectedType === 'combined' ? currentStudentItem.combined
      : selectedType === 'annual' ? currentStudentItem.annual
      : (selectedType === 'ut1' ? currentStudentItem.ut1 : selectedType === 'ut2' ? currentStudentItem.ut2 : selectedType === 'term1' ? currentStudentItem.term1 : currentStudentItem.term2);

    await exportStudentMarksheetToExcel({
      marksheetType: selectedType === 'annual' ? 'annual' : selectedType === 'combined' ? 'combined' : (selectedType.startsWith('ut') ? 'unit_test' : 'terminal'),
      schoolProfile,
      student: currentStudentItem.student,
      examName: marksheetMeta.title,
      data: summaryData || {},
      filename: `Marksheet_${(currentStudentItem.student.student_name || 'Student').replace(/\s+/g, '_')}_${selectedType.toUpperCase()}.xlsx`
    });
  };

  // Download Class Broadsheet in Excel
  const handleDownloadClassBroadsheetExcel = async () => {
    if (!classData?.students?.length) return;
    const timetable = (classData.classSubjects || []).map(s => ({ subject: s, total_marks: 100 }));
    const calculatedRows = classData.students.map(item => {
      const summaryData = selectedType === 'combined' ? item.combined
        : selectedType === 'annual' ? item.annual
        : (selectedType === 'ut1' ? item.ut1 : selectedType === 'ut2' ? item.ut2 : selectedType === 'term1' ? item.term1 : item.term2);

      const subjectScores = {};
      (summaryData?.subjects || []).forEach(sub => {
        subjectScores[sub.subject] = {
          total: sub.finalScore ?? sub.totalObtained ?? sub.marksObtained ?? '—',
          isEntered: true
        };
      });

      return {
        student: item.student,
        subjectScores,
        totalObtained: summaryData?.totalObtained || 0,
        totalMax: summaryData?.totalMax || 0,
        percentage: summaryData?.percentage || 0,
        grade: summaryData?.overallGrade || '—',
        status: summaryData?.status || 'Pass'
      };
    });

    await exportBroadsheetExcelWithImage({
      schoolProfile,
      classLevel: selectedClass,
      examName: marksheetMeta.title,
      timetable,
      students: classData.students.map(i => i.student),
      marksGrid: {},
      calculatedRows,
      filename: `Broadsheet_Class_${selectedClass}_${selectedType.toUpperCase()}.xlsx`
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-7 animate-fade-in font-body-md">
      
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-emerald-100">
              <FaGraduationCap />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2.5">
                Marksheet Generation Facility
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Official School Formats
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Generate Unit Test marksheets (2 exams), Terminal marksheets (2 exams), Combined 4-Exam transcript, and Annual Promotion cards with School Logo.
              </p>
            </div>
          </div>
        </div>

        {/* Global Class Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <FaSchool className="text-slate-400 text-sm" />
            <span className="text-xs font-bold text-slate-600 uppercase">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent font-bold text-slate-900 text-sm focus:outline-none cursor-pointer"
            >
              {allClasses.map((cls) => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'single' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaEye /> Student Card
            </button>
            <button
              onClick={() => setViewMode('broadsheet')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'broadsheet' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaTable /> Class Broadsheet
            </button>
          </div>
        </div>
      </div>

      {/* Marksheet Type Navigation Bar (6 Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setSelectedType('ut1')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'ut1'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span>Unit Test 1</span>
          <span className="text-[10px] font-normal opacity-85">Periodic 1 (50M)</span>
        </button>

        <button
          onClick={() => setSelectedType('term1')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'term1'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span>Terminal 1</span>
          <span className="text-[10px] font-normal opacity-85">Half-Yearly (100M)</span>
        </button>

        <button
          onClick={() => setSelectedType('ut2')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'ut2'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span>Unit Test 2</span>
          <span className="text-[10px] font-normal opacity-85">Periodic 2 (50M)</span>
        </button>

        <button
          onClick={() => setSelectedType('term2')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'term2'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span>Terminal 2</span>
          <span className="text-[10px] font-normal opacity-85">Final Exam (100M)</span>
        </button>

        <button
          onClick={() => setSelectedType('combined')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'combined'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span>Combined Marksheet</span>
          <span className="text-[10px] font-normal opacity-85">All 4 Exams (300M)</span>
        </button>

        <button
          onClick={() => setSelectedType('annual')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'annual'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span>Annual Marksheet</span>
          <span className="text-[10px] font-normal opacity-85">Average & Promotion</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <FaSpinner className="animate-spin text-3xl text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-slate-600">Aggregating Marksheets & Calculating Averages for Class {selectedClass}...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <FaExclamationTriangle className="text-rose-500 text-2xl mx-auto" />
          <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
          <button onClick={() => fetchClassData(selectedClass)} className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition">
            Retry
          </button>
        </div>
      ) : studentsList.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <FaUserGraduate className="text-4xl text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Students Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no enrolled students in Class {selectedClass}. Enroll students or select a different class.
          </p>
        </div>
      ) : viewMode === 'broadsheet' ? (
        /* ================== CLASS BROADSHEET VIEW ================== */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Class {selectedClass} Broadsheet • {marksheetMeta.title}
              </h3>
              <p className="text-xs text-slate-500">
                Total Students: {studentsList.length} • Includes embedded school logo in Excel export.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadClassBroadsheetExcel}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition"
              >
                <FaFileExcel className="text-sm" /> Export Broadsheet (Excel with Logo)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider">
                  <th className="p-3 pl-4">Roll</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Admission ID</th>
                  {(classData?.classSubjects || []).map((sub) => (
                    <th key={sub} className="p-3 text-center">{sub}</th>
                  ))}
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">%</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentsList.map((item, idx) => {
                  const s = item.student;
                  const summaryData = selectedType === 'combined' ? item.combined
                    : selectedType === 'annual' ? item.annual
                    : (selectedType === 'ut1' ? item.ut1 : selectedType === 'ut2' ? item.ut2 : selectedType === 'term1' ? item.term1 : item.term2);

                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 pl-4 font-bold text-slate-700">{s.roll_number || '—'}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.student_name || s.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{s.admission_id || s.admissionId}</td>
                      {(classData?.classSubjects || []).map((subName) => {
                        const sub = summaryData?.subjects?.find(sub => sub.subject?.toUpperCase() === subName.toUpperCase());
                        const score = sub ? (sub.finalScore ?? sub.totalObtained ?? sub.marksObtained ?? '—') : '—';
                        return (
                          <td key={subName} className="p-3 text-center font-medium text-slate-800">
                            {score}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center font-bold text-emerald-700">{summaryData?.totalObtained ?? '—'}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{summaryData?.percentage ? `${summaryData.percentage}%` : '—'}</td>
                      <td className="p-3 text-center font-bold text-indigo-700">{summaryData?.overallGrade || '—'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          summaryData?.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {summaryData?.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================== SINGLE STUDENT CARD VIEW ================== */
        <div className="space-y-6">
          {/* Student Selector Bar & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            {/* Student Dropdown / Navigation */}
            <div className="flex items-center gap-3">
              <button
                disabled={studentIndex === 0}
                onClick={() => setStudentIndex(prev => Math.max(0, prev - 1))}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Student"
              >
                <FaChevronLeft className="text-xs" />
              </button>

              <select
                value={studentIndex}
                onChange={(e) => setStudentIndex(parseInt(e.target.value, 10))}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                {studentsList.map((item, idx) => (
                  <option key={item.student.id || idx} value={idx}>
                    Roll {item.student.roll_number || (idx + 1)}: {item.student.student_name || item.student.name}
                  </option>
                ))}
              </select>

              <button
                disabled={studentIndex >= studentsList.length - 1}
                onClick={() => setStudentIndex(prev => Math.min(studentsList.length - 1, prev + 1))}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Student"
              >
                <FaChevronRight className="text-xs" />
              </button>

              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                ({studentIndex + 1} of {studentsList.length})
              </span>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleDownloadPDF(false)}
                disabled={generatingPdf}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                <FaFilePdf className="text-sm" /> Download PDF (with Logo)
              </button>

              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition"
              >
                <FaFileExcel className="text-sm" /> Download Excel (with Logo)
              </button>

              <button
                onClick={() => handleDownloadPDF(true)}
                disabled={generatingPdf}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition disabled:opacity-50"
                title="Download all student marksheets in a single multipage PDF"
              >
                <FaPrint className="text-sm" /> Bulk Class PDF ({studentsList.length})
              </button>
            </div>
          </div>

          {/* Interactive Report Card Sheet (Live Visual Preview) */}
          {currentStudentItem && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-emerald-800/80 p-8 shadow-xl relative overflow-hidden space-y-6">
              
              {/* Decorative Double Border Inset */}
              <div className="absolute inset-1.5 border border-emerald-100 rounded-2xl pointer-events-none" />

              {/* School Header */}
              <div className="text-center relative">
                {schoolProfile?.logo && (
                  <img
                    src={schoolProfile.logo}
                    alt="School Logo"
                    className="w-16 h-16 object-contain absolute left-0 top-0 hidden sm:block drop-shadow-sm"
                  />
                )}
                <h1 className="text-2xl font-black text-emerald-950 font-headline uppercase tracking-tight">
                  {schoolProfile?.name || 'Holy Name Higher Secondary School'}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {schoolProfile?.officeAddress || 'Hatimuria Gaon, Sivasagar, Assam - 785640'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Affiliated to Board of Secondary Education • Established 1978
                </p>

                {/* Marksheet Title Banner */}
                <div className="mt-4 inline-block bg-emerald-50 px-6 py-2 rounded-full border border-emerald-200">
                  <h2 className="text-xs font-black text-emerald-900 tracking-wider uppercase">
                    {marksheetMeta.title}
                  </h2>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Academic Session 2025 - 2026 • {marksheetMeta.subTitle}
                  </p>
                </div>
              </div>

              {/* Student Details Card */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Student Name</span>
                    <span className="font-extrabold text-slate-900 text-sm">{currentStudentItem.student.student_name || currentStudentItem.student.name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Admission ID</span>
                    <span className="font-bold text-slate-800 font-mono">{currentStudentItem.student.admission_id || currentStudentItem.student.admissionId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Class & Section</span>
                    <span className="font-bold text-slate-800">{selectedClass} - {currentStudentItem.student.section || 'A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Roll Number</span>
                    <span className="font-extrabold text-slate-900 text-sm">{currentStudentItem.student.roll_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Guardian Name</span>
                    <span className="font-medium text-slate-800">{currentStudentItem.student.guardian_name || currentStudentItem.student.father_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Date of Birth</span>
                    <span className="font-medium text-slate-800">{currentStudentItem.student.date_of_birth || 'N/A'}</span>
                  </div>
                </div>

                {/* Passport Photo Frame */}
                <div className="w-20 h-24 border-2 border-dashed border-slate-300 rounded-xl bg-white flex flex-col items-center justify-center text-center p-1 shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Passport<br/>Photo</span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3 pl-4 text-center w-12">Sl</th>
                      <th className="p-3">Subject Name</th>
                      {selectedType === 'combined' ? (
                        <>
                          <th className="p-3 text-center">UT 1 (/50)</th>
                          <th className="p-3 text-center">Term 1 (/100)</th>
                          <th className="p-3 text-center">UT 2 (/50)</th>
                          <th className="p-3 text-center">Term 2 (/100)</th>
                          <th className="p-3 text-center font-extrabold">Grand Total</th>
                          <th className="p-3 text-center">%</th>
                          <th className="p-3 text-center">Grade</th>
                        </>
                      ) : selectedType === 'annual' ? (
                        <>
                          <th className="p-3 text-center">UT Average</th>
                          <th className="p-3 text-center">Term Average</th>
                          <th className="p-3 text-center font-extrabold">Annual (/100)</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3 text-center">Performance</th>
                        </>
                      ) : selectedType.startsWith('term') ? (
                        <>
                          <th className="p-3 text-center">Theory</th>
                          <th className="p-3 text-center">Practical</th>
                          <th className="p-3 text-center font-extrabold">Total (/100)</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3 text-center">Remarks</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 text-center">Max Marks</th>
                          <th className="p-3 text-center">Pass Marks</th>
                          <th className="p-3 text-center font-extrabold">Obtained</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3 text-center">Remarks</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(() => {
                      const summaryData = selectedType === 'combined' ? currentStudentItem.combined
                        : selectedType === 'annual' ? currentStudentItem.annual
                        : (selectedType === 'ut1' ? currentStudentItem.ut1 : selectedType === 'ut2' ? currentStudentItem.ut2 : selectedType === 'term1' ? currentStudentItem.term1 : currentStudentItem.term2);

                      return (summaryData?.subjects || []).map((sub, idx) => (
                        <tr key={sub.subject || idx} className="hover:bg-emerald-50/30 transition">
                          <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{sub.subject}</td>
                          {selectedType === 'combined' ? (
                            <>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.ut1}</td>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.term1}</td>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.ut2}</td>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.term2}</td>
                              <td className="p-3 text-center font-black text-emerald-800">{sub.grandTotal}</td>
                              <td className="p-3 text-center font-bold text-slate-800">{sub.percentage}%</td>
                              <td className="p-3 text-center font-bold text-indigo-700">{sub.grade}</td>
                            </>
                          ) : selectedType === 'annual' ? (
                            <>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.utAverage}</td>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.termAverage}</td>
                              <td className="p-3 text-center font-black text-emerald-800">{sub.finalScore}</td>
                              <td className="p-3 text-center font-bold text-indigo-700">{sub.grade}</td>
                              <td className="p-3 text-center text-slate-600 font-medium">{sub.remarks}</td>
                            </>
                          ) : selectedType.startsWith('term') ? (
                            <>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.theoryMax != null ? `${sub.marksObtained ?? 0} / ${sub.theoryMax}` : '—'}</td>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.practicalMax != null ? `${sub.practicalMarks ?? 0} / ${sub.practicalMax}` : '—'}</td>
                              <td className="p-3 text-center font-black text-emerald-800">{sub.totalObtained ?? '—'}</td>
                              <td className="p-3 text-center font-bold text-indigo-700">{sub.grade}</td>
                              <td className="p-3 text-center text-slate-600 font-medium">{sub.remarks}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.maxMarks}</td>
                              <td className="p-3 text-center font-medium text-slate-700">{sub.passingMarks}</td>
                              <td className="p-3 text-center font-black text-emerald-800">{sub.marksObtained ?? '—'}</td>
                              <td className="p-3 text-center font-bold text-indigo-700">{sub.grade}</td>
                              <td className="p-3 text-center text-slate-600 font-medium">{sub.remarks}</td>
                            </>
                          )}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Performance Result Summary Card */}
              {(() => {
                const summaryData = selectedType === 'combined' ? currentStudentItem.combined
                  : selectedType === 'annual' ? currentStudentItem.annual
                  : (selectedType === 'ut1' ? currentStudentItem.ut1 : selectedType === 'ut2' ? currentStudentItem.ut2 : selectedType === 'term1' ? currentStudentItem.term1 : currentStudentItem.term2);

                return (
                  <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Marks</span>
                      <span className="text-lg font-black text-emerald-950">{summaryData?.totalObtained || 0} / {summaryData?.totalMax || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Percentage</span>
                      <span className="text-lg font-black text-emerald-950">{summaryData?.percentage || 0}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Overall Grade</span>
                      <span className="text-lg font-black text-indigo-800">{summaryData?.overallGrade || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Class Rank</span>
                      <span className="text-lg font-black text-emerald-950">#{summaryData?.rank || 1}</span>
                    </div>

                    <div className="col-span-2 sm:col-span-4 pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-slate-700">
                        Result: <span className="font-extrabold text-emerald-800">{summaryData?.status || 'PASSED'}</span>
                      </span>
                      {selectedType === 'annual' ? (
                        <span className="font-extrabold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300">
                          {currentStudentItem.annual?.promotion}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          Annual Attendance Record: <strong>94.6%</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="h-10" />
                  <div className="border-t border-slate-300 pt-1">Class Teacher</div>
                </div>
                <div>
                  <div className="h-10 flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">
                      Seal
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1">Exam Controller</div>
                </div>
                <div>
                  <div className="h-10" />
                  <div className="border-t border-slate-300 pt-1">Principal</div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MarksheetGenerator;
