import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { FaTimes, FaDownload, FaPrint, FaShieldAlt, FaCalendarAlt, FaUserGraduate, FaSchool } from 'react-icons/fa';
import { generateSingleAdmitCardPDF } from '../utils/admitCardPdfGenerator';

const AdmitCardPreviewModal = ({ isOpen, onClose, cardData }) => {
  const qrRef = useRef(null);

  if (!isOpen || !cardData) return null;

  const { student = {}, exam = {}, schedule = [], branding = {}, instructions = [], verificationUrl } = cardData;

  const handleDownloadPDF = () => {
    let qrDataUrl = null;
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      try {
        qrDataUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Failed to export QR canvas', err);
      }
    }

    const doc = generateSingleAdmitCardPDF(cardData, qrDataUrl);
    const fileName = `AdmitCard_${student.rollNumber || student.name || 'Student'}_${exam.name || 'Exam'}.pdf`.replace(/\s+/g, '_');
    doc.save(fileName);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400">
              <FaShieldAlt className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Official Admit Card Preview</h3>
              <p className="text-xs text-slate-400">1:1 Authentic Examination Hall Pass & Verification Layout</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
            >
              <FaDownload className="text-xs" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="Close"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        {/* Printable Card Frame */}
        <div className="p-6 bg-slate-50 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border-2 border-slate-300 overflow-hidden">
            {/* Top Accent Strip */}
            <div className="h-2.5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900" />

            {/* School Header */}
            <div className="px-8 pt-6 pb-4 text-center border-b border-slate-100 bg-white">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-14 mx-auto mb-2 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 mx-auto mb-2 flex items-center justify-center font-black text-xl border border-blue-200">
                  <FaSchool />
                </div>
              )}
              <h1 className="text-2xl font-black tracking-tight text-blue-950 uppercase">
                {branding.schoolName || 'VidyaBarta Academy'}
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                {branding.punchLine || 'Excellence in Education'} &bull; {branding.affiliation || 'Affiliated to State Board'}
              </p>

              {/* Examination Title Badge */}
              <div className="mt-3.5 inline-block px-6 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  OFFICIAL ADMIT CARD &bull; {exam.name || 'EXAMINATION'} ({exam.academicYear || new Date().getFullYear()})
                </span>
              </div>
            </div>

            {/* Candidate & QR Code Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50 border-b border-slate-200">
              {/* Left Student Info */}
              <div className="md:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Candidate Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Roll Number</span>
                  <span className="font-bold text-blue-900 text-sm">{student.rollNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Class & Section</span>
                  <span className="font-semibold text-slate-800">
                    Class {student.classLevel || 'General'} &bull; Sec {student.section || 'A'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Admission / Reg ID</span>
                  <span className="font-semibold text-slate-800">{student.admissionId || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Guardian Name</span>
                  <span className="font-medium text-slate-700">{student.guardianName || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[11px]">Date of Birth / Gender</span>
                  <span className="font-medium text-slate-700">
                    {student.dob || 'N/A'} ({student.gender || 'N/A'})
                  </span>
                </div>
              </div>

              {/* Right Media (Photo & QR Code) */}
              <div className="md:col-span-4 flex items-center justify-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                {/* Photo Box */}
                <div className="w-20 h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-1">
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt="Photo" className="w-full h-full object-cover rounded" />
                  ) : (
                    <>
                      <FaUserGraduate className="text-xl mb-1" />
                      <span className="text-[9px] font-bold text-center leading-tight">AFFIX PHOTO</span>
                    </>
                  )}
                </div>

                {/* QR Code Box */}
                <div ref={qrRef} className="flex flex-col items-center justify-center">
                  <div className="p-1 bg-white border border-slate-200 rounded shadow-xs">
                    <QRCodeCanvas
                      value={verificationUrl || 'https://vidyabarta.com/verify/pending'}
                      size={76}
                      level="M"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                    Scan to Verify
                  </span>
                </div>
              </div>
            </div>

            {/* Timetable Schedule Table */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FaCalendarAlt className="text-blue-900 text-sm" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Examination Routine & Hall Allocation
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-950 text-white font-semibold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Date & Day</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Subject / Paper</th>
                      <th className="py-2.5 px-3 text-center">Room No</th>
                      <th className="py-2.5 px-3 text-center">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {schedule && schedule.length > 0 ? (
                      schedule.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2 px-3 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{formatDate(row.exam_date)}</td>
                          <td className="py-2 px-3 text-slate-600 font-medium">
                            {row.start_time || '09:00 AM'} - {row.end_time || '12:00 PM'}
                          </td>
                          <td className="py-2 px-3 font-medium text-blue-950">
                            {row.subject} {row.sub_subject ? `(${row.sub_subject})` : ''}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700">{row.room_number || 'Hall 1'}</td>
                          <td className="py-2 px-3 text-center text-slate-300">&mdash;</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-slate-400">
                          Routine will be announced as per finalized timetable.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instructions & Official Signatures */}
            <div className="px-6 pb-6 pt-2 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 space-y-1 text-[10px] text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wide">Candidate Instructions:</span>
                <p>1. Must carry this original admit card & school photo ID to every examination paper.</p>
                <p>2. Electronic gadgets, smart watches, and unauthorized papers are strictly prohibited.</p>
                <p>3. Valid only with official Class Teacher and Principal signatures and school seal.</p>
              </div>

              <div className="md:col-span-6 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-600">
                <div>
                  <div className="border-b border-slate-300 pb-1 mb-1 text-slate-300">&nbsp;</div>
                  <span>Candidate</span>
                </div>
                <div>
                  <div className="border-b border-slate-300 pb-1 mb-1 text-slate-300">&nbsp;</div>
                  <span>Class Teacher</span>
                </div>
                <div>
                  <div className="border-b border-blue-900 pb-1 mb-1 text-slate-300">&nbsp;</div>
                  <span className="text-blue-950 font-bold">Principal / Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmitCardPreviewModal;
