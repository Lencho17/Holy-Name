import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteDataContext } from '../context/SiteDataContext';
import { FaUser, FaSignOutAlt, FaCalendarAlt, FaMoneyCheckAlt, FaClock, FaBookOpen } from 'react-icons/fa';
import StaffProfile from './StaffProfile';
import StaffHolidays from './StaffHolidays';
import StaffPayroll from './StaffPayroll';
import StaffTimetable from './StaffTimetable';
import StaffAttendance from './StaffAttendance';
import StaffLeave from './StaffLeave';
import StaffServiceRequest from './StaffServiceRequest';
import StaffAcademics from './StaffAcademics';
import StaffAnnouncements from './StaffAnnouncements';
import { FaBullhorn } from 'react-icons/fa';

function StaffPage() {
  const { schoolProfile } = useContext(SiteDataContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const data = localStorage.getItem('staffData');
    
    if (!token || !data) {
      navigate('/adminLogin'); // Redirect to login
      return;
    }
    
    try {
      setStaffData(JSON.parse(data));
    } catch (e) {
      navigate('/adminLogin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    navigate('/adminLogin');
  };

  if (!staffData) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          {schoolProfile?.logo && <img src={schoolProfile.logo} alt="Logo" className="h-8 w-auto" />}
          <div>
            <h1 className="font-black text-sm text-gray-800 uppercase tracking-widest">{schoolProfile?.name || 'School System'}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Staff Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaUser /> My Profile
          </button>
          <button
            onClick={() => setActiveTab('academics')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'academics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaBookOpen /> Academics & Comms
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'attendance' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaClock /> Attendance
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'leave' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaCalendarAlt /> Leave & CL
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'service' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaUser /> Service Requests
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'payroll' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaMoneyCheckAlt /> Payroll
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'timetable' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaBookOpen /> Timetables & Duties
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'holidays' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaCalendarAlt /> Holidays
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'announcements' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FaBullhorn /> Announcements
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight capitalize">
            {activeTab.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{staffData.name}</p>
              <p className="text-xs text-gray-500 capitalize">{staffData.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
              {staffData.name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'profile' && <StaffProfile />}
          {activeTab === 'holidays' && <StaffHolidays />}
          {activeTab === 'payroll' && <StaffPayroll staffData={staffData} />}
          {activeTab === 'timetable' && <StaffTimetable />}
          {activeTab === 'attendance' && <StaffAttendance />}
          {activeTab === 'leave' && <StaffLeave staffData={staffData} />}
          {activeTab === 'service' && <StaffServiceRequest />}
          {activeTab === 'academics' && <StaffAcademics />}
          {activeTab === 'announcements' && <StaffAnnouncements />}

          {(!['profile', 'holidays', 'payroll', 'timetable', 'attendance', 'leave', 'service', 'academics', 'announcements'].includes(activeTab)) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-medium">This feature is under development.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StaffPage;
