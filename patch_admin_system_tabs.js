const fs = require('fs');
const path = require('path');

const adminPagePath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/AdminPage.jsx');
let content = fs.readFileSync(adminPagePath, 'utf8');

const systemTabsCode = `
          {activeTab === 'status' && <SchoolStatusSettings apiUrl={API_URL} token={localStorage.getItem('adminToken')} />}
          {activeTab === 'holidays' && <HolidaySettings apiUrl={API_URL} token={localStorage.getItem('adminToken')} />}
          {activeTab === 'bulk' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-800 mb-6">Bulk Upload System</h2>
              <div className="space-y-12">
                <div className="border border-gray-100 p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-4 text-blue-800">Student Database</h3>
                  <BulkUpload apiUrl={API_URL} endpoint="students" token={localStorage.getItem('adminToken')} entityName="Students" onUploadSuccess={() => {}} />
                </div>
                <div className="border border-gray-100 p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-4 text-emerald-800">Teacher Database</h3>
                  <BulkUpload apiUrl={API_URL} endpoint="teachers" token={localStorage.getItem('adminToken')} entityName="Teachers" onUploadSuccess={() => {}} />
                </div>
              </div>
            </div>
          )}
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
          {activeTab === 'idCardViewer' && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-800 mb-2">ID Cards Generator</h2>
                <p className="text-gray-500 mb-6">Generate and download ID cards in bulk. (Feature implementation pending in later phases).</p>
             </div>
          )}
`;

if (!content.includes("{activeTab === 'status' && <SchoolStatusSettings")) {
  content = content.replace(
    "{activeTab === 'admission' && renderAdmissionTab()}",
    "{activeTab === 'admission' && renderAdmissionTab()}\n" + systemTabsCode
  );
}

fs.writeFileSync(adminPagePath, content, 'utf8');
console.log('System tabs successfully injected!');
