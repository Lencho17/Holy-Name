import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBriefcase, FiBox, FiLayers, FiStar, FiCreditCard, 
  FiDollarSign, FiUsers, FiSettings, FiMonitor, FiChevronDown, FiMenu, FiGlobe
} from 'react-icons/fi';

const SidebarItem = ({ to, icon: Icon, label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = location.pathname === to || (children && location.pathname.startsWith(to));

  if (children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive || isOpen
              ? 'bg-primary/5 text-primary font-medium'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`text-lg ${isActive || isOpen ? 'text-primary' : 'text-on-surface-variant'}`} />
            <span className="text-body-sm">{label}</span>
          </div>
          <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <div className="pl-11 pr-2 py-2 space-y-1 border-l-2 border-outline-variant ml-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={to === '/superadmin'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-primary text-white shadow-md shadow-primary/20 font-medium'
            : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
        }`
      }
    >
      <Icon className="text-lg" />
      <span className="text-body-sm">{label}</span>
    </NavLink>
  );
};

const SubItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block py-2 px-3 text-body-sm rounded-lg transition-colors ${
        isActive
          ? 'text-primary font-semibold bg-primary/5'
          : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/50'
      }`
    }
  >
    {label}
  </NavLink>
);

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState(() => {
    try {
      const data = localStorage.getItem('adminData');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  });

  const getInitials = (name) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-secondary/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-surface border-r border-outline-variant flex flex-col z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 flex items-center justify-center border-b border-outline-variant">
          <img src="/logo.png" alt="VidyaBarta" className="h-auto w-32 md:w-36 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <span style={{display: 'none'}} className="text-headline-sm font-bold font-headline text-neutral tracking-tight">VidyaBarta</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <SidebarItem to="/superadmin" icon={FiHome} label="Dashboard" />
          <SidebarItem to="/superadmin/schools" icon={FiBriefcase} label="Schools" />
          <SidebarItem to="/superadmin/packages" icon={FiBox} label="Package" />
          <SidebarItem to="/superadmin/addons" icon={FiLayers} label="Addons" />
          <SidebarItem to="/superadmin/features" icon={FiStar} label="Features" />
          <SidebarItem to="/superadmin/subscription" icon={FiCreditCard} label="Subscription" />
          <SidebarItem to="/superadmin/revenue" icon={FiDollarSign} label="Revenue & Settlements" />
          <SidebarItem to="/superadmin/domain-requests" icon={FiGlobe} label="Domain Requests" />
          
          <SidebarItem to="/superadmin/staff-management" icon={FiUsers} label="Staff Management">
            <SubItem to="/superadmin/staff-management/roles" label="Role & Permission" />
            <SubItem to="/superadmin/staff-management/staff" label="Staff" />
          </SidebarItem>

          <SidebarItem to="/superadmin/web-settings" icon={FiMonitor} label="Web Settings">
            <SubItem to="/superadmin/web-settings/general" label="General Settings" />
            <SubItem to="/superadmin/web-settings/features" label="Feature Sections" />
            <SubItem to="/superadmin/web-settings/faqs" label="Faqs" />
          </SidebarItem>

          <SidebarItem to="/superadmin/system-settings" icon={FiSettings} label="System Settings">
            <SubItem to="/superadmin/system-settings/app" label="App Settings" />
            <SubItem to="/superadmin/system-settings/general" label="General Settings" />
            <SubItem to="/superadmin/system-settings/subscription" label="Subscription Settings" />
            <SubItem to="/superadmin/system-settings/guidance" label="Guidance" />
            <SubItem to="/superadmin/system-settings/language" label="Language Settings" />
            <SubItem to="/superadmin/system-settings/notification" label="Notification Settings" />
            <SubItem to="/superadmin/system-settings/email-config" label="Email Configuration" />
            <SubItem to="/superadmin/system-settings/email-template" label="Email Template" />
            <SubItem to="/superadmin/system-settings/payment" label="Payment Settings" />
            <SubItem to="/superadmin/system-settings/privacy" label="Privacy - Policy" />
            <SubItem to="/superadmin/system-settings/contact" label="Contact Us" />
            <SubItem to="/superadmin/system-settings/about" label="About Us" />
            <SubItem to="/superadmin/system-settings/terms" label="Terms & Conditions" />
            <SubItem to="/superadmin/system-settings/refund" label="Refund Cancellation" />
            <SubItem to="/superadmin/system-settings/school-terms" label="School Terms & Condition" />
          </SidebarItem>

          <SidebarItem to="/superadmin/system-update" icon={FiSettings} label="System Update" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-surface border-b border-outline-variant flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <button 
            className="lg:hidden text-on-surface-variant p-2 rounded-lg hover:bg-surface-variant"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="text-2xl" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-body-sm font-semibold text-neutral">{adminData?.name || 'System Admin'}</p>
                <p className="text-label-sm text-on-surface-variant">{adminData?.email || 'admin@vidyabarta.com'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold shadow-inner">
                {getInitials(adminData?.name)}
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminData');
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shadow-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
