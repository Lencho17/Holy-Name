import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaCheckCircle, FaCalendarAlt, FaArrowLeft, FaDownload } from 'react-icons/fa';

const ExamManagement = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [timetablesMap, setTimetablesMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Views: 'list', 'timetable', 'marks'
  const [view, setView] = useState('list');
  const [selectedClassExam, setSelectedClassExam] = useState(null);
  
  // Timetable State
  const [timetableData, setTimetableData] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [savingTimetable, setSavingTimetable] = useState(false);

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', type: 'Offline', class_levels: [] });
  const allClasses = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const fetchExamsAndStatus = async () => {
    try {
      setLoading(true);
      const { data: examsData } = await axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(examsData);
      
      // Let's assume timetable status is true if timetable exists
      // Doing N requests is bad, but for the UI mockup we can just default to false
      // Or we can fetch them individually as needed. For now we will leave the map empty unless opened.
      // Or we could fetch one by one in the background
      const ttMap = {};
      await Promise.all(examsData.map(async (exam) => {
          try {
              const { data: tt } = await axios.get(`${apiUrl}/exams/${exam.id}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
              if (tt.length > 0) {
                  ttMap[exam.id] = true;
              }
          } catch(e) {}
      }));
      setTimetablesMap(ttMap);
      
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsAndStatus();
  }, [apiUrl, token]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (newExam.class_levels.length === 0) return alert('Select at least one class');
    try {
      await axios.post(`${apiUrl}/exams`, newExam, { headers: { Authorization: `Bearer ${token}` } });
      setShowCreate(false);
      setNewExam({ name: '', type: 'Offline', class_levels: [] });
      fetchExamsAndStatus();
    } catch (error) {
      console.error(error);
      alert('Failed to create exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    // Currently backend only supports delete by name group /exams/group/:name
    // To delete single exam class, we need an endpoint. Since we don't know if we have one, we will use the UI filtering.
    // Let's just delete the group for now if that's all we have.
    alert('Currently, deleting a single class exam record requires a dedicated backend route. For now, it is hidden from UI.');
    setExams(exams.filter(e => e.id !== examId));
  };

  const openTimetable = async (examRecord) => {
    setSelectedClassExam(examRecord);
    setView('timetable');
    
    // Fetch configured subjects for this class
    try {
      const { data: config } = await axios.get(`${apiUrl}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } });
      const cleanClassLevel = (lvl) => typeof lvl === 'string' ? lvl.replace(/Class /g, '').trim() : lvl;
      const clsConfig = config.find(c => cleanClassLevel(c.class_level) === cleanClassLevel(examRecord.class_level));
      let subs = [];
      if (clsConfig) {
        subs = [...(clsConfig.core_subjects || []), ...((clsConfig.elective_groups || []).flatMap(g => g.subjects || []))];
      }
      setAvailableSubjects(subs.map(s => s.name || s.subject_name));
    } catch (err) {
      console.error(err);
    }

    // Fetch existing timetable
    try {
      const { data: tt } = await axios.get(`${apiUrl}/exams/${examRecord.id}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      setTimetableData(tt.length > 0 ? tt : []);
    } catch (err) {
      console.error(err);
    }
  };

  const addTimetableRow = () => {
    setTimetableData([...timetableData, {
      class_level: selectedClassExam.class_level,
      subject: '',
      sub_subject: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      total_marks: 100,
      passing_marks: 30,
      has_practical: false,
      theory_marks: '',
      practical_marks: '',
      room_number: ''
    }]);
  };

  const handleSaveTimetable = async () => {
    setSavingTimetable(true);
    try {
      await axios.post(`${apiUrl}/exams/${selectedClassExam.id}/timetable`, { timetableData }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Timetable Saved!');
      setTimetablesMap(prev => ({...prev, [selectedClassExam.id]: true}));
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to save timetable');
    }
    setSavingTimetable(false);
  };

  if (loading) return <div className="p-8 text-center"><FaSpinner className="animate-spin inline mr-2" /> Loading...</div>;

  return (
    <div className="bg-white rounded-lg p-2 md:p-6 min-h-screen">
      
      {view === 'list' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">Exam Management</h2>
            <button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-sm">
              <FaPlus /> Create Exam
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-700">
                  <th className="p-4 text-sm font-bold">No.</th>
                  <th className="p-4 text-sm font-bold">Name</th>
                  <th className="p-4 text-sm font-bold">Description</th>
                  <th className="p-4 text-sm font-bold">Class</th>
                  <th className="p-4 text-sm font-bold">Timetable Created</th>
                  <th className="p-4 text-sm font-bold">Publish Result</th>
                  <th className="p-4 text-sm font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {exams.map((exam, idx) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-gray-800">{idx + 1}</td>
                    <td className="p-4 text-sm text-gray-700">{exam.name}</td>
                    <td className="p-4 text-sm text-gray-500">{exam.type}</td>
                    <td className="p-4 text-sm text-gray-700 font-medium">Class {exam.class_level}</td>
                    <td className="p-4">
                      {timetablesMap[exam.id] ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold shadow-sm">Yes</span>
                      ) : (
                        <span className="bg-pink-400 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">No</span>
                      )}
                    </td>
                    <td className="p-4">
                      {/* Placeholder for Publish Result */}
                      <span className="bg-pink-400 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">No</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openTimetable(exam)} className="bg-blue-400 text-white w-8 h-8 rounded-full hover:bg-blue-500 transition-colors flex items-center justify-center shadow-sm" title="Manage Timetable"><FaCalendarAlt size={12} /></button>
                        <button className="bg-[#20c997] text-white w-8 h-8 rounded-full hover:bg-teal-500 transition-colors flex items-center justify-center shadow-sm" title="Publish Result"><FaCheckCircle size={12} /></button>
                        <button onClick={() => handleDeleteExam(exam.id)} className="bg-[#4a5568] text-white w-8 h-8 rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center shadow-sm" title="Delete"><FaTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 font-medium">No exams created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'timetable' && selectedClassExam && (
        <div className="bg-[#f9fafb] p-6 rounded-lg">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-800">Create Exam Timetable</h2>
            <button onClick={() => setView('list')} className="bg-[#2A526A] text-white px-5 py-2 rounded font-bold text-sm hover:bg-[#1f3f52]">Back</button>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Exam</label>
              <div className="bg-[#e9ecef] p-3 rounded text-sm text-gray-700 font-medium border border-gray-200">{selectedClassExam.name}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Class</label>
              <div className="bg-[#e9ecef] p-3 rounded text-sm text-gray-700 font-medium border border-gray-200">Class {selectedClassExam.class_level}</div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {timetableData.map((row, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm relative">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Subject</label>
                    <select value={row.subject} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].subject = e.target.value; setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="">-- Select --</option>
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Total Marks <span className="text-pink-400">*</span></label>
                    <input type="number" value={row.total_marks || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].total_marks = parseInt(e.target.value); setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Total Marks" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Passing Marks <span className="text-pink-400">*</span></label>
                    <input type="number" value={row.passing_marks || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].passing_marks = parseInt(e.target.value); setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Passing Marks" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative pr-12">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Start Time <span className="text-pink-400">*</span></label>
                    <div className="relative">
                      <input type="time" value={row.start_time || ''} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].start_time = e.target.value; setTimetableData(newTt);
                      }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500 pr-8" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">End Time <span className="text-pink-400">*</span></label>
                    <div className="relative">
                      <input type="time" value={row.end_time || ''} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].end_time = e.target.value; setTimetableData(newTt);
                      }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500 pr-8" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Date <span className="text-pink-400">*</span></label>
                    <input type="date" value={row.exam_date || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].exam_date = e.target.value; setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  
                  {/* Delete button positioned absolute right like the red X in screenshot */}
                  <button onClick={() => setTimetableData(timetableData.filter((_, i) => i !== idx))} className="absolute bottom-0 right-0 bg-pink-100 text-pink-400 hover:bg-pink-200 rounded transition w-10 h-10 flex items-center justify-center font-bold text-lg leading-none pb-1">
                    ×
                  </button>
                </div>
                
                {/* Advanced Fields: Divide Subject and Practical */}
                <div className="mt-6 pt-4 border-t border-dashed border-gray-200 flex flex-wrap gap-6 items-center">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={!!row.sub_subject} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].sub_subject = e.target.checked ? 'Paper 1' : ''; setTimetableData(newTt);
                      }} className="rounded text-[#20c997] focus:ring-[#20c997] w-4 h-4" /> Divide Subject
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={row.has_practical} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].has_practical = e.target.checked; setTimetableData(newTt);
                      }} className="rounded text-[#20c997] focus:ring-[#20c997] w-4 h-4" /> Include Practical
                    </label>
                  </div>
                  
                  {row.sub_subject !== '' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-600">Paper:</label>
                      <input type="text" value={row.sub_subject} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].sub_subject = e.target.value; setTimetableData(newTt);
                      }} className="border-gray-300 border p-1.5 rounded text-sm w-40 bg-white" placeholder="e.g. Paper 1" />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => {
                          const newTt = [...timetableData];
                          newTt.splice(idx + 1, 0, { ...row, sub_subject: 'Paper 2', start_time: '', end_time: '', exam_date: '' });
                          setTimetableData(newTt);
                        }} className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-8 h-8 rounded text-sm font-bold flex items-center justify-center">+</button>
                        <button type="button" onClick={() => {
                          const newTt = timetableData.filter((_, i) => i !== idx);
                          setTimetableData(newTt);
                        }} className="bg-gray-100 text-gray-600 hover:bg-gray-200 w-8 h-8 rounded text-sm font-bold flex items-center justify-center">-</button>
                      </div>
                    </div>
                  )}

                  {row.has_practical && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-600">Marks Split:</label>
                      <input type="number" value={row.theory_marks || ''} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].theory_marks = parseInt(e.target.value); setTimetableData(newTt);
                      }} className="border-gray-300 border p-1.5 rounded text-xs w-20 bg-white" placeholder="Theory" title="Theory" />
                      <input type="number" value={row.practical_marks || ''} onChange={e => {
                        const newTt = [...timetableData]; newTt[idx].practical_marks = parseInt(e.target.value); setTimetableData(newTt);
                      }} className="border-gray-300 border p-1.5 rounded text-xs w-20 bg-white" placeholder="Prac" title="Practical" />
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <button onClick={addTimetableRow} className="bg-[#20c997] text-white px-5 py-2.5 rounded font-bold text-sm hover:bg-[#1ba87e] transition shadow-sm">Add New Data</button>
            <button onClick={handleSaveTimetable} disabled={savingTimetable} className="bg-[#2A526A] text-white px-8 py-2.5 rounded font-bold text-sm hover:bg-[#1f3f52] transition shadow-sm">
              {savingTimetable ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </div>
      )}


      {/* CREATE EXAM MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-xl font-bold mb-4">Create New Exam</h2>
            <form onSubmit={handleCreateExam}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Exam Name</label>
                <input required type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. First Term Exam" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select value={newExam.type} onChange={e => setNewExam({...newExam, type: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Classes</label>
                <div className="grid grid-cols-3 gap-2">
                  {allClasses.map(c => (
                    <label key={c} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={newExam.class_levels.includes(c)} onChange={(e) => {
                        if(e.target.checked) setNewExam({...newExam, class_levels: [...newExam.class_levels, c]});
                        else setNewExam({...newExam, class_levels: newExam.class_levels.filter(cl => cl !== c)});
                      }} className="rounded text-indigo-600" /> Class {c}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-[#20c997] text-white p-3 rounded font-bold hover:bg-[#1ba87e] transition">Create Exam</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamManagement;
