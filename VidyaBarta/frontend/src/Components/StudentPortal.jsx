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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    const colors = ['border-primary', 'border-secondary', 'border-error', 'border-tertiary'];
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

  return (
    <div className="bg-background text-on-background overflow-x-hidden min-h-screen flex">
      {/* Side Navigation Shell */}
      <aside className="flex flex-col fixed left-0 top-0 h-full w-64 border-r border-outline-variant bg-surface dark:bg-surface-dim z-[60]">
        <div className="p-lg flex flex-col gap-sm">
          <div className="flex items-center gap-md mb-xl">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h1 className="font-title-lg text-title-lg font-bold text-primary dark:text-primary-fixed">Student Portal</h1>
              <p className="font-body-sm text-body-sm text-secondary">Academic Session</p>
            </div>
          </div>
          <nav className="flex flex-col gap-xs">
            {/* Dashboard Active */}
            <a 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-primary dark:text-primary-fixed-dim font-bold border-r-4 border-primary bg-surface-container-high' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-body-md text-body-md">Dashboard</span>
            </a>
            {/* Courses */}
            <a 
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all cursor-pointer ${activeTab === 'courses' ? 'text-primary dark:text-primary-fixed-dim font-bold border-r-4 border-primary bg-surface-container-high' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">menu_book</span>
              <span className="font-body-md text-body-md">Courses</span>
            </a>
            {/* Fees */}
            <a 
              onClick={() => setActiveTab('fees')}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all cursor-pointer ${activeTab === 'fees' ? 'text-primary dark:text-primary-fixed-dim font-bold border-r-4 border-primary bg-surface-container-high' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined" style={{fontVariationSettings: activeTab === 'fees' ? "'FILL' 1" : "'FILL' 0"}}>payments</span>
              <span className="font-body-md text-body-md">Fees</span>
            </a>
            {/* Notices */}
            <a 
              onClick={() => setActiveTab('notices')}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all cursor-pointer ${activeTab === 'notices' ? 'text-primary dark:text-primary-fixed-dim font-bold border-r-4 border-primary bg-surface-container-high' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="font-body-md text-body-md">Notices</span>
            </a>
            {/* Exams */}
            <a 
              onClick={() => setActiveTab('exams')}
              className={`flex items-center gap-md px-md py-sm transition-all cursor-pointer ${activeTab === 'exams' ? 'text-primary dark:text-primary-fixed-dim font-bold border-r-4 border-primary bg-surface-container-high' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined">quiz</span>
              <span className="font-body-md text-body-md">Results</span>
            </a>
            
            <a 
              onClick={handleLogout}
              className="flex items-center gap-md px-md py-sm text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer mt-4 rounded-md"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-body-md text-body-md">Logout</span>
            </a>
          </nav>
        </div>
        <div className="mt-auto p-lg border-t border-outline-variant">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-label-md text-label-md text-on-surface truncate">{student.name}</p>
              <p className="text-[10px] text-secondary truncate">ID: {student.rollNumber}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Navigation Shell */}
        <header className="flex justify-between items-center w-full px-gutter h-16 sticky top-0 z-50 bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                placeholder="Search resources..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <h2 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed mr-4 hidden md:block">{schoolProfile?.name || 'EduCore Systems'}</h2>
            <button className="hover:bg-surface-container-low dark:hover:bg-surface-container-high rounded-full p-2 transition-transform active:scale-95 text-secondary">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="hover:bg-surface-container-low dark:hover:bg-surface-container-high rounded-full p-2 transition-transform active:scale-95 text-secondary">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <main className="p-lg max-w-[1440px] w-full mx-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* Welcome Banner Section */}
              <section className="mb-lg relative rounded-xl overflow-hidden bg-primary h-48 flex items-center px-xl">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                <div className="relative z-10 flex justify-between items-center w-full">
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-primary mb-xs">Welcome back, {student.name.split(' ')[0]}!</h2>
                    <p className="font-body-lg text-body-lg text-on-primary/80">You are enrolled in Grade {student.grade}.</p>
                  </div>
                  <div className="hidden md:block">
                    <button onClick={() => setActiveTab('exams')} className="bg-surface text-primary px-xl py-md rounded-lg font-title-lg hover:bg-surface-container-high transition-all">
                      View Results
                    </button>
                  </div>
                </div>
              </section>

              {/* Bento Dashboard Grid */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Recent Announcements (Taking up full width or 6 cols depending on content) */}
                <div className="col-span-12 md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
                  <div className="flex justify-between items-center mb-lg">
                    <h3 className="font-title-lg text-title-lg text-on-surface">Recent Announcements</h3>
                    <button onClick={() => setActiveTab('notices')} className="text-primary font-label-md text-label-md hover:underline">View All</button>
                  </div>
                  <div className="flex flex-col gap-md">
                    {notices.length > 0 ? notices.slice(0, 3).map((notice, idx) => (
                      <div key={idx} className={`p-md bg-surface-container-low rounded-lg border-l-4 ${getBorderColorForNotice(idx)}`}>
                        <p className={`font-label-md text-label-md text-secondary mb-xs`}>
                          {new Date(notice.date || notice.created_at).toLocaleDateString()}
                        </p>
                        <p className="font-body-md text-body-md text-on-surface font-medium">{notice.title}</p>
                        {notice.description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">{notice.description}</p>}
                      </div>
                    )) : (
                      <p className="font-body-md text-secondary py-4 text-center">No recent announcements.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Summary Table Section (Used for Results) */}
              <section className="mt-lg bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                <div className="px-lg py-md bg-surface-container border-b border-outline-variant flex justify-between items-center">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Latest Academic Results</h3>
                  <button onClick={() => setActiveTab('exams')} className="flex items-center gap-xs font-label-md text-label-md text-primary">
                    <span className="material-symbols-outlined text-sm">open_in_new</span> View Detailed
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Exam Name</th>
                        <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Subject</th>
                        <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Marks</th>
                        <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Grade</th>
                        <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {grades.length > 0 ? grades.slice(0, 5).map((grade, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-lowest transition-colors group">
                          <td className="px-lg py-md">
                            <p className="font-body-md text-body-md font-medium text-on-surface">{grade.exams?.exam_name || 'N/A'}</p>
                          </td>
                          <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">{grade.subject}</td>
                          <td className="px-lg py-md font-body-md text-body-md text-on-surface font-semibold">{grade.marks_obtained} / {grade.total_marks}</td>
                          <td className="px-lg py-md font-body-md text-body-md text-on-surface">{grade.grade || '-'}</td>
                          <td className="px-lg py-md">
                            <span className="bg-primary-container/20 text-primary px-sm py-xs rounded text-[11px] font-bold">PUBLISHED</span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-lg py-md text-center text-secondary font-body-md">
                            No recent grades found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : activeTab === 'notices' ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">All Notices</h2>
              <div className="space-y-4">
                {notices.map((notice, idx) => (
                  <div key={idx} className="p-md border border-outline-variant rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-title-lg font-bold text-on-surface">{notice.title}</h3>
                      <span className="text-label-md bg-surface-container-high px-2 py-1 rounded text-secondary">
                        {new Date(notice.date || notice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {notice.description && <p className="text-body-md text-on-surface-variant mt-2">{notice.description}</p>}
                    {notice.pdf_link && (
                      <a href={notice.pdf_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-label-md text-primary font-bold hover:underline">
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Download Attachment
                      </a>
                    )}
                  </div>
                ))}
                {notices.length === 0 && <p className="text-secondary text-center">No notices available.</p>}
              </div>
            </div>
          ) : activeTab === 'exams' ? (
            <div className="space-y-lg">
              {/* Page Header */}
              <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-primary">Examination &amp; Results</h2>
                  <p className="text-body-md text-secondary">Manage your upcoming schedules and view academic performance records.</p>
                </div>
                <button className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md flex items-center gap-xs hover:bg-primary-container transition-all active:scale-95 shadow-sm">
                  <span className="material-symbols-outlined">file_download</span>
                  Download Report Card
                </button>
              </div>

              <div className="grid grid-cols-12 gap-lg">
                {/* Upcoming Exams Bento Section */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
                  {/* Next Exam Highlight Card */}
                  <div className="bg-white/90 backdrop-blur border border-outline-variant rounded-xl p-lg flex flex-col md:flex-row justify-between items-center bg-primary-container text-on-primary overflow-hidden relative shadow-sm">
                    <div className="absolute -right-8 -bottom-8 opacity-10">
                      <span className="material-symbols-outlined text-[160px]">event_upcoming</span>
                    </div>
                    <div className="relative z-10 text-center md:text-left">
                      <span className="bg-secondary-fixed text-on-secondary-fixed px-sm py-xs rounded-full font-label-md uppercase tracking-wider">Next Exam</span>
                      {upcomingExams.length > 0 ? (
                        <>
                          <h3 className="font-headline-md text-headline-md mt-sm">{upcomingExams[0].exam_name || 'Upcoming Assessment'}</h3>
                          <div className="flex flex-wrap justify-center md:justify-start gap-lg mt-md">
                            <div className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-secondary-fixed">calendar_month</span>
                              <p className="font-body-md">{new Date(upcomingExams[0].exam_date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-secondary-fixed">schedule</span>
                              <p className="font-body-md">Standard Time</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <h3 className="font-headline-md text-headline-md mt-sm text-on-primary/80">No upcoming exams scheduled</h3>
                      )}
                    </div>
                    {upcomingExams.length > 0 && (
                      <button className="mt-lg md:mt-0 relative z-10 bg-white text-primary px-lg py-md rounded-lg font-bold shadow-lg hover:bg-surface-container-highest transition-transform active:scale-95 flex items-center gap-sm">
                        <span className="material-symbols-outlined">badge</span>
                        Download Admit Card
                      </button>
                    )}
                  </div>

                  {/* Exam Schedule Table Card */}
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
                    <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                      <h3 className="font-title-lg text-title-lg">Upcoming Schedule</h3>
                      <span className="text-label-md text-secondary">{upcomingExams.length} Exams Remaining</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container text-secondary font-label-md border-b border-outline-variant">
                            <th className="px-lg py-md">Date</th>
                            <th className="px-lg py-md">Exam Name</th>
                            <th className="px-lg py-md">Class/Section</th>
                            <th className="px-lg py-md">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {upcomingExams.length > 0 ? upcomingExams.map((exam, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-lg py-md font-body-md whitespace-nowrap">{new Date(exam.exam_date).toLocaleDateString()}</td>
                              <td className="px-lg py-md font-body-md font-bold">{exam.exam_name}</td>
                              <td className="px-lg py-md font-body-sm text-secondary">Class {exam.class_id}</td>
                              <td className="px-lg py-md">
                                <span className="material-symbols-outlined text-primary cursor-pointer hover:scale-110 transition-transform">info</span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="px-lg py-8 text-center text-secondary font-body-md">
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
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
                  {/* CGPA Widget */}
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg flex flex-col items-center text-center">
                    <p className="font-label-md text-secondary uppercase tracking-widest mb-md">Cumulative GPA</p>
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle className="text-surface-container-high" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="12"></circle>
                        <circle className="text-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset={grades.length ? (440 - (440 * (calculateGPA(grades) / 4.0))) : 440} strokeWidth="12" style={{transition: 'stroke-dashoffset 1s ease-in-out'}}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-display-lg text-display-lg text-primary">{calculateGPA(grades)}</span>
                        <span className="font-label-md text-secondary">OUT OF 4.0</span>
                      </div>
                    </div>
                    <div className="mt-lg w-full flex justify-between px-md py-sm bg-surface-container-low rounded-lg">
                      <div className="text-left">
                        <p className="text-[10px] text-secondary uppercase font-bold">Current Semester</p>
                        <p className="font-title-lg text-primary">{calculateGPA(grades)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-secondary uppercase font-bold">Ranking</p>
                        <p className="font-title-lg text-primary">{grades.length > 0 ? '#4 / 120' : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Analysis Widget */}
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                    <h3 className="font-title-lg text-title-lg mb-lg">Performance Trend</h3>
                    <div className="space-y-md">
                      <div>
                        <div className="flex justify-between mb-xs">
                          <span className="font-body-sm">Assignments</span>
                          <span className="font-label-md text-primary">{grades.length ? '94%' : '0%'}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full bg-primary ${grades.length ? 'w-[94%]' : 'w-0'}`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-xs">
                          <span className="font-body-sm">Mid-Term Exams</span>
                          <span className="font-label-md text-primary">{grades.length ? '88%' : '0%'}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full bg-primary ${grades.length ? 'w-[88%]' : 'w-0'}`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-xs">
                          <span className="font-body-sm">Attendance</span>
                          <span className="font-label-md text-primary">98%</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[98%]"></div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-lg text-[12px] text-secondary leading-relaxed italic">
                      * You have maintained an 'Excellent' attendance record, qualifying you for the Semester Merit Scholarship.
                    </p>
                  </div>
                </div>

                {/* Results Details Section (Full Width) */}
                <div className="col-span-12">
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
                    <div className="p-lg border-b border-outline-variant bg-surface-container-lowest">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
                        <div>
                          <h3 className="font-title-lg text-title-lg">Semester Grade Sheet</h3>
                          <p className="text-body-sm text-secondary">Academic Session: Spring 2024</p>
                        </div>
                        <div className="flex gap-sm">
                          <select className="rounded-lg border-outline-variant text-body-sm focus:ring-primary focus:border-primary">
                            <option>Spring 2024</option>
                            <option>Fall 2023</option>
                          </select>
                          <button className="flex items-center gap-xs px-md py-sm border border-outline text-secondary rounded-lg hover:bg-surface-container-low transition-colors text-body-sm">
                            <span className="material-symbols-outlined">print</span>
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container text-secondary font-label-md border-b border-outline-variant">
                            <th className="px-lg py-md">Code</th>
                            <th className="px-lg py-md">Subject Name</th>
                            <th className="px-lg py-md text-center">Exam Name</th>
                            <th className="px-lg py-md text-center">Marks/Grade</th>
                            <th className="px-lg py-md">Remarks</th>
                            <th className="px-lg py-md text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {grades.length > 0 ? grades.map((grade, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-lg py-md font-body-sm text-secondary">SBJ-{idx+1}01</td>
                              <td className="px-lg py-md font-body-md font-bold">{grade.subject}</td>
                              <td className="px-lg py-md text-center font-body-sm text-secondary">{grade.exams?.exam_name || 'N/A'}</td>
                              <td className="px-lg py-md text-center font-bold text-primary">
                                {grade.grade || 'N/A'} <span className="font-body-sm text-secondary font-normal">({grade.marks_obtained}/{grade.total_marks})</span>
                              </td>
                              <td className="px-lg py-md font-body-sm italic text-secondary">
                                {grade.marks_obtained/grade.total_marks > 0.8 ? 'Excellent performance.' : 'Good effort.'}
                              </td>
                              <td className="px-lg py-md text-right">
                                <span className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase ${grade.marks_obtained/grade.total_marks > 0.4 ? 'bg-green-100 text-green-800' : 'bg-error-container text-on-error-container'}`}>
                                  {grade.marks_obtained/grade.total_marks > 0.4 ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="6" className="px-lg py-12 text-center text-secondary font-body-md">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">receipt_long</span>
                                No grades found for this academic session.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {grades.length > 0 && (
                          <tfoot>
                            <tr className="bg-surface-container-high font-bold border-t border-outline">
                              <td className="px-lg py-md" colSpan="3">TOTAL SUBJECTS EVALUATED: {grades.length}</td>
                              <td className="px-lg py-md text-right" colSpan="2">SEMESTER GPA:</td>
                              <td className="px-lg py-md text-right text-primary">{calculateGPA(grades)}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'courses' ? (
            <div className="space-y-lg">
              {/* Header Section */}
              <header className="flex justify-between items-end mb-md">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-background">Course Materials &amp; Assignments</h2>
                  <p className="font-body-md text-body-md text-secondary">Access resources and submit your work for the current semester.</p>
                </div>
                <div className="flex gap-md hidden md:flex">
                  <button className="flex items-center gap-sm px-md py-sm bg-primary text-on-primary rounded-lg font-label-md transition-all active:scale-95">
                    <span className="material-symbols-outlined !text-md">file_download</span>
                    Download All Materials
                  </button>
                </div>
              </header>
              
              {/* Bento Layout: Enrolled Subjects Grid & Resource Hub */}
              <section className="grid grid-cols-12 gap-lg">
                {/* Enrolled Subjects Grid */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-lg">
                  {courses.length > 0 ? courses.map((course, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col hover:-translate-y-1 hover:shadow-md transition-all">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-md ${idx % 3 === 0 ? 'bg-primary-fixed text-primary' : idx % 3 === 1 ? 'bg-secondary-fixed text-secondary' : 'bg-tertiary-fixed text-tertiary'}`}>
                        <span className="material-symbols-outlined text-headline-md" style={{fontVariationSettings: "'FILL' 1"}}>{idx % 3 === 0 ? 'lyrics' : idx % 3 === 1 ? 'calculate' : 'terminal'}</span>
                      </div>
                      <h3 className="font-title-lg text-title-lg text-on-surface">{course.name || course.subject_name}</h3>
                      <p className="font-body-sm text-body-sm text-secondary mb-lg line-clamp-1">{course.description || "Enrolled Subject"}</p>
                      <div className="mt-auto space-y-sm">
                        <button className="w-full flex items-center justify-center gap-sm py-sm border border-outline-variant rounded-lg font-label-md text-primary hover:bg-primary/5 transition-colors">
                          <span className="material-symbols-outlined !text-md">download</span>
                          Materials
                        </button>
                        <button className="w-full py-sm bg-secondary-container text-on-secondary-container rounded-lg font-label-md hover:opacity-90 transition-opacity">
                          Assignments
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-12 md:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-4xl text-secondary mb-2">menu_book</span>
                      <p className="font-body-md text-secondary">No courses enrolled yet.</p>
                    </div>
                  )}
                </div>

                {/* Resource Hub Section */}
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-lg flex flex-col">
                  <div className="flex items-center justify-between mb-lg">
                    <h3 className="font-title-lg text-title-lg text-on-surface">Resource Hub</h3>
                    <span className="material-symbols-outlined text-secondary">cloud_download</span>
                  </div>
                  <div className="space-y-md flex-1 flex flex-col justify-center items-center opacity-70">
                      <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">folder_off</span>
                      <p className="text-body-sm text-secondary text-center">No general resources available right now.</p>
                  </div>
                </div>
              </section>

              {/* Detailed Assignment List */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-6">
                <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                  <h3 className="font-title-lg text-title-lg text-on-surface">Upcoming Assignments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-lg py-md text-left font-label-md text-on-surface-variant">Assignment Name</th>
                        <th className="px-lg py-md text-left font-label-md text-on-surface-variant">Subject</th>
                        <th className="px-lg py-md text-left font-label-md text-on-surface-variant">Due Date</th>
                        <th className="px-lg py-md text-left font-label-md text-on-surface-variant">Status</th>
                        <th className="px-lg py-md text-right font-label-md text-on-surface-variant">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {assignments.length > 0 ? assignments.map((assignment, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-sm">
                              <span className="material-symbols-outlined text-primary">edit_note</span>
                              <span className="font-body-md text-on-surface">{assignment.title}</span>
                            </div>
                          </td>
                          <td className="px-lg py-md">
                            <span className="px-md py-xs bg-primary-fixed text-primary rounded-full text-[12px] font-semibold">{assignment.subject || 'General'}</span>
                          </td>
                          <td className="px-lg py-md font-body-sm text-on-surface-variant">{new Date(assignment.due_date).toLocaleDateString()}</td>
                          <td className="px-lg py-md">
                            <span className="flex items-center gap-xs text-secondary font-label-md">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending
                            </span>
                          </td>
                          <td className="px-lg py-md text-right">
                            <button className="bg-primary text-on-primary font-label-md px-md py-sm rounded-lg hover:opacity-90 flex items-center gap-xs ml-auto">
                              <span className="material-symbols-outlined !text-md">upload</span> Upload
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-lg py-8 text-center text-secondary font-body-md">
                            No upcoming assignments.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : activeTab === 'fees' ? (
            <div className="space-y-lg">
              {/* Fee Summary Header (Bento Style) */}
              <section className="mb-xl">
                <div className="flex items-center justify-between mb-lg">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Fees &amp; Financials</h2>
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-lg font-label-md transition-all hover:brightness-110 active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">payment</span> Pay Now
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                  {/* Summary Card 1 */}
                  <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg">
                    <div className="flex justify-between items-start mb-md">
                      <span className="text-secondary font-label-md">Total Fees Paid</span>
                      <div className="p-2 bg-green-50 text-green-700 rounded-full">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </div>
                    </div>
                    <div className="font-headline-lg text-headline-lg text-on-surface">
                      ${fees.reduce((acc, fee) => fee.status === 'PAID' ? acc + (fee.amount || 0) : acc, 0).toFixed(2)}
                    </div>
                    <div className="mt-sm flex items-center gap-xs">
                      <span className="text-body-sm text-outline">Real-time calculations</span>
                    </div>
                  </div>
                  
                  {/* Summary Card 2 */}
                  <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg">
                    <div className="flex justify-between items-start mb-md">
                      <span className="text-secondary font-label-md">Remaining Balance</span>
                      <div className="p-2 bg-error-container text-on-error-container rounded-full">
                        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                      </div>
                    </div>
                    <div className="font-headline-lg text-headline-lg text-error">
                      ${fees.reduce((acc, fee) => (fee.status === 'PENDING' || fee.status === 'OVERDUE') ? acc + (fee.amount || 0) : acc, 0).toFixed(2)}
                    </div>
                    <p className="font-body-sm text-body-sm text-outline mt-sm italic">Including any late fines</p>
                  </div>
                  
                  {/* Summary Card 3 */}
                  <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg">
                    <div className="flex justify-between items-start mb-md">
                      <span className="text-secondary font-label-md">Next Due Date</span>
                      <div className="p-2 bg-secondary-container text-on-secondary-container rounded-full">
                        <span className="material-symbols-outlined text-[20px]">event</span>
                      </div>
                    </div>
                    {fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE').sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] ? (
                        <>
                          <div className="font-headline-lg text-headline-lg text-on-surface">
                            {new Date(fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE').sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0].due_date).toLocaleDateString()}
                          </div>
                          <div className="mt-sm">
                            <span className="px-sm py-xs bg-error-container text-on-error-container text-[10px] font-bold rounded uppercase">Upcoming</span>
                          </div>
                        </>
                    ) : (
                      <div className="font-headline-lg text-headline-lg text-on-surface">No Due Dates</div>
                    )}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-12 gap-lg">
                {/* Detailed Fee Structure (Table) */}
                <div className="col-span-12 lg:col-span-8">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                    <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
                      <h3 className="font-title-lg text-title-lg text-on-surface">Detailed Fee Structure</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low">
                            <th className="px-lg py-sm font-label-md text-label-md text-secondary border-b border-outline-variant uppercase">Particulars</th>
                            <th className="px-lg py-sm font-label-md text-label-md text-secondary border-b border-outline-variant uppercase">Amount</th>
                            <th className="px-lg py-sm font-label-md text-label-md text-secondary border-b border-outline-variant uppercase">Due Date</th>
                            <th className="px-lg py-sm font-label-md text-label-md text-secondary border-b border-outline-variant uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {fees.length > 0 ? fees.map((fee, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-lg py-md font-body-md text-body-md font-semibold">{fee.particulars || fee.fee_type || 'General Fee'}</td>
                              <td className="px-lg py-md font-body-md text-body-md">${(fee.amount || 0).toFixed(2)}</td>
                              <td className="px-lg py-md font-body-sm text-body-sm text-outline">{fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}</td>
                              <td className="px-lg py-md">
                                <span className={`px-md py-xs text-[11px] font-bold rounded-full ${fee.status === 'PAID' ? 'bg-green-100 text-green-800' : fee.status === 'PENDING' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                                  {(fee.status || 'PENDING').toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="px-lg py-8 text-center text-secondary font-body-md">
                                No fee records found for this academic session.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="col-span-12 lg:col-span-4">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col h-full">
                    <div className="px-lg py-md border-b border-outline-variant">
                      <h3 className="font-title-lg text-title-lg text-on-surface">Payment History</h3>
                    </div>
                    <div className="flex-1 p-lg space-y-md">
                      {transactions.length > 0 ? transactions.map((txn, idx) => (
                        <div key={idx} className="flex items-center justify-between p-md border border-outline-variant rounded-lg hover:bg-surface-container-low transition-all">
                          <div className="flex items-center gap-md">
                            <div className="w-10 h-10 flex items-center justify-center bg-surface-container-high rounded text-secondary">
                              <span className="material-symbols-outlined">description</span>
                            </div>
                            <div>
                              <p className="font-label-md text-label-md font-bold">{txn.receipt_no || `RCP-${txn.id?.substring(0,8) || 'XXXX'}`}</p>
                              <p className="font-body-sm text-body-sm text-outline">{new Date(txn.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button className="p-2 text-primary hover:bg-primary-fixed rounded transition-colors group">
                            <span className="material-symbols-outlined text-[20px] group-active:scale-90">download</span>
                          </button>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center h-32 opacity-70">
                            <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">receipt_long</span>
                            <p className="text-body-sm text-secondary text-center">No payment history available.</p>
                        </div>
                      )}
                    </div>
                    {transactions.length > 0 && (
                      <div className="p-lg">
                        <button className="w-full py-sm text-secondary font-label-md border border-outline-variant rounded hover:bg-surface-container-low transition-colors">
                          View All History
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-on-background/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-surface-container-lowest w-full max-w-md rounded-xl shadow-2xl border border-outline-variant p-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface">Secure Payment</h3>
              <button className="p-2 rounded-full hover:bg-surface-container-high text-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="mb-lg">
              <p className="text-secondary font-body-sm mb-xs">Amount to Pay</p>
              <p className="font-headline-lg text-headline-lg text-primary">
                ${fees.reduce((acc, fee) => (fee.status === 'PENDING' || fee.status === 'OVERDUE') ? acc + (fee.amount || 0) : acc, 0).toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-md">
              <label className="block">
                <span className="font-label-md text-label-md text-secondary uppercase block mb-xs">Payment Method</span>
                <div className="grid grid-cols-2 gap-md">
                  <div className="p-md border-2 border-primary bg-primary-fixed/20 rounded-lg flex flex-col items-center gap-sm cursor-pointer transition-all">
                    <span className="material-symbols-outlined text-primary">credit_card</span>
                    <span className="font-label-md text-primary">Card</span>
                  </div>
                  <div className="p-md border border-outline-variant rounded-lg flex flex-col items-center gap-sm cursor-pointer hover:bg-surface-container-low transition-all">
                    <span className="material-symbols-outlined text-secondary">qr_code_2</span>
                    <span className="font-label-md text-secondary">UPI / QR</span>
                  </div>
                </div>
              </label>
              
              <div className="space-y-sm">
                <label className="block">
                  <span className="font-label-md text-label-md text-secondary block mb-xs">Cardholder Name</span>
                  <input type="text" placeholder={student?.name || "Alex Richards"} className="w-full border-outline-variant rounded-lg bg-surface border px-md py-sm focus:ring-primary focus:border-primary" />
                </label>
                <label className="block">
                  <span className="font-label-md text-label-md text-secondary block mb-xs">Card Number</span>
                  <input type="text" placeholder="**** **** **** 4421" className="w-full border-outline-variant rounded-lg bg-surface border px-md py-sm focus:ring-primary focus:border-primary" />
                </label>
                <div className="grid grid-cols-2 gap-md">
                  <label className="block">
                    <span className="font-label-md text-label-md text-secondary block mb-xs">Expiry</span>
                    <input type="text" placeholder="MM/YY" className="w-full border-outline-variant rounded-lg bg-surface border px-md py-sm focus:ring-primary focus:border-primary" />
                  </label>
                  <label className="block">
                    <span className="font-label-md text-label-md text-secondary block mb-xs">CVV</span>
                    <input type="password" placeholder="***" className="w-full border-outline-variant rounded-lg bg-surface border px-md py-sm focus:ring-primary focus:border-primary" />
                  </label>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-xl bg-primary text-on-primary py-lg rounded-lg font-title-lg flex items-center justify-center gap-md hover:brightness-110 shadow-lg active:scale-[0.98] transition-all" onClick={() => alert('Payment flow is a placeholder.')}>
              Authorize Transaction <span className="material-symbols-outlined">lock</span>
            </button>
            <p className="mt-md text-center text-body-sm text-outline flex items-center justify-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">verified_user</span> Bank-level 256-bit encryption
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button for Support */}
      <button className="fixed bottom-lg right-lg w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100]">
        <span className="material-symbols-outlined">help</span>
      </button>
    </div>
  );
}

export default StudentPortal;
