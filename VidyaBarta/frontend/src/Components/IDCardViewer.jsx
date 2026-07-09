import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { FaIdBadge, FaDownload, FaTimes } from 'react-icons/fa';

const IDCardViewer = ({ student, onClose, schoolProfile }) => {
  const cardRef = useRef(null);

  const handleDownload = () => {
    // Generate simple PDF for the ID Card
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85.6, 53.98] // CR80 standard ID card size
    });

    const cardWidth = 53.98;
    const cardHeight = 85.6;

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, cardWidth, cardHeight, 'F');
    
    // Header
    doc.setFillColor(30, 58, 138); // bg-blue-900
    doc.rect(0, 0, cardWidth, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(schoolProfile?.name || (schoolProfile?.name?.toUpperCase() || "OUR SCHOOL"), cardWidth/2, 6, { align: 'center' });
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text('STUDENT ID CARD', cardWidth/2, 11, { align: 'center' });

    // Photo placeholder or actual photo
    doc.setDrawColor(200, 200, 200);
    doc.rect(cardWidth/2 - 10, 18, 20, 25);
    doc.setTextColor(150, 150, 150);
    doc.text('PHOTO', cardWidth/2, 32, { align: 'center' });

    // Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(student.student_name || student.name || 'N/A', cardWidth/2, 48, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    
    const details = [
      `ID/Roll No: ${student.admissionId || student.rollNumber || student.admission_id || 'N/A'}`,
      `Class: ${student.grade || student.classLevel || student.class_level || 'N/A'}`,
      `Guardian: ${student.guardianName || student.parentsName || student.guardian_name || 'N/A'}`,
      `Contact: ${student.contactNumber || student.phone || student.contact_number || 'N/A'}`
    ];

    let yPos = 55;
    details.forEach(detail => {
      doc.text(detail, 5, yPos);
      yPos += 5;
    });

    // Footer
    doc.setFillColor(30, 58, 138);
    doc.rect(0, cardHeight - 8, cardWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4);
    doc.text('This card is the property of the school.', cardWidth/2, cardHeight - 3, { align: 'center' });

    doc.save(`IDCard_${student.admission_id || student.roll_number || 'Unknown'}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FaIdBadge className="text-blue-600" /> ID Card Preview
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center bg-gray-50">
          {/* Visual representation of ID card */}
          <div ref={cardRef} className="w-[210px] h-[330px] bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 relative flex flex-col">
            <div className="bg-blue-900 text-white text-center py-3 px-2 flex-shrink-0">
              <h4 className="font-bold text-[11px] leading-tight uppercase tracking-wider">{schoolProfile?.name || 'Our School'}</h4>
              <p className="text-[8px] opacity-80 uppercase mt-1">Student ID Card</p>
            </div>
            
            <div className="flex-1 flex flex-col items-center px-4 py-4">
              <div className="w-24 h-24 bg-gray-100 border-2 border-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <FaIdBadge className="text-4xl text-gray-300" />
                )}
              </div>
              
              <h5 className="font-black text-sm text-gray-800 text-center uppercase mb-3 line-clamp-2">
                {student.student_name || student.name}
              </h5>
              
              <div className="w-full space-y-2 text-[10px]">
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-500 font-medium">ID / Roll No:</span>
                  <span className="font-bold text-gray-800">{student.admissionId || student.rollNumber || student.admission_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-500 font-medium">Class:</span>
                  <span className="font-bold text-gray-800">{student.grade || student.classLevel || student.class_level || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-500 font-medium">Guardian:</span>
                  <span className="font-bold text-gray-800 truncate ml-2 max-w-[100px] text-right">{student.guardianName || student.parentsName || student.guardian_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Contact:</span>
                  <span className="font-bold text-gray-800">{student.contactNumber || student.phone || student.contact_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-900 text-white text-center py-2 px-2 text-[6px] uppercase tracking-widest mt-auto">
              Property of {schoolProfile?.name || 'School'}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleDownload} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
            <FaDownload /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default IDCardViewer;
