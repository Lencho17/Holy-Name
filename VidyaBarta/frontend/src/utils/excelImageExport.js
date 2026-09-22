import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Loads an image from a URL and converts it to base64 for ExcelJS embedding.
 */
export const loadImageBase64 = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpeg';
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            const base64 = result.split(',')[1];
            resolve({ base64, extension: ext });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Fetch image failed, trying canvas fallback:', err);
  }

  // Fallback using HTML Image + Canvas
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ base64: dataUrl.split(',')[1], extension: 'png' });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
};

/**
 * Common styling borders for Excel cells
 */
const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

/**
 * Export Exam Routine with Embedded School Logo Image
 */
export const exportExamRoutineExcelWithImage = async ({
  schoolProfile,
  logicalGroup,
  sortedDates,
  sortedClasses,
  matrix,
  allTtRows,
  filename
}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = schoolProfile?.name || 'School Management';
  const worksheet = workbook.addWorksheet('Exam Routine');

  // Add School Logo Image if available
  if (schoolProfile?.logo) {
    const imgData = await loadImageBase64(schoolProfile.logo);
    if (imgData?.base64) {
      const imageId = workbook.addImage({
        base64: imgData.base64,
        extension: imgData.extension
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.2, row: 0.3 },
        ext: { width: 68, height: 68 }
      });
    }
  }

  const schoolName = (schoolProfile?.name || 'HOLY NAME HIGHER SECONDARY SCHOOL').toUpperCase();
  const schoolAddress = schoolProfile?.officeAddress || schoolProfile?.address || 'Sivasagar, Assam - 785640';
  const examName = `${(logicalGroup.name || 'EXAM').toUpperCase()} - EXAMINATION ROUTINE`;
  const startDate = logicalGroup.start_date || sortedDates[0];
  const endDate = logicalGroup.end_date || sortedDates[sortedDates.length - 1];
  const examTiming = (allTtRows[0]?.start_time && allTtRows[0]?.end_time)
    ? `${allTtRows[0].start_time.substring(0, 5)} - ${allTtRows[0].end_time.substring(0, 5)}`
    : '08:30 AM - 10:30 AM';

  const totalCols = sortedClasses.length + 1;

  // Header Rows
  const r1 = worksheet.addRow([schoolName]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  r1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  r1.height = 24;

  const r2 = worksheet.addRow([schoolAddress]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  r2.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  r2.height = 16;

  const r3 = worksheet.addRow([examName]);
  worksheet.mergeCells(3, 1, 3, totalCols);
  r3.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF312E81' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  r3.height = 20;

  const r4 = worksheet.addRow([`Exam Period: ${startDate} to ${endDate}   |   Exam Timings: ${examTiming} (1-Shift Session)   |   Total Classes: ${sortedClasses.length}`]);
  worksheet.mergeCells(4, 1, 4, totalCols);
  r4.font = { name: 'Arial', size: 9, color: { argb: 'FF334155' } };
  r4.alignment = { horizontal: 'center', vertical: 'middle' };
  r4.height = 18;

  // Blank line
  worksheet.addRow([]);

  // Table Column Headers
  const tableHeaders = ['Date & Day', ...sortedClasses.map((c) => `Class ${c}`)];
  const headerRow = worksheet.addRow(tableHeaders);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });

  // Table Data Rows
  sortedDates.forEach((d, idx) => {
    const dateObj = new Date(d);
    const dayName = isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateFormatted = `${d} (${dayName})`;

    const rowData = [dateFormatted];
    sortedClasses.forEach((c) => {
      const subs = matrix[d]?.[c] || [];
      rowData.push(subs.length > 0 ? subs.join('\n') : '—');
    });

    const row = worksheet.addRow(rowData);
    row.height = 22;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNum) => {
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { name: 'Arial', size: 9 };

      if (colNum === 1) {
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        };
      } else if (!isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
    });
  });

  // Set Column Widths
  worksheet.getColumn(1).width = 22;
  for (let i = 2; i <= totalCols; i++) {
    worksheet.getColumn(i).width = 18;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename || `Exam_Routine_${(logicalGroup.name || 'Exam').replace(/\s+/g, '_')}.xlsx`);
};

/**
 * Export Broadsheet / Tabulation Sheet to Excel with Logo
 */
