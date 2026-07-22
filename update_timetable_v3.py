import sys

file_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/TimetableManager.jsx'

content = """import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaSpinner, FaSave, FaPlus, FaClock, FaTrash, FaExclamationTriangle, FaFilePdf, FaUpload } from 'react-icons/fa';
import { FiEdit2, FiX } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TimetableManager = ({ apiUrl, token }) => {
  const [classesData, setClassesData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTimetables, setAllTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState('A');
  const [timetableData, setTimetableData] = useState([]);
  const [periodColumns, setPeriodColumns] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchInitialData();
  }, [apiUrl, token]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classRes, staffRes, timeRes] = await Promise.all([
        axios.get(`${apiUrl}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/staff/admin/all-staff`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/timetables/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setClassesData(classRes.data || []);
      setTeachers(staffRes.data || []);
      setAllTimetables(timeRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableForSection = (cls, targetSection, timetablesList = allTimetables) => {
    const entries = timetablesList.filter(t => t.class_level === cls.class_level && t.section === targetSection);
    
    let maxPeriod = 7;
    const loadedPeriods = new Map();
    
    entries.forEach(e => {
      if (e.period_number > maxPeriod) maxPeriod = e.period_number;
      if (!loadedPeriods.has(e.period_number) && e.start_time) {
         loadedPeriods.set(e.period_number, { 
           start: e.start_time.substring(0,5), 
           end: e.end_time ? e.end_time.substring(0,5) : '' 
         });
      }
    });

    const cols = [];
    for (let i = 1; i <= maxPeriod; i++) {
      cols.push({
        period_number: i,
        start: loadedPeriods.get(i)?.start || '',
        end: loadedPeriods.get(i)?.end || ''
      });
    }
    setPeriodColumns(cols);

    const grid = [];
    days.forEach(day => {
      const row = { day };
      for (let i = 1; i <= maxPeriod; i++) {
        const entry = entries.find(e => e.day_of_week === day && e.period_number === i);
        row[`p${i}`] = entry ? { subject: entry.subject, staff_id: entry.staff_id } : { subject: '', staff_id: '' };
      }
      grid.push(row);
    });
    setTimetableData(grid);
  };

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    const sections = cls.sections ? cls.sections.split(',') : ['A'];
    setEditingSection(sections[0]);
    loadTimetableForSection(cls, sections[0], allTimetables);
  };

  const handleSectionChange = (e) => {
    const val = e.target.value;
    setEditingSection(val);
    
    if (val === 'ALL') {
      const sections = editingClass.sections ? editingClass.sections.split(',') : ['A'];
      loadTimetableForSection(editingClass, sections[0], allTimetables);
    } else {
      loadTimetableForSection(editingClass, val, allTimetables);
    }
  };

  const addColumn = () => {
    const newPeriodNum = periodColumns.length + 1;
    setPeriodColumns([...periodColumns, { period_number: newPeriodNum, start: '', end: '' }]);
    
    const newGrid = timetableData.map(row => ({
      ...row,
      [`p${newPeriodNum}`]: { subject: '', staff_id: '' }
    }));
    setTimetableData(newGrid);
  };

  const updateColumnTime = (idx, field, value) => {
    const newCols = [...periodColumns];
    newCols[idx][field] = value;
    setPeriodColumns(newCols);
  };

  const updateCell = (dayIndex, periodNum, field, value) => {
    const newGrid = [...timetableData];
    newGrid[dayIndex][`p${periodNum}`][field] = value;
    setTimetableData(newGrid);
  };

  const removeColumn = () => {
    if (periodColumns.length <= 1) return;
    const newCols = [...periodColumns];
    const removedPeriodNum = newCols.pop().period_number;
    setPeriodColumns(newCols);
    
    const newGrid = timetableData.map(row => {
      const newRow = { ...row };
      delete newRow[`p${removedPeriodNum}`];
      return newRow;
    });
    setTimetableData(newGrid);
  };

  const checkClashes = () => {
    const clashes = [];
    const currentSections = editingSection === 'ALL' 
      ? (editingClass.sections ? editingClass.sections.split(',') : ['A'])
      : [editingSection];

    timetableData.forEach(row => {
      periodColumns.forEach(col => {
        const cell = row[`p${col.period_number}`];
        if (cell && cell.staff_id) {
          // Check all current sections being saved
          currentSections.forEach(sec => {
             const clash = allTimetables.find(t => 
                t.day_of_week === row.day && 
                t.period_number === col.period_number && 
                t.staff_id === cell.staff_id &&
                !(t.class_level === editingClass.class_level && t.section === sec)
             );
             if (clash && !clashes.find(c => c.staff_id === cell.staff_id && c.period === col.period_number && c.day === row.day)) {
                clashes.push({
                  day: row.day,
                  period: col.period_number,
                  staff_id: cell.staff_id,
                  clashClass: `Class ${clash.class_level} - ${clash.section}`
                });
             }
          });
        }
      });
    });
    return clashes;
  };

  const buildEntriesForSave = (isPublished, targetSection) => {
    const entriesToSave = [];
    timetableData.forEach(row => {
      periodColumns.forEach(col => {
        const cell = row[`p${col.period_number}`];
        if (cell && (cell.subject || cell.staff_id)) {
           entriesToSave.push({
             day_of_week: row.day,
             period_number: col.period_number,
             subject: cell.subject || null,
             staff_id: cell.staff_id || null,
             start_time: col.start ? `${col.start}:00` : null,
             end_time: col.end ? `${col.end}:00` : null,
             is_published: isPublished
           });
        }
      });
    });
    return entriesToSave;
  };

  const handleSave = async (isPublished) => {
    if (!editingClass) return;
    
    const clashes = checkClashes();
    if (clashes.length > 0) {
      alert(`Cannot save! There are ${clashes.length} teacher schedule clashes. Please resolve them first.`);
      return;
    }

    try {
      setSaving(true);
      
      const sectionsToSave = editingSection === 'ALL' 
        ? (editingClass.sections ? editingClass.sections.split(',') : ['A'])
        : [editingSection];

      const promises = sectionsToSave.map(sec => {
        const entriesToSave = buildEntriesForSave(isPublished, sec);
        return axios.post(`${apiUrl}/timetables`, {
          class_level: editingClass.class_level,
          section: sec,
          entries: entriesToSave
        }, { headers: { Authorization: `Bearer ${token}` } });
      });

      await Promise.all(promises);
      
      alert(isPublished ? 'Timetable published successfully!' : 'Timetable saved as draft!');
      setEditingClass(null);
      fetchInitialData(); // Refresh allTimetables
    } catch (err) {
      console.error(err);
      alert('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = (cls) => {
    const sections = cls.sections ? cls.sections.split(',') : ['A'];
    // For PDF generation, we generate for the first section if multiple, or prompt the user.
    // For simplicity, generate for sections[0]
    const targetSection = sections[0];
    
    const clsTimetable = allTimetables.filter(t => t.class_level === cls.class_level && t.section === targetSection);
    if (clsTimetable.length === 0) return alert(`No timetable data found for Class ${cls.class_level} - ${targetSection} to generate PDF.`);

    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text(`Class ${cls.class_level} - ${targetSection} Timetable`, 14, 20);
    
    let maxP = 1;
    clsTimetable.forEach(t => { if(t.period_number > maxP) maxP = t.period_number; });
    
    const head = [['Day', ...Array.from({length: maxP}, (_, i) => `Period ${i+1}`)]];
    const body = days.map(day => {
      const row = [day];
      for (let i = 1; i <= maxP; i++) {
        const entry = clsTimetable.find(t => t.day_of_week === day && t.period_number === i);
        if (entry) {
          const teacherName = teachers.find(tchr => tchr.id === entry.staff_id)?.name || '';
          const time = entry.start_time ? `\n(${entry.start_time.substring(0,5)} - ${entry.end_time?.substring(0,5) || ''})` : '';
          row.push(`${entry.subject || '-'}\n${teacherName}${time}`);
        } else {
          row.push('-');
        }
      }
      return row;
    });

    doc.autoTable({
      head,
      body,
      startY: 30,
      styles: { fontSize: 8, halign: 'center', cellPadding: 3 },
      headStyles: { fillColor: [13, 148, 136] }
    });

    doc.save(`Timetable_Class_${cls.class_level}_${targetSection}.pdf`);
  };

  const getAvailableSubjects = (cls) => {
    if (!cls) return [];
    const subjects = [];
    (cls.core_subjects || []).forEach(s => { subjects.push(s.subjects?.name || s.name || ''); });
    (cls.elective_groups || []).forEach(g => { (g.subjects || []).forEach(s => { subjects.push(s.subjects?.name || s.name || ''); }); });
    return [...new Set(subjects.filter(s => s))];
  };

  const getClassStatus = (cls) => {
    const sections = cls.sections ? cls.sections.split(',') : ['A'];
    const clsTimetables = allTimetables.filter(t => t.class_level === cls.class_level && sections.includes(t.section));
    
    if (clsTimetables.length === 0) return { label: 'Not Created', color: 'bg-gray-100 text-gray-500' };
    const isPublished = clsTimetables.some(t => t.is_published);
    return isPublished ? { label: 'Published', color: 'bg-emerald-100 text-emerald-600' } : { label: 'Draft', color: 'bg-amber-100 text-amber-600' };
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
          <FaCalendarAlt className="text-2xl" />
        </div>
        <h2 className="text-3xl font-black text-gray-800">Class Timetables</h2>
      </div>

      {loading ? (
        <div className="p-12 text-center text-teal-600">
          <FaSpinner className="animate-spin text-4xl mx-auto mb-4" />
          <p className="font-medium text-gray-500">Loading configurations...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-teal-50 text-teal-800 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold">#</th>
                <th className="p-4 font-bold">Class Level</th>
                <th className="p-4 font-bold">Sections</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classesData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">No class configurations found. Please setup Class Subjects first.</td>
                </tr>
              ) : (
                classesData.map((cls, idx) => {
                  const status = getClassStatus(cls);
                  return (
                    <tr key={cls.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{idx + 1}</td>
                      <td className="p-4 text-sm text-gray-800 font-bold">Class {cls.class_level}</td>
                      <td className="p-4 text-sm text-gray-600 font-medium">{cls.sections || 'A'}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(cls)}
                            className="text-teal-600 bg-teal-50 px-3 py-2 rounded-lg hover:bg-teal-100 font-medium text-sm inline-flex items-center gap-2"
                          >
                            <FiEdit2 size={16} /> Edit Timetable
                          </button>
                          {status.label !== 'Not Created' && (
                            <button 
                              onClick={() => generatePDF(cls)}
                              className="text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 font-medium text-sm inline-flex items-center gap-2"
                              title="Download PDF"
                            >
                              <FaFilePdf size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Timetable: Class {editingClass.class_level}
                  </h2>
                  <p className="text-sm text-teal-600 mt-1">Configure subjects and teachers for each period.</p>
                </div>
                
                <div className="border-l-2 border-teal-200 pl-4 ml-2">
                  <label className="block text-xs font-bold text-teal-800 uppercase mb-1">Target Section</label>
                  <select 
                    value={editingSection} 
                    onChange={handleSectionChange}
                    className="p-2 border border-teal-200 bg-white rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  >
                    {editingClass.sections && editingClass.sections.split(',').length > 1 && (
                      <option value="ALL" className="font-bold text-teal-700">Apply to All Sections</option>
                    )}
                    {(editingClass.sections ? editingClass.sections.split(',') : ['A']).map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleSave(false)}
                  disabled={saving || modalLoading}
                  className="bg-white border-2 border-teal-600 text-teal-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save as Draft
                </button>
                <button 
                  onClick={() => handleSave(true)}
                  disabled={saving || modalLoading}
                  className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaUpload />} Publish Timetable
                </button>
                <button onClick={() => setEditingClass(null)} className="p-2.5 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors ml-2">
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-auto bg-gray-50 flex-1">
              {modalLoading ? (
                <div className="p-12 text-center text-teal-600">
                  <FaSpinner className="animate-spin text-4xl mx-auto mb-4" />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto pb-4">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 font-bold text-gray-700 w-24 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Day</th>
                        {periodColumns.map((col, idx) => (
                          <th key={col.period_number} className="p-3 border-r border-gray-200 min-w-[200px] bg-teal-50/30">
                            <div className="flex flex-col gap-2">
                              <div className="font-bold text-teal-800 text-center flex justify-between items-center">
                                <span>Period {col.period_number}</span>
                                {idx === periodColumns.length - 1 && (
                                  <button onClick={removeColumn} className="text-red-400 hover:text-red-600 p-1 rounded" title="Remove Column">
                                    <FaTrash size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 focus-within:border-teal-400">
                                <FaClock className="text-gray-400 text-xs ml-1" />
                                <input 
                                  type="time" 
                                  value={col.start} 
                                  onChange={e => updateColumnTime(idx, 'start', e.target.value)}
                                  className="w-full text-xs outline-none bg-transparent"
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                  type="time" 
                                  value={col.end} 
                                  onChange={e => updateColumnTime(idx, 'end', e.target.value)}
                                  className="w-full text-xs outline-none bg-transparent"
                                />
                              </div>
                            </div>
                          </th>
                        ))}
                        <th className="p-3 bg-gray-50 w-16 text-center">
                          <button onClick={addColumn} className="bg-teal-100 text-teal-600 hover:bg-teal-200 p-2 rounded-lg" title="Add Column">
                            <FaPlus />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {timetableData.map((row, dayIdx) => (
                        <tr key={row.day} className="hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">
                            {row.day}
                          </td>
                          {periodColumns.map((col) => {
                            const cell = row[`p${col.period_number}`];
                            
                            // Check for clash
                            let clashWarning = null;
                            if (cell?.staff_id) {
                              const currentSections = editingSection === 'ALL' 
                                ? (editingClass.sections ? editingClass.sections.split(',') : ['A'])
                                : [editingSection];

                              currentSections.forEach(sec => {
                                 if (!clashWarning) {
                                   const clash = allTimetables.find(t => 
                                     t.day_of_week === row.day && 
                                     t.period_number === col.period_number && 
                                     t.staff_id === cell.staff_id &&
                                     !(t.class_level === editingClass.class_level && t.section === sec)
                                   );
                                   if (clash) clashWarning = clash;
                                 }
                              });
                            }

                            return (
                              <td key={col.period_number} className={`p-2 border-r border-gray-100 align-top ${clashWarning ? 'bg-red-50' : ''}`}>
                                <div className="flex flex-col gap-1.5">
                                  <select
                                    value={cell.subject || ''}
                                    onChange={(e) => updateCell(dayIdx, col.period_number, 'subject', e.target.value)}
                                    className={`w-full p-2 border rounded-lg text-xs outline-none transition-colors ${clashWarning ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'}`}
                                  >
                                    <option value="">-- Select Subject --</option>
                                    <option value="Recess">Recess / Break</option>
                                    {getAvailableSubjects(editingClass).map((sub, i) => (
                                      <option key={i} value={sub}>{sub}</option>
                                    ))}
                                  </select>
                                  
                                  <select
                                    value={cell.staff_id || ''}
                                    onChange={(e) => updateCell(dayIdx, col.period_number, 'staff_id', e.target.value)}
                                    className={`w-full p-2 border rounded-lg text-xs outline-none transition-colors ${clashWarning ? 'border-red-400 bg-white text-red-700 font-bold' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500'}`}
                                  >
                                    <option value="">-- Select Teacher --</option>
                                    {teachers.map(t => (
                                      <option key={t.id} value={t.id}>{t.name} ({t.role || 'Teacher'})</option>
                                    ))}
                                  </select>
                                  
                                  {clashWarning && (
                                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mt-1">
                                      <FaExclamationTriangle />
                                      Clashes with Class {clashWarning.class_level} - {clashWarning.section}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="bg-gray-50"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManager;
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated TimetableManager.jsx successfully.")
