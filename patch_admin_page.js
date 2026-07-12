const fs = require('fs');
const path = require('path');

const adminPagePath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/AdminPage.jsx');
let content = fs.readFileSync(adminPagePath, 'utf8');

// 1. Add imports
if (!content.includes('import StudentProfileViewer')) {
  content = content.replace(
    "import AdminAnnouncements from './AdminAnnouncements';",
    "import AdminAnnouncements from './AdminAnnouncements';\nimport StudentProfileViewer from './StudentProfileViewer';\nimport SchoolAdminsManager from './SchoolAdminsManager';"
  );
}

if (!content.includes('FaUser')) {
  content = content.replace(
    "import { FaIdBadge, FaMoneyCheckAlt, FaBullhorn } from 'react-icons/fa';",
    "import { FaIdBadge, FaMoneyCheckAlt, FaBullhorn, FaUser } from 'react-icons/fa';"
  );
}

// 2. Add state variables for Modals
if (!content.includes('const [viewingProfileFor, setViewingProfileFor]')) {
  content = content.replace(
    "const [viewingIdCardFor, setViewingIdCardFor] = useState(null);",
    "const [viewingIdCardFor, setViewingIdCardFor] = useState(null);\n  const [viewingProfileFor, setViewingProfileFor] = useState(null);\n  const [isEditingSubjectsFor, setIsEditingSubjectsFor] = useState(null);"
  );
}

// 3. Add View Profile Button to Student Table
if (!content.includes('onClick={() => setViewingProfileFor(student)}')) {
  content = content.replace(
    /<td className="py-4 text-right flex justify-end gap-3">\s*<button\s*onClick=\{\(\) => setViewingIdCardFor\(student\)\}/,
    `<td className="py-4 text-right flex justify-end gap-3">
                             <button 
                               onClick={() => setViewingProfileFor(student)}
                               className="text-primary hover:text-blue-600 transition-colors inline-flex items-center"
                               title="View Profile"
                             >
                               <FaUser size={14} />
                             </button>
                             <button 
                               onClick={() => setViewingIdCardFor(student)}`
  );
}

// 4. Add Modals at the bottom
if (!content.includes('<StudentProfileViewer')) {
  const modalsCode = `
          {viewingProfileFor && (
            <StudentProfileViewer
              student={viewingProfileFor}
              onClose={() => setViewingProfileFor(null)}
              onEditSubjects={() => {
                setIsEditingSubjectsFor(viewingProfileFor);
                setViewingProfileFor(null);
              }}
            />
          )}

          {isEditingSubjectsFor && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Subjects</h2>
                <p className="text-sm text-gray-500 mb-4">Update subjects for {isEditingSubjectsFor.student_name || isEditingSubjectsFor.name}</p>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const token = localStorage.getItem('adminToken');
                    const formData = new FormData(e.target);
                    await axios.put(\`\${API_URL}/students/\${isEditingSubjectsFor._id || isEditingSubjectsFor.id}\`, {
                      mil_subject: formData.get('mil_subject'),
                      elective_subject: formData.get('elective_subject')
                    }, { headers: { Authorization: \`Bearer \${token}\` } });
                    
                    alert('Subjects updated successfully!');
                    setIsEditingSubjectsFor(null);
                    fetchStudents();
                  } catch (error) {
                    alert('Failed to update subjects: ' + error.message);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">MIL Subject</label>
                    <input type="text" name="mil_subject" defaultValue={isEditingSubjectsFor.mil_subject || ''} className="w-full border rounded-lg p-2" placeholder="e.g. Assamese, Hindi, Bengali" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Elective Subject</label>
                    <input type="text" name="elective_subject" defaultValue={isEditingSubjectsFor.elective_subject || ''} className="w-full border rounded-lg p-2" placeholder="e.g. Advanced Mathematics, Computer Science" />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => {
                      setViewingProfileFor(isEditingSubjectsFor);
                      setIsEditingSubjectsFor(null);
                    }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}
`;
  content = content.replace(
    "onClose={() => setViewingIdCardFor(null)} \n            />\n          )}",
    "onClose={() => setViewingIdCardFor(null)} \n            />\n          )}\n" + modalsCode
  );
}

// 5. Add pendingAdmins body
if (!content.includes('<SchoolAdminsManager')) {
  const pendingAdminsBody = `
          {activeTab === 'pendingAdmins' && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">School Administrators</h2>
                  <p className="text-gray-500 mt-2">Manage additional admin accounts for this school (Max 3).</p>
                </div>
              </div>
              <SchoolAdminsManager apiUrl={API_URL} token={localStorage.getItem('adminToken')} />
            </div>
          )}
`;
  // Insert before the bulk upload tab body
  content = content.replace(
    "{activeTab === 'bulk' && (",
    pendingAdminsBody + "\n          {activeTab === 'bulk' && ("
  );
}

fs.writeFileSync(adminPagePath, content, 'utf8');
console.log('AdminPage.jsx successfully updated!');
