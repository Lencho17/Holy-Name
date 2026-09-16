import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Deterministic A4 PDF Generator for VidyaBarta Admit Cards
 * Strictly enforces fixed millimeter measurements without browser viewport dependency.
 */

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_LEFT_RIGHT_MM = 10;
export const MARGIN_TOP_BOTTOM_MM = 5.5;
export const CARD_WIDTH_MM = 190;
export const CARD_HEIGHT_MM = 138;
export const INTER_CARD_GAP_MM = 10;
export const CUT_GUIDELINE_Y_MM = 148.5; // (5.5 + 138 + 5) = 148.5 mm (exact midpoint)

/**
 * Format a date string into readable Date & Day
 */
const formatDateAndDay = (dateStr) => {
  if (!dateStr) return 'TBA';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${formatted} (${dayName})`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Draw a single admit card within fixed coordinates on a jsPDF document
 * @param {jsPDF} doc - jsPDF instance
 * @param {Object} cardData - Complete assembled card payload
 * @param {number} x - Horizontal coordinate (mm)
 * @param {number} y - Vertical coordinate (mm)
 * @param {string|null} qrDataUrl - Optional base64 data URL for QR Code
 */
export const drawAdmitCardOnDoc = (doc, cardData, x = MARGIN_LEFT_RIGHT_MM, y = MARGIN_TOP_BOTTOM_MM, qrDataUrl = null) => {
  const { student = {}, exam = {}, schedule = [], branding = {}, instructions = [] } = cardData;

  // 1. Outer Border & Card Background
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.35);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, 2, 2, 'FD');

  // Top Accent Header Stripe
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(x, y, CARD_WIDTH_MM, 3, 'F');

  // 2. School Branding Header
  const schoolName = branding.schoolName || 'VIDYABARTA ACADEMY';
  const punchLine = branding.punchLine || 'Empowering Knowledge & Excellence';
  const affiliation = branding.affiliation || 'Affiliated to State Secondary Board';

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName.toUpperCase(), x + CARD_WIDTH_MM / 2, y + 8, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${punchLine}  •  ${affiliation}`, x + CARD_WIDTH_MM / 2, y + 11.5, { align: 'center' });

  // Examination Badge Header
  const examTitle = `${exam.name || 'EXAMINATION'} (${exam.academicYear || new Date().getFullYear()})`;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x + 20, y + 13.5, CARD_WIDTH_MM - 40, 5.5, 1, 1, 'FD');

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`OFFICIAL ADMIT CARD — ${examTitle.toUpperCase()}`, x + CARD_WIDTH_MM / 2, y + 17.5, { align: 'center' });

  // 3. Student Details & Candidate Media Block
  const infoBoxY = y + 21;
  const infoBoxHeight = 27;

  // Left Details Container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x + 4, infoBoxY, 136, infoBoxHeight, 1, 1, 'FD');

  // Column 1
  const col1X = x + 7;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(6.5);

  const drawField = (label, value, fx, fy) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${label}:`, fx, fy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value || 'N/A'), fx + 26, fy);
  };

  drawField('Student Name', student.name, col1X, infoBoxY + 5.5);
  drawField('Roll Number', student.rollNumber, col1X, infoBoxY + 11);
  drawField('Class & Sec', `Class ${student.classLevel || 'General'} - ${student.section || 'A'}`, col1X, infoBoxY + 16.5);
  drawField('Admission ID', student.admissionId, col1X, infoBoxY + 22);

  // Column 2
  const col2X = x + 72;
  drawField('Guardian Name', student.guardianName, col2X, infoBoxY + 5.5);
  drawField('Date of Birth', student.dob, col2X, infoBoxY + 11);
  drawField('Gender', student.gender, col2X, infoBoxY + 16.5);
  drawField('Contact No.', student.contactNumber, col2X, infoBoxY + 22);

  // Right Photo & QR Block
  const photoX = x + 144;
  const photoWidth = 19;
  const photoHeight = 24;

  // Student Photo Placeholder or Image
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(photoX, infoBoxY + 1.5, photoWidth, photoHeight, 1, 1, 'FD');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('AFFIX', photoX + photoWidth / 2, infoBoxY + 11, { align: 'center' });
  doc.text('PHOTO', photoX + photoWidth / 2, infoBoxY + 15, { align: 'center' });

  // QR Code Block
  const qrX = x + 166;
  const qrSize = 20;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, infoBoxY + 1.5, qrSize, qrSize);
    } catch (qrErr) {
      doc.rect(qrX, infoBoxY + 1.5, qrSize, qrSize);
    }
  } else {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(qrX, infoBoxY + 1.5, qrSize, qrSize, 'FD');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(5);
    doc.text('QR CODE', qrX + qrSize / 2, infoBoxY + 12, { align: 'center' });
  }

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN TO VERIFY', qrX + qrSize / 2, infoBoxY + 24.5, { align: 'center' });

  // 4. Examination Timetable Table
  const tableY = infoBoxY + infoBoxHeight + 2;

  const tableBody = (schedule && schedule.length > 0)
    ? schedule.map((item, index) => [
        (index + 1).toString(),
        formatDateAndDay(item.exam_date),
        `${item.start_time || '09:00 AM'} - ${item.end_time || '12:00 PM'}`,
        item.subject + (item.sub_subject ? ` (${item.sub_subject})` : ''),
        item.room_number || 'Hall 1',
        ''
      ])
    : [
        ['1', 'As per routine', '09:00 AM - 12:00 PM', 'All Enrolled Subjects', 'Main Hall', '']
      ];

  autoTable(doc, {
    startY: tableY,
    margin: { left: x + 4, right: A4_WIDTH_MM - (x + CARD_WIDTH_MM - 4) },
    tableWidth: CARD_WIDTH_MM - 8,
    head: [['#', 'Date & Day', 'Time', 'Subject / Paper', 'Room No', 'Invigilator Sign']],
    body: tableBody.slice(0, 6), // Fit up to 6 rows cleanly within 138mm card
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 6,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1.2
    },
    bodyStyles: {
      fontSize: 5.5,
      textColor: [30, 41, 59],
      cellPadding: 1.1,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 36 },
      2: { cellWidth: 36, halign: 'center' },
      3: { cellWidth: 54 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 28, halign: 'center' }
    }
  });

  // 5. Candidate Instructions & Signatures Section
  const footerY = y + CARD_HEIGHT_MM - 20;

  // Candidate Guidelines (Left)
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT INSTRUCTIONS FOR CANDIDATES:', x + 5, footerY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(4.5);
  const inst1 = '1. Carry this admit card and valid school photo identity card to the exam hall for every subject.';
  const inst2 = '2. Entry permitted up to 15 minutes prior to scheduled start. Electronic gadgets and smart watches are strictly prohibited.';
  const inst3 = '3. Tampering or unauthorized alteration renders this admit card null and void.';
  doc.text(inst1, x + 5, footerY + 5.5);
  doc.text(inst2, x + 5, footerY + 8.5);
  doc.text(inst3, x + 5, footerY + 11.5);

  // Signatures (Right)
  const signY = y + CARD_HEIGHT_MM - 5;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);

  // Candidate Signature
  doc.line(x + 85, signY - 3, x + 115, signY - 3);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text("Candidate's Signature", x + 100, signY, { align: 'center' });

  // Class Teacher Signature
  doc.line(x + 122, signY - 3, x + 152, signY - 3);
  doc.text("Class Teacher", x + 137, signY, { align: 'center' });

  // Principal Signature & Seal
  doc.line(x + 158, signY - 3, x + 186, signY - 3);
  doc.setTextColor(30, 58, 138);
  doc.text("Principal / Controller", x + 172, signY, { align: 'center' });
};

/**
 * Generate a standalone Single Admit Card PDF
 * @param {Object} cardData - Assembled admit card payload
 * @param {string|null} qrDataUrl - Base64 PNG data URL of the QR code
 * @returns {jsPDF}
 */
export const generateSingleAdmitCardPDF = (cardData, qrDataUrl = null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Draw exactly one card centered vertically on the A4 page
  const yCentered = (A4_HEIGHT_MM - CARD_HEIGHT_MM) / 2; // ~79.5mm
  drawAdmitCardOnDoc(doc, cardData, MARGIN_LEFT_RIGHT_MM, yCentered, qrDataUrl);

  return doc;
};

/**
 * Generate a Bulk Class Admit Card PDF Booklet (Exactly 2 cards per A4 page)
 * @param {Array<Object>} cardPayloads - Array of card data objects
 * @param {Map<string, string>} qrCodeMap - Map of studentId/cardId to base64 QR data URL
 * @returns {jsPDF}
 */
export const generateBulkAdmitCardBookletPDF = (cardPayloads = [], qrCodeMap = new Map()) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  if (!cardPayloads || cardPayloads.length === 0) {
    doc.text('No admit card records found for export.', 20, 20);
    return doc;
  }

  cardPayloads.forEach((card, index) => {
    const pageIndex = Math.floor(index / 2);
    const positionOnPage = index % 2; // 0 = top card, 1 = bottom card

    if (index > 0 && positionOnPage === 0) {
      doc.addPage('a4', 'portrait');
    }

    const qrDataUrl = qrCodeMap.get(card.id) || qrCodeMap.get(card.student?.id) || null;

    if (positionOnPage === 0) {
      // Top Card
      drawAdmitCardOnDoc(doc, card, MARGIN_LEFT_RIGHT_MM, MARGIN_TOP_BOTTOM_MM, qrDataUrl);

      // Scissor Cut Guideline at exact midpoint y = 148.5 mm
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineDashPattern([2, 2], 0);
      doc.line(MARGIN_LEFT_RIGHT_MM, CUT_GUIDELINE_Y_MM, A4_WIDTH_MM - MARGIN_LEFT_RIGHT_MM, CUT_GUIDELINE_Y_MM);
      doc.setLineDashPattern([], 0); // reset dash

      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('✂  CUT ALONG DOTTED LINE  ✂', A4_WIDTH_MM / 2, CUT_GUIDELINE_Y_MM - 1, { align: 'center' });
    } else {
      // Bottom Card
      const bottomCardY = MARGIN_TOP_BOTTOM_MM + CARD_HEIGHT_MM + INTER_CARD_GAP_MM; // 5.5 + 138 + 10 = 153.5 mm
      drawAdmitCardOnDoc(doc, card, MARGIN_LEFT_RIGHT_MM, bottomCardY, qrDataUrl);
    }
  });

  return doc;
};
