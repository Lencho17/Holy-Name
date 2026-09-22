import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { 
  FaFilePdf, FaFileExcel, FaGraduationCap, FaAward, FaSearch, 
  FaUserGraduate, FaChevronLeft, FaChevronRight, FaPrint, FaSpinner, 
  FaCheckCircle, FaExclamationTriangle, FaTable, FaEye, FaLayerGroup,
  FaCalendarCheck, FaSchool, FaEdit, FaCheck, FaTimes, FaCamera,
  FaBarcode, FaQrcode
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  exportStudentMarksheetToExcel, 
  exportBroadsheetExcelWithImage,
  loadImageBase64 
} from '../utils/excelImageExport';

// Dynamic SVG Barcode Component for authentic official report cards
const BarcodeSVG = ({ code, className = "h-8 w-44" }) => {
  const str = String(code || 'HNSS-2025-001').toUpperCase();
  const bars = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    bars.push((charCode % 3) + 1);
    bars.push(1);
    bars.push(((charCode >> 1) % 2) + 1);
    bars.push(1);
  }
  let totalW = bars.reduce((a, b) => a + b, 0) + 8;
  let currX = 4;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${totalW} 26`} className={className} preserveAspectRatio="none">
        {bars.map((w, idx) => {
          const isBar = idx % 2 === 0;
          const x = currX;
          currX += w;
          if (!isBar) return null;
          return <rect key={idx} x={x} y="2" width={w} height="22" fill="#1e293b" />;
        })}
      </svg>
      <span className="text-[8.5px] font-mono tracking-widest text-slate-700 font-bold -mt-0.5">
        *{str}*
      </span>
    </div>
  );
};

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
  const [paperOrientation, setPaperOrientation] = useState('portrait'); // 'landscape' | 'portrait'
  const [promotionScheme, setPromotionScheme] = useState('specimen'); // 'specimen' (20/30/50%) | 'four_exam' (20/30/20/30%)
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
      ut1: classData?.exams?.ut1?.name || '1st & 2nd Unit',
      term1: classData?.exams?.term1?.name || 'Half-Yearly',
      ut2: classData?.exams?.ut2?.name || '3rd & 4th Unit',
      term2: classData?.exams?.term2?.name || 'Annual Exam'
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

  const isClass11to12 = useMemo(() => {
    return /^(CLASS\s*(XI|XII|11|12)|GRADE\s*(XI|XII|11|12)|(XI|XII|11|12))\b/i.test((selectedClass || '').trim());
  }, [selectedClass]);

  const isClass4to8 = useMemo(() => {
    return /^(CLASS\s*(IV|V|VI|VII|VIII|[4-8])|GRADE\s*(IV|V|VI|VII|VIII|[4-8])|(IV|V|VI|VII|VIII|[4-8]))\b/i.test((selectedClass || '').trim());
  }, [selectedClass]);

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
          title: (examNames.ut1 || '1st & 2nd Unit Test').toUpperCase(),
          subTitle: 'First Periodic Evaluation & Progress Report',
          scale: 'PM: 20/50',
          key: 'ut1',
          adminName: examNames.ut1,
          color: 'blue'
        };
      case 'term1':
        return {
          title: (examNames.term1 || 'Half-Yearly Examination').toUpperCase(),
          subTitle: 'Mid-Term Comprehensive Scholastic Evaluation',
          scale: 'PM: 40/100',
          key: 'term1',
          adminName: examNames.term1,
          color: 'purple'
        };
      case 'ut2':
        return {
          title: (examNames.ut2 || '3rd & 4th Unit Test').toUpperCase(),
          subTitle: 'Second Periodic Evaluation & Progress Report',
          scale: 'PM: 20/50',
          key: 'ut2',
          adminName: examNames.ut2,
          color: 'indigo'
        };
      case 'term2':
        return {
          title: (examNames.term2 || 'Annual Examination').toUpperCase(),
          subTitle: 'Final Term Comprehensive Scholastic Evaluation',
          scale: 'PM: 40/100',
          key: 'term2',
          adminName: examNames.term2,
          color: 'teal'
        };
      case 'annual':
      default:
        return {
          title: 'ANNUAL CONSOLIDATED PROGRESS & PROMOTION REPORT CARD',
          subTitle: '20% Periodic 1 + 30% Terminal 1 + 20% Periodic 2 + 30% Terminal 2 (100% Combined Scale)',
          scale: 'All 4 Exams Tabulated with Promotion Criteria & Grading Subjects',
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
      const isLandscape = selectedType === 'annual' && paperOrientation === 'landscape';
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const schoolName = (schoolProfile?.name || 'ACADEMIC INSTITUTION').toUpperCase();
      const schoolAddress = `${schoolProfile?.officeAddress || schoolProfile?.address || 'School Campus Address'}`;
      const contactInfo = `Ph: ${schoolProfile?.phone || schoolProfile?.contactPhone || '91**********'} | Email: ${schoolProfile?.email || 'office@school.edu'}`;
      const currentYear = new Date().getFullYear();
      const academicYearStr = `ACADEMIC YEAR: ${schoolProfile?.academicYear || schoolProfile?.session || `${currentYear}-${currentYear + 1}`}`;
      const watermarkText = schoolProfile?.name ? schoolProfile.name.toUpperCase().substring(0, 24) : 'PROGRESS REPORT';

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
          // A4 LANDSCAPE CONSOLIDATED MARKSHEET (297mm x 210mm)
          // =========================================================================

          // 1. Double Page Border
          doc.setDrawColor(20, 83, 45); // Deep green
          doc.setLineWidth(1.2);
          doc.rect(8, 8, 281, 194);
          doc.setDrawColor(187, 247, 208); // Inner light border
          doc.setLineWidth(0.5);
          doc.rect(10, 10, 277, 190);

          // 2. Subtle Watermark Seal
          doc.setFontSize(40);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(245, 248, 246);
          doc.text(watermarkText, 148.5, 115, { align: 'center', angle: 25 });

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
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 64, 175);
          doc.text('PROGRESS REPORT CARD', 148.5, 14, { align: 'center' });

          doc.setFontSize(14);
          doc.setTextColor(20, 83, 45);
          doc.text(schoolName, 148.5, 19, { align: 'center' });

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`${schoolAddress} | ${contactInfo}`, 148.5, 23, { align: 'center' });

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text(academicYearStr, 148.5, 27, { align: 'center' });

          // 6. Student Info Box (2 horizontal rows)
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(14, 31, 269, 15, 1.5, 1.5, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(14, 31, 269, 15, 1.5, 1.5, 'S');

          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);

          // Row 1
          doc.setFont('helvetica', 'bold');
          doc.text('SL NO:', 18, 36.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.roll_number || '01'), 30, 36.5);

          doc.setFont('helvetica', 'bold');
          doc.text('NAME:', 55, 36.5);
          doc.setFont('helvetica', 'bold');
          doc.text(String(s.student_name || s.name || 'N/A').toUpperCase(), 67, 36.5);

          doc.setFont('helvetica', 'bold');
          doc.text('CLASS:', 150, 36.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(selectedClass), 163, 36.5);

          doc.setFont('helvetica', 'bold');
          doc.text('SEC:', 185, 36.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.section || 'A'), 194, 36.5);

          doc.setFont('helvetica', 'bold');
          doc.text('ROLL:', 215, 36.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 83, 45);
          doc.text(String(s.roll_number || 'N/A'), 226, 36.5);

          // Row 2
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('STUDENT ID:', 18, 42.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.admission_id || s.admissionId || 'N/A'), 40, 42.5);

          doc.setFont('helvetica', 'bold');
          doc.text("FATHER'S NAME:", 95, 42.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.guardian_name || s.father_name || 'N/A').toUpperCase(), 122, 42.5);

          doc.setFont('helvetica', 'bold');
          doc.text('DATE OF BIRTH:', 185, 42.5);
          doc.setFont('helvetica', 'normal');
          doc.text(String(s.date_of_birth || 'N/A'), 210, 42.5);

          // 7. Multi-Exam Tabulation Grid with Grouped Super-Headers
          const isSpecimenScheme = promotionScheme === 'specimen';

          const tableHeaders = isSpecimenScheme ? [
            [
              { content: 'SL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
              { content: 'SUBJECT', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
              { content: 'MARKS', colSpan: 4, styles: { halign: 'center', fillColor: [30, 41, 59] } },
              { content: 'PROMOTION CRITERIA', colSpan: 4, styles: { halign: 'center', fillColor: [20, 83, 45] } },
              { content: 'GRADE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
              { content: `${examNames.ut1}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term1}\nPM:40/100`, styles: { halign: 'center' } },
              { content: `${examNames.ut2}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term2}\nPM:40/100`, styles: { halign: 'center' } },
              { content: '20% Marks\nof all the Unit Test', styles: { halign: 'center' } },
              { content: '30% Marks\nof Half-Yearly Exam', styles: { halign: 'center' } },
              { content: '50% of\nAnnual Exam', styles: { halign: 'center' } },
              { content: 'TOTAL\n(/100)', styles: { halign: 'center', fontStyle: 'bold' } }
            ]
          ] : [
            [
              { content: 'SL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
              { content: 'SUBJECT', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
              { content: 'MARKS', colSpan: 4, styles: { halign: 'center', fillColor: [30, 41, 59] } },
              { content: 'PROMOTION CRITERIA', colSpan: 5, styles: { halign: 'center', fillColor: [20, 83, 45] } },
              { content: 'GRADE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
              { content: `${examNames.ut1}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term1}\nPM:40/100`, styles: { halign: 'center' } },
              { content: `${examNames.ut2}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term2}\nPM:40/100`, styles: { halign: 'center' } },
              { content: `20% Marks\n${examNames.ut1}`, styles: { halign: 'center' } },
              { content: `30% Marks\n${examNames.term1}`, styles: { halign: 'center' } },
              { content: `20% Marks\n${examNames.ut2}`, styles: { halign: 'center' } },
              { content: `30% Marks\n${examNames.term2}`, styles: { halign: 'center' } },
              { content: 'TOTAL\n(/100)', styles: { halign: 'center', fontStyle: 'bold' } }
            ]
          ];

          const tableBody = (item.annual?.subjects || []).map((sub) => {
            if (isSpecimenScheme) {
              return [
                sub.sl,
                sub.subject,
                sub.ut1Raw ? sub.ut1Raw : '—',
                sub.term1Raw ? sub.term1Raw : '—',
                sub.ut2Raw ? sub.ut2Raw : '—',
                sub.term2Raw ? sub.term2Raw : '—',
                sub.utAll20Wt != null && sub.utAll20Wt !== '—' ? sub.utAll20Wt : (sub.ut1Wt || '—'),
                sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—',
                sub.annual50Wt != null && sub.annual50Wt !== '—' ? sub.annual50Wt : (sub.term2Wt || '—'),
                sub.score50Scheme != null && sub.score50Scheme !== '—' ? sub.score50Scheme : (sub.finalScore ?? '—'),
                sub.grade || '—'
              ];
            } else {
              return [
                sub.sl,
                sub.subject,
                sub.ut1Raw ? sub.ut1Raw : '—',
                sub.term1Raw ? sub.term1Raw : '—',
                sub.ut2Raw ? sub.ut2Raw : '—',
                sub.term2Raw ? sub.term2Raw : '—',
                sub.ut1Wt != null && sub.ut1Wt !== '—' ? sub.ut1Wt : '—',
                sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—',
                sub.ut2Wt != null && sub.ut2Wt !== '—' ? sub.ut2Wt : '—',
                sub.term2Wt != null && sub.term2Wt !== '—' ? sub.term2Wt : '—',
                sub.finalScore ?? '—',
                sub.grade || '—'
              ];
            }
          });

          // Summary Rows matching Sample
          const isClass11to12Local = /^(CLASS\s*(XI|XII|11|12)|GRADE\s*(XI|XII|11|12)|(XI|XII|11|12))\b/i.test((selectedClass || '').trim());
          const isClass4to8Local = /^(CLASS\s*(IV|V|VI|VII|VIII|[4-8])|GRADE\s*(IV|V|VI|VII|VIII|[4-8])|(IV|V|VI|VII|VIII|[4-8]))\b/i.test((selectedClass || '').trim());
          const defaultUt = isClass11to12Local ? 6 : (isClass4to8Local ? 8 : 7);
          const defaultTerm = isClass11to12Local ? 7 : (isClass4to8Local ? 10 : 9);
          const appCounts = item.annual?.appearingCounts || { ut1: defaultUt, term1: defaultTerm, ut2: defaultUt, term2: defaultTerm };
          const appSubsTotal = item.annual?.appearingSubjectsCount || item.annual?.subjects?.length || (isClass11to12Local ? 7 : (isClass4to8Local ? 10 : 9));
          const critColsSpan = isSpecimenScheme ? 3 : 4;

          tableBody.push([
            { content: 'APPEARING SUBJECTS', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: String(appCounts.ut1 || defaultUt), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: String(appCounts.term1 || defaultTerm), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: String(appCounts.ut2 || defaultUt), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: String(appCounts.term2 || defaultTerm), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: '—', colSpan: critColsSpan, styles: { halign: 'center' } },
            { content: `${appSubsTotal} Subs`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45] } }
          ]);

          tableBody.push([
            { content: 'TOTAL', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: String(item.ut1?.totalObtained ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: String(item.term1?.totalObtained ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: String(item.ut2?.totalObtained ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: String(item.term2?.totalObtained ?? '—'), styles: { halign: 'center', fontStyle: 'bold' } },
            { content: '—', colSpan: critColsSpan, styles: { halign: 'center' } },
            { content: `${item.annual?.totalObtained || 0}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45] } },
            { content: `/ ${item.annual?.totalMax || 0}`, styles: { halign: 'center', fontStyle: 'normal' } }
          ]);

          tableBody.push([
            { content: 'PERCENTAGE', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: item.ut1 ? `${item.ut1.percentage}%` : '—', styles: { halign: 'center' } },
            { content: item.term1 ? `${item.term1.percentage}%` : '—', styles: { halign: 'center' } },
            { content: item.ut2 ? `${item.ut2.percentage}%` : '—', styles: { halign: 'center' } },
            { content: item.term2 ? `${item.term2.percentage}%` : '—', styles: { halign: 'center' } },
            { content: '—', colSpan: critColsSpan, styles: { halign: 'center' } },
            { content: `${item.annual?.percentage || 0}%`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45] } }
          ]);

          tableBody.push([
            { content: 'RANK', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: `#${item.ut1?.rank || 1}`, styles: { halign: 'center' } },
            { content: `#${item.term1?.rank || 1}`, styles: { halign: 'center' } },
            { content: `#${item.ut2?.rank || 1}`, styles: { halign: 'center' } },
            { content: `#${item.term2?.rank || 1}`, styles: { halign: 'center' } },
            { content: '—', colSpan: critColsSpan, styles: { halign: 'center' } },
            { content: `#${item.annual?.rank || 1}`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [67, 56, 202] } }
          ]);

          tableBody.push([
            { content: 'RESULT', colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            { content: item.ut1?.status || '—', styles: { halign: 'center' } },
            { content: item.term1?.status || '—', styles: { halign: 'center' } },
            { content: item.ut2?.status || '—', styles: { halign: 'center' } },
            { content: item.term2?.status || '—', styles: { halign: 'center' } },
            { content: 'ANNUAL PROMOTION', colSpan: critColsSpan, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 253, 244] } },
            { content: item.annual?.promotion || 'PROMOTED', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45], fillColor: [240, 253, 244] } }
          ]);

          const landColStyles = isSpecimenScheme ? {
            0: { cellWidth: 8 },
            1: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
            2: { cellWidth: 24 },
            3: { cellWidth: 24 },
            4: { cellWidth: 24 },
            5: { cellWidth: 24 },
            6: { cellWidth: 26 },
            7: { cellWidth: 26 },
            8: { cellWidth: 26 },
            9: { cellWidth: 23, fontStyle: 'bold', textColor: [20, 83, 45] },
            10: { cellWidth: 14, fontStyle: 'bold', textColor: [67, 56, 202] }
          } : {
            0: { cellWidth: 8 },
            1: { cellWidth: 46, halign: 'left', fontStyle: 'bold' },
            2: { cellWidth: 23 },
            3: { cellWidth: 23 },
            4: { cellWidth: 23 },
            5: { cellWidth: 23 },
            6: { cellWidth: 21 },
            7: { cellWidth: 21 },
            8: { cellWidth: 21 },
            9: { cellWidth: 21 },
            10: { cellWidth: 23, fontStyle: 'bold', textColor: [20, 83, 45] },
            11: { cellWidth: 16, fontStyle: 'bold', textColor: [67, 56, 202] }
          };

          autoTable(doc, {
            head: tableHeaders,
            body: tableBody,
            startY: 48,
            margin: { left: 14, right: 14 },
            theme: 'grid',
            styles: {
              fontSize: 7,
              cellPadding: 1.2,
              halign: 'center',
              valign: 'middle',
              textColor: [30, 41, 59],
              lineColor: [203, 213, 225],
              lineWidth: 0.15
            },
            headStyles: {
              fontSize: 6.8,
              fontStyle: 'bold',
              fillColor: [30, 41, 59],
              textColor: [255, 255, 255]
            },
            columnStyles: landColStyles
          });

          let currentY = doc.lastAutoTable.finalY + 3;

          // 8. Centered RED REMARKS Label
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38);
          doc.text('REMARKS', 148.5, currentY + 3, { align: 'center' });
          currentY += 5.5;

          // 9. 4-Exam Remarks Boxes (Width: 269mm / 4 = ~65mm each)
          const examBoxW = 65;
          const remarksData = [
            { name: examNames.ut1, text: item.annual?.examRemarks?.ut1 || 'Good effort.' },
            { name: examNames.term1, text: item.annual?.examRemarks?.term1 || 'Satisfactory progress.' },
            { name: examNames.ut2, text: item.annual?.examRemarks?.ut2 || 'Steady progress.' },
            { name: examNames.term2, text: item.annual?.examRemarks?.term2 || studentRemark }
          ];

          remarksData.forEach((rm, rIdx) => {
            const bx = 14 + (rIdx * 68);
            doc.setFillColor(248, 250, 252);
            doc.rect(bx, currentY, examBoxW, 11, 'FD');
            doc.setDrawColor(203, 213, 225);
            doc.rect(bx, currentY, examBoxW, 11, 'S');

            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(rm.name, bx + 2, currentY + 3.2);

            doc.setFontSize(6);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(71, 85, 105);
            const lines = doc.splitTextToSize(`"${rm.text}"`, examBoxW - 4);
            doc.text(lines, bx + 2, currentY + 6.8);
          });

          currentY += 13.5;

          // 10. Left: GRADING SUBJECTS Table | Right: Principal Signature & Barcode
          const gradingBody = (item.annual?.gradingSubjects || []).map(gs => {
            const isStruck = gs.isStruck || (isClass11to12Local && ['CRAFT', 'DRAWING', 'ART', 'CONVERSATION', 'DICTATION'].includes(gs.subject));
            return [
              { content: isStruck ? `${gs.subject} (N/A)` : gs.subject, styles: isStruck ? { textColor: [148, 163, 184], fontStyle: 'italic' } : { halign: 'left', fontStyle: 'bold' } },
              { content: isStruck ? '—' : (gs.halfYearly || 'GOOD'), styles: isStruck ? { textColor: [148, 163, 184] } : {} },
              { content: isStruck ? '—' : (gs.annual || 'GOOD'), styles: isStruck ? { textColor: [148, 163, 184] } : { fontStyle: 'bold', textColor: [20, 83, 45] } }
            ];
          });

          autoTable(doc, {
            head: [
              [{ content: 'GRADING SUBJECTS', colSpan: 3, styles: { halign: 'center', fillColor: [51, 65, 85] } }],
              ['SUBJECTS', 'HALF-YEARLY', 'ANNUAL']
            ],
            body: gradingBody,
            startY: currentY,
            margin: { left: 14, right: 155 },
            tableWidth: 125,
            theme: 'grid',
            styles: {
              fontSize: 6.5,
              cellPadding: 1,
              halign: 'center',
              valign: 'middle',
              textColor: [30, 41, 59],
              lineColor: [203, 213, 225],
              lineWidth: 0.15
            },
            headStyles: {
              fontSize: 6.5,
              fontStyle: 'bold',
              fillColor: [71, 85, 105],
              textColor: [255, 255, 255]
            },
            columnStyles: {
              0: { halign: 'left', fontStyle: 'bold', cellWidth: 55 },
              1: { cellWidth: 35 },
              2: { cellWidth: 35, fontStyle: 'bold', textColor: [20, 83, 45] }
            }
          });

          const gradingEndY = doc.lastAutoTable.finalY;

          // Class Teacher Name Line under grading table
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('CLASS TEACHER NAME: ....................................................', 14, gradingEndY + 4);

          // Right: Principal Signature & Barcode
          const rightX = 145;
          const rightW = 138;

          // Principal Signature Box
          doc.setFillColor(248, 250, 252);
          doc.rect(rightX, currentY, rightW, 16, 'FD');
          doc.setDrawColor(203, 213, 225);
          doc.rect(rightX, currentY, rightW, 16, 'S');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('PRINCIPAL SIGNATURE', rightX + (rightW / 2), currentY + 7, { align: 'center' });
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text('(Verified & School Seal Affixed)', rightX + (rightW / 2), currentY + 11.5, { align: 'center' });

          // Barcode Box
          const bcY = currentY + 18;
          doc.setFillColor(254, 243, 199);
          doc.rect(rightX, bcY, rightW, 14, 'FD');
          doc.setDrawColor(251, 191, 36);
          doc.rect(rightX, bcY, rightW, 14, 'S');

          // Draw vector barcode bars in PDF
          const barcodeCode = `${s.admission_id || s.admissionId || 'HNSS'}-${s.roll_number || '01'}`;
          doc.setFillColor(30, 41, 59);
          const barStartX = rightX + 22;
          for (let b = 0; b < 40; b++) {
            const bw = (b % 3 === 0) ? 1.4 : 0.6;
            const bx = barStartX + (b * 2.3);
            doc.rect(bx, bcY + 2, bw, 7, 'F');
          }
          doc.setFontSize(6.5);
          doc.setFont('courier', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`*${barcodeCode}*`, rightX + (rightW / 2), bcY + 12, { align: 'center' });

          // 11. Bottom Digital Declaration Banner
          const bannerY = Math.max(gradingEndY + 6.5, bcY + 16.5);
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(14, bannerY, 269, 6.5, 1, 1, 'FD');
          doc.setDrawColor(248, 113, 113);
          doc.roundedRect(14, bannerY, 269, 6.5, 1, 1, 'S');

          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.text('This is a Digitally signed document and does not require any Physical Signature', 148.5, bannerY + 4.3, { align: 'center' });

        } else if (selectedType === 'annual') {
          // =========================================================================
          // PORTRAIT 1-PAGE SPECIMEN MARKSHEET (210mm x 297mm) - MATCHING CLASS I TO III SPECIMEN
          // =========================================================================

          // 1. Double Outer Page Border
          doc.setDrawColor(20, 83, 45); // Outer border
          doc.setLineWidth(1.1);
          doc.rect(8, 8, 194, 281);
          doc.setDrawColor(187, 247, 208); // Inner light border
          doc.setLineWidth(0.4);
          doc.rect(10, 10, 190, 277);

          // 2. Watermark Seal
          doc.setFontSize(38);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(245, 248, 246);
          doc.text(watermarkText, 105, 140, { align: 'center', angle: 30 });

          // 3. School Logo (Left: x=14, y=12, w=20, h=20)
          if (logoBase64) {
            try {
              doc.addImage(logoBase64, 'PNG', 14, 12, 20, 20);
            } catch (err) {}
          }

          // 4. Student Photo Box (Top-Right: x=168, y=12, w=24, h=28)
          if (studentPhotoBase64) {
            try {
              doc.addImage(studentPhotoBase64, 'JPEG', 168, 12, 24, 28);
              doc.setDrawColor(20, 83, 45);
              doc.setLineWidth(0.4);
              doc.rect(168, 12, 24, 28);
            } catch (e) {
              doc.setDrawColor(203, 213, 225);
              doc.rect(168, 12, 24, 28);
              doc.setFontSize(6);
              doc.setTextColor(148, 163, 184);
              doc.text('PHOTO', 180, 25, { align: 'center' });
            }
          } else {
            // Frame for student photo matching specimen
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.4);
            doc.rect(168, 12, 24, 28);
            doc.rect(170, 14, 20, 24);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Photo of the\nstudent', 180, 24, { align: 'center' });
          }

          // 5. School Header & Title (Center: x=105)
          // "PROGRESS REPORT CARD" badge
          doc.setFillColor(239, 246, 255);
          doc.roundedRect(68, 12, 74, 5.2, 1, 1, 'FD');
          doc.setDrawColor(59, 130, 246);
          doc.roundedRect(68, 12, 74, 5.2, 1, 1, 'S');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 64, 175);
          doc.text('PROGRESS REPORT CARD', 105, 15.8, { align: 'center' });

          // School Name
          doc.setFontSize(12.5);
          doc.setTextColor(20, 83, 45);
          doc.text(schoolName, 105, 21.5, { align: 'center' });

          // Address & Contact Info
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(schoolAddress, 105, 25.2, { align: 'center' });
          doc.text(contactInfo, 105, 28.5, { align: 'center' });

          // Academic Year with Yellow Highlight Box
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('ACADEMIC YEAR: ', 93, 33);
          const acYear = schoolProfile?.academicYear || schoolProfile?.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
          doc.setFillColor(254, 240, 138); // Yellow highlight
          doc.rect(94, 30.2, 24, 4.2, 'F');
          doc.setTextColor(113, 63, 18);
          doc.text(acYear, 106, 33, { align: 'center' });

          // 6. Student Particulars (Dotted layout style matching specimen)
          let py = 38;
          doc.setFontSize(7.2);
          doc.setTextColor(30, 41, 59);

          // SL NO
          doc.setFont('helvetica', 'bold');
          doc.text('SL NO:', 14, py);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.roll_number || '01'}.....................................................................................................................................................`, 26, py);
          py += 4.2;

          // NAME
          doc.setFont('helvetica', 'bold');
          doc.text('NAME:', 14, py);
          doc.setFont('helvetica', 'bold');
          doc.text(`${(s.student_name || s.name || '').toUpperCase()}...............................................................................................................................`, 26, py);
          py += 4.2;

          // CLASS, SEC, ROLL
          doc.setFont('helvetica', 'bold');
          doc.text('CLASS:', 14, py);
          doc.setFont('helvetica', 'normal');
          doc.text(`${selectedClass}.......................`, 27, py);

          doc.setFont('helvetica', 'bold');
          doc.text('SEC:', 58, py);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.section || 'A'}.........................`, 66, py);

          doc.setFont('helvetica', 'bold');
          doc.text('ROLL:', 98, py);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(20, 83, 45);
          doc.text(`${s.roll_number || '—'}........................................................................`, 108, py);
          py += 4.2;

          // STUDENT ID
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'bold');
          doc.text('STUDENT ID:', 14, py);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.admission_id || s.admissionId || '—'}.................................................................................................................................`, 34, py);
          py += 4.2;

          // FATHER'S NAME
          doc.setFont('helvetica', 'bold');
          doc.text("FATHER'S NAME:", 14, py);
          doc.setFont('helvetica', 'normal');
          doc.text(`${(s.guardian_name || s.father_name || 'N/A').toUpperCase()}..................................................................................................................`, 40, py);
          py += 4.2;

          // DATE OF BIRTH
          doc.setFont('helvetica', 'bold');
          doc.text('DATE OF BIRTH:', 14, py);
          doc.setFont('helvetica', 'normal');
          doc.text(`${s.date_of_birth || 'N/A'}..................................................................................................................................`, 39, py);
          py += 4.5;

          // EXAMINATION with Yellow Highlight Box
          doc.setFont('helvetica', 'bold');
          doc.text('EXAMINATION:', 14, py);
          const examBannerTitle = marksheetMeta.title;
          const examTextWidth = doc.getTextWidth(examBannerTitle);
          doc.setFillColor(254, 240, 138); // Yellow highlight
          doc.rect(38, py - 3.4, examTextWidth + 6, 4.4, 'F');
          doc.setTextColor(30, 41, 59);
          doc.text(examBannerTitle, 41, py);
          py += 6.5;

          // 7. Multi-Exam Tabulation Grid with Grouped Super-Headers
          const isSpecimenScheme = promotionScheme === 'specimen';

          const portHeaders = isSpecimenScheme ? [
            [
              { content: 'SUBJECT', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
              { content: 'MARKS', colSpan: 4, styles: { halign: 'center', fillColor: [30, 41, 59] } },
              { content: 'PROMOTION CRITERIA', colSpan: 4, styles: { halign: 'center', fillColor: [20, 83, 45] } },
              { content: 'GRADE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
              { content: `${examNames.ut1}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term1}\nPM:40/100`, styles: { halign: 'center' } },
              { content: `${examNames.ut2}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term2}\nPM:40/100`, styles: { halign: 'center' } },
              { content: '20% Marks\nof all the Unit Test', styles: { halign: 'center' } },
              { content: '30% Marks\nof Half-Yearly Exam', styles: { halign: 'center' } },
              { content: '50% of\nAnnual Exam', styles: { halign: 'center' } },
              { content: 'TOTAL\n(/100)', styles: { halign: 'center', fontStyle: 'bold' } }
            ]
          ] : [
            [
              { content: 'SUBJECT', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
              { content: 'MARKS', colSpan: 4, styles: { halign: 'center', fillColor: [30, 41, 59] } },
              { content: 'PROMOTION CRITERIA', colSpan: 5, styles: { halign: 'center', fillColor: [20, 83, 45] } },
              { content: 'GRADE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
            ],
            [
              { content: `${examNames.ut1}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term1}\nPM:40/100`, styles: { halign: 'center' } },
              { content: `${examNames.ut2}\nPM:20/50`, styles: { halign: 'center' } },
              { content: `${examNames.term2}\nPM:40/100`, styles: { halign: 'center' } },
              { content: `20% Marks\n${examNames.ut1}`, styles: { halign: 'center' } },
              { content: `30% Marks\n${examNames.term1}`, styles: { halign: 'center' } },
              { content: `20% Marks\n${examNames.ut2}`, styles: { halign: 'center' } },
              { content: `30% Marks\n${examNames.term2}`, styles: { halign: 'center' } },
              { content: 'TOTAL\n(/100)', styles: { halign: 'center', fontStyle: 'bold' } }
            ]
          ];

          const portBody = (item.annual?.subjects || []).map((sub) => {
            if (isSpecimenScheme) {
              return [
                sub.subject,
                sub.ut1Raw ? sub.ut1Raw : '—',
                sub.term1Raw ? sub.term1Raw : '—',
                sub.ut2Raw ? sub.ut2Raw : '—',
                sub.term2Raw ? sub.term2Raw : '—',
                sub.utAll20Wt != null && sub.utAll20Wt !== '—' ? sub.utAll20Wt : (sub.ut1Wt || '—'),
                sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—',
                sub.annual50Wt != null && sub.annual50Wt !== '—' ? sub.annual50Wt : (sub.term2Wt || '—'),
                sub.score50Scheme != null && sub.score50Scheme !== '—' ? sub.score50Scheme : (sub.finalScore ?? '—'),
                sub.grade || '—'
              ];
            } else {
              return [
                sub.subject,
                sub.ut1Raw ? sub.ut1Raw : '—',
                sub.term1Raw ? sub.term1Raw : '—',
                sub.ut2Raw ? sub.ut2Raw : '—',
                sub.term2Raw ? sub.term2Raw : '—',
                sub.ut1Wt != null && sub.ut1Wt !== '—' ? sub.ut1Wt : '—',
                sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—',
                sub.ut2Wt != null && sub.ut2Wt !== '—' ? sub.ut2Wt : '—',
                sub.term2Wt != null && sub.term2Wt !== '—' ? sub.term2Wt : '—',
                sub.finalScore ?? '—',
                sub.grade || '—'
              ];
            }
          });

          // Summary Rows matching Sample
          const isClass11to12Local = /^(CLASS\s*(XI|XII|11|12)|GRADE\s*(XI|XII|11|12)|(XI|XII|11|12))\b/i.test((selectedClass || '').trim());
          const isClass4to8Local = /^(CLASS\s*(IV|V|VI|VII|VIII|[4-8])|GRADE\s*(IV|V|VI|VII|VIII|[4-8])|(IV|V|VI|VII|VIII|[4-8]))\b/i.test((selectedClass || '').trim());
          const defaultUt = isClass11to12Local ? 6 : (isClass4to8Local ? 8 : 7);
          const defaultTerm = isClass11to12Local ? 7 : (isClass4to8Local ? 10 : 9);
          const appCounts = item.annual?.appearingCounts || { ut1: defaultUt, term1: defaultTerm, ut2: defaultUt, term2: defaultTerm };
          const appSubsTotal = item.annual?.appearingSubjectsCount || item.annual?.subjects?.length || (isClass11to12Local ? 7 : (isClass4to8Local ? 10 : 9));
          const portCritSpan = isSpecimenScheme ? 3 : 4;

          portBody.push([
            { content: 'APPEARING SUBJECTS', styles: { halign: 'left', fontStyle: 'bold' } },
            { content: String(appCounts.ut1 || defaultUt), styles: { halign: 'center' } },
            { content: String(appCounts.term1 || defaultTerm), styles: { halign: 'center' } },
            { content: String(appCounts.ut2 || defaultUt), styles: { halign: 'center' } },
            { content: String(appCounts.term2 || defaultTerm), styles: { halign: 'center' } },
            { content: '—', colSpan: portCritSpan, styles: { halign: 'center' } },
            { content: `${appSubsTotal} Subs`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45] } }
          ]);

          portBody.push([
            { content: 'TOTAL', styles: { halign: 'left', fontStyle: 'bold' } },
            { content: String(item.ut1?.totalObtained ?? '—'), styles: { halign: 'center' } },
            { content: String(item.term1?.totalObtained ?? '—'), styles: { halign: 'center' } },
            { content: String(item.ut2?.totalObtained ?? '—'), styles: { halign: 'center' } },
            { content: String(item.term2?.totalObtained ?? '—'), styles: { halign: 'center' } },
            { content: '—', colSpan: portCritSpan, styles: { halign: 'center' } },
            { content: `${item.annual?.totalObtained || 0}`, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45] } },
            { content: `/ ${item.annual?.totalMax || 0}`, styles: { halign: 'center', fontStyle: 'normal' } }
          ]);

          portBody.push([
            { content: 'PERCENTAGE', styles: { halign: 'left', fontStyle: 'bold' } },
            { content: item.ut1 ? `${item.ut1.percentage}%` : '—', styles: { halign: 'center' } },
            { content: item.term1 ? `${item.term1.percentage}%` : '—', styles: { halign: 'center' } },
            { content: item.ut2 ? `${item.ut2.percentage}%` : '—', styles: { halign: 'center' } },
            { content: item.term2 ? `${item.term2.percentage}%` : '—', styles: { halign: 'center' } },
            { content: '—', colSpan: portCritSpan, styles: { halign: 'center' } },
            { content: `${item.annual?.percentage || 0}%`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45] } }
          ]);

          portBody.push([
            { content: 'RANK', styles: { halign: 'left', fontStyle: 'bold' } },
            { content: `#${item.ut1?.rank || 1}`, styles: { halign: 'center' } },
            { content: `#${item.term1?.rank || 1}`, styles: { halign: 'center' } },
            { content: `#${item.ut2?.rank || 1}`, styles: { halign: 'center' } },
            { content: `#${item.term2?.rank || 1}`, styles: { halign: 'center' } },
            { content: '—', colSpan: portCritSpan, styles: { halign: 'center' } },
            { content: `#${item.annual?.rank || 1}`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [67, 56, 202] } }
          ]);

          portBody.push([
            { content: 'RESULT', styles: { halign: 'left', fontStyle: 'bold' } },
            { content: item.ut1?.status || '—', styles: { halign: 'center' } },
            { content: item.term1?.status || '—', styles: { halign: 'center' } },
            { content: item.ut2?.status || '—', styles: { halign: 'center' } },
            { content: item.term2?.status || '—', styles: { halign: 'center' } },
            { content: 'ANNUAL PROMOTION', colSpan: portCritSpan, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 253, 244] } },
            { content: item.annual?.promotion || 'PROMOTED', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', textColor: [20, 83, 45], fillColor: [240, 253, 244] } }
          ]);

          const portColStyles = isSpecimenScheme ? {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 42 },
            1: { cellWidth: 15.5 },
            2: { cellWidth: 15.5 },
            3: { cellWidth: 15.5 },
            4: { cellWidth: 15.5 },
            5: { cellWidth: 16 },
            6: { cellWidth: 16 },
            7: { cellWidth: 16 },
            8: { cellWidth: 16, fontStyle: 'bold', textColor: [20, 83, 45] },
            9: { cellWidth: 14, fontStyle: 'bold', textColor: [67, 56, 202] }
          } : {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 15 },
            2: { cellWidth: 15 },
            3: { cellWidth: 15 },
            4: { cellWidth: 15 },
            5: { cellWidth: 14 },
            6: { cellWidth: 14 },
            7: { cellWidth: 14 },
            8: { cellWidth: 14 },
            9: { cellWidth: 13, fontStyle: 'bold', textColor: [20, 83, 45] },
            10: { cellWidth: 13, fontStyle: 'bold', textColor: [67, 56, 202] }
          };

          autoTable(doc, {
            head: portHeaders,
            body: portBody,
            startY: py,
            margin: { left: 14, right: 14 },
            tableWidth: 182,
            theme: 'grid',
            styles: {
              fontSize: 6.5,
              cellPadding: 1.1,
              halign: 'center',
              valign: 'middle',
              textColor: [30, 41, 59],
              lineColor: [203, 213, 225],
              lineWidth: 0.15
            },
            headStyles: {
              fontSize: 6.2,
              fontStyle: 'bold',
              fillColor: [30, 41, 59],
              textColor: [255, 255, 255]
            },
            columnStyles: portColStyles
          });

          let currentY = doc.lastAutoTable.finalY + 2.5;

          // 8. Centered RED REMARKS Label
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38);
          doc.text('REMARKS', 105, currentY + 2.5, { align: 'center' });
          currentY += 4.5;

          // 9. 4-Exam Remarks Boxes side by side (Width: 182mm / 4 = 43.5mm each)
          const pBoxW = 43.5;
          const portRemarks = [
            { name: examNames.ut1, text: item.annual?.examRemarks?.ut1 || 'Good effort.' },
            { name: examNames.term1, text: item.annual?.examRemarks?.term1 || 'Satisfactory progress.' },
            { name: examNames.ut2, text: item.annual?.examRemarks?.ut2 || 'Steady improvement.' },
            { name: examNames.term2, text: item.annual?.examRemarks?.term2 || studentRemark }
          ];

          portRemarks.forEach((rm, rIdx) => {
            const bx = 14 + (rIdx * 46);
            doc.setFillColor(248, 250, 252);
            doc.rect(bx, currentY, pBoxW, 12, 'FD');
            doc.setDrawColor(203, 213, 225);
            doc.rect(bx, currentY, pBoxW, 12, 'S');

            doc.setFontSize(6.2);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(rm.name, bx + 1.8, currentY + 3.2);

            doc.setFontSize(5.8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(71, 85, 105);
            const rmLines = doc.splitTextToSize(`"${rm.text}"`, pBoxW - 3.6);
            doc.text(rmLines, bx + 1.8, currentY + 7);
          });

          currentY += 14.5;

          // 10. Left: GRADING SUBJECTS Table | Right: Principal Signature & Barcode
          const lowerStartY = currentY;
          const gradingBody = (item.annual?.gradingSubjects || []).map(gs => {
            const isStruck = gs.isStruck || (isClass11to12Local && ['CRAFT', 'DRAWING', 'ART', 'CONVERSATION', 'DICTATION'].includes(gs.subject));
            return [
              { content: isStruck ? `${gs.subject} (N/A)` : gs.subject, styles: isStruck ? { textColor: [148, 163, 184], fontStyle: 'italic' } : { halign: 'left', fontStyle: 'bold' } },
              { content: isStruck ? '—' : (gs.halfYearly || 'GOOD'), styles: isStruck ? { textColor: [148, 163, 184] } : {} },
              { content: isStruck ? '—' : (gs.annual || 'GOOD'), styles: isStruck ? { textColor: [148, 163, 184] } : { fontStyle: 'bold', textColor: [20, 83, 45] } }
            ];
          });

          autoTable(doc, {
            head: [
              [{ content: 'GRADING SUBJECTS', colSpan: 3, styles: { halign: 'center', fillColor: [51, 65, 85] } }],
              ['SUBJECTS', 'HALF-YEARLY', 'ANNUAL']
            ],
            body: gradingBody,
            startY: lowerStartY,
            margin: { left: 14, right: 112 },
            tableWidth: 84,
            theme: 'grid',
            styles: {
              fontSize: 6.2,
              cellPadding: 0.9,
              halign: 'center',
              valign: 'middle',
              textColor: [30, 41, 59],
              lineColor: [203, 213, 225],
              lineWidth: 0.15
            },
            headStyles: {
              fontSize: 6.2,
              fontStyle: 'bold',
              fillColor: [71, 85, 105],
              textColor: [255, 255, 255]
            },
            columnStyles: {
              0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
              1: { cellWidth: 22 },
              2: { cellWidth: 22, fontStyle: 'bold', textColor: [20, 83, 45] }
            }
          });

          const gradingEndY = doc.lastAutoTable.finalY;

          // Class Teacher Name Line below grading table
          doc.setFontSize(6.8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('CLASS TEACHER NAME: ....................................................', 14, gradingEndY + 4.5);

          // Right Side: Principal Signature Box & Barcode Box (x = 104, w = 92)
          const pRightX = 104;
          const pRightW = 92;

          // Principal Signature Box (Outer rect with inner inset border)
          doc.setFillColor(248, 250, 252);
          doc.rect(pRightX, lowerStartY, pRightW, 17, 'FD');
          doc.setDrawColor(203, 213, 225);
          doc.rect(pRightX, lowerStartY, pRightW, 17, 'S');
          doc.rect(pRightX + 1.5, lowerStartY + 1.5, pRightW - 3, 14, 'S');

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('PRINCIPAL SIGNATURE', pRightX + (pRightW / 2), lowerStartY + 8, { align: 'center' });
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text('(Verified & School Seal Affixed)', pRightX + (pRightW / 2), lowerStartY + 12.5, { align: 'center' });

          // Barcode Box
          const bcBoxY = lowerStartY + 19.5;
          doc.setFillColor(254, 243, 199);
          doc.rect(pRightX, bcBoxY, pRightW, 15.5, 'FD');
          doc.setDrawColor(251, 191, 36);
          doc.rect(pRightX, bcBoxY, pRightW, 15.5, 'S');

          doc.setFontSize(6.2);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(113, 63, 18);
          doc.text('BARCODE IF POSSIBLE', pRightX + 4, bcBoxY + 3.8);

          // Draw vector barcode bars in PDF
          const bcCode = `${s.admission_id || s.admissionId || 'HNSS'}-${s.roll_number || '01'}`;
          doc.setFillColor(30, 41, 59);
          const barStartX = pRightX + 14;
          for (let b = 0; b < 36; b++) {
            const bw = (b % 3 === 0) ? 1.2 : 0.55;
            const bx = barStartX + (b * 1.8);
            doc.rect(bx, bcBoxY + 5.2, bw, 6, 'F');
          }
          doc.setFontSize(6.5);
          doc.setFont('courier', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`*${bcCode}*`, pRightX + (pRightW / 2), bcBoxY + 13.5, { align: 'center' });

          // 11. Bottom Digital Declaration Banner (Single A4 Page, y = 276mm)
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(14, 276, 182, 6, 1, 1, 'FD');
          doc.setDrawColor(248, 113, 113);
          doc.roundedRect(14, 276, 182, 6, 1, 1, 'S');

          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(153, 27, 27);
          doc.text('This is a Digitally signed document and does not require any Physical Signature', 105, 280.2, { align: 'center' });
        } else {
          // =========================================================================
          // SINGLE EXAM REPORT CARD (1-PAGE PORTRAIT, 210mm x 297mm)
          // =========================================================================
          const examData = item[selectedType] || { subjects: [], totalObtained: 0, totalMax: 0, percentage: 0, overallGrade: '—', rank: 1, status: 'PENDING' };

          // 1. Double Page Border
          doc.setDrawColor(20, 83, 45);
          doc.setLineWidth(1.2);
          doc.rect(8, 8, 194, 281);
          doc.setDrawColor(187, 247, 208);
          doc.setLineWidth(0.5);
          doc.rect(10, 10, 190, 277);

          // 2. Watermark Seal
          doc.setFontSize(38);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(245, 248, 246);
          doc.text(watermarkText, 105, 140, { align: 'center', angle: 30 });

          // 3. Logo
          if (logoBase64) {
            try {
              doc.addImage(logoBase64, 'PNG', 14, 13, 20, 20);
            } catch (err) {}
          }

          // 4. Student Photo Box (Top-Right)
          if (studentPhotoBase64) {
            try {
              doc.addImage(studentPhotoBase64, 'JPEG', 174, 13, 19, 23);
              doc.setDrawColor(20, 83, 45);
              doc.rect(174, 13, 19, 23);
            } catch (e) {
              doc.setDrawColor(203, 213, 225);
              doc.rect(174, 13, 19, 23);
              doc.setFontSize(6);
              doc.setTextColor(148, 163, 184);
              doc.text('PHOTO', 183.5, 25, { align: 'center' });
            }
          } else {
            doc.setDrawColor(203, 213, 225);
            doc.rect(174, 13, 19, 23);
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text('Photo of the\nstudent', 183.5, 24, { align: 'center' });
          }

          // 5. Header
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 64, 175);
          doc.text('PROGRESS REPORT CARD', 105, 15, { align: 'center' });

          doc.setFontSize(13);
          doc.setTextColor(20, 83, 45);
          doc.text(schoolName, 105, 20, { align: 'center' });

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(schoolAddress, 105, 24, { align: 'center' });
          doc.text(contactInfo, 105, 27.5, { align: 'center' });

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text(academicYearStr, 105, 31.5, { align: 'center' });

          // 6. Student Particulars Table
          autoTable(doc, {
            head: [],
            body: [
              [
                { content: 'SL NO', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: String(sIdx + 1), styles: { fontStyle: 'bold' } },
                { content: 'NAME', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: (s.student_name || s.name || 'N/A').toUpperCase(), styles: { fontStyle: 'bold', textColor: [20, 83, 45] } },
                { content: 'CLASS', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: selectedClass, styles: { fontStyle: 'bold' } },
                { content: 'SEC', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: s.section || 'A', styles: { fontStyle: 'bold' } },
                { content: 'ROLL', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: String(s.roll_number || '01'), styles: { fontStyle: 'bold', textColor: [30, 64, 175] } },
                { content: 'STUDENT ID', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: String(s.admission_id || s.admissionId || 'N/A'), styles: { fontStyle: 'bold' } }
              ],
              [
                { content: "FATHER'S NAME", styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: (s.guardian_name || s.father_name || "FATHER'S NAME").toUpperCase(), colSpan: 3, styles: { fontStyle: 'bold' } },
                { content: 'DATE OF BIRTH', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] } },
                { content: s.date_of_birth || 'DD/MM/YYYY', colSpan: 3, styles: { fontStyle: 'bold' } },
                { content: 'EXAMINATION', styles: { fontStyle: 'bold', fillColor: [254, 240, 138], textColor: [113, 63, 18] } },
                { content: marksheetMeta.title, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [254, 240, 138], textColor: [113, 63, 18] } }
              ]
            ],
            startY: 36,
            margin: { left: 14, right: 14 },
            tableWidth: 182,
            theme: 'grid',
            styles: {
              fontSize: 6.8,
              cellPadding: 1.4,
              valign: 'middle',
              lineColor: [203, 213, 225],
              lineWidth: 0.15,
              textColor: [30, 41, 59]
            }
          });

          let singleY = doc.lastAutoTable.finalY + 3.5;

          // 7. Scholastic Subjects Table for Single Exam
          const singleTableBody = (examData.subjects || []).map((sub, idx) => [
            idx + 1,
            sub.subject,
            sub.maxMarks,
            sub.passingMarks,
            sub.totalObtained != null ? sub.totalObtained : '—',
            sub.percentage !== '—' ? `${sub.percentage}%` : '—',
            sub.grade || '—',
            sub.remarks || '—'
          ]);

          // Summary Rows
          singleTableBody.push([
            { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left', fillColor: [241, 245, 249] } },
            { content: String(examData.totalMax || 0), styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } },
            { content: '—', styles: { halign: 'center', fillColor: [241, 245, 249] } },
            { content: String(examData.totalObtained || 0), styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231], textColor: [20, 83, 45] } },
            { content: `${examData.percentage || 0}%`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } },
            { content: String(examData.overallGrade || '—'), styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249], textColor: [67, 56, 202] } },
            { content: String(examData.status || '—'), styles: { fontStyle: 'bold', halign: 'center', fillColor: [220, 252, 231], textColor: [20, 83, 45] } }
          ]);

          singleTableBody.push([
            { content: 'CLASS RANK & RESULT', colSpan: 2, styles: { fontStyle: 'bold', halign: 'left', fillColor: [248, 250, 252] } },
            { content: `Rank #${examData.rank || 1} in Class ${selectedClass}`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'left', textColor: [67, 56, 202] } },
            { content: 'STATUS', styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } },
            { content: String(examData.status || 'PASSED'), styles: { fontStyle: 'bold', halign: 'center', textColor: [20, 83, 45] } }
          ]);

          autoTable(doc, {
            head: [
              ['SL', 'SUBJECT', 'MAX MARKS', 'PASS MARKS', 'MARKS OBTAINED', 'PERCENTAGE', 'GRADE', 'REMARKS']
            ],
            body: singleTableBody,
            startY: singleY,
            margin: { left: 14, right: 14 },
            tableWidth: 182,
            theme: 'grid',
            styles: {
              fontSize: 7.2,
              cellPadding: 1.8,
              halign: 'center',
              valign: 'middle',
              textColor: [30, 41, 59],
              lineColor: [203, 213, 225],
              lineWidth: 0.15
            },
            headStyles: {
              fontSize: 7.2,
              fontStyle: 'bold',
              fillColor: [30, 41, 59],
              textColor: [255, 255, 255]
            },
            columnStyles: {
              0: { cellWidth: 12 },
              1: { cellWidth: 54, halign: 'left', fontStyle: 'bold' },
              2: { cellWidth: 20 },
              3: { cellWidth: 20 },
              4: { cellWidth: 26, fontStyle: 'bold', textColor: [20, 83, 45] },
              5: { cellWidth: 20 },
              6: { cellWidth: 14, fontStyle: 'bold', textColor: [67, 56, 202] },
              7: { cellWidth: 16 }
            }
          });

          let singleTableEndY = doc.lastAutoTable.finalY + 4;

          // 8. Teacher Remarks Box
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(14, singleTableEndY, 182, 16, 1, 1, 'FD');
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(14, singleTableEndY, 182, 16, 1, 1, 'S');

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`TEACHER REMARK (${marksheetMeta.title}):`, 17, singleTableEndY + 5);

          const singleRemarkText = item.annual?.examRemarks?.[selectedType] || studentRemark;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(71, 85, 105);
          doc.text(`"${singleRemarkText}"`, 17, singleTableEndY + 11);

          singleTableEndY += 20;

          // 9. Grading Subjects (if available) + Signatures & Barcode
          const singleGrading = (item.annual?.gradingSubjects || []).map(gs => [
            gs.subject,
            selectedType.startsWith('term2') || selectedType === 'ut2' ? (gs.annual || 'GOOD') : (gs.halfYearly || 'GOOD')
          ]);

          if (singleGrading.length > 0) {
            autoTable(doc, {
              head: [
                [{ content: 'CO-SCHOLASTIC / GRADING EVALUATION', colSpan: 2, styles: { halign: 'center', fillColor: [51, 65, 85] } }],
                ['SUBJECT', 'EVALUATION / RATING']
              ],
              body: singleGrading,
              startY: singleTableEndY,
              margin: { left: 14, right: 100 },
              tableWidth: 90,
              theme: 'grid',
              styles: {
                fontSize: 6.8,
                cellPadding: 1.4,
                halign: 'center',
                valign: 'middle',
                textColor: [30, 41, 59],
                lineColor: [203, 213, 225],
                lineWidth: 0.15
              },
              headStyles: {
                fontSize: 6.8,
                fontStyle: 'bold',
                fillColor: [71, 85, 105],
                textColor: [255, 255, 255]
              },
              columnStyles: {
                0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 40, fontStyle: 'bold', textColor: [20, 83, 45] }
              }
            });
          }

          // Signatures and Barcode Box on Right
          const sigBoxX = singleGrading.length > 0 ? 112 : 14;
          const sigBoxW = singleGrading.length > 0 ? 84 : 182;

          doc.setFillColor(248, 250, 252);
          doc.roundedRect(sigBoxX, singleTableEndY, sigBoxW, 20, 1, 1, 'FD');
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(sigBoxX, singleTableEndY, sigBoxW, 20, 1, 1, 'S');

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('PRINCIPAL SIGNATURE', sigBoxX + (sigBoxW / 2), singleTableEndY + 9, { align: 'center' });
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text('(Verified & Approved)', sigBoxX + (sigBoxW / 2), singleTableEndY + 15, { align: 'center' });

          // Barcode box below signature
          const sbcY = singleTableEndY + 23;
          doc.setFillColor(254, 243, 199);
          doc.rect(sigBoxX, sbcY, sigBoxW, 14, 'FD');
          doc.setDrawColor(251, 191, 36);
          doc.rect(sigBoxX, sbcY, sigBoxW, 14, 'S');

          const sbcCode = `${s.admission_id || s.admissionId || 'HNSS'}-${s.roll_number || '01'}`;
          doc.setFillColor(30, 41, 59);
          const sbarX = sigBoxX + (sigBoxW / 2) - 30;
          for (let b = 0; b < 28; b++) {
            const bw = (b % 3 === 0) ? 1.4 : 0.6;
            const bx = sbarX + (b * 2.1);
            doc.rect(bx, sbcY + 2, bw, 6.5, 'F');
          }
          doc.setFontSize(6.5);
          doc.setFont('courier', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`*${sbcCode}*`, sigBoxX + (sigBoxW / 2), sbcY + 11.5, { align: 'center' });

          // Digital signature disclaimer banner at bottom
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(14, 276, 182, 7, 1, 1, 'FD');
          doc.setDrawColor(248, 113, 113);
          doc.roundedRect(14, 276, 182, 7, 1, 1, 'S');

          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(153, 27, 27);
          doc.text('This is a Digitally signed document and does not require any Physical Signature', 105, 280.8, { align: 'center' });
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
                  Dynamic School Template
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Dynamic marksheet engine supporting scholastic & co-scholastic grading subjects, 4-exam remarks, barcode, and digital verification.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Class, Orientation & View Mode */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
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

          {/* Orientation Toggle (Landscape / Portrait) */}
          {viewMode === 'single' && selectedType === 'annual' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPaperOrientation('portrait')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  paperOrientation === 'portrait' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Single-Page Portrait Specimen View (Sample Style)"
              >
                Portrait (1-Page)
              </button>
              <button
                onClick={() => setPaperOrientation('landscape')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  paperOrientation === 'landscape' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Single-Page Landscape Consolidated View"
              >
                Landscape (1-Page)
              </button>
            </div>
          )}

          {/* Promotion Scheme Toggle */}
          {viewMode === 'single' && selectedType === 'annual' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPromotionScheme('specimen')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  promotionScheme === 'specimen' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Specimen Scheme (20% All Unit Tests + 30% Half-Yearly + 50% Annual Exam)"
              >
                Specimen (20/30/50%)
              </button>
              <button
                onClick={() => setPromotionScheme('four_exam')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  promotionScheme === 'four_exam' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="4-Exam Weighted Scheme (20% PA1 + 30% Term1 + 20% PA2 + 30% Term2)"
              >
                4-Exam (20/30/20/30%)
              </button>
            </div>
          )}

          {/* View Mode Toggle (Student Card vs Broadsheet) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'single' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FaEye /> Report Card
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
            {paperOrientation === 'landscape' ? 'Landscape (1-Page)' : 'Portrait (Front & Back)'} • All 4 Exams + Grading Subjects
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
                <FaFilePdf className="text-sm" /> Download PDF ({selectedType === 'annual' && paperOrientation === 'landscape' ? 'Landscape' : 'Portrait'})
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
            <div className={`${paperOrientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto bg-white rounded-3xl border-2 border-emerald-900/90 p-8 shadow-2xl relative overflow-hidden space-y-6 font-body-md`}>
              
              {/* Decorative Double Border Inset */}
              <div className="absolute inset-2 border border-emerald-200/80 rounded-2xl pointer-events-none" />

              {/* 1. Header Block with School Logo, Info & Student Photo */}
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

                {/* Center: School Header & Title Banner */}
                <div className="flex-1 text-center space-y-1">
                  <div className="inline-block bg-blue-50 px-4 py-0.5 rounded-full border border-blue-200 text-blue-800 text-[10px] font-bold tracking-widest uppercase mb-1">
                    PROGRESS REPORT CARD
                  </div>
                  <h1 className="text-xl lg:text-2xl font-black text-emerald-950 font-headline uppercase tracking-tight">
                    {schoolProfile?.name || 'ACADEMIC INSTITUTION'}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    {schoolProfile?.officeAddress || schoolProfile?.address || 'School Campus Address'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ph: {schoolProfile?.phone || schoolProfile?.contactPhone || '91**********'} | Email: {schoolProfile?.email || 'office@school.edu'}
                  </p>
                  <p className="text-xs font-black text-amber-800 bg-amber-100/70 inline-block px-4 py-0.5 rounded-full border border-amber-300 mt-1">
                    ACADEMIC YEAR: {schoolProfile?.academicYear || schoolProfile?.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
                  </p>
                </div>

                {/* Right: Student Photo Frame */}
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
                        Photo of the<br/>student
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Student Particulars (Dotted layout style) */}
              <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="font-bold text-slate-600 mr-1.5">SL NO:</span>
                    <span className="font-semibold text-slate-900">{currentStudentItem.student.roll_number || '01'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-600 mr-1.5">NAME:</span>
                    <span className="font-black text-slate-950 uppercase">{currentStudentItem.student.student_name || currentStudentItem.student.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="font-bold text-slate-600 mr-1.5">CLASS:</span>
                    <span className="font-bold text-slate-900">{selectedClass}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 mr-1.5">SEC:</span>
                    <span className="font-bold text-slate-900">{currentStudentItem.student.section || 'A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 mr-1.5">ROLL:</span>
                    <span className="font-black text-emerald-800">{currentStudentItem.student.roll_number || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="font-bold text-slate-600 mr-1.5">STUDENT ID:</span>
                    <span className="font-mono font-bold text-slate-900">{currentStudentItem.student.admission_id || currentStudentItem.student.admissionId || '—'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-600 mr-1.5">FATHER'S NAME:</span>
                    <span className="font-semibold text-slate-900 uppercase">{currentStudentItem.student.guardian_name || currentStudentItem.student.father_name || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div>
                    <span className="font-bold text-slate-600 mr-1.5">DATE OF BIRTH:</span>
                    <span className="font-semibold text-slate-900">{currentStudentItem.student.date_of_birth || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="font-bold text-slate-600">EXAMINATION:</span>
                    <span className="font-black text-slate-900 bg-yellow-200 px-3 py-0.5 rounded-lg border border-yellow-300">
                      {marksheetMeta.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Main Scholastic Subject Table */}
              {selectedType === 'annual' ? (
                /* Annual 4-Exam Combined Table with Super-Headers */
                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-center text-[11px]">
                        <th rowSpan={2} className="p-2 border-r border-slate-700 w-10">SL</th>
                        <th rowSpan={2} className="p-2 border-r border-slate-700 text-left min-w-[140px]">SUBJECT</th>
                        <th colSpan={4} className="p-1.5 border-r border-slate-700 bg-slate-900 uppercase tracking-wider">
                          MARKS
                        </th>
                        <th colSpan={promotionScheme === 'specimen' ? 4 : 5} className="p-1.5 border-r border-slate-700 bg-emerald-900 uppercase tracking-wider">
                          PROMOTION CRITERIA
                        </th>
                        <th rowSpan={2} className="p-2 font-bold text-white w-14">GRADE</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-800 font-semibold text-[10px] text-center border-b border-slate-300">
                        {/* MARKS Super-column Sub-headers */}
                        <th className="p-1.5 border-r border-slate-300">
                          <span className="block font-bold">{examNames.ut1}</span>
                          <span className="text-[9px] text-slate-500">PM: 20/50</span>
                        </th>
                        <th className="p-1.5 border-r border-slate-300">
                          <span className="block font-bold">{examNames.term1}</span>
                          <span className="text-[9px] text-slate-500">PM: 40/100</span>
                        </th>
                        <th className="p-1.5 border-r border-slate-300">
                          <span className="block font-bold">{examNames.ut2}</span>
                          <span className="text-[9px] text-slate-500">PM: 20/50</span>
                        </th>
                        <th className="p-1.5 border-r border-slate-300">
                          <span className="block font-bold">{examNames.term2}</span>
                          <span className="text-[9px] text-slate-500">PM: 40/100</span>
                        </th>
                        {/* PROMOTION CRITERIA Super-column Sub-headers */}
                        {promotionScheme === 'specimen' ? (
                          <>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">20% Marks</span>
                              <span className="text-[9px] text-slate-500">of all Unit Tests</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">30% Marks</span>
                              <span className="text-[9px] text-slate-500">Half-Yearly Exam</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">50% of</span>
                              <span className="text-[9px] text-slate-500">Annual Exam</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-100/70 font-black text-emerald-950">
                              <span className="block font-bold">TOTAL</span>
                              <span className="text-[9px] font-normal text-emerald-800">(/100)</span>
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">20% Marks</span>
                              <span className="text-[9px] text-slate-500">{examNames.ut1}</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">30% Marks</span>
                              <span className="text-[9px] text-slate-500">{examNames.term1}</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">20% Marks</span>
                              <span className="text-[9px] text-slate-500">{examNames.ut2}</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-50/60">
                              <span className="block font-bold">30% Marks</span>
                              <span className="text-[9px] text-slate-500">{examNames.term2}</span>
                            </th>
                            <th className="p-1.5 border-r border-slate-300 bg-emerald-100/70 font-black text-emerald-950">
                              <span className="block font-bold">TOTAL</span>
                              <span className="text-[9px] font-normal text-emerald-800">(/100)</span>
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(currentStudentItem.annual?.subjects || []).map((sub, idx) => (
                        <tr key={sub.subject || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-200">{sub.sl}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{sub.subject}</td>
                          {/* Raw Exam Scores */}
                          <td className="p-2 text-center font-medium text-slate-700 border-r border-slate-200">{sub.ut1Raw ? sub.ut1Raw : '—'}</td>
                          <td className="p-2 text-center font-medium text-slate-700 border-r border-slate-200">{sub.term1Raw ? sub.term1Raw : '—'}</td>
                          <td className="p-2 text-center font-medium text-slate-700 border-r border-slate-200">{sub.ut2Raw ? sub.ut2Raw : '—'}</td>
                          <td className="p-2 text-center font-medium text-slate-700 border-r border-slate-200">{sub.term2Raw ? sub.term2Raw : '—'}</td>
                          {/* Weighted Points */}
                          {promotionScheme === 'specimen' ? (
                            <>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">
                                {sub.utAll20Wt != null && sub.utAll20Wt !== '—' ? sub.utAll20Wt : (sub.ut1Wt || '—')}
                              </td>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">
                                {sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—'}
                              </td>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">
                                {sub.annual50Wt != null && sub.annual50Wt !== '—' ? sub.annual50Wt : (sub.term2Wt || '—')}
                              </td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-200 bg-emerald-100/50 text-sm">
                                {sub.score50Scheme != null && sub.score50Scheme !== '—' ? sub.score50Scheme : sub.finalScore}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">{sub.ut1Wt != null && sub.ut1Wt !== '—' ? sub.ut1Wt : '—'}</td>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">{sub.term1Wt != null && sub.term1Wt !== '—' ? sub.term1Wt : '—'}</td>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">{sub.ut2Wt != null && sub.ut2Wt !== '—' ? sub.ut2Wt : '—'}</td>
                              <td className="p-2 text-center font-semibold text-slate-800 border-r border-slate-200 bg-emerald-50/30">{sub.term2Wt != null && sub.term2Wt !== '—' ? sub.term2Wt : '—'}</td>
                              <td className="p-2 text-center font-black text-emerald-800 border-r border-slate-200 bg-emerald-100/50 text-sm">
                                {sub.finalScore}
                              </td>
                            </>
                          )}
                          <td className="p-2 text-center font-black text-indigo-700">
                            {sub.grade}
                          </td>
                        </tr>
                      ))}

                      {/* Summary Row 1: APPEARING SUBJECTS */}
                      <tr className="bg-slate-50 font-bold text-slate-800 text-[11px] border-t-2 border-slate-300">
                        <td colSpan={2} className="p-2 pl-3 border-r border-slate-200 text-left uppercase">APPEARING SUBJECTS</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.annual?.appearingCounts?.ut1 || (isClass11to12 ? 6 : (isClass4to8 ? 8 : 7))}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.annual?.appearingCounts?.term1 || (isClass11to12 ? 7 : (isClass4to8 ? 10 : 9))}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.annual?.appearingCounts?.ut2 || (isClass11to12 ? 6 : (isClass4to8 ? 8 : 7))}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.annual?.appearingCounts?.term2 || (isClass11to12 ? 7 : (isClass4to8 ? 10 : 9))}</td>
                        <td colSpan={promotionScheme === 'specimen' ? 3 : 4} className="p-2 border-r border-slate-200 text-center text-slate-400">—</td>
                        <td colSpan={2} className="p-2 text-center font-black text-emerald-800">
                          {currentStudentItem.annual?.appearingSubjectsCount || currentStudentItem.annual?.subjects?.length || (isClass11to12 ? 7 : (isClass4to8 ? 10 : 9))} Subs
                        </td>
                      </tr>

                      {/* Summary Row 2: TOTAL */}
                      <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                        <td colSpan={2} className="p-2 pl-3 border-r border-slate-200 text-left uppercase">TOTAL</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.ut1?.totalObtained ?? '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.term1?.totalObtained ?? '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.ut2?.totalObtained ?? '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.term2?.totalObtained ?? '—'}</td>
                        <td colSpan={promotionScheme === 'specimen' ? 3 : 4} className="p-2 border-r border-slate-200 text-center text-slate-400">—</td>
                        <td className="p-2 text-center border-r border-slate-200 font-black text-emerald-800 text-sm">
                          {currentStudentItem.annual?.totalObtained || 0}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-500 text-[10px]">
                          / {currentStudentItem.annual?.totalMax || 0}
                        </td>
                      </tr>

                      {/* Summary Row 3: PERCENTAGE */}
                      <tr className="bg-white font-bold text-slate-900 text-[11px]">
                        <td colSpan={2} className="p-2 pl-3 border-r border-slate-200 text-left uppercase">PERCENTAGE</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.ut1 ? `${currentStudentItem.ut1.percentage}%` : '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.term1 ? `${currentStudentItem.term1.percentage}%` : '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.ut2 ? `${currentStudentItem.ut2.percentage}%` : '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.term2 ? `${currentStudentItem.term2.percentage}%` : '—'}</td>
                        <td colSpan={promotionScheme === 'specimen' ? 3 : 4} className="p-2 border-r border-slate-200 text-center text-slate-400">—</td>
                        <td colSpan={2} className="p-2 text-center font-black text-emerald-800 text-sm">
                          {currentStudentItem.annual?.percentage || 0}%
                        </td>
                      </tr>

                      {/* Summary Row 4: RANK */}
                      <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                        <td colSpan={2} className="p-2 pl-3 border-r border-slate-200 text-left uppercase">RANK</td>
                        <td className="p-2 text-center border-r border-slate-200">#{currentStudentItem.ut1?.rank || 1}</td>
                        <td className="p-2 text-center border-r border-slate-200">#{currentStudentItem.term1?.rank || 1}</td>
                        <td className="p-2 text-center border-r border-slate-200">#{currentStudentItem.ut2?.rank || 1}</td>
                        <td className="p-2 text-center border-r border-slate-200">#{currentStudentItem.term2?.rank || 1}</td>
                        <td colSpan={promotionScheme === 'specimen' ? 3 : 4} className="p-2 border-r border-slate-200 text-center text-slate-400">—</td>
                        <td colSpan={2} className="p-2 text-center font-black text-indigo-700 text-sm">
                          #{currentStudentItem.annual?.rank || 1}
                        </td>
                      </tr>

                      {/* Summary Row 5: RESULT / PROMOTION */}
                      <tr className="bg-emerald-50/70 font-black text-slate-900 text-[11px]">
                        <td colSpan={2} className="p-2 pl-3 border-r border-slate-200 text-left uppercase text-emerald-950">RESULT</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.ut1?.status || '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.term1?.status || '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.ut2?.status || '—'}</td>
                        <td className="p-2 text-center border-r border-slate-200">{currentStudentItem.term2?.status || '—'}</td>
                        <td colSpan={promotionScheme === 'specimen' ? 3 : 4} className="p-2 border-r border-slate-200 text-center font-bold text-emerald-900 bg-emerald-100/60 uppercase">
                          ANNUAL PROMOTION
                        </td>
                        <td colSpan={2} className="p-2 text-center font-black text-emerald-900 text-xs bg-emerald-100/80">
                          {currentStudentItem.annual?.promotion}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Single Exam Subject Table */
                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold text-center text-[11px]">
                        <th className="p-2.5 border-r border-slate-700 w-12">SL</th>
                        <th className="p-2.5 border-r border-slate-700 text-left min-w-[180px]">SUBJECT</th>
                        <th className="p-2.5 border-r border-slate-700 w-24">MAX MARKS</th>
                        <th className="p-2.5 border-r border-slate-700 w-24">PASS MARKS</th>
                        <th className="p-2.5 border-r border-slate-700 w-28 bg-slate-900 text-emerald-300 font-black">MARKS OBTAINED</th>
                        <th className="p-2.5 border-r border-slate-700 w-24">PERCENTAGE</th>
                        <th className="p-2.5 border-r border-slate-700 w-20">GRADE</th>
                        <th className="p-2.5 w-28">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(currentStudentItem[selectedType]?.subjects || []).map((sub, idx) => (
                        <tr key={sub.subject || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{sub.subject}</td>
                          <td className="p-2.5 text-center font-semibold text-slate-600 border-r border-slate-200">{sub.maxMarks}</td>
                          <td className="p-2.5 text-center font-semibold text-slate-600 border-r border-slate-200">{sub.passingMarks}</td>
                          <td className="p-2.5 text-center font-black text-emerald-800 border-r border-slate-200 bg-emerald-50/50 text-sm">
                            {sub.totalObtained != null ? sub.totalObtained : '—'}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                            {sub.percentage !== '—' ? `${sub.percentage}%` : '—'}
                          </td>
                          <td className="p-2.5 text-center font-black text-indigo-700 border-r border-slate-200">{sub.grade}</td>
                          <td className="p-2.5 text-center font-semibold text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${sub.remarks === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {sub.remarks}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Single Exam Summary Rows */}
                      <tr className="bg-slate-50 font-bold text-slate-900 text-[11px] border-t-2 border-slate-300">
                        <td colSpan={2} className="p-2.5 pl-3 border-r border-slate-200 text-left uppercase">TOTAL</td>
                        <td className="p-2.5 text-center border-r border-slate-200 text-slate-500 font-bold">{currentStudentItem[selectedType]?.totalMax || 0}</td>
                        <td className="p-2.5 text-center border-r border-slate-200 text-slate-400">—</td>
                        <td className="p-2.5 text-center border-r border-slate-200 font-black text-emerald-800 text-sm bg-emerald-100/60">
                          {currentStudentItem[selectedType]?.totalObtained || 0}
                        </td>
                        <td className="p-2.5 text-center border-r border-slate-200 font-black text-slate-800">
                          {currentStudentItem[selectedType]?.percentage || 0}%
                        </td>
                        <td className="p-2.5 text-center border-r border-slate-200 font-black text-indigo-700">
                          {currentStudentItem[selectedType]?.overallGrade || '—'}
                        </td>
                        <td className="p-2.5 text-center font-black text-emerald-800">
                          {currentStudentItem[selectedType]?.status || '—'}
                        </td>
                      </tr>
                      <tr className="bg-white font-bold text-slate-900 text-[11px]">
                        <td colSpan={2} className="p-2 pl-3 border-r border-slate-200 text-left uppercase">CLASS RANK</td>
                        <td colSpan={6} className="p-2 pl-4 text-left font-black text-indigo-700">
                          Rank #{currentStudentItem[selectedType]?.rank || 1} in Class {selectedClass}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4 & 5. Remarks Section */}
              {selectedType === 'annual' ? (
                <>
                  <div className="text-center pt-1">
                    <span className="text-xs font-black text-red-600 tracking-wider uppercase">
                      REMARKS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                      <span className="block text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1">
                        {examNames.ut1}
                      </span>
                      <p className="text-[11px] italic text-slate-600 font-medium min-h-[38px]">
                        "{currentStudentItem.annual?.examRemarks?.ut1 || 'Good effort.'}"
                      </p>
                    </div>
                    <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                      <span className="block text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1">
                        {examNames.term1}
                      </span>
                      <p className="text-[11px] italic text-slate-600 font-medium min-h-[38px]">
                        "{currentStudentItem.annual?.examRemarks?.term1 || 'Satisfactory progress.'}"
                      </p>
                    </div>
                    <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                      <span className="block text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1">
                        {examNames.ut2}
                      </span>
                      <p className="text-[11px] italic text-slate-600 font-medium min-h-[38px]">
                        "{currentStudentItem.annual?.examRemarks?.ut2 || 'Steady improvement.'}"
                      </p>
                    </div>
                    <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                      <span className="block text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1">
                        {examNames.term2}
                      </span>
                      <p className="text-[11px] italic text-slate-600 font-medium min-h-[38px]">
                        "{activeStudentRemark}"
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                  <span className="block text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 mb-1">
                    TEACHER REMARK ({marksheetMeta.title})
                  </span>
                  <p className="text-[12px] italic text-slate-700 font-medium">
                    "{currentStudentItem.annual?.examRemarks?.[selectedType] || activeStudentRemark}"
                  </p>
                </div>
              )}

              {/* 6. Co-Scholastic GRADING SUBJECTS Table + Signatures & Barcode */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 items-start">
                
                {/* Left: GRADING SUBJECTS TABLE (if configured) */}
                {(currentStudentItem.annual?.gradingSubjects || []).length > 0 ? (
                  <div className="md:col-span-6 border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-slate-200 text-slate-900 font-bold text-[11px] uppercase tracking-wider text-center py-1.5 border-b border-slate-300">
                      GRADING SUBJECTS
                    </div>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-slate-700 text-[10px] text-center border-b border-slate-300">
                          <th className="p-1.5 border-r border-slate-300 text-left pl-3">SUBJECTS</th>
                          {selectedType === 'annual' ? (
                            <>
                              <th className="p-1.5 border-r border-slate-300 w-28">HALF-YEARLY</th>
                              <th className="p-1.5 w-28">ANNUAL</th>
                            </>
                          ) : (
                            <th className="p-1.5 w-40">EVALUATION / RATING</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {(currentStudentItem.annual?.gradingSubjects || []).map((gs, gIdx) => {
                          const isStruck = gs.isStruck || (isClass11to12 && ['CRAFT', 'DRAWING', 'ART', 'CONVERSATION', 'DICTATION'].includes(gs.subject));
                          return (
                            <tr key={gIdx} className={`hover:bg-slate-50 ${isStruck ? 'opacity-60 bg-slate-50/50' : ''}`}>
                              <td className={`p-1.5 pl-3 font-semibold border-r border-slate-200 ${isStruck ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {gs.subject} {isStruck && <span className="text-[9px] text-amber-700 font-normal no-underline ml-1">(N/A)</span>}
                              </td>
                              {selectedType === 'annual' ? (
                                <>
                                  <td className={`p-1.5 text-center font-bold border-r border-slate-200 ${isStruck ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {isStruck ? '—' : (gs.halfYearly || 'GOOD')}
                                  </td>
                                  <td className={`p-1.5 text-center font-black ${isStruck ? 'line-through text-slate-400' : 'text-emerald-800'}`}>
                                    {isStruck ? '—' : (gs.annual || 'GOOD')}
                                  </td>
                                </>
                              ) : (
                                <td className={`p-1.5 text-center font-black ${isStruck ? 'line-through text-slate-400' : 'text-emerald-800'}`}>
                                  {isStruck ? '—' : (selectedType.startsWith('term2') || selectedType === 'ut2' ? (gs.annual || 'GOOD') : (gs.halfYearly || 'GOOD'))}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700">
                      CLASS TEACHER NAME: <span className="font-normal underline ml-1">....................................................</span>
                    </div>
                  </div>
                ) : null}

                {/* Right: PRINCIPAL SIGNATURE + BARCODE */}
                <div className={`${(currentStudentItem.annual?.gradingSubjects || []).length > 0 ? 'md:col-span-6' : 'md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4'} space-y-4 flex flex-col justify-between h-full`}>
                  <div className="border-2 border-slate-300 rounded-2xl p-1.5 bg-slate-50 flex items-center justify-center min-h-[95px] text-center shadow-sm">
                    <div className="border border-slate-300 rounded-xl w-full h-full flex flex-col items-center justify-center py-4 px-3 bg-white/60">
                      <span className="text-xs font-black text-slate-800 tracking-wider uppercase block">PRINCIPAL SIGNATURE</span>
                      <span className="text-[10px] text-slate-400 font-medium">(Verified & Digitally Approved)</span>
                    </div>
                  </div>

                  <div className="border border-amber-300/80 bg-amber-50/60 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-amber-900 tracking-wider uppercase mb-1">
                      BARCODE IF POSSIBLE
                    </span>
                    <BarcodeSVG code={`${currentStudentItem.student.admission_id || currentStudentItem.student.admissionId || 'HNSS'}-${currentStudentItem.student.roll_number || '01'}`} />
                  </div>
                </div>
              </div>

              {/* 7. Bottom Digital Declaration Banner */}
              <div className="p-2.5 rounded-xl border border-red-300 bg-red-50/50 text-center">
                <p className="text-[11px] font-serif italic text-amber-950 font-semibold tracking-wide">
                  This is a Digitally signed document and does not require any Physical Signature
                </p>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MarksheetGenerator;
