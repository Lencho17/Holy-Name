const fs = require('fs');
const path = require('path');

const adminPagePath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/AdminPage.jsx');
let content = fs.readFileSync(adminPagePath, 'utf8');

if (!content.includes('label="Finance & Fees"')) {
  // Add SidebarItem right before the Data sidebar item
  const financeItem = `
          <SidebarItem active={activeTab === 'fees'} onClick={() => { setActiveTab('fees'); setIsSidebarOpen(false); }} icon={FaMoneyCheckAlt} label="Finance & Fees" />
`;
  
  content = content.replace(
    '<SidebarItem active={isDataActive} icon={FiUsers} label="Data">',
    financeItem + '\n          <SidebarItem active={isDataActive} icon={FiUsers} label="Data">'
  );

  fs.writeFileSync(adminPagePath, content, 'utf8');
  console.log('AdminPage.jsx successfully patched for FeeManagement SidebarItem!');
} else {
  console.log('Finance & Fees already exists in sidebar.');
}
