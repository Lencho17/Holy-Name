import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGraduationCap, FaFileAlt, FaPen, FaClipboardList, FaUsers, FaUpload } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffAcademics = () => {
  const [activeTab, setActiveTab] = useState('assignments'); 
  
  const [assignments, setAssignments] = useState([]);
  const [papers, setPapers] = useState([]);
  const [marks, setMarks] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('staffToken');
      const headers = { Authorization: `Bearer ${token}` };
      if (tab === 'assignments') {
        const res = await axios.get(`${API_URL}/staff/assignments`, { headers });
        setAssignments(res.data);
      } else if (tab === 'papers') {
        const res = await axios.get(`${API_URL}/staff/question-papers`, { headers });
        setPapers(res.data);
      } else if (tab === 'marks') {
        const res = await axios.get(`${API_URL}/staff/marks`, { headers });
        setMarks(res.data);
      }
      setShowForm(false);
    } catch (err) {
      console.error(`Failed to fetch ${tab}`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    
    setUploadingFile(true);
    try {
      const res = await axios.post(`${API_URL}/upload`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, file_url: res.data.url || res.data.secure_url });
    } catch (err) {
      alert('File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e, endpoint, fetchKey) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('staffToken');
      await axios.post(`${API_URL}/staff/${endpoint}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      alert('Saved successfully');
      setFormData({});
      fetchData(fetchKey);
    } catch (err) { alert('Failed to save'); }
  };

  const tabs = [
    { id: 'assignments', label: 'Assignments', icon: <FaPen /> },
    { id: 'papers', label: 'Q. Papers', icon: <FaFileAlt /> },
    { id: 'marks', label: 'Marks', icon: <FaGraduationCap /> },
    { id: 'mcq', label: 'MCQ Exams', icon: <FaClipboardList /> },
    { id: 'reports', label: 'Reports', icon: <FaUsers /> }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 flex items-center gap-2 font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 min-h-[500px]">
        {loading ? (
          <p className="text-gray-500 text-center">Loading data...</p>
        ) : (
          <>
            {activeTab === 'assignments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-800">Your Assignments</h4>
                  <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700">
                    {showForm ? 'Cancel' : 'Create Assignment'}
                  </button>
                </div>
                
                {showForm && (
                  <form onSubmit={(e) => handleSubmit(e, 'assignments', 'assignments')} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="Title" value={formData.title||''} onChange={e => setFormData({...formData, title: e.target.value})} className="p-2 border rounded" />
                      <input required type="text" placeholder="Subject" value={formData.subject||''} onChange={e => setFormData({...formData, subject: e.target.value})} className="p-2 border rounded" />
                      <input required type="text" placeholder="Class (e.g. 10)" value={formData.class_level||''} onChange={e => setFormData({...formData, class_level: e.target.value})} className="p-2 border rounded" />
                      <input required type="text" placeholder="Section (e.g. A)" value={formData.section||''} onChange={e => setFormData({...formData, section: e.target.value})} className="p-2 border rounded" />
                      <input required type="date" value={formData.deadline||''} onChange={e => setFormData({...formData, deadline: e.target.value})} className="p-2 border rounded" />
                      <div className="flex items-center gap-2">
                        <input type="file" onChange={handleFileUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {uploadingFile && <span className="text-xs text-blue-500 font-bold">Uploading...</span>}
                      </div>
                    </div>
                    <textarea required placeholder="Description" value={formData.description||''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded resize-none" rows="3"></textarea>
                    {formData.file_url && <p className="text-sm text-green-600 font-bold">✓ File attached successfully</p>}
                    <button type="submit" disabled={uploadingFile} className="w-full py-2 bg-blue-600 text-white font-bold rounded disabled:opacity-50">Submit Assignment</button>
                  </form>
                )}

                {assignments.length === 0 ? <p className="text-gray-500">No assignments created yet.</p> : (
                  <div className="grid gap-4">
                    {assignments.map(a => (
                      <div key={a.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <p className="font-bold text-gray-800">{a.title} <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md ml-2">{a.subject}</span></p>
                          <p className="text-sm text-gray-500 mt-1">Class {a.class_level} {a.section} | Due: {new Date(a.deadline).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-700 mt-2">{a.description}</p>
                        </div>
                        {a.file_url && (
                           <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 bg-blue-50 p-3 rounded-full">
                             <FaFileAlt size={20} />
                           </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'papers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-800">Question Papers Bank</h4>
                  <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700">
                    {showForm ? 'Cancel' : 'Upload Paper'}
                  </button>
                </div>
                
                {showForm && (
                  <form onSubmit={(e) => handleSubmit(e, 'question-papers', 'papers')} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="Title (e.g. Midterm 2026)" value={formData.title||''} onChange={e => setFormData({...formData, title: e.target.value})} className="p-2 border rounded col-span-2" />
                      <input required type="text" placeholder="Subject" value={formData.subject||''} onChange={e => setFormData({...formData, subject: e.target.value})} className="p-2 border rounded" />
                      <input required type="text" placeholder="Class (e.g. 10)" value={formData.class_level||''} onChange={e => setFormData({...formData, class_level: e.target.value})} className="p-2 border rounded" />
                      <div className="col-span-2 flex items-center gap-2 bg-white p-2 border rounded">
                        <input required type="file" onChange={handleFileUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {uploadingFile && <span className="text-xs text-blue-500 font-bold">Uploading...</span>}
                        {formData.file_url && <span className="text-sm text-green-600 font-bold">✓ Ready</span>}
                      </div>
                    </div>
                    <button type="submit" disabled={uploadingFile || !formData.file_url} className="w-full py-2 bg-blue-600 text-white font-bold rounded disabled:opacity-50">Upload Question Paper</button>
                  </form>
                )}

                {papers.length === 0 ? <p className="text-gray-500">No question papers uploaded.</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {papers.map(p => (
                      <div key={p.id} className="p-4 border border-blue-100 rounded-xl flex items-center gap-4 bg-blue-50/30 hover:bg-blue-50 transition-colors">
                        <div className="p-3 bg-white rounded-lg shadow-sm text-blue-500"><FaFileAlt size={24} /></div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm leading-tight">{p.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{p.subject} • Class {p.class_level}</p>
                        </div>
                        <a href={p.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 bg-white p-2 rounded-full shadow-sm">
                          <FaUpload />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marks' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-800">Student Marks Entry</h4>
                  <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700">
                    {showForm ? 'Cancel' : 'Enter Marks'}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={(e) => handleSubmit(e, 'marks', 'marks')} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input required type="text" placeholder="Student ID (UUID)" value={formData.student_id||''} onChange={e => setFormData({...formData, student_id: e.target.value})} className="p-2 border rounded md:col-span-3" />
                      <input required type="text" placeholder="Exam Name (e.g. Finals)" value={formData.exam_name||''} onChange={e => setFormData({...formData, exam_name: e.target.value})} className="p-2 border rounded" />
                      <input required type="text" placeholder="Subject" value={formData.subject||''} onChange={e => setFormData({...formData, subject: e.target.value})} className="p-2 border rounded" />
                      <input required type="number" placeholder="Max Marks" value={formData.max_marks||''} onChange={e => setFormData({...formData, max_marks: e.target.value})} className="p-2 border rounded" />
                      <input required type="text" placeholder="Marks Obtained (or 'ABS')" value={formData.marks_obtained||''} onChange={e => setFormData({...formData, marks_obtained: e.target.value})} className="p-2 border rounded md:col-span-3 font-bold text-blue-600" />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded">Save Marks</button>
                  </form>
                )}

                {marks.length === 0 ? <p className="text-gray-500">No marks entered yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 border-b text-sm text-gray-600">Student ID</th>
                          <th className="p-3 border-b text-sm text-gray-600">Exam</th>
                          <th className="p-3 border-b text-sm text-gray-600">Subject</th>
                          <th className="p-3 border-b text-sm text-gray-600 text-right">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="p-3 border-b text-sm text-gray-800 font-mono text-xs">{m.student_id.substring(0,8)}...</td>
                            <td className="p-3 border-b text-sm text-gray-800 font-bold">{m.exam_name}</td>
                            <td className="p-3 border-b text-sm text-gray-800">{m.subject}</td>
                            <td className="p-3 border-b text-sm text-right font-bold text-blue-600">{m.marks_obtained} / {m.max_marks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Other tabs are structured similarly */}
            {['mcq', 'reports'].includes(activeTab) && (
              <div className="text-center py-12">
                <div className="inline-block p-4 rounded-full bg-blue-50 text-blue-600 text-4xl mb-4">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">{tabs.find(t => t.id === activeTab)?.label} Module</h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  This sub-module is currently under development. Advanced interactive forms will be rendered here soon.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffAcademics;
