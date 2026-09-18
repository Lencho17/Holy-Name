import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { StudentAuthContext } from '../context/StudentAuthContext';
import StudentTimetable from './StudentTimetable';
import StudentCourses from './StudentCourses';
import StudentDues from './StudentDues';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import ReadmissionVerification from './ReadmissionVerification';
import StudentProfile from './StudentProfile';
import AdmitCardPreviewModal from './AdmitCardPreviewModal';
import { generateSingleAdmitCardPDF } from '../utils/admitCardPdfGenerator';

function StudentPortal() {
  const { API_URL, schoolProfile } = useContext(SiteDataContext);
  const { student, token, logout, loading: authLoading } = useContext(StudentAuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [myAdmitCards, setMyAdmitCards] = useState([]);
  const [previewCardData, setPreviewCardData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUdiseBanner, setShowUdiseBanner] = useState(true);
  const [udiseProfile, setUdiseProfile] = useState(null);
  const navigate = useNavigate();
  
  const hasPendingFees = !student?.admissionFeePaid || fees.some(f => f.status === 'Pending' || f.status === 'Overdue');

  // Results & Grievance State
  const [publishedResults, setPublishedResults] = useState([]);
  const [myGrievances, setMyGrievances] = useState([]);
  const [showGrievanceForm, setShowGrievanceForm] = useState(false);
  const [grievanceForm, setGrievanceForm] = useState({ exam_id: '', subject: '', complaint: '' });
  const [expandedMenu, setExpandedMenu] = useState('timetable_group');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(true);

  // In-Site Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [selectedNotifModal, setSelectedNotifModal] = useState(null);
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/student-portal/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
      setUnreadNotifCount(res.data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await axios.put(`${API_URL}/student-portal/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await axios.put(`${API_URL}/student-portal/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNotification = (notif) => {
    setSelectedNotifModal(notif);
    setIsNotifDropdownOpen(false);
    if (!notif.is_read) {
      handleMarkNotificationRead(notif.id);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchPortalData = async () => {
      try {
        const [gradesRes, noticesRes, coursesRes, assignmentsRes, feesRes, transactionsRes, upcomingExamsRes, udiseRes, admitCardsRes, notifRes] = await Promise.all([
          axios.get(`${API_URL}/student-portal/grades?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/notices?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/courses?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/assignments?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/fees?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/transactions?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/upcoming-exams?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/student-portal/udise?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
          axios.get(`${API_URL}/admit-cards/student/my-cards?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_URL}/student-portal/notifications?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { notifications: [], unreadCount: 0 } }))
        ]);

        setNotifications(notifRes?.data?.notifications || []);
        setUnreadNotifCount(notifRes?.data?.unreadCount || 0);
        
        const gradesData = Array.isArray(gradesRes.data) ? gradesRes.data : [];
        const uniqueExamIds = [...new Set(gradesData.map(g => g.exam_id))];
        const timetables = {};
        await Promise.all(uniqueExamIds.map(async (eid) => {
          try {
            const ttRes = await axios.get(`${API_URL}/exams/${eid}/timetable?_t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
            timetables[eid] = ttRes.data;
          } catch(e) {}
        }));

        const enrichedGrades = gradesData.map(g => {
          const tt = (timetables[g.exam_id] || []).find(t => t.subject === g.subject);
          let passed = false;
          let totalObtained = parseInt(g.marks_obtained) || 0;
          
          if (tt) {
             if (tt.has_practical) {
               totalObtained += parseInt(g.practical_marks_obtained) || 0;
               const thPass = tt.theory_passing_marks || 0;
               const prPass = tt.practical_passing_marks || 0;
               passed = (parseInt(g.marks_obtained) || 0) >= thPass && (parseInt(g.practical_marks_obtained) || 0) >= prPass;
             } else {
               const passMark = tt.passing_marks || 30;
               passed = totalObtained >= passMark;
             }
          } else {
             // Fallback
             passed = totalObtained >= 30;
          }
          
          return { ...g, timetable: tt, passed, totalObtained };
        });
        
        setGrades(enrichedGrades);
        setNotices(Array.isArray(noticesRes.data) ? noticesRes.data : []);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
        setFees(Array.isArray(feesRes.data) ? feesRes.data : []);
        setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
        setUpcomingExams(Array.isArray(upcomingExamsRes.data) ? upcomingExamsRes.data : []);
        setMyAdmitCards(admitCardsRes?.data?.data || []);
        setUdiseProfile(udiseRes.data);
        if (udiseRes.data) {
          setShowUdiseBanner(false);
        }

        // Fetch Grievances (if route exists)
        try {
          const gRes = await axios.get(`${API_URL}/grievances/my-grievances`, { headers: { Authorization: `Bearer ${token}` } });
          if(gRes.data && Array.isArray(gRes.data)) setMyGrievances(gRes.data);
        } catch(e) {}

        // Group enrichedGrades into publishedResults
        const resultsMap = {};
        enrichedGrades.forEach(g => {
          if (!resultsMap[g.exam_id]) {
             resultsMap[g.exam_id] = {
               id: g.exam_id,
               name: g.exams?.name || 'Unknown Exam',
               published_date: g.exams?.published_date || g.created_at,
               marks: []
             };
          }
          resultsMap[g.exam_id].marks.push({
             subject: g.subject,
             obtained: g.totalObtained,
             max: g.timetable ? g.timetable.max_marks : (g.max_marks || 100)
          });
        });
        
        setPublishedResults(Object.values(resultsMap).sort((a,b) => new Date(b.published_date) - new Date(a.published_date)));

      } catch (error) {
        console.error("Failed to load portal data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [token, API_URL]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!token || !student) {
    return <Navigate to="/login" replace />;
  }

  // Enforce Inactive Status
  if (student.status === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100 text-center p-8">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Inactive</h1>
          <p className="text-gray-500 mb-6">Your readmission deadline has passed, and your account has been marked as inactive. Please contact your school administrator to resolve this.</p>
          <button onClick={() => { logout(); navigate('/login'); }} className="bg-gray-900 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Enforce Readmission Verification Form
  if (!student.admissionFeePaid && student.readmissionDeadline && !student.readmissionVerified) {
    return <ReadmissionVerification />;
  }

  // After verification, force payment
  const mustPayReadmission = !student.admissionFeePaid && student.readmissionDeadline && student.readmissionVerified;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBorderColorForNotice = (idx) => {
    const colors = ['border-indigo-500', 'border-purple-500', 'border-pink-500', 'border-blue-500'];
    return colors[idx % colors.length];
  };

  const calculateGPA = (gradesArray) => {
    if (!gradesArray || gradesArray.length === 0) return (0).toFixed(2);
    let totalPoints = 0;
    gradesArray.forEach(g => {
      const p = g.total_marks > 0 ? (g.marks_obtained / g.total_marks) * 100 : 0;
      if (p >= 90) totalPoints += 4.0;
      else if (p >= 80) totalPoints += 3.0;
      else if (p >= 70) totalPoints += 2.0;
      else if (p >= 60) totalPoints += 1.0;
    });
    return (totalPoints / gradesArray.length).toFixed(2);
  };

  // Professional UI Classes
  const glassCard = "bg-white border border-gray-200 shadow-sm rounded-xl";
  const glassButton = "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all text-gray-700";

  return (
    <div className="bg-gray-50 text-gray-800 overflow-x-hidden min-h-screen flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Side Navigation Shell */}
      <aside className={`flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-[60] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
              {schoolProfile?.logo ? (
                <img src={schoolProfile.logo} alt="School Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="material-symbols-outlined text-[24px]">school</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" title={schoolProfile?.name || 'Student Portal'}>
                {schoolProfile?.name || 'Student Portal'}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-0.5 truncate">Academic Session</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', disabled: mustPayReadmission },
              { id: 'profile', icon: 'person', label: 'My Profile', disabled: mustPayReadmission },
              { id: 'courses', icon: 'menu_book', label: 'Courses', disabled: mustPayReadmission },
              { id: 'fees', icon: 'payments', label: 'Fees' },
              { id: 'notices', icon: 'campaign', label: 'Announcements', badge: unreadNotifCount, disabled: mustPayReadmission },
              { id: 'timetable_group', icon: 'calendar_month', label: 'Timetable', disabled: mustPayReadmission, subItems: [
                { id: 'timetable', label: 'Class Timetable' },
                { id: 'exam_timetable', label: 'Exam Time Table' }
              ]},
              { id: 'exams', icon: 'quiz', label: 'Results', disabled: mustPayReadmission }
            ].map(item => (
              <div key={item.id}>
                <a 
                  onClick={() => { 
                    if(item.disabled) return;
                    if(!item.subItems) { 
                      setActiveTab(item.id); 
                      setIsSidebarOpen(false); 
                    } else {
                      setExpandedMenu(prev => prev === item.id ? '' : item.id);
                    }
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all cursor-pointer font-medium text-sm
                    ${item.disabled ? 'text-gray-400 cursor-not-allowed opacity-60' : 
                    ((!item.subItems && activeTab === item.id) || (item.subItems && item.subItems.some(s => s.id === activeTab))
                      ? 'bg-blue-50 text-blue-700 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <span className={`material-symbols-outlined text-[18px] transition-transform ${expandedMenu === item.id ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    )}
                  </div>
                </a>
                {item.subItems && expandedMenu === item.id && (
                  <div className="ml-9 mt-1 flex flex-col gap-1">
                    {item.subItems.map(sub => (
                      <a 
                        key={sub.id}
                        onClick={() => { setActiveTab(sub.id); setIsSidebarOpen(false); }}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                          ${activeTab === sub.id 
                            ? 'text-blue-700 font-semibold bg-blue-50/50' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                      >
                        {sub.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <a 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer mt-6 rounded-xl font-medium text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Logout</span>
            </a>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
              <p className="text-xs text-gray-500 truncate">ID: {student.rollNumber}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative z-10 w-full">
        {/* Top Navigation Shell */}
        <header className="flex justify-between items-center w-full px-4 md:px-8 h-20 sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center flex-1 max-w-xl gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 focus:outline-none flex items-center justify-center rounded-lg hover:bg-white/50"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-sm" 
                placeholder="Search resources, assignments..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-gray-800 mr-4 hidden md:block bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200 shadow-sm text-sm">
              {schoolProfile?.name || 'VidyaBarta Platform'}
            </h2>
            
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={`${glassButton} relative rounded-full p-2.5 flex items-center justify-center text-gray-600 hover:text-indigo-600 focus:outline-none transition-colors`}
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-sm">Notifications</span>
                        {unreadNotifCount > 0 && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10 px-4 text-gray-400">
                          <span className="material-symbols-outlined text-4xl mb-1 opacity-40">notifications_off</span>
                          <p className="text-xs font-medium">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleOpenNotification(n)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                              !n.is_read ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                              n.priority === 'Urgent' 
                                ? 'bg-red-100 text-red-600' 
                                : n.category === 'Fee Reminder'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              <span className="material-symbols-outlined text-[16px]">
                                {n.priority === 'Urgent' ? 'warning' : n.category === 'Fee Reminder' ? 'payments' : 'info'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <p className={`text-xs truncate ${!n.is_read ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                                  {n.title}
                                </p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          setIsNotifDropdownOpen(false);
                          setActiveTab('notices');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View All Announcements &rarr;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className={`${glassButton} rounded-full p-2.5 flex items-center justify-center text-gray-600 hover:text-indigo-600`}>
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        </header>

        {/* Admission / Readmission Fee Pending Popup/Banner */}
        {student && !student.admissionFeePaid && student.admissionId && showEnrollmentModal && (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setShowEnrollmentModal(false); }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-bounce-in relative">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowEnrollmentModal(false)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all z-20 text-sm font-black"
                title="Close and browse portal"
              >
                ✕
              </button>

              {/* Banner header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center relative">
                <div className="text-5xl mb-3">🎓</div>
                <h2 className="text-2xl font-black">
                  {student.readmissionDeadline ? "Readmission Due" : "Complete Your Enrollment"}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {student.readmissionDeadline 
                    ? `Please complete your readmission before ${student.readmissionDeadline}`
                    : "One last step to finalize your admission"}
                </p>
              </div>

              <div className="p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 text-sm font-medium">
                    <strong>Hi {student.name}!</strong>{" "}
                    {student.readmissionDeadline
                      ? "You have been promoted to the next class! Please complete your readmission fee payment and Quarter 1 fees to activate your account for the new academic year."
                      : "Your admission has been approved. Please complete the admission fee payment and kit selection to activate your full student account."}
                  </p>
                </div>

                <div className="space-y-3 mb-6 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>Application submitted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>Interview passed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">!</span>
                    <span className="font-bold text-amber-700">Admission fee payment pending</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => navigate(`/admission/checkout/${student.admissionId}`)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
                  >
                    <span>Continue to Payment</span>
                    <span>&rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEnrollmentModal(false)}
                    className="w-full text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 py-3 rounded-xl transition-all border border-gray-200 text-center"
                  >
                    Remind Me Later / Browse Portal &rarr;
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">You can browse your timetable, announcements, and results anytime</p>
              </div>
            </div>
          </div>
        )}

        <main className="p-8 max-w-[1440px] w-full mx-auto flex-1">
          {/* Non-blocking reminder banner when modal is dismissed */}
          {!showEnrollmentModal && student && !student.admissionFeePaid && student.admissionId && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3.5 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fade-in">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
                <span className="text-xl">🎓</span>
                <span>Admission fee payment is pending. Complete your kit selection and enrollment.</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => navigate(`/admission/checkout/${student.admissionId}`)}
                  className="bg-white text-orange-600 hover:bg-orange-50 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  Complete Payment &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => setShowEnrollmentModal(true)}
                  className="text-white/80 hover:text-white text-xs font-bold underline px-2 py-1"
                >
                  View Details
                </button>
              </div>
            </div>
          )}
          {mustPayReadmission && activeTab !== 'fees' ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-6 flex items-start gap-3">
              <span className="material-symbols-outlined mt-1 flex-shrink-0">warning</span>
              <div>
                <h3 className="font-bold">Payment Required</h3>
                <p className="text-sm">You have verified your readmission details. Please navigate to the <b>Fees</b> tab to pay your readmission fees and fully unlock your portal.</p>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : activeTab === 'profile' ? (
            <StudentProfile udiseData={udiseProfile} />
          ) : activeTab === 'courses' ? (
            <StudentCourses />
          ) : activeTab === 'timetable' ? (
            <div className="animate-fade-in">
              <StudentTimetable />
            </div>
          ) : activeTab === 'exam_timetable' ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Exam Time Table</h2>
              <div className={`${glassCard} overflow-hidden flex flex-col`}>
                <div className="p-6 border-b border-gray-100 bg-white/40 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Schedule</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{upcomingExams.length} Exams Remaining</span>
                    <button 
                      disabled={upcomingExams.length === 0}
                      onClick={() => {
                        if (!upcomingExams || upcomingExams.length === 0) {
                          alert("No upcoming exams scheduled to download.");
                          return;
                        }
                        const doc = new jsPDF();
                        doc.setFontSize(18);
                        doc.text(`My Exam Timetable - Class ${student.grade || student.class_id}`, 14, 22);
                        
                        const tableColumn = ["Date", "Exam Name", "Subject", "Time"];
                        const tableRows = upcomingExams.map(exam => [
                          new Date(exam.exam_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                          exam.exam_name,
                          `${exam.subject} ${exam.sub_subject ? `(${exam.sub_subject})` : ''}`,
                          `${exam.start_time ? exam.start_time.substring(0,5) : '--:--'} - ${exam.end_time ? exam.end_time.substring(0,5) : '--:--'}`
                        ]);
                        
                        autoTable(doc, {
                          head: [tableColumn],
                          body: tableRows,
                          startY: 40,
                        });
                        
                        doc.save(`My_Timetable.pdf`);
                      }} 
                      className={`text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                        upcomingExams.length === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Download PDF
                    </button>
                  </div>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Name</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {upcomingExams.map(exam => (
                        <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="p-4">
                              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                {new Date(exam.exam_date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                              </span>
                          </td>
                          <td className="p-4 font-bold text-gray-900 text-sm">{exam.exam_name}</td>
                          <td className="p-4 font-bold text-gray-900 text-sm">
                            {exam.subject}
                            {exam.sub_subject && <span className="ml-1 text-xs text-gray-500 font-medium">({exam.sub_subject})</span>}
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-600">
                            {exam.start_time ? exam.start_time.substring(0, 5) : '--:--'} - {exam.end_time ? exam.end_time.substring(0, 5) : '--:--'}
                          </td>
                        </tr>
                      ))}
                      {upcomingExams.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-gray-500 font-medium bg-gray-50/50">
                            No upcoming exams scheduled at the moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* UDISE Form Banner */}
              {showUdiseBanner && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
                      <span className="material-symbols-outlined text-2xl">assignment_late</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-800">Action Required: UDISE Student Form</h3>
                      <p className="text-sm text-yellow-700 mt-1 font-medium">You must complete your mandatory UDISE profile data for this academic year.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button onClick={() => setShowUdiseBanner(false)} className="px-5 py-2.5 bg-transparent border border-yellow-300 hover:bg-yellow-100 text-yellow-800 font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 flex-1 md:flex-auto">
                      Fill Later
                    </button>
                    <button onClick={() => navigate('/student-udise-form')} className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl shadow-md transition-all whitespace-nowrap active:scale-95 flex-1 md:flex-auto">
                      Complete Now
                    </button>
                  </div>
                </div>
              )}

              {/* Welcome Banner Section */}
              <section className="mb-8 relative rounded-xl overflow-hidden bg-blue-900 shadow-sm border border-blue-800">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center w-full px-8 py-10">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {student.name.split(' ')[0]}!</h2>
                    <p className="text-blue-100 text-lg">You are enrolled in Grade <span className="font-semibold text-white">{student.grade}</span>.</p>
                  </div>
                  <div className="hidden md:block mt-6 md:mt-0">
                    <button onClick={() => setActiveTab('exams')} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-sm flex items-center gap-2">
                      <span className="material-symbols-outlined">monitoring</span>
                      View Academic Results
                    </button>
                  </div>
                </div>
              </section>

              {/* Bento Dashboard Grid */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Recent Announcements (Lifetime Archive) */}
                <div className={`col-span-12 md:col-span-4 ${glassCard} p-6 flex flex-col`}>
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-800 text-lg">Announcements</h3>
                      {unreadNotifCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                          {unreadNotifCount} New
                        </span>
                      )}
                    </div>
                    <button onClick={() => setActiveTab('notices')} className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
                      View All &rarr;
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 3).map((n) => {
                        const isUrgent = n.priority === 'Urgent';
                        return (
                          <div 
                            key={n.id} 
                            onClick={() => handleOpenNotification(n)}
                            className="p-3.5 bg-gray-50/90 hover:bg-blue-50/50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden group"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              isUrgent ? 'bg-red-500' : n.category === 'Fee Reminder' ? 'bg-amber-500' : 'bg-blue-600'
                            }`} />
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                {n.category || 'Announcement'}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-400">
                                {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 font-bold leading-tight group-hover:text-blue-700 transition-colors line-clamp-1">
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                New
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : notices.length > 0 ? (
                      notices.slice(0, 3).map((notice, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow relative overflow-hidden group">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${getBorderColorForNotice(idx).replace('border-', 'bg-')}`}></div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            {new Date(notice.date || notice.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')}
                          </p>
                          <p className="text-sm text-gray-800 font-bold leading-tight group-hover:text-indigo-700 transition-colors">{notice.title}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">campaign</span>
                        <p className="text-sm">No announcements yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Results Table Section (Span 8) */}
                <div className={`col-span-12 md:col-span-8 ${glassCard} p-6 flex flex-col`}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Latest Academic Results</h3>
                      <p className="text-sm text-gray-500 mt-1">Recent performance across all subjects.</p>
                    </div>
                    <button onClick={() => setActiveTab('exams')} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span> Detailed
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                          <th className="pb-3 pl-2">Exam Name</th>
                          <th className="pb-3">Subject</th>
                          <th className="pb-3">Marks</th>
                          <th className="pb-3">Grade</th>
                          <th className="pb-3 text-right pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {grades.length > 0 ? grades.slice(0, 5).map((grade, idx) => (
                          <tr key={idx} className="hover:bg-white/60 transition-colors group">
                            <td className="py-4 pl-2">
                              <p className="text-sm font-bold text-gray-800">{grade.exams?.name || 'N/A'}</p>
                            </td>
                            <td className="py-4 text-sm text-gray-600 font-medium">{grade.subject?.replace(/^VB-?/, '')}</td>
                            <td className="py-4 text-sm text-gray-800 font-bold">{grade.marks_obtained} <span className="text-gray-400 font-normal">/ {grade.total_marks}</span></td>
                            <td className="py-4 text-sm font-bold text-indigo-600">{grade.grade || '-'}</td>
                            <td className="py-4 pr-2 text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                PUBLISHED
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-gray-400">
                              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">assignment</span>
                              <p className="text-sm">No recent grades found.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'notices' ? (
            <div className={`${glassCard} p-6 sm:p-8 min-h-[600px] space-y-6`}>
              {/* Header with Lifetime Archive Stats */}
              <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                      <span className="material-symbols-outlined text-2xl">campaign</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Announcements & Notices</h2>
                      <p className="text-sm text-gray-500">Official school broadcasts, academic notices, circulars, and fee alerts.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 sm:w-64">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                      <input 
                        type="text" 
                        value={announcementSearch}
                        onChange={(e) => setAnnouncementSearch(e.target.value)}
                        placeholder="Search announcements..." 
                        className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-semibold text-gray-800 rounded-xl border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                      {announcementSearch && (
                        <button 
                          onClick={() => setAnnouncementSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
                  {[
                    { id: 'all', label: `All (${notifications.length})` },
                    { id: 'unread', label: `Unread (${unreadNotifCount})` },
                    { id: 'fees', label: 'Fee Notices' },
                    { id: 'academic', label: 'Academic' },
                    { id: 'school', label: 'School Circulars' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setNoticeCategoryFilter(f.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        noticeCategoryFilter === f.id
                          ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Announcements & Notifications Section */}
              <div className="space-y-4">
                {/* 1. Student Targeted In-Site Announcements */}
                {notifications
                  .filter(n => {
                    if (noticeCategoryFilter === 'unread') return !n.is_read;
                    if (noticeCategoryFilter === 'fees') return n.category === 'Fee Reminder';
                    if (noticeCategoryFilter === 'academic') return n.category === 'Academic';
                    if (noticeCategoryFilter === 'school') return false; // Show only school notices
                    if (announcementSearch.trim()) {
                      const q = announcementSearch.toLowerCase().trim();
                      const titleMatch = n.title?.toLowerCase().includes(q);
                      const msgMatch = n.message?.toLowerCase().includes(q);
                      const catMatch = n.category?.toLowerCase().includes(q);
                      if (!titleMatch && !msgMatch && !catMatch) return false;
                    }
                    return true;
                  })
                  .map((n) => {
                    const isUrgent = n.priority === 'Urgent';
                    const isFee = n.category === 'Fee Reminder';
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpenNotification(n)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                          !n.is_read
                            ? 'bg-blue-50/40 border-blue-200 shadow-sm hover:border-blue-300'
                            : 'bg-white border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isUrgent ? 'bg-red-500' : isFee ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />

                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isUrgent 
                                ? 'bg-red-100 text-red-700' 
                                : isFee 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {n.category || 'Announcement'}
                            </span>
                            {isUrgent && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white flex items-center gap-1">
                                ⚠️ URGENT
                              </span>
                            )}
                            {!n.is_read && (
                              <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                New
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-500">
                            {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-1.5">
                          {n.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {n.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                          <span className="font-semibold text-gray-500">From: School Administration</span>
                          <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-1">
                            Read Full Message &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {/* 2. School Wide General Circulars (if filter allows) */}
                {noticeCategoryFilter !== 'unread' && noticeCategoryFilter !== 'fees' && notices.map((notice, idx) => (
                  <div key={`notice-${idx}`} className="p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-sm transition-all group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-400 opacity-60" />
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                          Official Circular
                        </span>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{notice.title}</h3>
                      </div>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                        {new Date(notice.date || notice.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')}
                      </span>
                    </div>
                    {notice.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{notice.description}</p>}
                    {notice.pdf_link && (
                      <a href={notice.pdf_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100">
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Download Document
                      </a>
                    )}
                  </div>
                ))}

                {notifications.length === 0 && notices.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-3 opacity-40">inbox</span>
                    <p className="font-bold text-gray-600">No Announcements Available</p>
                    <p className="text-xs text-gray-400 mt-1">You are all caught up with your school notifications.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'exams' ? (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Examination &amp; Results</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your upcoming schedules and view academic performance records.</p>
                </div>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">file_download</span>
                  Download Report Card
                </button>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Upcoming Exams Bento Section */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  {/* Next Exam Highlight Card */}
                  <div className="bg-blue-800 rounded-xl p-8 flex flex-col md:flex-row justify-between items-center text-white overflow-hidden relative shadow-sm">
                    <div className="absolute -right-8 -bottom-8 opacity-10">
                      <span className="material-symbols-outlined text-[160px]">event_upcoming</span>
                    </div>
                    <div className="relative z-10 text-center md:text-left">
                      <span className="bg-white/20 backdrop-blur border border-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Next Exam</span>
                      {upcomingExams.length > 0 ? (
                        <>
                          <h3 className="text-2xl font-bold mt-4">{upcomingExams[0].exam_name || 'Upcoming Assessment'}</h3>
                          <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-indigo-200">calendar_month</span>
                              <p className="text-sm font-medium">{new Date(upcomingExams[0].exam_date).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-indigo-200">schedule</span>
                              <p className="text-sm font-medium">Standard Time</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <h3 className="text-2xl font-bold mt-4 text-indigo-100">No upcoming exams scheduled</h3>
                      )}
                    </div>
                    {/* Admit Cards Actions & Multi-Exam Status */}
                    <div className="mt-6 md:mt-0 relative z-10 flex flex-col gap-2 max-w-sm w-full">
                      {myAdmitCards && myAdmitCards.length > 0 ? (
                        myAdmitCards.map((card) => {
                          const isReleased = card.status === 'released';
                          const isWithheld = card.status === 'withheld';
                          return (
                            <div key={card.examId} className="bg-white/15 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center justify-between gap-3 text-white">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">{card.examName}</div>
                                <div className="text-[11px] text-indigo-200 mt-0.5">
                                  {isReleased && <span className="text-emerald-300 font-bold">✓ Released</span>}
                                  {isWithheld && <span className="text-rose-300 font-bold">⚠ Withheld (Due: ₹{card.outstandingFee})</span>}
                                  {!isReleased && !isWithheld && <span className="text-amber-200">Pending Release</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isReleased && card.cardData && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setPreviewCardData(card.cardData);
                                        setIsPreviewOpen(true);
                                      }}
                                      className="bg-white text-blue-900 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                                      title="Preview Admit Card"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => {
                                        const doc = generateSingleAdmitCardPDF(card.cardData);
                                        doc.save(`AdmitCard_${student?.student_name || 'Student'}_${card.examName}.pdf`.replace(/\s+/g, '_'));
                                      }}
                                      className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer"
                                      title="Download PDF"
                                    >
                                      PDF
                                    </button>
                                  </>
                                )}
                                {isWithheld && (
                                  <button
                                    onClick={() => setActiveTab('fees')}
                                    className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    Pay Dues
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-indigo-200 italic">No active examination admit cards issued</div>
                      )}
                    </div>
                  </div>

                  {/* Exam Schedule Table Card */}
                  <div className={`${glassCard} overflow-hidden flex flex-col`}>
                    <div className="p-6 border-b border-gray-100 bg-white/40 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900">Upcoming Schedule</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{upcomingExams.length} Exams Remaining</span>
                        <button 
                          disabled={upcomingExams.length === 0}
                          onClick={() => {
                            if (!upcomingExams || upcomingExams.length === 0) {
                              alert("No upcoming exams scheduled to download.");
                              return;
                            }
                            const doc = new jsPDF();
                            doc.setFontSize(18);
                            doc.text(`My Exam Timetable - Class ${student.grade || student.class_id}`, 14, 22);
                            
                            const tableColumn = ["Date", "Exam Name", "Subject", "Time"];
                            const tableRows = upcomingExams.map(exam => [
                              new Date(exam.exam_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                              exam.exam_name,
                              `${exam.subject} ${exam.sub_subject ? `(${exam.sub_subject})` : ''}`,
                              `${exam.start_time ? exam.start_time.substring(0,5) : '--:--'} - ${exam.end_time ? exam.end_time.substring(0,5) : '--:--'}`
                            ]);
                            
                            autoTable(doc, {
                              head: [tableColumn],
                              body: tableRows,
                              startY: 30,
                            });
                            
                            doc.save(`My_Timetable.pdf`);
                          }} 
                          className={`text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                            upcomingExams.length === 0
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <span className="material-symbols-outlined">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto p-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Exam Name</th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {upcomingExams.length > 0 ? upcomingExams.map((exam, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap">{new Date(exam.exam_date).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-bold">{exam.exam_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {exam.subject} {exam.sub_subject ? `(${exam.sub_subject})` : ''}
                                {exam.has_practical && <span className="block text-xs text-indigo-400">Theory + Practical</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {exam.start_time ? exam.start_time.substring(0,5) : '--:--'} - {exam.end_time ? exam.end_time.substring(0,5) : '--:--'}
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="text-center py-4 text-gray-500 text-sm">No upcoming exams</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Published Results & Grievances */}
                  <div className={`${glassCard} overflow-hidden flex flex-col`}>
                    <div className="p-6 border-b border-gray-100 bg-white/40 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900">Published Results</h3>
                      <button onClick={() => setShowGrievanceForm(!showGrievanceForm)} className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                        Raise Grievance
                      </button>
                    </div>

                    {showGrievanceForm && (
                      <div className="p-6 bg-orange-50/50 border-b border-orange-100">
                        <h4 className="font-bold text-orange-800 mb-3">Submit a Grievance</h4>
                        <p className="text-xs text-orange-600 mb-4">Grievances must be raised within 7 days of result publication.</p>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await axios.post(`${API_URL}/grievances/submit`, grievanceForm, { headers: { Authorization: `Bearer ${token}` } });
                            alert('Grievance submitted successfully!');
                            setMyGrievances([res.data.data, ...myGrievances]);
                            setShowGrievanceForm(false);
                            setGrievanceForm({ exam_id: '', subject: '', complaint: '' });
                          } catch(err) { alert(err.response?.data?.message || 'Failed to submit grievance'); }
                        }} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select required className="p-2.5 border rounded-lg bg-white" value={grievanceForm.exam_id} onChange={e => setGrievanceForm({...grievanceForm, exam_id: e.target.value})}>
                              <option value="">Select Exam</option>
                              {publishedResults.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                            </select>
                            <input required type="text" placeholder="Subject" className="p-2.5 border rounded-lg bg-white" value={grievanceForm.subject} onChange={e => setGrievanceForm({...grievanceForm, subject: e.target.value})} />
                          </div>
                          <textarea required placeholder="Detailed Complaint/Reason..." className="w-full p-2.5 border rounded-lg bg-white h-24" value={grievanceForm.complaint} onChange={e => setGrievanceForm({...grievanceForm, complaint: e.target.value})}></textarea>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowGrievanceForm(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700">Submit</button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      {publishedResults.length === 0 ? <p className="text-sm text-gray-500">No published results.</p> : null}
                      {publishedResults.map(pr => (
                        <div key={pr.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h4 className="font-bold text-gray-800">{pr.name}</h4>
                              <p className="text-xs text-gray-500">Published: {new Date(pr.published_date).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</p>
                            </div>
                            {hasPendingFees ? (
                              <div className="text-red-500 text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                                Pending Fees - Download Disabled
                              </div>
                            ) : (
                              <button className="text-blue-600 text-sm font-bold bg-blue-50 px-3 py-1.5 rounded-lg">Download SVG Card</button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {pr.marks.map((m, i) => (
                              <div key={i} className="bg-white p-2 rounded border border-gray-100 text-center">
                                <div className="text-xs text-gray-500 font-bold">{m.subject?.replace(/^VB-?/, '')}</div>
                                {hasPendingFees ? (
                                  <div className="text-sm font-black text-gray-800">
                                    {Math.round((m.obtained / m.max) * 100)}%
                                  </div>
                                ) : (
                                  <div className="text-sm font-black text-gray-800">{m.obtained}/{m.max}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {myGrievances.length > 0 && (
                     <div className={`${glassCard} overflow-hidden flex flex-col p-6`}>
                       <h3 className="text-lg font-bold text-gray-900 mb-4">My Grievances</h3>
                       <div className="space-y-3">
                         {myGrievances.map(g => (
                           <div key={g.id} className="bg-orange-50/30 p-4 border border-orange-100 rounded-xl">
                             <div className="flex justify-between mb-2">
                               <span className="font-bold text-gray-800">{g.exam?.name} - {g.subject?.replace(/^VB-?/, '')}</span>
                               <span className={`text-xs font-bold px-2 py-1 rounded-full ${g.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{g.status}</span>
                             </div>
                             <p className="text-sm text-gray-600"><strong>Complaint:</strong> {g.complaint}</p>
                             {g.admin_reply && <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded"><strong>Reply:</strong> {g.admin_reply}</p>}
                           </div>
                         ))}
                       </div>
                     </div>
                  )}

                </div>


                {/* Results Details Section (Full Width) */}
                <div className="col-span-12">
                  <div className={`${glassCard} overflow-hidden`}>
                    <div className="p-6 border-b border-gray-100 bg-white/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Semester Grade Sheet</h3>
                        <p className="text-sm text-gray-500 mt-1">Academic Session: Spring 2024</p>
                      </div>
                      <div className="flex gap-3">
                        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer">
                          <option>Spring 2024</option>
                          <option>Fall 2023</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">print</span>
                          Print
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto p-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Subject Name</th>
                            <th className="px-6 py-4 text-center">Exam Name</th>
                            <th className="px-6 py-4 text-center">Marks/Grade</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {grades.length > 0 ? grades.map((grade, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-500 font-mono">SBJ-{idx+1}01</td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">{grade.subject?.replace(/^VB-?/, '')}</td>
                              <td className="px-6 py-4 text-center text-sm text-gray-500">{grade.exams?.name || 'N/A'}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  {grade.timetable?.has_practical ? (
                                    <div className="text-xs text-gray-500 mb-1">
                                      Th: <span className="font-bold text-gray-800">{grade.marks_obtained}</span>/{grade.timetable.theory_marks} | 
                                      Pr: <span className="font-bold text-gray-800">{grade.practical_marks_obtained || 0}</span>/{grade.timetable.practical_marks}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 mb-1">
                                      Max: {grade.timetable?.total_marks || grade.max_marks || 100}
                                    </div>
                                  )}
                                  <span className="font-bold text-indigo-600 text-lg leading-none">{grade.totalObtained}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 italic">
                                {grade.passed ? (
                                   <span className="text-green-600 font-bold">Passed</span>
                                ) : (
                                   <span className="text-red-500 font-bold">Failed</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                  PUBLISHED
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">assignment_late</span>
                                <p>No detailed results available for this semester.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'fees' ? (
            <div className="animate-fade-in">
              <StudentDues />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-gray-400 font-medium">This module is under development.</p>
            </div>
          )}
        </main>
      </div>

      {/* 1:1 Authentic Admit Card Preview Modal */}
      <AdmitCardPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        cardData={previewCardData}
      />

      {/* Notification Detail Modal */}
      {selectedNotifModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            <div className={`p-6 text-white ${
              selectedNotifModal.priority === 'Urgent'
                ? 'bg-gradient-to-r from-red-600 to-rose-700'
                : selectedNotifModal.category === 'Fee Reminder'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  {selectedNotifModal.category || 'Announcement'}
                </span>
                <span className="text-xs text-white/80">
                  {new Date(selectedNotifModal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-xl font-black text-white leading-snug">
                {selectedNotifModal.title}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotifModal.message}
              </div>

              <div className="text-xs text-gray-400 flex items-center justify-between pt-2">
                <span>Official School Notice</span>
                <span>Audience: Direct / Class Target</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotifModal(null)}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPortal;
