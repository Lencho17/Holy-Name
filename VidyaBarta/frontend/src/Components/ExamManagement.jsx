import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGraduationCap, FaPlus, FaSave, FaSpinner, FaEyeSlash } from 'react-icons/fa';

const ExamManagement = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [newExam, setNewExam] = useState({
    name: '',
    class_level: '9',
    type: 'Offline'
  });

  const [selectedExam, setSelectedExam] = useState(null);
  const [marks, setMarks] = useState([]);
  const [savingMarks, setSavingMarks] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(res.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [apiUrl, token]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/exams`, newExam, { headers: { Authorization: `Bearer ${token}` } });
      alert('Exam created successfully');
      setShowCreate(false);
      setNewExam({ name: '', class_level: '9', type: 'Offline' });
      fetchExams();
    } catch (err) {
      alert('Failed to create exam');
    }
  };

  const fetchMarks = async (examId) => {
    try {
      const res = await axios.get(`${apiUrl}/exams/${examId}/marks`, { headers: { Authorization: `Bearer ${token}` } });
      setMarks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    fetchMarks(exam.id);
  };

  const handleSaveMarks = async () => {
    if (!selectedExam) return;
    setSavingMarks(true);
    try {
      await axios.post(`${apiUrl}/exams/${selectedExam.id}/marks`, { marks }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Marks saved successfully!');
    } catch (err) {
      alert('Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const toggleWithhold = async (studentId, subject, currentStatus) => {
    try {
      await axios.put(`${apiUrl}/exams/${selectedExam.id}/marks/${studentId}/withhold`, { subject, withheld: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchMarks(selectedExam.id);
    } catch (err) {
      alert('Failed to update withhold status');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading exams...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaGraduationCap className="text-indigo-600 text-2xl" />
          <h2 className="text-2xl font-black text-gray-800">Exam Management</h2>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700"
        >
          <FaPlus /> Create New Exam
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateExam} className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Exam Name</label>
            <input required type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg" placeholder="e.g. Mid-Term 2026" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Class Level</label>
            <input required type="text" value={newExam.class_level} onChange={e => setNewExam({...newExam, class_level: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg" placeholder="e.g. 10" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Type</label>
            <select value={newExam.type} onChange={e => setNewExam({...newExam, type: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg">
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white p-2.5 rounded-lg font-bold hover:bg-green-700 w-full">Save Exam</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r pr-6">
          <h3 className="font-bold text-gray-700 mb-4">Past & Upcoming Exams</h3>
          <div className="space-y-3">
            {exams.map(exam => (
              <div 
                key={exam.id} 
                onClick={() => handleSelectExam(exam)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedExam?.id === exam.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-gray-50 border-gray-100'}`}
              >
                <div className="font-bold text-gray-800">{exam.name}</div>
                <div className="text-xs text-gray-500 mt-1">Class {exam.class_level} • {exam.type.toUpperCase()}</div>
              </div>
            ))}
            {exams.length === 0 && <div className="text-sm text-gray-400 text-center py-4">No exams created yet.</div>}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedExam ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">{selectedExam.name} - Class {selectedExam.class_level} Marks</h3>
                <button onClick={handleSaveMarks} disabled={savingMarks} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                  {savingMarks ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Marks
                </button>
              </div>
              
              {/* In a real app, this would be a table with a row for each student enrolled in this class. For now, we show the saved marks. */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-600 font-bold">
                    <tr>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Marks</th>
                      <th className="p-3">Total</th>
                      <th className="p-3 text-center">Withhold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="p-3 font-mono">{m.student_id}</td>
                        <td className="p-3">{m.subject}</td>
                        <td className="p-3">
                          <input type="number" value={m.marks_obtained} onChange={(e) => {
                            const newMarks = [...marks];
                            newMarks[idx].marks_obtained = e.target.value;
                            setMarks(newMarks);
                          }} className="w-16 p-1 border rounded" />
                        </td>
                        <td className="p-3">{m.total_marks}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => toggleWithhold(m.student_id, m.subject, m.withheld)} className={`p-1.5 rounded-lg ${m.withheld ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500 hover:bg-red-50'}`}>
                            <FaEyeSlash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {marks.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">No marks entered yet. (Student fetching UI goes here)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Select an exam from the left to manage marks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
