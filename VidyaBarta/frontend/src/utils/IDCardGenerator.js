import { jsPDF } from 'jspdf';

export const generatePDFData = (student, schoolProfile) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85.6, 53.98] });
  const cardWidth = 53.98;
  const cardHeight = 85.6;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, cardWidth, cardHeight, 'F');
  
  doc.setFillColor(30, 58, 138); 
  doc.rect(0, 0, cardWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(schoolProfile?.school_name || "OUR SCHOOL", cardWidth/2, 6, { align: 'center' });
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text('ID CARD', cardWidth/2, 11, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.rect(cardWidth/2 - 10, 18, 20, 25);
  doc.setTextColor(150, 150, 150);
  doc.text('PHOTO', cardWidth/2, 32, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(student.student_name || student.name || 'N/A', cardWidth/2, 48, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  
  const idStr = student.admission_id || student.roll_number || student.employee_id || 'N/A';
  const classStr = student.class_name ? `${student.class_name} ${student.section || ''}` : student.department || 'N/A';
  const roleStr = student.role || (student.class_name ? 'Student' : 'Staff');
  const contactStr = student.contact_number || student.phone || 'N/A';

  const details = [
    `ID/Roll No: ${idStr}`,
    `Role/Class: ${roleStr} ${student.class_name ? ' - ' + classStr : ''}`,
    `Contact: ${contactStr}`
  ];

  let yPos = 55;
  details.forEach(detail => {
    doc.text(detail, 5, yPos);
    yPos += 5;
  });

  doc.setFillColor(30, 58, 138);
  doc.rect(0, cardHeight - 8, cardWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(4);
  doc.text('This card is the property of the school.', cardWidth/2, cardHeight - 3, { align: 'center' });

  return doc.output('arraybuffer');
};

export const generateImageCard = async (student, schoolProfile, format = 'image/jpeg') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 635; // Aspect ratio of 85.6 x 53.98
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, canvas.width, 110);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(schoolProfile?.school_name || 'OUR SCHOOL', canvas.width/2, 45);
    ctx.font = '16px Arial';
    ctx.fillText('ID CARD', canvas.width/2, 80);

    // Photo Box
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width/2 - 75, 135, 150, 185);
    ctx.fillStyle = '#999999';
    ctx.font = '20px Arial';
    ctx.fillText('PHOTO', canvas.width/2, 235);

    // Details
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(student.student_name || student.name || 'N/A', canvas.width/2, 360);

    ctx.textAlign = 'left';
    ctx.font = '18px Arial';
    
    const idStr = student.admission_id || student.roll_number || student.employee_id || 'N/A';
    const classStr = student.class_name ? `${student.class_name} ${student.section || ''}` : student.department || 'N/A';
    const roleStr = student.role || (student.class_name ? 'Student' : 'Staff');
    const contactStr = student.contact_number || student.phone || 'N/A';

    ctx.fillText(`ID/Roll No: ${idStr}`, 40, 420);
    ctx.fillText(`Role/Class: ${roleStr} ${student.class_name ? ' - ' + classStr : ''}`, 40, 460);
    ctx.fillText(`Contact: ${contactStr}`, 40, 500);

    // Footer
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('This card is the property of the school.', canvas.width/2, canvas.height - 25);

    const dataUrl = canvas.toDataURL(format, 0.9);
    // Return base64 without prefix for jszip
    resolve(dataUrl.split(',')[1]);
  });
};
