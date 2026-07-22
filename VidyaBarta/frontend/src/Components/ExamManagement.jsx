import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaSave, FaSpinner, FaTrash, FaTable, FaEdit } from 'react-icons/fa';

const ExamManagement = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', type: 'Offline', class_levels: [] });
  const [selectedExamGroup, setSelectedExamGroup] = useState(null); // The selected exam name group
  const [selectedClassExam, setSelectedClassExam] = useState(null); // The specific exam record for a class
  
  // Timetable State
  const [timetableTab, setTimetableTab] = useState('marks'); // 'marks' or 'timetable'
  const [timetableData, setTimetableData] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [savingTimetable, setSavingTimetable] = useState(false);

  // Marks State
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [savingMarks, setSavingMarks] = useState(false);

  const allClasses = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const fetchExams = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [apiUrl, token]);

  // Group exams by name
  const groupedExams = exams.reduce((acc, exam) => {
    if (!acc[exam.name]) acc[exam.name] = [];
    acc[exam.name].push(exam);
    return acc;
  }, {});

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (newExam.class_levels.length === 0) return alert('Select at least one class');
    try {
      await axios.post(`${apiUrl}/exams`, newExam, { headers: { Authorization: `Bearer ${token}` } });
      setShowCreate(false);
      setNewExam({ name: '', type: 'Offline', class_levels: [] });
      fetchExams();
    } catch (error) {
      console.error(error);
      alert('Failed to create exam');
    }
  };

  const handleSelectExamClass = async (examRecord) => {
    setSelectedClassExam(examRecord);
    setTimetableTab('timetable');
    
    // Fetch configured subjects for this class
    try {
      const { data: config } = await axios.get(`${apiUrl}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } });
      const clsConfig = config.find(c => c.class_level === examRecord.class_level);
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
    } catch (err) {
      console.error(err);
      alert('Failed to save timetable');
    }
    setSavingTimetable(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading exams...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800">Exam Management</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
          <FaPlus /> Create Exam
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateExam} className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Exam Name</label>
            <input required type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg" placeholder="e.g. Mid-Term 2026" />
            
            <label className="block text-xs font-bold text-gray-600 uppercase mt-3 mb-1">Type</label>
            <select value={newExam.type} onChange={e => setNewExam({...newExam, type: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg">
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 flex justify-between">
              Select Classes
              <button type="button" onClick={() => setNewExam({...newExam, class_levels: newExam.class_levels.length === allClasses.length ? [] : allClasses})} className="text-indigo-600 hover:underline">Select All</button>
            </label>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 bg-white p-3 rounded-lg border border-gray-200">
              {allClasses.map(c => (
                <label key={c} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newExam.class_levels.includes(c)}
                    onChange={(e) => {
                      if (e.target.checked) setNewExam({...newExam, class_levels: [...newExam.class_levels, c]});
                      else setNewExam({...newExam, class_levels: newExam.class_levels.filter(cl => cl !== c)});
                    }}
                    className="rounded text-indigo-600"
                  />
                  Class {c}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700">Save Exam Config</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 border-r pr-6">
          <h3 className="font-bold text-gray-700 mb-4">Exams List</h3>
          <div className="space-y-4">
            {Object.keys(groupedExams).length === 0 ? <p className="text-sm text-gray-400 text-center">No exams created.</p> : null}
            {Object.entries(groupedExams).map(([examName, classesArray]) => (
              <div key={examName} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div 
                  className="bg-gray-100 p-3 font-bold text-gray-800 cursor-pointer flex justify-between items-center"
                  onClick={() => setSelectedExamGroup(selectedExamGroup === examName ? null : examName)}
                >
                  {examName}
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-md">{classesArray.length} Classes</span>
                </div>
                {selectedExamGroup === examName && (
                  <div className="divide-y divide-gray-100 bg-white">
                    {classesArray.map(examRecord => (
                      <div 
                        key={examRecord.id}
                        onClick={() => handleSelectExamClass(examRecord)}
                        className={`p-3 text-sm cursor-pointer hover:bg-indigo-50 transition-colors flex justify-between items-center ${selectedClassExam?.id === examRecord.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                      >
                        <span className="font-semibold text-gray-700">Class {examRecord.class_level}</span>
                        <span className="text-xs text-gray-400">{examRecord.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedClassExam ? (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h3 className="font-black text-gray-900 text-xl">{selectedClassExam.name}</h3>
                  <p className="text-sm text-indigo-600 font-semibold">Class {selectedClassExam.class_level}</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setTimetableTab('timetable')} className={`px-4 py-1.5 text-sm font-bold rounded-md ${timetableTab === 'timetable' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500'}`}><FaTable className="inline mr-1" /> Timetable</button>
                  <button onClick={() => setTimetableTab('marks')} className={`px-4 py-1.5 text-sm font-bold rounded-md ${timetableTab === 'marks' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500'}`}><FaEdit className="inline mr-1" /> Marks Entry</button>
                </div>
              </div>

              {timetableTab === 'timetable' && (
                <div className="space-y-4">
                  {timetableData.map((row, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                      <button onClick={() => setTimetableData(timetableData.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><FaTrash /></button>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
                          <select value={row.subject} onChange={e => {
                            const newTt = [...timetableData]; newTt[idx].subject = e.target.value; setTimetableData(newTt);
                          }} className="w-full border-gray-200 p-2 rounded-lg text-sm">
                            <option value="">Select Subject</option>
                            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                          <input type="date" value={row.exam_date} onChange={e => {
                            const newTt = [...timetableData]; newTt[idx].exam_date = e.target.value; setTimetableData(newTt);
                          }} className="w-full border-gray-200 p-2 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Time (Start - End)</label>
                          <div className="flex items-center gap-1">
                            <input type="time" value={row.start_time} onChange={e => {
                              const newTt = [...timetableData]; newTt[idx].start_time = e.target.value; setTimetableData(newTt);
                            }} className="w-full border-gray-200 p-2 rounded-lg text-sm" />
                            <span className="text-gray-400">-</span>
                            <input type="time" value={row.end_time} onChange={e => {
                              const newTt = [...timetableData]; newTt[idx].end_time = e.target.value; setTimetableData(newTt);
                            }} className="w-full border-gray-200 p-2 rounded-lg text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Room No.</label>
                          <input type="text" value={row.room_number || ''} onChange={e => {
                            const newTt = [...timetableData]; newTt[idx].room_number = e.target.value; setTimetableData(newTt);
                          }} className="w-full border-gray-200 p-2 rounded-lg text-sm" placeholder="e.g. Hall A" />
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Division Toggle */}
                        <div>
                          <label className="flex items-center gap-2 mb-2 cursor-pointer">
                            <input type="checkbox" checked={!!row.sub_subject} onChange={e => {
                              const newTt = [...timetableData]; newTt[idx].sub_subject = e.target.checked ? 'Paper 1' : ''; setTimetableData(newTt);
                            }} className="rounded text-indigo-600" />
                            <span className="text-sm font-bold text-gray-700">Divide Subject (Sub-Subject)</span>
                          </label>
                          {row.sub_subject !== '' && (
                            <input type="text" value={row.sub_subject} onChange={e => {
                              const newTt = [...timetableData]; newTt[idx].sub_subject = e.target.value; setTimetableData(newTt);
                            }} className="w-full border-gray-200 p-2 rounded-lg text-sm mt-1" placeholder="e.g. Physics, Theory Part 1" />
                          )}
                        </div>

                        {/* Practical Toggle */}
                        <div>
                          <label className="flex items-center gap-2 mb-2 cursor-pointer">
                            <input type="checkbox" checked={row.has_practical} onChange={e => {
                              const newTt = [...timetableData]; newTt[idx].has_practical = e.target.checked; setTimetableData(newTt);
                            }} className="rounded text-indigo-600" />
                            <span className="text-sm font-bold text-gray-700">Include Practical?</span>
                          </label>
                          <div className="flex gap-2 mt-1">
                            {row.has_practical ? (
                              <>
                                <input type="number" value={row.theory_marks || ''} onChange={e => {
                                  const newTt = [...timetableData]; newTt[idx].theory_marks = parseInt(e.target.value); setTimetableData(newTt);
                                }} className="w-1/2 border-gray-200 p-2 rounded-lg text-sm" placeholder="Theory Max" />
                                <input type="number" value={row.practical_marks || ''} onChange={e => {
                                  const newTt = [...timetableData]; newTt[idx].practical_marks = parseInt(e.target.value); setTimetableData(newTt);
                                }} className="w-1/2 border-gray-200 p-2 rounded-lg text-sm" placeholder="Prac. Max" />
                              </>
                            ) : (
                              <>
                                <input type="number" value={row.total_marks || ''} onChange={e => {
                                  const newTt = [...timetableData]; newTt[idx].total_marks = parseInt(e.target.value); setTimetableData(newTt);
                                }} className="w-1/2 border-gray-200 p-2 rounded-lg text-sm" placeholder="Total Marks" />
                                <input type="number" value={row.passing_marks || ''} onChange={e => {
                                  const newTt = [...timetableData]; newTt[idx].passing_marks = parseInt(e.target.value); setTimetableData(newTt);
                                }} className="w-1/2 border-gray-200 p-2 rounded-lg text-sm" placeholder="Pass Marks" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center mt-6">
                    <button onClick={addTimetableRow} className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline"><FaPlus /> Add New Data</button>
                    <button onClick={handleSaveTimetable} disabled={savingTimetable} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                      {savingTimetable ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Timetable
                    </button>
                  </div>
                </div>
              )}

              {timetableTab === 'marks' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Marks Entry</h3>
                    <button onClick={async () => {
                      setSavingMarks(true);
                      try {
                        const marksPayload = Object.values(marks);
                        await axios.post(`${apiUrl}/exams/${selectedClassExam.id}/marks/subject-teacher`, { marks: marksPayload }, { headers: { Authorization: `Bearer ${token}` } });
                        alert('Marks saved!');
                      } catch (e) {
                        alert('Failed to save marks');
                      }
                      setSavingMarks(false);
                    }} disabled={savingMarks} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
                      {savingMarks ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Marks
                    </button>
                  </div>
                  
                  {timetableData.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-500">Please configure the timetable first to enter marks.</div>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-100 text-gray-600 font-bold">
                          <tr>
                            <th className="p-3 border-b border-r">Student ID</th>
                            <th className="p-3 border-b border-r">Student Name</th>
                            {timetableData.map((col, idx) => (
                              <th key={idx} className="p-3 border-b border-r text-center" colSpan={col.has_practical ? 2 : 1}>
                                {col.subject} {col.sub_subject ? `(${col.sub_subject})` : ''}
                                <div className="text-xs text-gray-400 font-normal mt-1">
                                  {col.has_practical ? `Th: ${col.theory_marks} | Pr: ${col.practical_marks}` : `Max: ${col.total_marks}`}
                                </div>
                              </th>
                            ))}
                          </tr>
                          <tr>
                            <th className="p-2 border-b border-r"></th>
                            <th className="p-2 border-b border-r"></th>
                            {timetableData.map((col, idx) => col.has_practical ? (
                                <React.Fragment key={idx}>
                                  <th className="p-2 border-b border-r text-xs text-center bg-gray-50">Theory</th>
                                  <th className="p-2 border-b border-r text-xs text-center bg-gray-50">Practical</th>
                                </React.Fragment>
                              ) : (
                                <th key={idx} className="p-2 border-b border-r text-xs text-center bg-gray-50">Total</th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {students.length === 0 && (
                            <tr><td colSpan={timetableData.length * 2 + 2} className="p-4 text-center text-gray-500">No students found in this class yet. (Placeholder)</td></tr>
                          )}
                          {students.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="p-3 border-b border-r font-medium">{student.admission_no}</td>
                              <td className="p-3 border-b border-r font-bold">{student.name}</td>
                              {timetableData.map((col, idx) => {
                                const markKey = `${student.id}_${col.subject}_${col.sub_subject || 'main'}`;
                                const markRecord = marks[markKey] || { student_id: student.id, subject: col.subject, sub_subject: col.sub_subject };
                                
                                return col.has_practical ? (
                                  <React.Fragment key={idx}>
                                    <td className="p-2 border-b border-r">
                                      <input type="number" value={markRecord.marks_obtained || ''} onChange={e => {
                                        setMarks({...marks, [markKey]: {...markRecord, marks_obtained: e.target.value, max_marks: col.theory_marks}})
                                      }} className="w-16 border-gray-200 p-1 rounded text-center" />
                                    </td>
                                    <td className="p-2 border-b border-r">
                                      <input type="number" value={markRecord.practical_marks_obtained || ''} onChange={e => {
                                        setMarks({...marks, [markKey]: {...markRecord, practical_marks_obtained: e.target.value}})
                                      }} className="w-16 border-gray-200 p-1 rounded text-center" />
                                    </td>
                                  </React.Fragment>
                                ) : (
                                  <td key={idx} className="p-2 border-b border-r">
                                    <input type="number" value={markRecord.marks_obtained || ''} onChange={e => {
                                      setMarks({...marks, [markKey]: {...markRecord, marks_obtained: e.target.value, max_marks: col.total_marks}})
                                    }} className="w-16 border-gray-200 p-1 rounded text-center" />
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100 min-h-[300px]">
              Select a class from an exam to manage its timetable and marks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
