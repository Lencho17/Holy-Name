const fs = require('fs');
const path = require('path');

const adminPagePath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/AdminPage.jsx');
let content = fs.readFileSync(adminPagePath, 'utf8');

// 1. Import FeeManagement
if (!content.includes('import FeeManagement from')) {
  content = content.replace(
    "import AdminStaffRequests from './AdminStaffRequests';",
    "import AdminStaffRequests from './AdminStaffRequests';\nimport FeeManagement from './FeeManagement';"
  );
}

// 2. Add Sidebar Item for fees
if (!content.includes("setActiveTab('fees')")) {
  const sidebarItem = `
          <SidebarItem active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} icon={FaMoneyCheckAlt} label="Finance & Fees" />
          <SidebarItem active={activeTab === 'admissions'} onClick={() => setActiveTab('admissions')} icon={FaUserPlus} label="Admissions" />
`;
  content = content.replace(
    "<SidebarItem active={activeTab === 'admissions'} onClick={() => setActiveTab('admissions')} icon={FaUserPlus} label=\"Admissions\" />",
    sidebarItem
  );
}

// 3. Add to the main render switch
if (!content.includes("{activeTab === 'fees' && <FeeManagement")) {
  const feesBody = `
          {activeTab === 'fees' && <FeeManagement apiUrl={API_URL} token={localStorage.getItem('adminToken')} />}
`;
  content = content.replace(
    "{activeTab === 'dashboard' && renderDashboard()}",
    "{activeTab === 'dashboard' && renderDashboard()}\n" + feesBody
  );
}

fs.writeFileSync(adminPagePath, content, 'utf8');
console.log('AdminPage.jsx successfully patched for FeeManagement!');
