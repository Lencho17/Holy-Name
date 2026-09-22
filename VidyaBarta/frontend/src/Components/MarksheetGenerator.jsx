import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { 
  FaFilePdf, FaFileExcel, FaGraduationCap, FaAward, FaSearch, 
  FaUserGraduate, FaChevronLeft, FaChevronRight, FaPrint, FaSpinner, 
  FaCheckCircle, FaExclamationTriangle, FaTable, FaEye, FaLayerGroup,
  FaCalendarCheck, FaSchool, FaEdit, FaCheck, FaTimes, FaCamera
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
  // 'annual' | 'ut1' | 'term1' | 'ut2' | 'term2'
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'broadsheet'
  const [studentIndex, setStudentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Data States
  const [loading, setLoading] = useState(false);
  const [classData, setClassData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Remarks States
  const [customRemarks, setCustomRemarks] = useState({});
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [tempRemarkText, setTempRemarkText] = useState('');

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
      setEditingRemarks(false);
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

  // Dynamic Exam Names as created by School Admin
  const examNames = useMemo(() => {
    return {
      ut1: classData?.exams?.ut1?.name || 'Periodic Assessment - I',
      term1: classData?.exams?.term1?.name || 'Terminal Assessment - I',
      ut2: classData?.exams?.ut2?.name || 'Periodic Assessment - II',
      term2: classData?.exams?.term2?.name || 'Terminal Assessment - II'
    };
  }, [classData]);

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

  // Active student remarks
  const activeStudentRemark = useMemo(() => {
    if (!currentStudentItem) return '';
    const stuId = currentStudentItem.student.id;
    if (customRemarks[stuId] !== undefined) return customRemarks[stuId];
    return currentStudentItem.annual?.teacherRemarks || 'Satisfactory academic progress and positive conduct. Promoted to next class.';
  }, [currentStudentItem, customRemarks]);

  // Active Marksheet Title & Details
  const marksheetMeta = useMemo(() => {
    switch (selectedType) {
      case 'ut1':
        return {
          title: (examNames.ut1 || 'PERIODIC ASSESSMENT - I').toUpperCase(),
          subTitle: 'First Periodic Evaluation & Progress Report',
          scale: 'Max Marks: 50 / Subject',
          key: 'ut1',
          adminName: examNames.ut1,
          color: 'blue'
        };
      case 'term1':
        return {
          title: (examNames.term1 || 'TERMINAL ASSESSMENT - I').toUpperCase(),
          subTitle: 'Mid-Term Comprehensive Scholastic Evaluation',
          scale: 'Max Marks: 100 / Subject (Theory + Practical)',
          key: 'term1',
          adminName: examNames.term1,
          color: 'purple'
        };
      case 'ut2':
        return {
          title: (examNames.ut2 || 'PERIODIC ASSESSMENT - II').toUpperCase(),
          subTitle: 'Second Periodic Evaluation & Progress Report',
          scale: 'Max Marks: 50 / Subject',
          key: 'ut2',
          adminName: examNames.ut2,
          color: 'indigo'
        };
      case 'term2':
        return {
          title: (examNames.term2 || 'TERMINAL ASSESSMENT - II').toUpperCase(),
          subTitle: 'Final Term Comprehensive Scholastic Evaluation',
          scale: 'Max Marks: 100 / Subject (Theory + Practical)',
          key: 'term2',
          adminName: examNames.term2,
          color: 'teal'
        };
      case 'annual':
      default:
        return {
          title: 'ANNUAL CONSOLIDATED PROGRESS & PROMOTION REPORT CARD',
          subTitle: '20% Periodic 1 + 30% Terminal 1 + 20% Periodic 2 + 30% Terminal 2 (100% Combined Scale)',
          scale: 'Consolidated Evaluation across All 4 Exams with Class Rank & Promotion',
          key: 'annual',
          color: 'emerald'
        };
    }
  }, [selectedType, examNames]);

  // Download PDF Marksheet for Student or Batch
  const handleDownloadPDF = async (isBatch = false) => {
    if (!classData || (!currentStudentItem && !isBatch)) return;
    setGeneratingPdf(true);

    try {
      const isLandscape = selectedType === 'annual';
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

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

      for (let sIdx = 0; sIdx < studentsToPrint.length; sIdx++) {
        const item = studentsToPrint[sIdx];
        if (sIdx > 0) doc.addPage();
        const s = item.student;

        // Load student photo if available
        let studentPhotoBase64 = null;
        const photoUrl = s.photo_url || s.photoUrl || s.photo || s.avatar;
        if (photoUrl) {
          try {
            const pData = await loadImageBase64(photoUrl);
            if (pData?.base64) studentPhotoBase64 = pData.base64;
          } catch (e) {
            console.warn('Could not load student photo:', e);
          }
        }

        const studentRemark = customRemarks[s.id] !== undefined
          ? customRemarks[s.id]
          : (item.annual?.teacherRemarks || 'Satisfactory academic performance and positive conduct. Promoted to next class.');

        if (isLandscape) {
          // =========================================================================
          // A4 LANDSCAPE ANNUAL COMBINED MARKSHEET (297mm x 210mm) - EXACT SINGLE PAGE
          // =========================================================================

          // 1. Double Page Border
          doc.setDrawColor(20, 83, 45); // Deep green
          doc.setLineWidth(1.2);
          doc.rect(8, 8, 281, 194);
          doc.setDrawColor(187, 247, 208); // Light green inner line
          doc.setLineWidth(0.5);
          doc.rect(10, 10, 277, 190);

          // 2. Subtle Watermark Seal
          doc.setFontSize(40);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(245, 248, 246);
          doc.text('HOLY NAME', 148.5, 115, { align: 'center', angle: 25 });

          // 3. School Logo (Left: x=14, y=12, w=22, h=22)
          if (logoBase64) {
            try {
              doc.addImage(logoBase64, 'PNG', 14, 12, 22, 22);
            } catch (e) {
              console.warn('PDF logo render error:', e);
            }
          }

          // 4. Student Photo (Right: x=261, y=12, w=22, h=25)
          if (studentPhotoBase64) {
            try {
              doc.addImage(studentPhotoBase64, 'JPEG', 261, 12, 22, 25);
              doc.setDrawColor(20, 83, 45);
              doc.setLineWidth(0.4);
              doc.rect(261, 12, 22, 25);
            } catch (e) {
              doc.setDrawColor(203, 213, 225);
              doc.rect(261, 12, 22, 25);
              doc.setFontSize(6.5);
              doc.setTextColor(148, 163, 184);
              doc.text('STUDENT\nPHOTO', 272, 22, { align: 'center' });
            }
          } else {
            doc.setFillColor(248, 250, 252);
            doc.rect(261, 12, 22, 25, 'FD');
            doc.setDrawColor(203, 213, 225);
            doc.rect(261, 12, 22, 25, 'S');
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(148, 163, 184);
            doc.text('STUDENT\nPHOTO', 272, 23, { align: 'center' });
          }

          // 5. School Header (Center: x=148.5)
          doc.setFontSize(15);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 83, 45);
          doc.text(schoolName, 148.5, 16, { align: 'center' });

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(schoolAddress, 148.5, 20.5, { align: 'center' });

          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(affiliation, 148.5, 24.5, { align: 'center' });

          // 6. Title Ribbon (Full Width: 269mm)
          doc.setFillColor(240, 253, 244);
          doc.roundedRect(14, 28, 269, 7, 1.5, 1.5, 'F');
          doc.setDrawColor(187, 247, 208);
          doc.roundedRect(14, 28, 269, 7, 1.5, 1.5, 'S');

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text('ANNUAL CONSOLIDATED PROGRESS & PROMOTION REPORT CARD (ACADEMIC SESSION 2025-2026)', 148.5, 32.8, { align: 'center' });

          // 7. Student Info Box (2 horizontal rows)
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(14, 38, 269, 16, 1.5, 1.5, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(14, 38, 269, 16, 1.5, 1.5, 'S');

          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);

          // Row 1 (y = 43.5)
          doc.setFont('helvetica', 'bold');
          doc.text('Student Name:', 18, 43.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.student_name || s.name || 'N/A').toUpperCase(), 42, 43.5);

          doc.setFont('helvetica', 'bold');
          doc.text('Admission ID:', 95, 43.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.admission_id || s.admissionId || 'N/A'), 118, 43.5);

          doc.setFont('helvetica', 'bold');
          doc.text('Class & Section:', 168, 43.5);
          doc.setFont('helvetica', 'normal');
          doc.text(`Class ${selectedClass} - ${s.section || 'A'}`, 195, 43.5);

          doc.setFont('helvetica', 'bold');
          doc.text('Roll Number:', 235, 43.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 83, 45);
          doc.text(String(s.roll_number || 'N/A'), 257, 43.5);

          // Row 2 (y = 50.5)
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('Guardian Name:', 18, 50.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.guardian_name || s.father_name || 'N/A'), 44, 50.5);

          doc.setFont('helvetica', 'bold');
          doc.text('Date of Birth:', 95, 50.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.date_of_birth || 'N/A'), 118, 50.5);

          doc.setFont('helvetica', 'bold');
          doc.text('Academic Session:', 168, 50.5);
          doc.setFont('helvetica', 'normal');
          doc.text('2025 - 2026', 198, 50.5);

          doc.setFont('helvetica', 'bold');
          doc.text('Attendance:', 235, 50.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(item.annual?.attendance || '94.6%'), 254, 50.5);

          // 8. Multi-Exam Tabulation Grid (All 4 Exams + Combined)
          const tableHeaders = [[
            'Sl',
            'Subject Name',
            `${examNames.ut1}\n(20% Wt)`,
            `${examNames.term1}\n(30% Wt)`,
            `${examNames.ut2}\n(20% Wt)`,
            `${examNames.term2}\n(30% Wt)`,
            'Combined Marks\n(/100)',
            'Combined\n%',
            'Grade',
            'Remarks'
          ]];

          const tableBody = (item.annual?.subjects || []).map((sub) => [
            sub.sl,
            sub.subject,
            sub.ut1Raw ? `${sub.ut1Raw}\n(${sub.ut1Wt})` : (sub.ut1Wt != null && sub.ut1Wt !== '—' ? sub.ut1Wt : '—'),
            sub.term1Raw ? `${sub.term1Raw}\n(${sub.term1Wt})` : (sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—'),
            sub.ut2Raw ? `${sub.ut2Raw}\n(${sub.ut2Wt})` : (sub.ut2Wt != null && sub.ut2Wt !== '—' ? sub.ut2Wt : '—'),
            sub.term2Raw ? `${sub.term2Raw}\n(${sub.term2Wt})` : (sub.term2Wt != null && sub.term2Wt !== '—' ? sub.term2Wt : '—'),
            sub.finalScore ?? '—',
            sub.finalScore && sub.finalScore !== '—' ? `${sub.finalScore}%` : '—',
            sub.grade || '—',
            sub.remarks || '—'
          ]);

          autoTable(doc, {
            head: tableHeaders,
            body: tableBody,
            startY: 57,
            margin: { left: 14, right: 14 },
            theme: 'grid',
            styles: {
              fontSize: 7.5,
              cellPadding: 1.5,
              halign: 'center',
              valign: 'middle',
              textColor: [30, 41, 59],
              lineColor: [226, 232, 240],
              lineWidth: 0.15
            },
            headStyles: {
              fillColor: [20, 83, 45],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 7.5
            },
            columnStyles: {
              0: { cellWidth: 9 },
              1: { cellWidth: 52, halign: 'left', fontStyle: 'bold' },
              2: { cellWidth: 26 },
              3: { cellWidth: 26 },
              4: { cellWidth: 26 },
              5: { cellWidth: 26 },
              6: { cellWidth: 30, fontStyle: 'bold', textColor: [20, 83, 45] },
              7: { cellWidth: 22, fontStyle: 'bold' },
              8: { cellWidth: 18, fontStyle: 'bold', textColor: [67, 56, 202] },
              9: { cellWidth: 34 }
            }
          });

          const tableEndY = doc.lastAutoTable.finalY;

          // 9. Performance & Promotion Strip
          const summaryY = Math.min(tableEndY + 3, 148);
          doc.setFillColor(240, 253, 244);
          doc.roundedRect(14, summaryY, 269, 14, 1.5, 1.5, 'F');
          doc.setDrawColor(187, 247, 208);
          doc.roundedRect(14, summaryY, 269, 14, 1.5, 1.5, 'S');

          // Line 1 of Summary
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 83, 45);
          doc.text(`Combined Total: ${item.annual?.totalObtained || 0} / ${item.annual?.totalMax || 0}`, 18, summaryY + 5.5);
          doc.text(`Overall Percentage: ${item.annual?.percentage || 0}%`, 85, summaryY + 5.5);
          doc.text(`Overall Grade: ${item.annual?.overallGrade || '—'}`, 150, summaryY + 5.5);
          doc.text(`Class Rank: #${item.annual?.rank || 1}`, 215, summaryY + 5.5);

          // Line 2 of Summary: Promotion Status (Highlight)
          doc.setFontSize(9);
          doc.text(`Promotion Status: ${item.annual?.promotion || 'PROMOTED'}`, 18, summaryY + 11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`Final Result: ${item.annual?.status || 'PASSED'}`, 150, summaryY + 11);
          doc.text(`Annual Attendance: ${item.annual?.attendance || '94.6%'}`, 215, summaryY + 11);

          // 10. Class Teacher Remarks Box
          const remarkY = summaryY + 16.5;
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(14, remarkY, 269, 8, 1, 1, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(14, remarkY, 269, 8, 1, 1, 'S');

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text("Class Teacher's Remarks:", 18, remarkY + 5.2);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(51, 65, 85);
          const remarkLines = doc.splitTextToSize(`"${studentRemark}"`, 208);
          doc.text(remarkLines, 62, remarkY + 5.2);

          // 11. Grading Scale Key
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text(
            'Grading Scale: A1 (90-100) | A2 (80-89) | B1 (70-79) | B2 (60-69) | C1 (50-59) | C2 (40-49) | D (33-39) | E (Below 33)',
            148.5,
            185,
            { align: 'center' }
          );

          // 12. Signatures Row at fixed bottom y = 193
          const sigY = 193;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);

          doc.text('Class Teacher', 45, sigY, { align: 'center' });
          doc.text('Parent / Guardian', 148.5, sigY, { align: 'center' });
          doc.text('Principal / Headmaster', 245, sigY, { align: 'center' });

          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text('(Signature & Date)', 45, sigY + 3.5, { align: 'center' });
          doc.text('(Signature)', 148.5, sigY + 3.5, { align: 'center' });
          doc.text('(Signature & Official Seal)', 245, sigY + 3.5, { align: 'center' });

        } else {
          // =========================================================================
          // PORTRAIT SINGLE EXAM MARKSHEET (210mm x 297mm)
          // =========================================================================

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
          doc.setTextColor(245, 248, 246);
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

          // Title Ribbon with dynamic school admin exam name
          doc.setFillColor(240, 253, 244);
          doc.roundedRect(14, currentY, 182, 10, 2, 2, 'F');
          doc.setDrawColor(187, 247, 208);
          doc.roundedRect(14, currentY, 182, 10, 2, 2, 'S');

          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 101, 52);
          doc.text(marksheetMeta.title, 105, currentY + 6.5, { align: 'center' });
          currentY += 13;

          // Student Info Card with Student Photo
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
          doc.text(`${s.student_name || s.name || 'N/A'}`.toUpperCase(), 45, currentY + 6);

          doc.setFont('helvetica', 'bold');
          doc.text('Admission ID:', 110, currentY + 6);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.admission_id || s.admissionId || 'N/A'}`, 135, currentY + 6);

          // Row 2
          doc.setFont('helvetica', 'bold');
          doc.text('Class & Section:', 18, currentY + 14);
          doc.setFont('helvetica', 'normal');
          doc.text(`Class ${selectedClass} - ${s.section || 'A'}`, 45, currentY + 14);

          doc.setFont('helvetica', 'bold');
          doc.text('Roll Number:', 110, currentY + 14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 83, 45);
          doc.text(`${s.roll_number || 'N/A'}`, 135, currentY + 14);

          // Row 3
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('Guardian Name:', 18, currentY + 22);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.guardian_name || s.father_name || 'N/A'}`, 45, currentY + 22);

          doc.setFont('helvetica', 'bold');
          doc.text('Date of Birth:', 110, currentY + 22);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.date_of_birth || 'N/A'}`, 135, currentY + 22);

          // Student Photo Box / Actual photo
          if (studentPhotoBase64) {
            try {
              doc.addImage(studentPhotoBase64, 'JPEG', 172, currentY + 2.5, 19, 21);
              doc.setDrawColor(20, 83, 45);
              doc.rect(172, currentY + 2.5, 19, 21);
            } catch (e) {
              doc.setDrawColor(203, 213, 225);
              doc.rect(172, currentY + 2.5, 19, 21);
              doc.setFontSize(6);
              doc.setTextColor(148, 163, 184);
              doc.text('PHOTO', 181.5, currentY + 13, { align: 'center' });
            }
          } else {
            doc.setDrawColor(203, 213, 225);
            doc.rect(172, currentY + 2.5, 19, 21);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text('PASSPORT\nPHOTO', 181.5, currentY + 11, { align: 'center' });
          }

          currentY += 29;

          // Table Content for Individual Exam
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
          } else {
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
          const summaryData = selectedType === 'ut1' ? item.ut1 : selectedType === 'ut2' ? item.ut2 : selectedType === 'term1' ? item.term1 : item.term2;

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
          doc.text(`Class Rank: #${summaryData?.rank || '1'}`, 20, currentY + 17);
          doc.text(`Final Result: ${summaryData?.status || 'PASSED'}`, 85, currentY + 17);
          doc.text(`Attendance: 95%`, 145, currentY + 17);

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
        }
      }

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
    const summaryData = selectedType === 'annual' ? currentStudentItem.annual
      : (selectedType === 'ut1' ? currentStudentItem.ut1 : selectedType === 'ut2' ? currentStudentItem.ut2 : selectedType === 'term1' ? currentStudentItem.term1 : currentStudentItem.term2);

    await exportStudentMarksheetToExcel({
      marksheetType: selectedType === 'annual' ? 'annual' : (selectedType.startsWith('ut') ? 'unit_test' : 'terminal'),
      schoolProfile,
      student: currentStudentItem.student,
      examName: marksheetMeta.title,
      data: {
        ...(summaryData || {}),
        teacherRemarks: activeStudentRemark
      },
      examNames,
      filename: `Marksheet_${(currentStudentItem.student.student_name || 'Student').replace(/\s+/g, '_')}_${selectedType.toUpperCase()}.xlsx`
    });
  };

  // Download Class Broadsheet in Excel
  const handleDownloadClassBroadsheetExcel = async () => {
    if (!classData?.students?.length) return;
    const timetable = (classData.classSubjects || []).map(s => ({ subject: s, total_marks: 100 }));
    const calculatedRows = classData.students.map(item => {
      const summaryData = selectedType === 'annual' ? item.annual
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

  // Save customized teacher remark
  const handleSaveRemark = () => {
    if (currentStudentItem) {
      setCustomRemarks(prev => ({
        ...prev,
        [currentStudentItem.student.id]: tempRemarkText
      }));
    }
    setEditingRemarks(false);
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
                Generate 4 individual exam marksheets and the Combined Annual Report Card in Landscape mode with Photo & School Logo.
              </p>
            </div>
          </div>
        </div>

        {/* Global Class Selector & View Mode */}
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

      {/* Marksheet Type Navigation Bar (5 Tabs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
        
        {/* Tab 1: Periodic 1 (Admin Named) */}
        <button
          onClick={() => setSelectedType('ut1')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'ut1'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span className="truncate max-w-[130px]">{examNames.ut1}</span>
          <span className="text-[10px] font-normal opacity-85">Periodic 1 (50M)</span>
        </button>

        {/* Tab 2: Terminal 1 (Admin Named) */}
        <button
          onClick={() => setSelectedType('term1')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'term1'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span className="truncate max-w-[130px]">{examNames.term1}</span>
          <span className="text-[10px] font-normal opacity-85">Terminal 1 (100M)</span>
        </button>

        {/* Tab 3: Periodic 2 (Admin Named) */}
        <button
          onClick={() => setSelectedType('ut2')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'ut2'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span className="truncate max-w-[130px]">{examNames.ut2}</span>
          <span className="text-[10px] font-normal opacity-85">Periodic 2 (50M)</span>
        </button>

        {/* Tab 4: Terminal 2 (Admin Named) */}
        <button
          onClick={() => setSelectedType('term2')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'term2'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-600/30'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span className="truncate max-w-[130px]">{examNames.term2}</span>
          <span className="text-[10px] font-normal opacity-85">Terminal 2 (100M)</span>
        </button>

        {/* Tab 5: Annual Combined Marksheet (Takes 2 cols on lg) */}
        <button
          onClick={() => setSelectedType('annual')}
          className={`col-span-2 sm:col-span-2 lg:col-span-2 py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center ${
            selectedType === 'annual'
              ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/25 ring-2 ring-emerald-600'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-black">
            <FaAward className="text-amber-300" /> Annual Marksheet (Combined)
          </span>
          <span className="text-[10px] font-normal opacity-90">
            Landscape Single-Page • 20% PA1 + 30% Term1 + 20% PA2 + 30% Term2
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <FaSpinner className="animate-spin text-3xl text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-slate-600">Aggregating Marksheets & Calculating Weighted Percentages for Class {selectedClass}...</p>
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
                  const summaryData = selectedType === 'annual' ? item.annual
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
                <FaFilePdf className="text-sm" /> Download PDF ({selectedType === 'annual' ? 'Landscape' : 'Portrait'})
              </button>

              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition"
              >
                <FaFileExcel className="text-sm" /> Download Excel ({selectedType === 'annual' ? 'Landscape' : 'Standard'})
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

          {/* ========================================================================= */}
          {/* INTERACTIVE REPORT CARD SHEET (LIVE VISUAL PREVIEW) */}
          {/* ========================================================================= */}
          {currentStudentItem && (
            selectedType === 'annual' ? (
              /* LANDSCAPE ANNUAL COMBINED REPORT CARD PREVIEW (MAX-W-6XL) */
              <div className="max-w-6xl mx-auto bg-white rounded-3xl border-2 border-emerald-900/90 p-8 shadow-2xl relative overflow-hidden space-y-6 font-body-md">
                
                {/* Decorative Double Border Inset */}
                <div className="absolute inset-2 border border-emerald-200/80 rounded-2xl pointer-events-none" />

                {/* Top Badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <FaAward className="text-amber-500" /> Official A4 Landscape Report Card
                  </span>
                  <span className="uppercase tracking-wider">
                    Formula: 20% PA1 + 30% Term1 + 20% PA2 + 30% Term2 = 100%
                  </span>
                </div>

                {/* School Header with Logo and Student Photo */}
                <div className="flex items-start justify-between gap-6 pt-2">
                  
                  {/* Left: School Logo */}
                  <div className="w-24 shrink-0 flex items-center justify-start">
                    {schoolProfile?.logo ? (
                      <img
                        src={schoolProfile.logo}
                        alt="School Logo"
                        className="w-20 h-20 object-contain drop-shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 text-3xl font-black">
                        <FaSchool />
                      </div>
                    )}
                  </div>

                  {/* Center: School Header & Report Card Title */}
                  <div className="flex-1 text-center space-y-1">
                    <h1 className="text-2xl lg:text-3xl font-black text-emerald-950 font-headline uppercase tracking-tight">
                      {schoolProfile?.name || 'Holy Name Higher Secondary School'}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      {schoolProfile?.officeAddress || 'Hatimuria Gaon, Sivasagar, Assam - 785640'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Affiliated to Board of Secondary Education | Recognized by Govt. of Assam • Estd. 1978
                    </p>

                    {/* Ribbon Title */}
                    <div className="mt-3 inline-block bg-emerald-50 px-8 py-2 rounded-full border border-emerald-300 shadow-sm">
                      <h2 className="text-xs lg:text-sm font-black text-emerald-900 tracking-wider uppercase">
                        ANNUAL CONSOLIDATED PROGRESS & PROMOTION REPORT CARD
                      </h2>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Academic Session 2025 - 2026 • Combined Evaluation of All 4 Examinations
                      </p>
                    </div>
                  </div>

                  {/* Right: Student Photo */}
                  <div className="w-24 shrink-0 flex flex-col items-center justify-center">
                    {(currentStudentItem.student.photo_url || currentStudentItem.student.photo || currentStudentItem.student.avatar) ? (
                      <img
                        src={currentStudentItem.student.photo_url || currentStudentItem.student.photo || currentStudentItem.student.avatar}
                        alt="Student"
                        className="w-20 h-24 object-cover rounded-xl border-2 border-emerald-800 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-24 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-1">
                        <FaCamera className="text-slate-300 text-xl mb-1" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight">
                          Passport<br/>Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizontal Student Details Card (2 Rows) */}
                <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6 text-xs">
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Student Name</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {currentStudentItem.student.student_name || currentStudentItem.student.name}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Admission ID</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {currentStudentItem.student.admission_id || currentStudentItem.student.admissionId || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Class & Section</span>
                    <span className="font-bold text-slate-800">
                      Class {selectedClass} - {currentStudentItem.student.section || 'A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Roll Number</span>
                    <span className="font-black text-emerald-800 text-sm">
                      #{currentStudentItem.student.roll_number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Guardian Name</span>
                    <span className="font-medium text-slate-800">
                      {currentStudentItem.student.guardian_name || currentStudentItem.student.father_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Date of Birth</span>
                    <span className="font-medium text-slate-800">
                      {currentStudentItem.student.date_of_birth || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Academic Session</span>
                    <span className="font-medium text-slate-800">2025 - 2026</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[9px]">Annual Attendance</span>
                    <span className="font-bold text-emerald-700">
                      {currentStudentItem.annual?.attendance || '94.6%'}
                    </span>
                  </div>
                </div>

                {/* Multi-Exam Tabulation Grid (All 4 Exams + Combined Score) */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-950 text-white font-bold uppercase tracking-wider text-[11px]">
                        <th className="p-3 pl-4 text-center w-12 border-r border-emerald-800">Sl</th>
                        <th className="p-3 border-r border-emerald-800">Subject Name</th>
                        <th className="p-3 text-center border-r border-emerald-800 bg-blue-950/60">
                          {examNames.ut1}<br/><span className="text-[9px] font-normal text-blue-200">(20% Wt)</span>
                        </th>
                        <th className="p-3 text-center border-r border-emerald-800 bg-purple-950/60">
                          {examNames.term1}<br/><span className="text-[9px] font-normal text-purple-200">(30% Wt)</span>
                        </th>
                        <th className="p-3 text-center border-r border-emerald-800 bg-indigo-950/60">
                          {examNames.ut2}<br/><span className="text-[9px] font-normal text-indigo-200">(20% Wt)</span>
                        </th>
                        <th className="p-3 text-center border-r border-emerald-800 bg-teal-950/60">
                          {examNames.term2}<br/><span className="text-[9px] font-normal text-teal-200">(30% Wt)</span>
                        </th>
                        <th className="p-3 text-center border-r border-emerald-800 bg-emerald-900 font-extrabold">
                          Combined Marks<br/><span className="text-[9px] font-normal text-emerald-200">(/100 Scale)</span>
                        </th>
                        <th className="p-3 text-center border-r border-emerald-800">Combined %</th>
                        <th className="p-3 text-center border-r border-emerald-800">Grade</th>
                        <th className="p-3 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(currentStudentItem.annual?.subjects || []).map((sub, idx) => (
                        <tr key={sub.subject || idx} className="hover:bg-emerald-50/30 transition">
                          <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-100">{sub.sl}</td>
                          <td className="p-3 font-bold text-slate-900 border-r border-slate-100">{sub.subject}</td>
                          <td className="p-3 text-center font-medium text-slate-700 border-r border-slate-100">
                            {sub.ut1Raw ? (
                              <div>
                                <span className="font-semibold">{sub.ut1Raw}</span>
                                <span className="block text-[10px] text-blue-600 font-bold">({sub.ut1Wt})</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-center font-medium text-slate-700 border-r border-slate-100">
                            {sub.term1Raw ? (
                              <div>
                                <span className="font-semibold">{sub.term1Raw}</span>
                                <span className="block text-[10px] text-purple-600 font-bold">({sub.term1Wt})</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-center font-medium text-slate-700 border-r border-slate-100">
                            {sub.ut2Raw ? (
                              <div>
                                <span className="font-semibold">{sub.ut2Raw}</span>
                                <span className="block text-[10px] text-indigo-600 font-bold">({sub.ut2Wt})</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-center font-medium text-slate-700 border-r border-slate-100">
                            {sub.term2Raw ? (
                              <div>
                                <span className="font-semibold">{sub.term2Raw}</span>
                                <span className="block text-[10px] text-teal-600 font-bold">({sub.term2Wt})</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-center font-black text-emerald-800 text-sm border-r border-slate-100 bg-emerald-50/40">
                            {sub.finalScore}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800 border-r border-slate-100">
                            {sub.finalScore !== '—' ? `${sub.finalScore}%` : '—'}
                          </td>
                          <td className="p-3 text-center font-black text-indigo-700 border-r border-slate-100">
                            {sub.grade}
                          </td>
                          <td className="p-3 text-center text-slate-600 font-medium">
                            {sub.remarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance Summary & Promotion Strip */}
                <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-300 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Combined Total</span>
                      <span className="text-xl font-black text-emerald-950">
                        {currentStudentItem.annual?.totalObtained || 0} / {currentStudentItem.annual?.totalMax || 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Combined Percentage</span>
                      <span className="text-xl font-black text-emerald-950">
                        {currentStudentItem.annual?.percentage || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Overall Grade</span>
                      <span className="text-xl font-black text-indigo-800">
                        {currentStudentItem.annual?.overallGrade || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Class Rank</span>
                      <span className="text-xl font-black text-emerald-950">
                        #{currentStudentItem.annual?.rank || 1}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Promotion Status Banner */}
                  <div className="pt-3 border-t border-emerald-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-semibold">Final Result:</span>
                      <span className="font-black text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                        {currentStudentItem.annual?.status || 'PASSED'}
                      </span>
                    </div>

                    {/* Promotion Status Badge */}
                    <div className="px-5 py-2 rounded-xl font-black text-sm shadow-sm flex items-center gap-2 bg-emerald-600 text-white border border-emerald-700">
                      <FaCheckCircle className="text-base" />
                      <span>{currentStudentItem.annual?.promotion}</span>
                    </div>
                  </div>
                </div>

                {/* Class Teacher Remarks Panel (Editable) */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Class Teacher's Remarks & Conduct Evaluation:
                    </span>
                    {editingRemarks ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={tempRemarkText}
                          onChange={(e) => setTempRemarkText(e.target.value)}
                          className="w-full p-2.5 text-xs border border-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveRemark}
                            className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 transition"
                          >
                            <FaCheck /> Save Remarks
                          </button>
                          <button
                            onClick={() => setEditingRemarks(false)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-300 transition"
                          >
                            <FaTimes /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-800 italic mt-0.5">
                        "{activeStudentRemark}"
                      </p>
                    )}
                  </div>
                  {!editingRemarks && (
                    <button
                      onClick={() => {
                        setTempRemarkText(activeStudentRemark);
                        setEditingRemarks(true);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <FaEdit /> Edit Remarks
                    </button>
                  )}
                </div>

                {/* Official Signatures Row */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-800">
                  <div>
                    <div className="h-10" />
                    <div className="border-t border-slate-300 pt-1.5">Class Teacher</div>
                    <span className="text-[10px] text-slate-400 font-normal">(Signature & Date)</span>
                  </div>
                  <div>
                    <div className="h-10" />
                    <div className="border-t border-slate-300 pt-1.5">Parent / Guardian</div>
                    <span className="text-[10px] text-slate-400 font-normal">(Signature)</span>
                  </div>
                  <div>
                    <div className="h-10 flex items-center justify-center">
                      <span className="w-12 h-12 rounded-full border border-dashed border-emerald-400 flex items-center justify-center text-[8px] text-emerald-700 font-bold uppercase">
                        Seal
                      </span>
                    </div>
                    <div className="border-t border-slate-300 pt-1.5">Principal / Headmaster</div>
                    <span className="text-[10px] text-slate-400 font-normal">(Signature & Official Seal)</span>
                  </div>
                </div>

              </div>
            ) : (
              /* PORTRAIT SINGLE EXAM REPORT CARD PREVIEW (MAX-W-4XL) */
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

                  {/* Marksheet Title Banner with Dynamic Admin Exam Name */}
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
                      <span className="font-extrabold text-slate-900 text-sm">
                        {currentStudentItem.student.student_name || currentStudentItem.student.name}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-bold uppercase text-[10px]">Admission ID</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {currentStudentItem.student.admission_id || currentStudentItem.student.admissionId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-bold uppercase text-[10px]">Class & Section</span>
                      <span className="font-bold text-slate-800">
                        Class {selectedClass} - {currentStudentItem.student.section || 'A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-bold uppercase text-[10px]">Roll Number</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        #{currentStudentItem.student.roll_number || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-bold uppercase text-[10px]">Guardian Name</span>
                      <span className="font-medium text-slate-800">
                        {currentStudentItem.student.guardian_name || currentStudentItem.student.father_name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-bold uppercase text-[10px]">Date of Birth</span>
                      <span className="font-medium text-slate-800">
                        {currentStudentItem.student.date_of_birth || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Passport Photo Frame / Actual Photo */}
                  <div className="w-20 h-24 shrink-0 flex items-center justify-center">
                    {(currentStudentItem.student.photo_url || currentStudentItem.student.photo || currentStudentItem.student.avatar) ? (
                      <img
                        src={currentStudentItem.student.photo_url || currentStudentItem.student.photo || currentStudentItem.student.avatar}
                        alt="Photo"
                        className="w-20 h-24 object-cover rounded-xl border border-slate-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-24 border-2 border-dashed border-slate-300 rounded-xl bg-white flex flex-col items-center justify-center text-center p-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          Passport<br/>Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Marks Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-emerald-900 text-white font-bold uppercase tracking-wider text-[11px]">
                        <th className="p-3 pl-4 text-center w-12">Sl</th>
                        <th className="p-3">Subject Name</th>
                        {selectedType.startsWith('term') ? (
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
                        const examObj = selectedType === 'ut1' ? currentStudentItem.ut1 : selectedType === 'ut2' ? currentStudentItem.ut2 : selectedType === 'term1' ? currentStudentItem.term1 : currentStudentItem.term2;

                        return (examObj?.subjects || []).map((sub, idx) => (
                          <tr key={sub.subject || idx} className="hover:bg-emerald-50/30 transition">
                            <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{sub.subject}</td>
                            {selectedType.startsWith('term') ? (
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
                  const summaryData = selectedType === 'ut1' ? currentStudentItem.ut1 : selectedType === 'ut2' ? currentStudentItem.ut2 : selectedType === 'term1' ? currentStudentItem.term1 : currentStudentItem.term2;

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
                        <span className="text-slate-600 font-medium">
                          Attendance Record: <strong>95%</strong>
                        </span>
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
            )
          )}
        </div>
      )}

    </div>
  );
};

export default MarksheetGenerator;
