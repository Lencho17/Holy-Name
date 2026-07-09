const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'VidyaBarta/frontend/src/Components/AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports if missing
if (!content.includes('FiChevronDown')) {
  content = content.replace(
    "import { FaUsers", 
    "import { FiChevronDown, FiMenu, FiHome, FiBriefcase, FiBox, FiLayers, FiStar, FiCreditCard, FiDollarSign, FiUsers, FiSettings, FiMonitor } from 'react-icons/fi';\\nimport { FaUsers"
  );
}

// 2. Inject SidebarItem and SubItem
const sidebarComponents = \`
const SidebarItem = ({ active, onClick, icon: Icon, label, children }) => {
  const [isOpen, ReactSetIsOpen] = React.useState(false);
  const isActive = active;
  React.useEffect(() => {
    if (active) ReactSetIsOpen(true);
  }, [active]);

  if (children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => ReactSetIsOpen(!isOpen)}
          className={"w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 " + (isActive || isOpen ? 'bg-primary/5 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface')}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className={"text-lg " + (isActive || isOpen ? 'text-primary' : 'text-on-surface-variant')} />}
            <span className="text-body-sm">{label}</span>
          </div>
          <FiChevronDown className={"transition-transform duration-200 " + (isOpen ? 'rotate-180' : '')} />
        </button>
        <div className={"overflow-hidden transition-all duration-300 " + (isOpen ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0')}>
          <div className="pl-11 pr-2 py-2 space-y-1 border-l-2 border-outline-variant ml-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={"w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 " + (isActive ? 'bg-primary text-white shadow-md shadow-primary/20 font-medium' : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface')}
    >
      {Icon && <Icon className="text-lg" />}
      <span className="text-body-sm">{label}</span>
    </button>
  );
};

const SubItem = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={"w-full text-left block py-2 px-3 text-body-sm rounded-lg transition-colors " + (active ? 'text-primary font-semibold bg-primary/5' : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/50')}
  >
    {label}
  </button>
);
\`;

if (!content.includes('const SidebarItem = ({ active')) {
  content = content.replace("function AdminPage() {", sidebarComponents + "\\nfunction AdminPage() {");
}

const returnStartStr = '  return (\\n    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden" style={{ backgroundColor: \\'#F1F5F9\\' }}>';
const mainStr = '<main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8" style={{ backgroundColor: \\'#F8FAFC\\' }}>';

const startIndex = content.indexOf(returnStartStr);
const endIndex = content.indexOf(mainStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newLayout = \`  const getInitials = (name) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isContentActive = ['schoolProfile', 'gallery', 'videos', 'banner', 'highlights', 'events', 'notices', 'faculty', 'principal', 'alumni', 'excellence', 'emeritus', 'careerAds', 'socialMedia', 'stats', 'about', 'courses', 'faqs', 'amenities'].includes(activeTab);
  const isDataActive = ['admission', 'students', 'inquiries', 'jobApplications', 'staffLeaves', 'staffRequests', 'staffAssignments', 'staffPayroll', 'staffAnnouncements', 'tenders', 'appointments'].includes(activeTab);
  const isSystemActive = ['pendingAdmins', 'status', 'bulk', 'holidays', 'idCardViewer'].includes(activeTab);

  return (
    <div className="min-h-screen bg-background flex font-sans overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-secondary/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={"fixed lg:sticky top-0 h-screen w-72 bg-surface border-r border-outline-variant flex flex-col z-50 transition-transform duration-300 " + (isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="p-6 flex items-center justify-center border-b border-outline-variant gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-primary/20 overflow-hidden bg-white shrink-0">
              {schoolProfile?.logo ? (
                <img src={schoolProfile.logo} alt="School Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <FaGraduationCap className="text-primary text-lg" />
              )}
            </div>
            <div className="flex flex-col justify-center items-start overflow-hidden">
              <h2 className="text-sm font-bold text-neutral leading-none tracking-wide mb-0.5 truncate w-full">
                {schoolProfile?.name || "School"}
              </h2>
              <span className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.2em] leading-none">Admin Console</span>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {adminUser?.role === 'developer' && (
             <SidebarItem active={activeTab === 'activity'} onClick={() => { setActiveTab('activity'); setIsSidebarOpen(false); }} icon={FiMonitor} label="Activity Logs" />
          )}
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} icon={FiHome} label="Dashboard" />
          
          <SidebarItem active={isContentActive} icon={FiLayers} label="Content">
            <SubItem active={activeTab === 'schoolProfile'} onClick={() => { setActiveTab('schoolProfile'); setIsSidebarOpen(false); }} label="School Profile" />
            <SubItem active={activeTab === 'gallery'} onClick={() => { setActiveTab('gallery'); setIsSidebarOpen(false); }} label="Gallery" />
            <SubItem active={activeTab === 'videos'} onClick={() => { setActiveTab('videos'); setIsSidebarOpen(false); }} label="Videos" />
            <SubItem active={activeTab === 'banner'} onClick={() => { setActiveTab('banner'); setIsSidebarOpen(false); }} label="Popup Banner" />
            <SubItem active={activeTab === 'highlights'} onClick={() => { setActiveTab('highlights'); setIsSidebarOpen(false); }} label="Highlights" />
            <SubItem active={activeTab === 'events'} onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }} label="Events" />
            <SubItem active={activeTab === 'notices'} onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }} label="Notices" />
            <SubItem active={activeTab === 'faculty'} onClick={() => { setActiveTab('faculty'); setIsSidebarOpen(false); }} label="Faculty" />
            <SubItem active={activeTab === 'principal'} onClick={() => { setActiveTab('principal'); setIsSidebarOpen(false); }} label="Principal" />
            <SubItem active={activeTab === 'alumni'} onClick={() => { setActiveTab('alumni'); setIsSidebarOpen(false); }} label="Alumni" />
            <SubItem active={activeTab === 'excellence'} onClick={() => { setActiveTab('excellence'); setIsSidebarOpen(false); }} label="Excellence" />
            <SubItem active={activeTab === 'emeritus'} onClick={() => { setActiveTab('emeritus'); setIsSidebarOpen(false); }} label="Alumestron" />
            <SubItem active={activeTab === 'careerAds'} onClick={() => { setActiveTab('careerAds'); setIsSidebarOpen(false); }} label="Career Ads" />
            <SubItem active={activeTab === 'socialMedia'} onClick={() => { setActiveTab('socialMedia'); setIsSidebarOpen(false); }} label="Social Media" />
            <SubItem active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }} label="Home Stats" />
            <SubItem active={activeTab === 'about'} onClick={() => { setActiveTab('about'); setIsSidebarOpen(false); }} label="About Page" />
            <SubItem active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setIsSidebarOpen(false); }} label="Courses Page" />
            <SubItem active={activeTab === 'faqs'} onClick={() => { setActiveTab('faqs'); setIsSidebarOpen(false); }} label="FAQs" />
            <SubItem active={activeTab === 'amenities'} onClick={() => { setActiveTab('amenities'); setIsSidebarOpen(false); }} label="Amenities" />
          </SidebarItem>

          <SidebarItem active={isDataActive} icon={FiUsers} label="Data">
             <SubItem active={activeTab === 'admission'} onClick={() => { setActiveTab('admission'); setIsSidebarOpen(false); }} label="Admission" />
             <SubItem active={activeTab === 'appointments'} onClick={() => { setActiveTab('appointments'); setIsSidebarOpen(false); }} label="Appointments" />
             <SubItem active={activeTab === 'inquiries'} onClick={() => { setActiveTab('inquiries'); setIsSidebarOpen(false); }} label="Inquiries" />
             <SubItem active={activeTab === 'jobApplications'} onClick={() => { setActiveTab('jobApplications'); setIsSidebarOpen(false); }} label="Recruitment" />
             <SubItem active={activeTab === 'staffLeaves'} onClick={() => { setActiveTab('staffLeaves'); setIsSidebarOpen(false); }} label="Staff Leaves" />
             <SubItem active={activeTab === 'staffRequests'} onClick={() => { setActiveTab('staffRequests'); setIsSidebarOpen(false); }} label="Staff Requests" />
             <SubItem active={activeTab === 'staffAssignments'} onClick={() => { setActiveTab('staffAssignments'); setIsSidebarOpen(false); }} label="Staff Assignments" />
             <SubItem active={activeTab === 'staffPayroll'} onClick={() => { setActiveTab('staffPayroll'); setIsSidebarOpen(false); }} label="Payroll" />
             <SubItem active={activeTab === 'staffAnnouncements'} onClick={() => { setActiveTab('staffAnnouncements'); setIsSidebarOpen(false); }} label="Announcements" />
             <SubItem active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }} label="Students" />
             <SubItem active={activeTab === 'tenders'} onClick={() => { setActiveTab('tenders'); setIsSidebarOpen(false); }} label="Tenders" />
          </SidebarItem>

          <SidebarItem active={isSystemActive} icon={FiSettings} label="System">
            <SubItem active={activeTab === 'pendingAdmins'} onClick={() => { setActiveTab('pendingAdmins'); setIsSidebarOpen(false); }} label="Access Requests" />
            <SubItem active={activeTab === 'status'} onClick={() => { setActiveTab('status'); setIsSidebarOpen(false); }} label="Portal Status" />
            <SubItem active={activeTab === 'bulk'} onClick={() => { setActiveTab('bulk'); setIsSidebarOpen(false); }} label="Bulk Upload" />
            <SubItem active={activeTab === 'holidays'} onClick={() => { setActiveTab('holidays'); setIsSidebarOpen(false); }} label="Holiday Settings" />
            <SubItem active={activeTab === 'idCardViewer'} onClick={() => { setActiveTab('idCardViewer'); setIsSidebarOpen(false); }} label="ID Cards" />
          </SidebarItem>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-surface border-b border-outline-variant flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <button 
            className="lg:hidden text-on-surface-variant p-2 rounded-lg hover:bg-surface-variant"
            onClick={() => setIsSidebarOpen(true)}
          >
            <FiMenu className="text-2xl" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-body-sm font-semibold text-neutral">{adminUser?.name || 'Admin User'}</p>
                <p className="text-label-sm text-on-surface-variant">{adminUser?.email || ''}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold shadow-inner uppercase">
                {getInitials(adminUser?.name)}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
\`;

  content = content.substring(0, startIndex) + newLayout + content.substring(endIndex + mainStr.length);
  content = content.replace("    </div>\\n  );\\n}\\n\\nexport default AdminPage;", "    </div>\\n      </main>\\n    </div>\\n  );\\n}\\n\\nexport default AdminPage;");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('AdminPage.jsx patched successfully');
} else {
  console.log('Could not find the target strings');
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
}
