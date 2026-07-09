const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Components', 'AdminPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 1. Add FaAngleDown to imports
const importLineIndex = lines.findIndex(l => l.includes('import { FaUsers') && l.includes('react-icons/fa'));
if (importLineIndex !== -1 && !lines[importLineIndex].includes('FaAngleDown')) {
  lines[importLineIndex] = lines[importLineIndex].replace("FaTrophy } from 'react-icons/fa';", "FaTrophy, FaAngleDown } from 'react-icons/fa';");
}

// 2. Add state
const stateLineIndex = lines.findIndex(l => l.includes('const [isSidebarOpen, setIsSidebarOpen] = useState(false);'));
if (stateLineIndex !== -1) {
  lines[stateLineIndex] = `  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'content', 'data', 'system', etc.

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);`;
}

// 3. Replace layout return
const returnStartIndex = lines.findIndex(l => l.trim() === 'return (' && lines[lines.indexOf(l) + 1].includes('min-h-screen flex font-sans'));
const mainStartIndex = lines.findIndex((l, i) => i > returnStartIndex && l.includes('<main className="flex-1'));

if (returnStartIndex !== -1 && mainStartIndex !== -1) {
  const newLayout = `  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden" style={{ backgroundColor: '#F1F5F9' }}>
      {/* Top Navbar */}
      <nav className="bg-[#0F172A] text-white shadow-xl z-50 sticky top-0 w-full" style={{ background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="flex items-center justify-between px-4 lg:px-8 py-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center border border-slate-600/30">
              <FaGraduationCap className="text-blue-300 text-lg" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 leading-tight tracking-wide">
                {schoolProfile?.name || "School"}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Admin Console</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 flex-1 ml-10">
            <button 
              onClick={() => { setActiveTab('dashboard'); setOpenDropdown(null); }}
              className={\`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 \${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-white/10 hover:text-white'}\`}
            >
              <FaChartLine /> Dashboard
            </button>

            {/* Content Management Dropdown */}
            <div className="relative nav-dropdown-container">
              <button 
                onClick={() => setOpenDropdown(openDropdown === 'content' ? null : 'content')}
                className={\`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 \${['schoolProfile', 'gallery', 'videos', 'banner', 'highlights', 'events', 'notices', 'faculty', 'principal', 'alumni', 'excellence', 'emeritus', 'careerAds', 'socialMedia', 'stats', 'about', 'courses', 'faqs'].includes(activeTab) ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}\`}
              >
                <FaImage /> Content <FaAngleDown className={\`transition-transform \${openDropdown === 'content' ? 'rotate-180' : ''}\`} />
              </button>
              {openDropdown === 'content' && (
                <div className="absolute top-full left-0 mt-2 w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 grid grid-cols-2 gap-2 text-gray-800 animate-in fade-in slide-in-from-top-2">
                  {[
                    { id: 'schoolProfile', label: 'School Profile', icon: <FaInfoCircle className="text-blue-500"/> },
                    { id: 'gallery', label: 'Gallery', icon: <FaImage className="text-purple-500"/> },
                    { id: 'videos', label: 'Video Blog', icon: <FaVideo className="text-red-500"/> },
                    { id: 'banner', label: 'Popup Banner', icon: <FaImage className="text-amber-500"/> },
                    { id: 'highlights', label: 'Highlights', icon: <FaStar className="text-yellow-500"/> },
                    { id: 'events', label: 'Events', icon: <FaCalendarAlt className="text-emerald-500"/> },
                    { id: 'notices', label: 'Notices', icon: <FaClipboardList className="text-orange-500"/> },
                    { id: 'faculty', label: 'Faculty', icon: <FaChalkboardTeacher className="text-indigo-500"/> },
                    { id: 'principal', label: 'Principal Desk', icon: <FaClipboardList className="text-slate-500"/> },
                    { id: 'alumni', label: 'Alumni', icon: <FaGraduationCap className="text-blue-400"/> },
                    { id: 'excellence', label: 'Excellence', icon: <FaAward className="text-amber-600"/> },
                    { id: 'emeritus', label: 'Alumestron', icon: <FaUserTie className="text-purple-600"/> },
                    { id: 'careerAds', label: 'Career Ads', icon: <FaBriefcase className="text-cyan-600"/> },
                    { id: 'socialMedia', label: 'Social Media', icon: <FaShareAlt className="text-blue-600"/> },
                    { id: 'stats', label: 'Home Stats', icon: <FaChartLine className="text-green-600"/> },
                    { id: 'about', label: 'About Page', icon: <FaInfoCircle className="text-indigo-400"/> },
                    { id: 'courses', label: 'Courses Page', icon: <FaBookOpen className="text-orange-400"/> },
                    { id: 'faqs', label: 'FAQs', icon: <FaQuestionCircle className="text-red-400"/> }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setOpenDropdown(null); }}
                      className={\`flex items-center gap-3 p-2 rounded-xl text-sm transition-colors text-left \${activeTab === item.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'}\`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                         {item.icon}
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* School Data Dropdown */}
            <div className="relative nav-dropdown-container">
              <button 
                onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
                className={\`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 \${['applications', 'students', 'inquiries', 'jobApplications', 'tenders'].includes(activeTab) ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}\`}
              >
                <FaUsers /> Data 
                {(inquiries.filter(i => !i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST') && !i.isRead).length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
                )}
                <FaAngleDown className={\`transition-transform \${openDropdown === 'data' ? 'rotate-180' : ''}\`} />
              </button>
              {openDropdown === 'data' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 text-gray-800 animate-in fade-in slide-in-from-top-2">
                  {[
                    { id: 'applications', label: 'Applications', icon: <FaClipboardList className="text-blue-500"/> },
                    { id: 'students', label: 'Students', icon: <FaUsers className="text-green-500"/> },
                    { id: 'inquiries', label: 'Inquiries', icon: <FaCommentDots className="text-purple-500"/>, badge: inquiries.filter(i => !i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST') && !i.isRead).length },
                    { id: 'jobApplications', label: 'Recruitment', icon: <FaBriefcase className="text-amber-500"/> },
                    { id: 'tenders', label: 'Tenders', icon: <FaGavel className="text-slate-500"/> }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setOpenDropdown(null); }}
                      className={\`flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-colors text-left \${activeTab === item.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'}\`}
                    >
                      {item.icon} {item.label}
                      {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* System Control Dropdown */}
            {(adminUser?.role === 'superadmin' || adminUser?.role === 'developer') && (
              <div className="relative nav-dropdown-container">
                <button 
                  onClick={() => setOpenDropdown(openDropdown === 'system' ? null : 'system')}
                  className={\`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 \${['adminRequests', 'admins', 'settings'].includes(activeTab) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}\`}
                >
                  <FaCog /> System
                  {(inquiries.filter(i => i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST') && !i.isRead).length > 0) && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
                  )}
                  <FaAngleDown className={\`transition-transform \${openDropdown === 'system' ? 'rotate-180' : ''}\`} />
                </button>
                {openDropdown === 'system' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 text-gray-800 animate-in fade-in slide-in-from-top-2">
                    {[
                      { id: 'adminRequests', label: 'Admin Requests', icon: <FaIdCard className="text-amber-500"/>, badge: inquiries.filter(i => i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST') && !i.isRead).length },
                      { id: 'admins', label: 'Manage Admins', icon: <FaUsers className="text-blue-500"/> },
                      { id: 'settings', label: 'Settings', icon: <FaCog className="text-slate-500"/> }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setOpenDropdown(null); }}
                        className={\`flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-colors text-left \${activeTab === item.id ? 'bg-amber-50 text-amber-700 font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'}\`}
                      >
                        {item.icon} {item.label}
                        {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
               <div className={\`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border \${sessionRemaining <= 120 ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse' : 'bg-white/5 text-slate-300 border-white/10'}\`}>
                 <FaClock /> <span>{formatTimer(sessionRemaining)}</span>
               </div>
            </div>

            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-semibold text-white leading-tight">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">
                {adminUser?.role === 'developer' ? 'System Developer' : 
                 adminUser?.role === 'superadmin' ? 'Super Administrator' : 
                 'Administrator'}
              </p>
            </div>

            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer border border-blue-400/50">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                 <NavLink to="/" className="flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-colors text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium">
                   <FaLaptop /> View Website
                 </NavLink>
                 <div className="h-px bg-gray-100 my-1 w-full" />
                 <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-colors text-red-600 hover:bg-red-50 font-bold">
                   <FaSignOutAlt /> Logout
                 </button>
              </div>
            </div>

            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2.5 hover:bg-white/10 rounded-xl text-white transition-colors"
            >
              {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isSidebarOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-[#1E293B] border-t border-slate-700 shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-2">
            <div className="p-4 space-y-4">
              <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={\`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 \${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'}\`}>
                <FaChartLine /> Dashboard
              </button>
              
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-4 mb-2">Content</p>
                {['schoolProfile', 'gallery', 'videos', 'banner', 'highlights', 'events', 'notices', 'faculty', 'principal', 'alumni', 'excellence', 'emeritus', 'careerAds', 'socialMedia', 'stats', 'about', 'courses', 'faqs'].map(id => (
                  <button key={id} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }} className={\`w-full text-left px-4 py-2 rounded-xl text-sm flex items-center gap-3 \${activeTab === id ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:bg-white/5'}\`}>
                    {id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-4 mb-2 mt-4">Data</p>
                {['applications', 'students', 'inquiries', 'jobApplications', 'tenders'].map(id => (
                  <button key={id} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }} className={\`w-full text-left px-4 py-2 rounded-xl text-sm flex items-center gap-3 \${activeTab === id ? 'bg-blue-600/20 text-blue-300' : 'text-slate-400 hover:bg-white/5'}\`}>
                    {id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto">
`;

  lines.splice(returnStartIndex, mainStartIndex - returnStartIndex);
  lines.splice(returnStartIndex, 0, newLayout);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Layout replaced successfully!');
