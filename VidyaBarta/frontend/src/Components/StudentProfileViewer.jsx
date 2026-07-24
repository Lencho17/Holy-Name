import React, { useState } from 'react';
import axios from 'axios';
import { FaEdit, FaSave } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { FaUser, FaDownload, FaTimes, FaPhone, FaMapMarkerAlt, FaEnvelope, FaBirthdayCake, FaTint, FaVenusMars } from 'react-icons/fa';

const StudentProfileViewer = ({ student, onClose, onEditSubjects, onUpdate, apiUrl }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: student.studentName || student.student_name || student.name || '',
    admissionId: student.admissionId || student.admission_id || '',
    rollNumber: student.rollNumber || student.roll_number || '',
    dob: student.dateOfBirth || student.date_of_birth || student.dob || '',
    bloodGroup: student.bloodGroup || student.blood_group || '',
    gender: student.gender || '',
    phone: student.contactNumber || student.contact_number || student.phone || '',
    email: student.email || '',
    address: student.address || '',
    guardianName: student.guardianName || student.guardian_name || student.parentsName || '',
    guardianPhone: student.guardianPhone || student.guardian_phone || student.parentsPhone || ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${apiUrl}/students/${student._id || student.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error saving student', err);
      alert('Failed to save student profile');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 58, 138); // bg-blue-900
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('Student Profile', 105, 20, { align: 'center' });

    // Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Personal Information', 20, 50);
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const details = [
      ['Name:', student.studentName || student.student_name || student.name || 'N/A'],
      ['Admission ID:', student.admissionId || student.admission_id || 'N/A'],
      ['Roll Number:', student.rollNumber || student.roll_number || 'N/A'],
      ['Class:', `${student.className || student.class_name || student.grade || 'N/A'} - ${student.section || ''}`],
      ['Date of Birth:', student.dateOfBirth || student.date_of_birth || student.dob || 'N/A'],
      ['Blood Group:', student.bloodGroup || student.blood_group || 'N/A'],
      ['Gender:', student.gender || 'N/A'],
      ['Phone:', student.contactNumber || student.contact_number || student.phone || 'N/A'],
      ['Email:', student.email || 'N/A'],
      ['Address:', student.address || 'N/A'],
      ['Guardian Name:', student.guardianName || student.guardian_name || student.parentsName || 'N/A'],
      ['Guardian Phone:', student.guardianPhone || student.guardian_phone || student.parentsPhone || 'N/A'],
    ];

    let y = 65;
    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 60, y);
      y += 10;
    });

    if (student.mil_subject || student.elective_subject) {
      y += 5;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Academic Subjects', 20, y);
      doc.setLineWidth(0.5);
      doc.line(20, y + 2, 190, y + 2);
      y += 15;

      doc.setFontSize(11);
      if (student.mil_subject) {
        doc.setFont("helvetica", "bold");
        doc.text('MIL Subject:', 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(student.mil_subject), 60, y);
        y += 10;
      }
      if (student.elective_subject) {
        doc.setFont("helvetica", "bold");
        doc.text('Elective:', 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(student.elective_subject), 60, y);
        y += 10;
      }
    }

    doc.save(`${student.student_name || 'Student'}_Profile.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaUser className="text-blue-600" /> Student Profile
          </h3>
          <div className="flex gap-2 ml-auto mr-4">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                <FaEdit /> Edit Profile
              </button>
            ) : (
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 text-sm font-bold text-white bg-green-600 px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                <FaSave /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-100 border-2 border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm flex items-center justify-center">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="text-6xl text-gray-300" />
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {student.status || 'Active'}
              </span>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                {isEditing ? (
                  <input type="text" className="text-2xl font-black text-gray-800 border-b-2 border-blue-500 bg-transparent outline-none w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Student Name" />
                ) : (
                  <h2 className="text-2xl font-black text-gray-800">{student.studentName || student.student_name || student.name || 'Unknown'}</h2>
                )}
                <p className="text-gray-500 font-medium text-sm">Class {student.className || student.class_name || student.grade} {student.section && `- Section ${student.section}`}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Admission ID</span>
                  {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded" value={formData.admissionId} onChange={e => setFormData({...formData, admissionId: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.admissionId || student.admission_id || 'N/A'}</span>}
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Roll Number</span>
                  {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.rollNumber || student.roll_number || 'N/A'}</span>}
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaBirthdayCake className="text-gray-400" /> {isEditing ? <input type="date" className="w-full text-sm p-1 border rounded ml-2" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /> : (student.dateOfBirth || student.date_of_birth || student.dob || 'N/A')}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Blood Group</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaTint className="text-red-400" /> {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded ml-2" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} /> : (student.bloodGroup || student.blood_group || 'N/A')}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaVenusMars className="text-pink-400" /> {isEditing ? (
                      <select className="w-full text-sm p-1 border rounded ml-2" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (student.gender || 'N/A')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FaPhone size={14} />
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500">Phone Number</span>
                  {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.contactNumber || student.contact_number || student.phone || 'N/A'}</span>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <FaEnvelope size={14} />
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500">Email Address</span>
                  {isEditing ? <input type="email" className="w-full text-sm p-1 border rounded mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800 break-all">{student.email || 'N/A'}</span>}
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <FaMapMarkerAlt size={14} />
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500">Residential Address</span>
                  {isEditing ? <textarea className="w-full text-sm p-1 border rounded mt-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.address || 'N/A'}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Guardian Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="block text-xs font-medium text-gray-500">Guardian Name</span>
                {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded mt-1" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.guardianName || student.guardian_name || student.parentsName || 'N/A'}</span>}
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500">Guardian Phone</span>
                {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded mt-1" value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.guardianPhone || student.guardian_phone || student.parentsPhone || 'N/A'}</span>}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Academic Subjects</h4>
              <button 
                onClick={onEditSubjects} 
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-3 py-1 rounded bg-blue-50"
              >
                Change Subjects
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg bg-white">
                <span className="block text-xs font-medium text-gray-500 mb-1">MIL Subject</span>
                <span className="text-sm font-semibold text-gray-800">{student.milSubject || student.mil_subject || 'Not Assigned'}</span>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg bg-white">
                <span className="block text-xs font-medium text-gray-500 mb-1">Elective Subject</span>
                <span className="text-sm font-semibold text-gray-800">{student.electiveSubject || student.elective_subject || 'Not Assigned'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">* Applicable primarily for classes IX to XII.</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Close</button>
          <button onClick={handleDownloadPDF} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-2 transition-all">
            <FaDownload /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileViewer;
