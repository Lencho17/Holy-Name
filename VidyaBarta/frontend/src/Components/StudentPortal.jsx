import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { StudentAuthContext } from '../context/StudentAuthContext';

function StudentPortal() {
  const { API_URL, schoolProfile } = useContext(SiteDataContext);
  const { student, token, logout, loading: authLoading } = useContext(StudentAuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [grades, setGrades] = useState([]);
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const fetchPortalData = async () => {
      try {
        const [gradesRes, noticesRes, coursesRes, assignmentsRes, feesRes, transactionsRes, upcomingExamsRes] = await Promise.all([
          axios.get(`${API_URL}/student-portal/grades`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/student-portal/notices`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/student-portal/courses`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/student-portal/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/student-portal/fees`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/student-portal/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/student-portal/upcoming-exams`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setGrades(gradesRes.data);
        setNotices(noticesRes.data);
        setCourses(coursesRes.data);
        setAssignments(assignmentsRes.data);
        setFees(feesRes.data);
        setTransactions(transactionsRes.data);
        setUpcomingExams(upcomingExamsRes.data);
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

  // Glassmorphism classes
  const glassCard = "bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl";
  const glassButton = "bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm transition-all text-gray-700";

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 text-gray-800 overflow-x-hidden min-h-screen flex font-sans">
      
      {/* Decorative Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Side Navigation Shell */}
      <aside className="flex flex-col fixed left-0 top-0 h-full w-64 bg-white/60 backdrop-blur-xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-[60]">
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0 overflow-hidden">
              {schoolProfile?.logo_url ? (
                <img src={schoolProfile.logo_url} alt="School Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">school</span>
              )}
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-gray-900 leading-tight truncate" title={schoolProfile?.name || 'Student Portal'}>{schoolProfile?.name || 'Student Portal'}</h1>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider truncate">Academic Session</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
              { id: 'courses', icon: 'menu_book', label: 'Courses' },
              { id: 'fees', icon: 'payments', label: 'Fees' },
              { id: 'notices', icon: 'notifications', label: 'Notices' },
              { id: 'exams', icon: 'quiz', label: 'Results' }
            ].map(item => (
              <a 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium text-sm
                  ${activeTab === item.id 
                    ? 'bg-white shadow-sm border border-white/80 text-indigo-700 font-semibold' 
                    : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'}`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </a>
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
        <div className="mt-auto p-6 border-t border-white/40 bg-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white flex items-center justify-center text-gray-600 shadow-sm">
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
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        {/* Top Navigation Shell */}
        <header className="flex justify-between items-center w-full px-8 h-20 sticky top-0 z-50 bg-white/40 backdrop-blur-md border-b border-white/40 shadow-sm">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner" 
                placeholder="Search resources, assignments..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-gray-800 mr-4 hidden md:block bg-white/60 px-4 py-1.5 rounded-full border border-white shadow-sm text-sm">
              {schoolProfile?.name || 'VidyaBarta Platform'}
            </h2>
            <button className={`${glassButton} rounded-full p-2.5 flex items-center justify-center text-gray-600 hover:text-indigo-600`}>
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className={`${glassButton} rounded-full p-2.5 flex items-center justify-center text-gray-600 hover:text-indigo-600`}>
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        </header>

        <main className="p-8 max-w-[1440px] w-full mx-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* Welcome Banner Section */}
              <section className="mb-8 relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 shadow-xl shadow-indigo-200">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center w-full px-10 py-12">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {student.name.split(' ')[0]}! 👋</h2>
                    <p className="text-indigo-100 text-lg">You are enrolled in Grade <span className="font-semibold text-white">{student.grade}</span>.</p>
                  </div>
                  <div className="hidden md:block mt-6 md:mt-0">
                    <button onClick={() => setActiveTab('exams')} className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2">
                      <span className="material-symbols-outlined">monitoring</span>
                      View Academic Results
                    </button>
                  </div>
                </div>
              </section>

              {/* Bento Dashboard Grid */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Recent Announcements */}
                <div className={`col-span-12 md:col-span-4 ${glassCard} p-6 flex flex-col`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Announcements</h3>
                    <button onClick={() => setActiveTab('notices')} className="text-indigo-600 text-sm font-semibold hover:underline">View All</button>
                  </div>
                  <div className="flex flex-col gap-4 flex-1">
                    {notices.length > 0 ? notices.slice(0, 3).map((notice, idx) => (
                      <div key={idx} className="p-4 bg-white/50 rounded-xl border border-white/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getBorderColorForNotice(idx).replace('border-', 'bg-')}`}></div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          {new Date(notice.date || notice.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-800 font-bold leading-tight group-hover:text-indigo-700 transition-colors">{notice.title}</p>
                      </div>
                    )) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">campaign</span>
                        <p className="text-sm">No recent announcements.</p>
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
                              <p className="text-sm font-bold text-gray-800">{grade.exams?.exam_name || 'N/A'}</p>
                            </td>
                            <td className="py-4 text-sm text-gray-600 font-medium">{grade.subject}</td>
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
            <div className={`${glassCard} p-8 min-h-[600px]`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">campaign</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notice Board</h2>
                  <p className="text-sm text-gray-500">Official communications and announcements.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {notices.map((notice, idx) => (
                  <div key={idx} className="p-5 bg-white/50 border border-white/80 rounded-2xl hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{notice.title}</h3>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                        {new Date(notice.date || notice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {notice.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{notice.description}</p>}
                    {notice.pdf_link && (
                      <a href={notice.pdf_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> View Document
                      </a>
                    )}
                  </div>
                ))}
                {notices.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-4 opacity-50">inbox</span>
                    <p>No notices available right now.</p>
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
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
                  <span className="material-symbols-outlined text-[20px]">file_download</span>
                  Download Report Card
                </button>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Upcoming Exams Bento Section */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  {/* Next Exam Highlight Card */}
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center text-white overflow-hidden relative shadow-lg shadow-indigo-200">
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
                              <p className="text-sm font-medium">{new Date(upcomingExams[0].exam_date).toLocaleDateString()}</p>
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
                    {upcomingExams.length > 0 && (
                      <button className="mt-6 md:mt-0 relative z-10 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined">badge</span>
                        Admit Card
                      </button>
                    )}
                  </div>

                  {/* Exam Schedule Table Card */}
                  <div className={`${glassCard} overflow-hidden flex flex-col`}>
                    <div className="p-6 border-b border-gray-100 bg-white/40 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900">Upcoming Schedule</h3>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{upcomingExams.length} Exams Remaining</span>
                    </div>
                    <div className="overflow-x-auto p-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Exam Name</th>
                            <th className="px-4 py-3">Class/Section</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {upcomingExams.length > 0 ? upcomingExams.map((exam, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/50 transition-colors rounded-xl">
                              <td className="px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap">{new Date(exam.exam_date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-bold">{exam.exam_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">Class {exam.class_id}</td>
                              <td className="px-4 py-3 text-right">
                                <button className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors">
                                  <span className="material-symbols-outlined text-[20px]">info</span>
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-10 text-center text-gray-400 text-sm">
                                No exams currently scheduled for this term.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* GPA Summary & Stats Column */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  {/* CGPA Widget */}
                  <div className={`${glassCard} p-6 flex flex-col items-center text-center relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Cumulative GPA</p>
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-gray-100" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="12"></circle>
                        <circle className="text-indigo-500 drop-shadow-md" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset={grades.length ? (440 - (440 * (calculateGPA(grades) / 4.0))) : 440} strokeWidth="12" strokeLinecap="round" style={{transition: 'stroke-dashoffset 1.5s ease-in-out'}}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-gray-900">{calculateGPA(grades)}</span>
                        <span className="text-[10px] font-bold text-gray-400 mt-1">OUT OF 4.0</span>
                      </div>
                    </div>
                    <div className="mt-8 w-full flex justify-between px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-xl">
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Semester</p>
                        <p className="text-lg font-bold text-gray-800">{calculateGPA(grades)}</p>
                      </div>
                      <div className="w-px bg-gray-200"></div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Ranking</p>
                        <p className="text-lg font-bold text-indigo-600">{grades.length > 0 ? '#4 / 120' : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Analysis Widget */}
                  <div className={`${glassCard} p-6`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-5">Performance Trend</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-600">Assignments</span>
                          <span className="text-sm font-bold text-gray-900">{grades.length ? '94%' : '0%'}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full bg-indigo-500 rounded-full ${grades.length ? 'w-[94%]' : 'w-0'}`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-600">Mid-Term Exams</span>
                          <span className="text-sm font-bold text-gray-900">{grades.length ? '88%' : '0%'}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full bg-purple-500 rounded-full ${grades.length ? 'w-[88%]' : 'w-0'}`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-600">Attendance</span>
                          <span className="text-sm font-bold text-gray-900">98%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-green-500 rounded-full w-[98%]"></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3 items-start">
                      <span className="material-symbols-outlined text-indigo-500 text-[18px] mt-0.5">hotel_class</span>
                      <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                        You have maintained an excellent attendance record, qualifying you for the Semester Merit Scholarship.
                      </p>
                    </div>
                  </div>
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
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">{grade.subject}</td>
                              <td className="px-6 py-4 text-center text-sm text-gray-500">{grade.exams?.exam_name || 'N/A'}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <span className="font-bold text-indigo-600 text-lg leading-none">{grade.marks_obtained}</span>
                                  <span className="text-[10px] text-gray-400 font-bold mt-1">GRADE: {grade.grade || '-'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 italic">Passed with distinction</td>
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
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-gray-400 font-medium">This module is under development.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentPortal;
