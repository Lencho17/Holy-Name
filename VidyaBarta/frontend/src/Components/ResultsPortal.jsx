import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaDownload, FaSpinner } from 'react-icons/fa';

const ResultsPortal = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [grievances, setGrievances] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(res.data);

      const gRes = await axios.get(`/api/grievances`, { headers: { Authorization: `Bearer ${token}` } });
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

  const handlePublish = async (id) => {
    if(!window.confirm('Publish results? Students will see their marks and have 7 days to raise grievances.')) return;
    try {
      await axios.post(`/api/exams/${id}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (e) { alert('Failed to publish'); }
  };

  const handleFinalize = async (id) => {
    if(!window.confirm('Finalize results? Marks will be locked permanently.')) return;
    try {
      await axios.post(`/api/exams/${id}/finalize`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (e) { alert(e.response?.data?.message || 'Failed to finalize'); }
  };

  const handleResolveGrievance = async (id, status, admin_reply) => {
    try {
      await axios.patch(`/api/grievances/${id}/resolve`, { status, admin_reply }, { headers: { Authorization: `Bearer ${token}` } });
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-800">{exam.name}</div>
                <div className="text-xs text-gray-500">Class {exam.class_level} • Status: {exam.status}</div>
              </div>
              <div className="flex gap-2">
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
                  <div className="font-bold text-gray-800">Student: {g.student?.name} ({g.student?.roll_number})</div>
                  <div className="text-xs text-gray-500">Exam: {g.exam?.name} | Subject: {g.subject} | Status: <span className={g.status === 'Resolved' ? 'text-green-600' : 'text-orange-600'}>{g.status}</span></div>
                </div>
                <div className="text-xs text-gray-400">{new Date(g.created_at).toLocaleDateString()}</div>
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
