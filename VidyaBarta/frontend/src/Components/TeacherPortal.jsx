import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteDataContext } from '../context/SiteDataContext';
import { FaUser, FaSignOutAlt, FaBook, FaCheckDouble, FaSearch } from 'react-icons/fa';

function TeacherPortal() {
  const { schoolProfile, API_URL } = useContext(SiteDataContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subject-marks');
  const [staffData, setStaffData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Marks Entry State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [marksGrid, setMarksGrid] = useState({}); // { studentId: { obtained, max } }

  // Review State
  const [reviewMarks, setReviewMarks] = useState([]);
  const [modifications, setModifications] = useState({}); // { markId: { newMark, reason } }

  // Authentication
  useEffect(() => {
    const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
    const data = localStorage.getItem('staffData') || localStorage.getItem('adminData');
    
    if (!token || !data) {
      navigate('/login');
      return;
    }
    
    try {
      setStaffData(JSON.parse(data));
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch Assignments
  useEffect(() => {
    if (!staffData) return;
    
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/assignments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter assignments for this teacher
          const myAssignments = data.filter(a => {
            const staffId = staffData.id || staffData._id;
            return a.class_teacher_id === staffId || 
            (a.subject_teachers && a.subject_teachers.some(st => st.teacher_id === staffId));
          });
          setAssignments(myAssignments);
        }
      } catch (err) {
        console.error('Error fetching assignments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
    
    // Fetch Exams
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/exams`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setExams(await res.json());
      } catch(err) { console.error(err); }
    };
    fetchExams();
  }, [staffData]);

  // Load students and existing marks when subject/class/exam is selected
  useEffect(() => {
    if (activeTab === 'subject-marks' && selectedAssignment && selectedSubject && selectedExam) {
      loadMarksEntryData();
    }
    if (activeTab === 'class-review' && selectedAssignment && selectedExam) {
      loadReviewData();
    }
  }, [selectedAssignment, selectedSubject, selectedExam, activeTab]);

  const loadMarksEntryData = async () => {
    try {
      const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
      // Fetch students for class
      const sRes = await fetch(`${API_URL}/students?class_level=${selectedAssignment.class_name}&section=${selectedAssignment.section}`, { headers: { 'Authorization': `Bearer ${token}` } });
      let studs = [];
      if (sRes.ok) {
        const resData = await sRes.json();
        studs = resData.data || resData;
      }
      setStudents(studs);

      // Fetch marks
      const mRes = await fetch(`${API_URL}/exams/${selectedExam}/marks`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (mRes.ok) {
        const marksData = await mRes.json();
        const initialGrid = {};
        studs.forEach(s => {
          const mark = marksData.find(m => m.student_id === s.id && m.subject === selectedSubject);
          initialGrid[s.id] = { obtained: mark ? mark.marks_obtained : '', max: mark ? mark.max_marks : 100 };
        });
        setMarksGrid(initialGrid);
      }
    } catch(err) { console.error(err); }
  };

  const loadReviewData = async () => {
    try {
      const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
      const mRes = await fetch(`${API_URL}/exams/${selectedExam}/marks`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (mRes.ok) {
        const allMarks = await mRes.json();
        // We only want to review marks for the assigned class. We need student info to filter by class.
        // Assuming backend handles class filtering or we do it here:
        const sRes = await fetch(`${API_URL}/students?class_level=${selectedAssignment.class_name}&section=${selectedAssignment.section}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const sResData = sRes.ok ? await sRes.json() : [];
        const studs = sResData.data || sResData;
        const classStudentIds = studs.map(s => s.id);
        
        const filteredMarks = allMarks.filter(m => classStudentIds.includes(m.student_id));
        setReviewMarks(filteredMarks);
      }
    } catch(err) { console.error(err); }
  };

  const handleSubmitMarks = async () => {
    try {
      const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
      const payload = Object.keys(marksGrid).map(sId => ({
        student_id: sId,
        subject: selectedSubject,
        marks_obtained: marksGrid[sId].obtained,
        max_marks: marksGrid[sId].max
      }));

      const res = await fetch(`${API_URL}/exams/${selectedExam}/marks/subject-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ marks: payload })
      });
      if (res.ok) {
        alert('Marks submitted to class teacher successfully!');
      } else {
        alert('Failed to submit marks');
      }
    } catch(err) { console.error(err); }
  };

  const handleReviewSubmit = async () => {
    try {
      const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
      const mods = Object.keys(modifications).map(mId => ({
        mark_id: mId,
        marks_obtained: modifications[mId].newMark,
        reason: modifications[mId].reason
      }));

      // Add unchanged marks as reviewed
      reviewMarks.forEach(m => {
        if (!modifications[m.id]) {
          mods.push({ mark_id: m.id, marks_obtained: m.marks_obtained, reason: '' });
        }
      });

      const res = await fetch(`${API_URL}/exams/${selectedExam}/marks/class-teacher-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ modifications: mods })
      });
      if (res.ok) {
        alert('Class Review completed successfully!');
        setModifications({});
        loadReviewData();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch(err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  if (!staffData || loading) return <div className="p-8 text-center">Loading Teacher Portal...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
            T
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Teacher Portal</h2>
            <p className="text-xs text-gray-500">{schoolProfile?.name || 'School'}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('subject-marks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === 'subject-marks' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">edit_document</span>
            Subject Marks Entry
          </button>
          
          <button 
            onClick={() => setActiveTab('class-review')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === 'class-review' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            Class Teacher Review
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
              {staffData.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{staffData.name}</p>
              <p className="text-xs text-gray-500 truncate">{staffData.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[100vw]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {activeTab === 'subject-marks' ? 'Subject Marks Entry' : 'Class Teacher Review'}
            </h1>
            <p className="text-gray-500">
              {activeTab === 'subject-marks' 
                ? 'Enter and submit marks for the subjects you teach.' 
                : 'Review, modify, and confirm marks for your assigned class.'}
            </p>
          </div>

          {/* DEBUG INFO: Please ignore this, just for fixing the issue! */}
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Staff ID: {staffData?.id}</p>
            <p>Total Assignments for me: {assignments.length}</p>
            <p>Assignments JSON: {JSON.stringify(assignments)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            
            {activeTab === 'subject-marks' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <select 
                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedAssignment(assignments.find(a => a.id === e.target.value))}
                  >
                    <option value="">-- Select Class --</option>
                    {assignments.filter(a => {
                      const staffId = staffData.id || staffData._id;
                      return a.subject_teachers?.some(st => st.teacher_id === staffId);
                    }).map(a => (
                      <option key={a.id} value={a.id}>{a.class_name} {a.section}</option>
                    ))}
                  </select>

                  <select 
                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedAssignment}
                  >
                    <option value="">-- Select Subject --</option>
                    {selectedAssignment?.subject_teachers?.filter(st => {
                      const staffId = staffData.id || staffData._id;
                      return st.teacher_id === staffId;
                    }).map(st => (
                      <option key={st.subject} value={st.subject}>{st.subject}</option>
                    ))}
                  </select>

                  <select 
                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedExam(e.target.value)}
                  >
                    <option value="">-- Select Exam --</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                {students.length > 0 && selectedSubject && selectedExam && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-y border-gray-100">
                          <th className="p-3 text-sm text-gray-600">Student ID</th>
                          <th className="p-3 text-sm text-gray-600">Marks Obtained</th>
                          <th className="p-3 text-sm text-gray-600">Max Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(s => (
                          <tr key={s.id} className="border-b border-gray-50">
                            <td className="p-3 text-sm font-medium">{s.name} ({s.roll_number})</td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                className="border p-2 rounded w-24 outline-none focus:border-blue-500"
                                value={marksGrid[s.id]?.obtained || ''}
                                onChange={e => setMarksGrid({...marksGrid, [s.id]: { ...marksGrid[s.id], obtained: e.target.value }})}
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                className="border p-2 rounded w-24 outline-none"
                                value={marksGrid[s.id]?.max || 100}
                                onChange={e => setMarksGrid({...marksGrid, [s.id]: { ...marksGrid[s.id], max: e.target.value }})}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-6 flex justify-end">
                      <button onClick={handleSubmitMarks} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
                        Submit Marks to Class Teacher
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'class-review' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <select 
                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedAssignment(assignments.find(a => a.id === e.target.value))}
                  >
                    <option value="">-- Select Your Assigned Class --</option>
                    {assignments.filter(a => a.class_teacher_id === staffData.id).map(a => (
                      <option key={a.id} value={a.id}>{a.class_name} {a.section}</option>
                    ))}
                  </select>

                  <select 
                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedExam(e.target.value)}
                  >
                    <option value="">-- Select Exam --</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                {reviewMarks.length > 0 && (
                   <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-gray-50 border-y border-gray-100">
                         <th className="p-3 text-sm text-gray-600">Student</th>
                         <th className="p-3 text-sm text-gray-600">Subject</th>
                         <th className="p-3 text-sm text-gray-600">Original Mark</th>
                         <th className="p-3 text-sm text-gray-600">Modify Mark</th>
                         <th className="p-3 text-sm text-gray-600">Reason for Change</th>
                       </tr>
                     </thead>
                     <tbody>
                       {reviewMarks.map(m => (
                         <tr key={m.id} className="border-b border-gray-50">
                           <td className="p-3 text-sm">{m.student_id}</td>
                           <td className="p-3 text-sm font-medium">{m.subject}</td>
                           <td className="p-3 text-sm">{m.marks_obtained} / {m.max_marks}</td>
                           <td className="p-3">
                             <input 
                               type="number" 
                               className="border p-2 rounded w-24 outline-none focus:border-blue-500"
                               value={modifications[m.id]?.newMark ?? m.marks_obtained}
                               onChange={e => setModifications({...modifications, [m.id]: { ...modifications[m.id], newMark: e.target.value }})}
                             />
                           </td>
                           <td className="p-3">
                             {modifications[m.id]?.newMark && modifications[m.id].newMark !== String(m.marks_obtained) && (
                               <input 
                                 type="text" 
                                 placeholder="Reason required"
                                 required
                                 className="border p-2 rounded w-full outline-none focus:ring-1 focus:ring-red-400 border-red-200 bg-red-50"
                                 value={modifications[m.id]?.reason || ''}
                                 onChange={e => setModifications({...modifications, [m.id]: { ...modifications[m.id], reason: e.target.value }})}
                               />
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   <div className="mt-6 flex justify-end">
                     <button onClick={handleReviewSubmit} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-medium shadow-sm flex items-center gap-2">
                       <FaCheckDouble />
                       Confirm & Submit to Admin
                     </button>
                   </div>
                 </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherPortal;
