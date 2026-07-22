import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaCheckCircle, FaCalendarAlt, FaArrowLeft, FaDownload, FaSpinner } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExamManagement = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [timetablesMap, setTimetablesMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Views: 'list', 'timetable', 'marks'
  const [view, setView] = useState('list');
  const [selectedClassExam, setSelectedClassExam] = useState(null);
  
  // Timetable State (structured by subject block)
  const [timetableData, setTimetableData] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [savingTimetable, setSavingTimetable] = useState(false);

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [bulkExamName, setBulkExamName] = useState('');
  const [newExam, setNewExam] = useState({ name: '', type: 'Offline', class_levels: [] });
  const allClasses = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const uniqueExamNames = [...new Set(exams.map(e => e.name))];

  const fetchExamsAndStatus = async () => {
    try {
      setLoading(true);
      const { data: examsData } = await axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(examsData);
      
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
    if (!window.confirm('Are you sure you want to delete this exam? This cannot be undone.')) return;
    try {
      await axios.delete(`${apiUrl}/exams/${examId}`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(exams.filter(e => e.id !== examId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete exam');
    }
  };

  const downloadClassPDF = async (examRecord) => {
    try {
      const { data: ttData } = await axios.get(`${apiUrl}/exams/${examRecord.id}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      if (!ttData || ttData.length === 0) {
        alert('No timetable created yet to download.');
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Exam Timetable: ${examRecord.name} - Class ${examRecord.class_level}`, 14, 22);
      
      const tableColumn = ["Date", "Time", "Subject", "Total Marks", "Pass Marks", "Room"];
      const tableRows = [];
      
      ttData.forEach(row => {
        const subjectName = `${row.subject} ${row.sub_subject ? `(${row.sub_subject})` : ''} ${row.has_practical ? '(Th+Pr)' : ''}`;
        const timeStr = `${row.start_time?.substring(0,5) || '--:--'} - ${row.end_time?.substring(0,5) || '--:--'}`;
        tableRows.push([
          row.exam_date || '-',
          timeStr,
          subjectName,
          row.total_marks || (row.theory_marks + row.practical_marks),
          row.passing_marks || '-',
          row.room_number || '-'
        ]);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
      });
      
      doc.save(`Timetable_${examRecord.name}_Class_${examRecord.class_level}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Failed to download PDF");
    }
  };

  const downloadBulkPDF = async (e) => {
    e.preventDefault();
    if (!bulkExamName) return alert('Select an exam');
    const examClasses = exams.filter(ex => ex.name === bulkExamName);
    if (examClasses.length === 0) return;
    
    try {
      const doc = new jsPDF();
      let hasData = false;
      
      for (let i = 0; i < examClasses.length; i++) {
        const cls = examClasses[i];
        const { data: ttData } = await axios.get(`${apiUrl}/exams/${cls.id}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
        
        if (ttData && ttData.length > 0) {
          if (hasData) doc.addPage();
          hasData = true;
          doc.setFontSize(18);
          doc.text(`Exam Timetable: ${cls.name} - Class ${cls.class_level}`, 14, 22);
          
          const tableColumn = ["Date", "Time", "Subject", "Total Marks", "Pass Marks", "Room"];
          const tableRows = [];
          
          ttData.forEach(row => {
            const subjectName = `${row.subject} ${row.sub_subject ? `(${row.sub_subject})` : ''} ${row.has_practical ? '(Th+Pr)' : ''}`;
            const timeStr = `${row.start_time?.substring(0,5) || '--:--'} - ${row.end_time?.substring(0,5) || '--:--'}`;
            tableRows.push([
              row.exam_date || '-',
              timeStr,
              subjectName,
              row.total_marks || (row.theory_marks + row.practical_marks),
              row.passing_marks || '-',
              row.room_number || '-'
            ]);
          });
          
          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
          });
        }
      }
      
      if (hasData) {
        doc.save(`Bulk_Timetable_${bulkExamName}.pdf`);
        setShowBulkDownload(false);
      } else {
        alert('No timetables found for this exam group.');
      }
    } catch (error) {
      console.error(error);
      alert("Failed to download bulk PDF");
    }
  };

  const openTimetable = async (examRecord) => {
    setSelectedClassExam(examRecord);
    setView('timetable');
    
    // Fetch configured subjects for this class
    try {
      const { data: config } = await axios.get(`${apiUrl}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } });
      const getBaseClass = (lvl) => {
        if (typeof lvl !== 'string') return lvl;
        const match = lvl.match(/Class\s+([IVX]+)/i) || lvl.match(/^([IVX]+)/i);
        return match ? match[1].toUpperCase() : lvl;
      };
      const examBaseClass = getBaseClass(examRecord.class_level);
      const clsConfig = config.find(c => getBaseClass(c.class_level) === examBaseClass);
      let subs = [];
      if (clsConfig) {
        subs = [...(clsConfig.core_subjects || []), ...((clsConfig.elective_groups || []).flatMap(g => g.subjects || []))];
      }
      setAvailableSubjects(subs.map(s => (typeof s === 'string' ? s : (s.subjects?.name || s.name || s.subject_name))).filter(Boolean));
    } catch (err) {
      console.error(err);
    }

    // Fetch existing timetable and structure it
    try {
      const { data: tt } = await axios.get(`${apiUrl}/exams/${examRecord.id}/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      const grouped = [];
      tt.forEach(item => {
        let existing = grouped.find(g => g.subject === item.subject);
        if (existing) {
          existing.is_divided = true;
          existing.papers.push({ name: item.sub_subject || '', exam_date: item.exam_date || '', start_time: item.start_time || '', end_time: item.end_time || '' });
        } else {
          grouped.push({
            subject: item.subject,
            total_marks: item.total_marks || 100,
            passing_marks: item.passing_marks || 30,
            has_practical: item.has_practical || false,
            theory_marks: item.theory_marks || '',
            practical_marks: item.practical_marks || '',
            is_divided: !!item.sub_subject,
            papers: [{ name: item.sub_subject || '', exam_date: item.exam_date || '', start_time: item.start_time || '', end_time: item.end_time || '' }]
          });
        }
      });
      setTimetableData(grouped.length > 0 ? grouped : []);
    } catch (err) {
      console.error(err);
    }
  };

  const addTimetableRow = () => {
    setTimetableData([...timetableData, {
      subject: '',
      total_marks: 100,
      passing_marks: 30,
      has_practical: false,
      theory_marks: '',
      practical_marks: '',
      is_divided: false,
      papers: [{ name: '', exam_date: '', start_time: '', end_time: '' }]
    }]);
  };

  const handleSaveTimetable = async () => {
    setSavingTimetable(true);
    try {
      const flatData = [];
      timetableData.forEach(g => {
        g.papers.forEach(p => {
          flatData.push({
            class_level: selectedClassExam.class_level,
            subject: g.subject,
            total_marks: g.total_marks,
            passing_marks: g.passing_marks,
            has_practical: g.has_practical,
            theory_marks: g.theory_marks,
            practical_marks: g.practical_marks,
            sub_subject: g.is_divided ? p.name : '',
            exam_date: p.exam_date,
            start_time: p.start_time,
            end_time: p.end_time,
            room_number: '' // Omitted from UI for now, kept for schema
          });
        });
      });
      await axios.post(`${apiUrl}/exams/${selectedClassExam.id}/timetable`, { timetableData: flatData }, { headers: { Authorization: `Bearer ${token}` } });
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
            <div className="flex gap-4">
              <button onClick={() => setShowBulkDownload(true)} className="bg-[#ed8936] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-orange-500 transition flex items-center gap-2 text-sm shadow-sm">
                <FaDownload /> Bulk Download
              </button>
              <button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-sm">
                <FaPlus /> Create Exam
              </button>
            </div>
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
                      <span className="bg-pink-400 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">No</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openTimetable(exam)} className="bg-[#46a5f7] text-white w-8 h-8 rounded-full hover:bg-blue-500 transition-colors flex items-center justify-center shadow-sm" title="Manage Timetable"><FaCalendarAlt size={12} /></button>
                        <button className="bg-[#20c997] text-white w-8 h-8 rounded-full hover:bg-teal-500 transition-colors flex items-center justify-center shadow-sm" title="Publish Result"><FaCheckCircle size={12} /></button>
                        <button onClick={() => downloadClassPDF(exam)} className="bg-[#ed8936] text-white w-8 h-8 rounded-full hover:bg-orange-500 transition-colors flex items-center justify-center shadow-sm" title="Download Timetable PDF"><FaDownload size={12} /></button>
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
            {timetableData.map((group, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm relative">
                
                {/* Delete Entire Block Button */}
                <button onClick={() => setTimetableData(timetableData.filter((_, i) => i !== idx))} className="absolute top-4 right-4 bg-pink-100 text-pink-400 hover:bg-pink-200 rounded transition w-8 h-8 flex items-center justify-center font-bold text-lg leading-none pb-1" title="Delete entire subject">
                  ×
                </button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pr-12">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-2">Subject</label>
                    <select value={group.subject} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].subject = e.target.value; setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="">-- Select --</option>
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Total Marks <span className="text-pink-400">*</span></label>
                    <input type="number" value={group.total_marks || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].total_marks = parseInt(e.target.value); setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Total Marks" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Passing Marks <span className="text-pink-400">*</span></label>
                    <input type="number" value={group.passing_marks || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].passing_marks = parseInt(e.target.value); setTimetableData(newTt);
                    }} className="w-full border border-gray-300 p-2.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Passing Marks" />
                  </div>
                </div>
                


                {/* Toggles */}
                <div className="flex flex-wrap gap-6 items-center mb-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={group.is_divided} onChange={e => {
                      const newTt = [...timetableData]; 
                      newTt[idx].is_divided = e.target.checked; 
                      // If dividing for first time, make sure there's at least one paper name initialized
                      if (e.target.checked && !newTt[idx].papers[0].name) {
                          newTt[idx].papers[0].name = 'Paper 1';
                      }
                      setTimetableData(newTt);
                    }} className="rounded text-[#20c997] focus:ring-[#20c997] w-4 h-4" /> Divide Subject
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={group.has_practical} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].has_practical = e.target.checked; setTimetableData(newTt);
                    }} className="rounded text-[#20c997] focus:ring-[#20c997] w-4 h-4" /> Include Practical
                  </label>
                </div>

                {/* Practical Marks Split */}
                {group.has_practical && (
                  <div className="flex items-center gap-4 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="text-xs font-bold text-gray-600">Marks Split:</label>
                    <input type="number" value={group.theory_marks || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].theory_marks = parseInt(e.target.value); setTimetableData(newTt);
                    }} className="border-gray-300 border p-2 rounded text-xs w-24 bg-white" placeholder="Theory" title="Theory" />
                    <input type="number" value={group.practical_marks || ''} onChange={e => {
                      const newTt = [...timetableData]; newTt[idx].practical_marks = parseInt(e.target.value); setTimetableData(newTt);
                    }} className="border-gray-300 border p-2 rounded text-xs w-24 bg-white" placeholder="Prac" title="Practical" />
                  </div>
                )}

                {/* Papers List */}
                <div className="space-y-4">
                  {group.papers.map((paper, pIdx) => (
                    <div key={pIdx} className={`grid grid-cols-1 gap-4 items-end relative bg-gray-50 p-4 rounded-lg border border-gray-200 ${group.is_divided ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                      {group.is_divided && (
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Paper Name</label>
                          <input type="text" value={paper.name} onChange={e => {
                            const newTt = [...timetableData]; newTt[idx].papers[pIdx].name = e.target.value; setTimetableData(newTt);
                          }} className="w-full border border-gray-300 p-2 rounded text-sm bg-white" placeholder="e.g. Theory" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                        <input type="date" value={paper.exam_date} onChange={e => {
                          const newTt = [...timetableData]; newTt[idx].papers[pIdx].exam_date = e.target.value; setTimetableData(newTt);
                        }} className="w-full border border-gray-300 p-2 rounded text-sm bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Start Time</label>
                        <input type="time" value={paper.start_time} onChange={e => {
                          const newTt = [...timetableData]; newTt[idx].papers[pIdx].start_time = e.target.value; setTimetableData(newTt);
                        }} className="w-full border border-gray-300 p-2 rounded text-sm bg-white" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-600 mb-1">End Time</label>
                          <input type="time" value={paper.end_time} onChange={e => {
                            const newTt = [...timetableData]; newTt[idx].papers[pIdx].end_time = e.target.value; setTimetableData(newTt);
                          }} className="w-full border border-gray-300 p-2 rounded text-sm bg-white" />
                        </div>
                        {group.is_divided && (
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <button onClick={() => {
                              const newTt = [...timetableData];
                              newTt[idx].papers.splice(pIdx + 1, 0, { name: `Paper ${newTt[idx].papers.length + 1}`, exam_date: '', start_time: '', end_time: '' });
                              setTimetableData(newTt);
                            }} className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 w-8 h-8 rounded text-sm font-bold flex items-center justify-center mt-4" title="Add Division">+</button>
                            {group.papers.length > 1 && (
                              <button onClick={() => {
                                const newTt = [...timetableData];
                                newTt[idx].papers.splice(pIdx, 1);
                                setTimetableData(newTt);
                              }} className="bg-pink-100 text-pink-500 hover:bg-pink-200 w-8 h-8 rounded text-sm font-bold flex items-center justify-center mt-4" title="Remove Division">-</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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


      {/* BULK DOWNLOAD MODAL */}
      {showBulkDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setShowBulkDownload(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-xl font-bold mb-4">Bulk Download Timetables</h2>
            <form onSubmit={downloadBulkPDF}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Exam Group</label>
                <select required value={bulkExamName} onChange={e => setBulkExamName(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">-- Select Exam --</option>
                  {uniqueExamNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-[#ed8936] text-white p-3 rounded font-bold hover:bg-orange-500 transition flex items-center justify-center gap-2">
                <FaDownload /> Download PDFs
              </button>
            </form>
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
