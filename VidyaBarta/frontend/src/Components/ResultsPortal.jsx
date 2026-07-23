import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaDownload, FaSpinner } from 'react-icons/fa';

const ResultsPortal = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedExam, setExpandedExam] = useState(null);
  const [examDetails, setExamDetails] = useState({ marks: [], students: [], timetable: [], aggregated: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(res.data);

      const gRes = await axios.get(`${apiUrl}/grievances`, { headers: { Authorization: `Bearer ${token}` } });
      setGrievances(gRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl, token]);

  const toggleExam = async (exam) => {
    if (expandedExam === exam.id) {
      setExpandedExam(null);
      return;
    }
    setExpandedExam(exam.id);
    setLoadingDetails(true);
    try {
      const mRes = await axios.get(`${apiUrl}/exams/${exam.id}/marks`, { headers: { Authorization: `Bearer ${token}` } });
      const marks = mRes.data;
      
      const tRes = await axios.get(`${apiUrl}/exams/${exam.id}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      const timetable = tRes.data;
      
      const parts = (exam.class_level || '').split(' ');
      let url = `${apiUrl}/students?class_level=${parts[0]}`;
      if (parts[1]) url += `&section=${parts[1]}`;
      const sRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const students = sRes.data.data || sRes.data;
      
      const studentMap = {};
      students.forEach(s => {
        studentMap[s.id] = { student: s, totalObtained: 0, totalMax: 0, subjectsPassed: 0, subjectsCount: 0 };
      });
      
      marks.forEach(m => {
        if (!studentMap[m.student_id]) return;
        const entry = studentMap[m.student_id];
        entry.totalObtained += (parseFloat(m.marks_obtained) || 0) + (parseFloat(m.practical_marks_obtained) || 0);
        entry.totalMax += (parseFloat(m.max_marks) || 0);
        entry.subjectsCount += 1;
        
        const tt = timetable.find(t => t.subject === m.subject);
        const passingMarks = tt ? (parseFloat(tt.passing_marks) || 40) : 40;
        const subTotal = (parseFloat(m.marks_obtained) || 0) + (parseFloat(m.practical_marks_obtained) || 0);
        if (subTotal >= passingMarks) entry.subjectsPassed += 1;
      });
      
      const aggregated = Object.values(studentMap).map(e => ({
        ...e,
        percentage: e.totalMax > 0 ? ((e.totalObtained / e.totalMax) * 100).toFixed(1) : 0
      })).filter(e => e.subjectsCount > 0);
      
      setExamDetails({ marks, students, timetable, aggregated });
    } catch (e) {
      console.error(e);
      alert('Failed to load exam details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePublish = async (id) => {
    if(!window.confirm('Publish results? Students will see their marks and have 7 days to raise grievances.')) return;
    try {
      await axios.post(`${apiUrl}/exams/${id}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (e) { alert('Failed to publish'); }
  };

  const handleFinalize = async (id) => {
    if(!window.confirm('Finalize results? Marks will be locked permanently.')) return;
    try {
      await axios.post(`${apiUrl}/exams/${id}/finalize`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (e) { alert(e.response?.data?.message || 'Failed to finalize'); }
  };

  const handleResolveGrievance = async (id, status, admin_reply) => {
    try {
      await axios.patch(`${apiUrl}/grievances/${id}/resolve`, { status, admin_reply }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (e) { alert('Failed to resolve grievance'); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading data...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaFileAlt className="text-teal-600 text-2xl" />
        <h2 className="text-2xl font-black text-gray-800">Results & Marksheets</h2>
      </div>

      <div className="bg-teal-50/50 rounded-xl p-5 border border-teal-100">
        <h3 className="font-bold text-teal-800 mb-4">Generate Marksheets for Exams</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleExam(exam)}
              >
                <div>
                  <div className="font-bold text-gray-800">{exam.name}</div>
                  <div className="text-xs text-gray-500">Class {exam.class_level} • Status: {exam.workflow_status || 'Draft'}</div>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                {exam.workflow_status === 'ClassReview' && (
                  <button onClick={() => handlePublish(exam.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700">
                    Publish Results
                  </button>
                )}
                {exam.workflow_status === 'Published' && (
                  <button onClick={() => handleFinalize(exam.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700">
                    Finalize
                  </button>
                )}
                {(exam.workflow_status === 'Published' || exam.workflow_status === 'Finalized') && (
                  <button 
                    onClick={() => {
                      // Original print logic kept for convenience, in a real app would use SVG templates
                      alert('Download Marksheet (Will use SVG template soon)');
                    }}
                    className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-200"
                  >
                    <FaDownload /> Download
                  </button>
                )}
                {(!exam.workflow_status || exam.workflow_status === 'Draft' || exam.workflow_status === 'SubjectEntry') && (
                  <span className="text-sm text-gray-400 italic">Waiting on Teachers</span>
                )}
              </div>
                </div>
              {expandedExam === exam.id && (
                <div className="border-t p-4 bg-gray-50">
                  {loadingDetails ? (
                    <div className="text-center text-sm text-gray-500 py-4"><FaSpinner className="animate-spin inline mr-2" /> Loading student data...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-white rounded border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100 border-b">
                            <th className="p-2 text-xs font-bold text-gray-700">Student Name</th>
                            <th className="p-2 text-xs font-bold text-gray-700">Total Marks</th>
                            <th className="p-2 text-xs font-bold text-gray-700">Percentage</th>
                            <th className="p-2 text-xs font-bold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examDetails.aggregated.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center text-sm text-gray-500">No marks entry found.</td></tr>
                          ) : (
                            examDetails.aggregated.map(row => (
                              <tr key={row.student.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-2 text-sm">{row.student.student_name || row.student.name} <span className="text-gray-400 text-xs">({row.student.admission_id || row.student.roll_number})</span></td>
                                <td className="p-2 text-sm font-medium">{row.totalObtained} / {row.totalMax}</td>
                                <td className="p-2 text-sm">{row.percentage}%</td>
                                <td className="p-2 text-sm">
                                  {row.subjectsPassed === row.subjectsCount ? (
                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs border border-green-100">Passed ({row.subjectsPassed}/{row.subjectsCount})</span>
                                  ) : (
                                    <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded text-xs border border-orange-100">Passed {row.subjectsPassed}/{row.subjectsCount} Subjects</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {exams.length === 0 && (
             <div className="text-sm text-gray-400">No exams available.</div>
          )}
        </div>
      </div>

      <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100 mt-6">
        <h3 className="font-bold text-orange-800 mb-4">Grievance Management</h3>
        <div className="grid grid-cols-1 gap-4">
          {grievances.length === 0 ? <div className="text-sm text-gray-400">No grievances reported.</div> : null}
          {grievances.map(g => (
            <div key={g.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-gray-800">Student: {g.student?.student_name || g.student?.name} ({g.student?.admission_id || g.student?.roll_number})</div>
                  <div className="text-xs text-gray-500">Exam: {g.exam?.name} | Subject: {g.subject?.replace(/^VB-?/, '')} | Status: <span className={g.status === 'Resolved' ? 'text-green-600' : 'text-orange-600'}>{g.status}</span></div>
                </div>
                <div className="text-xs text-gray-400">{new Date(g.created_at).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</div>
              </div>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-3">
                <strong>Complaint:</strong> {g.complaint}
              </div>
              {g.status !== 'Resolved' ? (
                <div className="flex gap-2 mt-2">
                  <input type="text" id={`reply-${g.id}`} placeholder="Admin Reply (Optional)" className="border rounded p-1 text-sm flex-1" />
                  <button onClick={() => {
                    const reply = document.getElementById(`reply-${g.id}`).value;
                    handleResolveGrievance(g.id, 'Resolved', reply);
                  }} className="bg-green-600 text-white text-xs px-3 py-1 rounded">Mark Resolved</button>
                </div>
              ) : (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                  <strong>Admin Reply:</strong> {g.admin_reply || 'No reply provided.'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsPortal;