export const exportBroadsheetExcelWithImage = async ({
  schoolProfile,
  classLevel,
  examName,
  timetable,
  students,
  marksGrid,
  calculatedRows,
  filename
}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Class ${classLevel} Broadsheet`);

  // Add School Logo Image if available
  if (schoolProfile?.logo) {
    const imgData = await loadImageBase64(schoolProfile.logo);
    if (imgData?.base64) {
      const imageId = workbook.addImage({
        base64: imgData.base64,
        extension: imgData.extension
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.2, row: 0.3 },
        ext: { width: 65, height: 65 }
      });
    }
  }

  const totalCols = 4 + timetable.length + 5;
  const schoolName = (schoolProfile?.name || 'HOLY NAME HIGHER SECONDARY SCHOOL').toUpperCase();
  const schoolAddress = schoolProfile?.officeAddress || schoolProfile?.address || 'Sivasagar, Assam - 785640';

  const r1 = worksheet.addRow([schoolName]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  r1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  r1.height = 24;

  const r2 = worksheet.addRow([schoolAddress]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  r2.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  r2.height = 16;

  const r3 = worksheet.addRow([`TABULATION BROADSHEET - ${examName.toUpperCase()} - CLASS ${classLevel}`]);
  worksheet.mergeCells(3, 1, 3, totalCols);
  r3.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F766E' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  r3.height = 20;

  worksheet.addRow([]);

  // Table Headers
  const headers = [
    'Roll No',
    'Student Name',
    'Admission ID',
    'Gender',
    ...timetable.map((t) => `${t.subject} (${t.total_marks || 100})`),
    'Total Obtained',
    'Total Max',
    'Percentage',
    'Grade',
    'Status'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' }
    };
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  // Data Rows
  calculatedRows.forEach((row, idx) => {
    const s = row.student;
    const rowValues = [
      s.roll_number || '—',
      s.student_name || s.name || '—',
      s.admission_id || s.admissionId || '—',
      s.gender || '—',
      ...timetable.map((t) => {
        const sc = row.subjectScores[t.subject];
        return sc && sc.isEntered ? sc.total : '—';
      }),
      row.totalObtained,
      row.totalMax,
      `${row.percentage}%`,
      row.grade,
      row.status
    ];

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 20;
    const isEven = idx % 2 === 0;

    dataRow.eachCell((cell, colNum) => {
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
      cell.font = { name: 'Arial', size: 9 };
      if (!isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0FDFA' }
        };
      }
      if (colNum === totalCols) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: row.status === 'Pass' ? 'FF16A34A' : 'FFE11D48' } };
      }
    });
  });

  // Column Widths
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 26;
  worksheet.getColumn(3).width = 18;
  worksheet.getColumn(4).width = 12;
  for (let i = 5; i <= totalCols; i++) {
    worksheet.getColumn(i).width = 16;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename || `Broadsheet_${classLevel}_${examName.replace(/\s+/g, '_')}.xlsx`);
};

/**
 * Export Individual Student Marksheet to Excel with Logo & Full Styling
 * Supports: 'unit_test', 'terminal', 'combined', 'annual'
 */
export const exportStudentMarksheetToExcel = async ({
  marksheetType, // 'unit_test' | 'terminal' | 'combined' | 'annual'
  schoolProfile,
  student,
  examName,
  data, // contains subjects, scores, totals, grades, rank, promotion, teacherRemarks
  examNames = {}, // { ut1, term1, ut2, term2 }
  filename
}) => {
  const workbook = new ExcelJS.Workbook();
  const title = marksheetType === 'unit_test' ? 'Unit Test Marksheet'
    : marksheetType === 'terminal' ? 'Terminal Marksheet'
    : marksheetType === 'combined' ? 'Combined Marksheet'
    : 'Annual Marksheet';

  const worksheet = workbook.addWorksheet(title);

  // Set Landscape for Annual Marksheet as requested
  if (marksheetType === 'annual' || marksheetType === 'combined') {
    worksheet.pageSetup = { orientation: 'landscape', paperSize: 9 };
  }

  // Add School Logo Image
  if (schoolProfile?.logo) {
    const imgData = await loadImageBase64(schoolProfile.logo);
    if (imgData?.base64) {
      const imageId = workbook.addImage({
        base64: imgData.base64,
        extension: imgData.extension
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.2, row: 0.3 },
        ext: { width: 65, height: 65 }
      });
    }
  }

  const schoolName = (schoolProfile?.name || 'HOLY NAME HIGHER SECONDARY SCHOOL').toUpperCase();
  const schoolAddress = schoolProfile?.officeAddress || schoolProfile?.address || 'Sivasagar, Assam - 785640';
  const totalCols = marksheetType === 'annual' ? 10 : (marksheetType === 'combined' ? 9 : 7);

  // School Header
  const r1 = worksheet.addRow([schoolName]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  r1.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF14532D' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  r1.height = 24;

  const r2 = worksheet.addRow([schoolAddress]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  r2.font = { name: 'Arial', size: 9, color: { argb: 'FF475569' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  r2.height = 16;

  const reportTitle = marksheetType === 'annual'
    ? 'ANNUAL COMBINED PROGRESS & PROMOTION REPORT CARD (2025-2026)'
    : `${examName.toUpperCase()} - STUDENT PROGRESS MARKSHEET`;

  const r3 = worksheet.addRow([reportTitle]);
  worksheet.mergeCells(3, 1, 3, totalCols);
  r3.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF15803D' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  r3.height = 20;

  worksheet.addRow([]);

  // Student Profile Info Box (Landscape format)
  const infoRow1 = worksheet.addRow([
    'Student Name:', student.student_name || student.name || 'N/A', '',
    'Admission ID:', student.admission_id || student.admissionId || 'N/A', '',
    'Academic Session:', '2025 - 2026'
  ]);
  infoRow1.font = { name: 'Arial', size: 9.5 };
  infoRow1.getCell(1).font = { bold: true };
  infoRow1.getCell(4).font = { bold: true };
  infoRow1.getCell(7).font = { bold: true };

  const infoRow2 = worksheet.addRow([
    'Class & Section:', `${student.grade || student.class_level || 'N/A'} - ${student.section || 'A'}`, '',
    'Roll Number:', student.roll_number || 'N/A', '',
    'Attendance:', data.attendance || '210 / 222 Days (94.6%)'
  ]);
  infoRow2.font = { name: 'Arial', size: 9.5 };
  infoRow2.getCell(1).font = { bold: true };
  infoRow2.getCell(4).font = { bold: true };
  infoRow2.getCell(7).font = { bold: true };

  const infoRow3 = worksheet.addRow([
    'Guardian Name:', student.guardian_name || student.father_name || 'N/A', '',
    'Date of Birth:', student.date_of_birth || 'N/A', '',
    'Promotion Status:', data.promotion || 'PROMOTED'
  ]);
  infoRow3.font = { name: 'Arial', size: 9.5 };
  infoRow3.getCell(1).font = { bold: true };
  infoRow3.getCell(4).font = { bold: true };
  infoRow3.getCell(7).font = { bold: true, color: { argb: 'FF15803D' } };

  worksheet.addRow([]);

  // Dynamic Exam Names with weights
  const ut1Label = `${examNames.ut1 || 'Periodic 1'} (20%)`;
  const term1Label = `${examNames.term1 || 'Terminal 1'} (30%)`;
  const ut2Label = `${examNames.ut2 || 'Periodic 2'} (20%)`;
  const term2Label = `${examNames.term2 || 'Terminal 2'} (30%)`;

  // Table Headers based on Marksheet Type
  let tableHeaders = [];
  if (marksheetType === 'unit_test') {
    tableHeaders = ['Sl', 'Subject Name', 'Max Marks', 'Passing Marks', 'Marks Obtained', 'Subject Grade', 'Remarks'];
  } else if (marksheetType === 'terminal') {
    tableHeaders = ['Sl', 'Subject Name', 'Theory Marks', 'Practical Marks', 'Total Obtained / Max', 'Subject Grade', 'Remarks'];
  } else if (marksheetType === 'combined') {
    tableHeaders = ['Sl', 'Subject Name', 'Unit Test 1 (/50)', 'Terminal 1 (/100)', 'Unit Test 2 (/50)', 'Terminal 2 (/100)', 'Grand Total', 'Percentage', 'Grade'];
  } else {
    // Annual Combined (All 4 Exams in Landscape mode)
    tableHeaders = [
      'Sl',
      'Subject Name',
      ut1Label,
      term1Label,
      ut2Label,
      term2Label,
      'Combined Marks (/100)',
      'Combined %',
      'Grade',
      'Remarks'
    ];
  }

  const hRow = worksheet.addRow(tableHeaders);
  hRow.height = 24;
  hRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF14532D' }
    };
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });

  // Rows of Subjects
  (data.subjects || []).forEach((sub, sIdx) => {
    let rVals = [];
    if (marksheetType === 'unit_test') {
      rVals = [
        sIdx + 1,
        sub.subject,
        sub.maxMarks || 50,
        sub.passingMarks || 20,
        sub.marksObtained ?? '—',
        sub.grade || '—',
        sub.remarks || '—'
      ];
    } else if (marksheetType === 'terminal') {
      rVals = [
        sIdx + 1,
        sub.subject,
        sub.theoryMarks ?? '—',
        sub.practicalMarks ?? '—',
        `${sub.totalObtained ?? '—'} / ${sub.totalMax || 100}`,
        sub.grade || '—',
        sub.remarks || '—'
      ];
    } else if (marksheetType === 'combined') {
      rVals = [
        sIdx + 1,
        sub.subject,
        sub.ut1 ?? '—',
        sub.term1 ?? '—',
        sub.ut2 ?? '—',
        sub.term2 ?? '—',
        `${sub.grandTotal ?? '—'} / ${sub.grandMax || 300}`,
        `${sub.percentage || 0}%`,
        sub.grade || '—'
      ];
    } else {
      // Annual Combined
      rVals = [
        sIdx + 1,
        sub.subject,
        sub.ut1Raw ? `${sub.ut1Raw} (${sub.ut1Wt})` : (sub.ut1Wt ?? '—'),
        sub.term1Raw ? `${sub.term1Raw} (${sub.term1Wt})` : (sub.term1Wt ?? '—'),
        sub.ut2Raw ? `${sub.ut2Raw} (${sub.ut2Wt})` : (sub.ut2Wt ?? '—'),
        sub.term2Raw ? `${sub.term2Raw} (${sub.term2Wt})` : (sub.term2Wt ?? '—'),
        sub.finalScore ?? '—',
        sub.finalScore ? `${sub.finalScore}%` : '—',
        sub.grade || '—',
        sub.remarks || '—'
      ];
    }

    const subRow = worksheet.addRow(rVals);
    subRow.height = 20;
    subRow.eachCell((cell, colNum) => {
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
      cell.font = { name: 'Arial', size: 9 };
      if (marksheetType === 'annual' && colNum === 7) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF15803D' } };
      }
    });
  });

  // Summary Performance
  worksheet.addRow([]);
  const sumRow1 = worksheet.addRow([
    `Grand Total: ${data.totalObtained || 0} / ${data.totalMax || 0}`, '',
    `Combined Percentage: ${data.percentage || 0}%`, '',
    `Overall Grade: ${data.overallGrade || '—'}`, '',
    `Class Rank: #${data.rank || 1}`
  ]);
  sumRow1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF14532D' } };

  const sumRow2 = worksheet.addRow([
    `Final Result: ${data.status || 'PASSED'}`, '',
    marksheetType === 'annual' ? `Promotion Status: ${data.promotion || 'PROMOTED'}` : `Attendance: ${data.attendance || '95%'}`, '',
    '', '',
    ''
  ]);
  sumRow2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };

  if (marksheetType === 'annual') {
    const remarkRow = worksheet.addRow([
      `Class Teacher's Remarks: ${data.teacherRemarks || 'Satisfactory academic performance and conduct. Promoted to next class.'}`
    ]);
    worksheet.mergeCells(remarkRow.number, 1, remarkRow.number, totalCols);
    remarkRow.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF334155' } };
    remarkRow.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  // Set Widths
  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 24;
  for (let c = 3; c <= totalCols; c++) {
    worksheet.getColumn(c).width = marksheetType === 'annual' ? 18 : 18;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename || `Marksheet_${(student.student_name || 'Student').replace(/\s+/g, '_')}_${marksheetType}.xlsx`);
};
