const fs = require('fs');
const file = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/StudentProfileViewer.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import React from 'react';", "import React, { useState } from 'react';\nimport axios from 'axios';\nimport { FaEdit, FaSave } from 'react-icons/fa';");

content = content.replace(
  "const StudentProfileViewer = ({ student, onClose, onEditSubjects }) => {",
  `const StudentProfileViewer = ({ student, onClose, onEditSubjects, onUpdate, apiUrl }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: student.student_name || student.name || '',
    admissionId: student.admission_id || student.admissionId || '',
    rollNumber: student.roll_number || student.rollNumber || '',
    dob: student.dob || '',
    bloodGroup: student.blood_group || student.bloodGroup || '',
    phone: student.contact_number || student.phone || student.contactNumber || '',
    email: student.email || '',
    address: student.address || '',
    guardianName: student.guardian_name || student.parentsName || student.guardianName || '',
    guardianPhone: student.guardian_phone || student.parentsPhone || ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(\`\${apiUrl}/students/\${student._id || student.id}\`, formData, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error saving student', err);
      alert('Failed to save student profile');
    } finally {
      setIsSaving(false);
    }
  };`
);

content = content.replace(
  `<h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaUser className="text-blue-600" /> Student Profile
          </h3>`,
  `<h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
          </div>`
);

// Replace editable fields in the view
content = content.replace(
  `<h2 className="text-2xl font-black text-gray-800">{student.student_name || student.name || 'Unknown'}</h2>`,
  `{isEditing ? (
                  <input type="text" className="text-2xl font-black text-gray-800 border-b-2 border-blue-500 bg-transparent outline-none w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Student Name" />
                ) : (
                  <h2 className="text-2xl font-black text-gray-800">{student.student_name || student.name || 'Unknown'}</h2>
                )}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800">{student.admission_id || student.admissionId || 'N/A'}</span>`,
  `{isEditing ? <input type="text" className="w-full text-sm p-1 border rounded" value={formData.admissionId} onChange={e => setFormData({...formData, admissionId: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.admission_id || student.admissionId || 'N/A'}</span>}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800">{student.roll_number || student.rollNumber || 'N/A'}</span>`,
  `{isEditing ? <input type="text" className="w-full text-sm p-1 border rounded" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.roll_number || student.rollNumber || 'N/A'}</span>}`
);

content = content.replace(
  `<FaBirthdayCake className="text-gray-400" /> {student.dob || 'N/A'}`,
  `<FaBirthdayCake className="text-gray-400" /> {isEditing ? <input type="date" className="w-full text-sm p-1 border rounded ml-2" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /> : (student.dob || 'N/A')}`
);

content = content.replace(
  `<FaTint className="text-red-400" /> {student.blood_group || student.bloodGroup || 'N/A'}`,
  `<FaTint className="text-red-400" /> {isEditing ? <input type="text" className="w-full text-sm p-1 border rounded ml-2" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} /> : (student.blood_group || student.bloodGroup || 'N/A')}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800">{student.contact_number || student.phone || student.contactNumber || 'N/A'}</span>`,
  `{isEditing ? <input type="text" className="w-full text-sm p-1 border rounded mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.contact_number || student.phone || student.contactNumber || 'N/A'}</span>}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800 break-all">{student.email || 'N/A'}</span>`,
  `{isEditing ? <input type="email" className="w-full text-sm p-1 border rounded mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800 break-all">{student.email || 'N/A'}</span>}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800">{student.address || 'N/A'}</span>`,
  `{isEditing ? <textarea className="w-full text-sm p-1 border rounded mt-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.address || 'N/A'}</span>}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800">{student.guardian_name || student.parentsName || student.guardianName || 'N/A'}</span>`,
  `{isEditing ? <input type="text" className="w-full text-sm p-1 border rounded mt-1" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.guardian_name || student.parentsName || student.guardianName || 'N/A'}</span>}`
);

content = content.replace(
  `<span className="text-sm font-semibold text-gray-800">{student.guardian_phone || student.parentsPhone || 'N/A'}</span>`,
  `{isEditing ? <input type="text" className="w-full text-sm p-1 border rounded mt-1" value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} /> : <span className="text-sm font-semibold text-gray-800">{student.guardian_phone || student.parentsPhone || 'N/A'}</span>}`
);

fs.writeFileSync(file, content);
console.log('Patched StudentProfileViewer.jsx');
