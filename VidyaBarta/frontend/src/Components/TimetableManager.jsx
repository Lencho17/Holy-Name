import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaSpinner, FaSave, FaPlus, FaClock, FaTrash, FaExclamationTriangle, FaFilePdf, FaUpload, FaBolt } from 'react-icons/fa';
import { FiEdit2, FiX } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sortClasses } from '../utils/classOrder';
import AutoTimetableModal from './AutoTimetableModal';

const TimetableManager = ({ apiUrl, token }) => {
  const [classesData, setClassesData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTimetables, setAllTimetables] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);

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
      const [classRes, staffRes, timeRes, assignRes] = await Promise.all([
        axios.get(`${apiUrl}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/staff/admin/all-staff`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/timetables/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/assignments`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      
      setClassesData(sortClasses(classRes.data || [], c => c.class_level));
      setTeachers(staffRes.data || []);
      setAllTimetables(timeRes.data || []);
      setClassAssignments(assignRes.data || []);
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
        const periodEntries = entries.filter(e => e.day_of_week === day && e.period_number === i);
        if (periodEntries.length > 0) {
          row[`p${i}`] = {
            subject: periodEntries[0].subject || '',
            staff_id: periodEntries[0].staff_id || '',
            secondary_staff_id: (periodEntries[1] && periodEntries[1].staff_id) || ''
          };
        } else {
          row[`p${i}`] = { subject: '', staff_id: '', secondary_staff_id: '' };
        }
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
      [`p${newPeriodNum}`]: { subject: '', staff_id: '', secondary_staff_id: '' }
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

  // Helper to count teacher's classes on a specific day across all other classes and current grid
  const getTeacherDayClassCount = (staffId, day, excludePeriodNum = null) => {
    if (!staffId) return 0;
    let count = 0;
    const currentSections = editingSection === 'ALL' 
      ? (editingClass?.sections ? editingClass.sections.split(',') : ['A'])
      : [editingSection];

    // 1. Count in all other classes
    allTimetables.forEach(t => {
      if (t.day_of_week === day && t.staff_id === staffId && t.subject && !t.subject.toLowerCase().includes('recess') && !t.subject.toLowerCase().includes('break')) {
        const isCurrentClass = t.class_level === editingClass?.class_level && currentSections.includes(t.section);
        if (!isCurrentClass) {
          count++;
        }
      }
    });

    // 2. Count in current editing grid for this day (checking both primary and co-teacher slots)
    const row = timetableData.find(r => r.day === day);
    if (row) {
      periodColumns.forEach(col => {
        if (excludePeriodNum !== null && col.period_number === excludePeriodNum) return;
        const cell = row[`p${col.period_number}`];
        if (cell && (cell.staff_id === staffId || cell.secondary_staff_id === staffId) && cell.subject && !cell.subject.toLowerCase().includes('recess') && !cell.subject.toLowerCase().includes('break')) {
          count++;
        }
      });
    }

    return count;
  };

  // Handle subject change with automatic teacher pre-selection from mapped assignments
  const handleSubjectChange = (dayIndex, periodNum, subject) => {
    const newGrid = [...timetableData];
    const currentCell = newGrid[dayIndex][`p${periodNum}`] || { subject: '', staff_id: '', secondary_staff_id: '' };

    if (!subject || subject.toLowerCase().includes('recess') || subject.toLowerCase().includes('break')) {
      newGrid[dayIndex][`p${periodNum}`] = { subject, staff_id: '', secondary_staff_id: '' };
      setTimetableData(newGrid);
      return;
    }

    let teacherToSet = currentCell.staff_id;
    let secondaryTeacherToSet = currentCell.secondary_staff_id;

    // If teacher not manually set yet, check if classAssignments has assigned teachers for this subject
    if (editingClass) {
      const clsName = editingClass.class_level;
      const targetSec = editingSection === 'ALL' ? 'A' : editingSection;
      const assignment = classAssignments.find(a => 
        (a.class_name === clsName || a.class_name === `Class ${clsName}`) && 
        (!a.section || a.section.toLowerCase() === targetSec.toLowerCase())
      );

      if (assignment && assignment.subject_teachers) {
        const sLower = subject.toLowerCase().trim();
        const parenMatch = subject.match(/^([^(]+)\s*\(([^)]+)\)$/);
        const dashMatch = subject.match(/^([^-]+)\s*-\s*(.+)$/);
        const parentName = parenMatch ? parenMatch[1].trim().toLowerCase() : (dashMatch ? dashMatch[1].trim().toLowerCase() : null);
        const partName = parenMatch ? parenMatch[2].trim().toLowerCase() : (dashMatch ? dashMatch[2].trim().toLowerCase() : null);

        const matched = assignment.subject_teachers.find(st => {
          if (!st.subject) return false;
          const stSub = st.subject.toLowerCase().trim();
          return stSub === sLower ||
                 (partName && stSub === partName) ||
                 (parentName && stSub === parentName) ||
                 sLower.includes(stSub);
        });
        if (matched) {
          const day = days[dayIndex];
          if (!teacherToSet && matched.teacher_id) {
            const teacherCount = getTeacherDayClassCount(matched.teacher_id, day, periodNum);
            if (teacherCount < 6) {
              teacherToSet = matched.teacher_id;
            }
          }
          if (!secondaryTeacherToSet && matched.secondary_teacher_id && matched.secondary_teacher_id !== teacherToSet) {
            const secCount = getTeacherDayClassCount(matched.secondary_teacher_id, day, periodNum);
            if (secCount < 6) {
              secondaryTeacherToSet = matched.secondary_teacher_id;
            }
          }
        }
      }

      // Rule 9: Period 1 is always allotted to the section Class Teacher
      if (periodNum === 1 && !teacherToSet && assignment?.class_teacher_id) {
        const day = days[dayIndex];
        const teacherCount = getTeacherDayClassCount(assignment.class_teacher_id, day, periodNum);
        if (teacherCount < 6) {
          teacherToSet = assignment.class_teacher_id;
        }
      }
    }

    newGrid[dayIndex][`p${periodNum}`] = { 
      ...currentCell, 
      subject, 
      staff_id: teacherToSet || '', 
      secondary_staff_id: secondaryTeacherToSet || '' 
    };
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
        if (!cell) return;

        // Check if both primary and secondary teachers are set to the exact same teacher
        if (cell.staff_id && cell.secondary_staff_id && cell.staff_id === cell.secondary_staff_id) {
          const teacherObj = teachers.find(t => t.id === cell.staff_id);
          clashes.push({
            type: 'duplicate_same_slot',
            day: row.day,
            period: col.period_number,
            staff_id: cell.staff_id,
            message: `Teacher "${teacherObj?.name || 'Staff'}" is selected as both Primary and Co-Teacher in Period ${col.period_number} on ${row.day}.`
          });
        }

        // Check double-booking clashes for both teachers
        const slotTeachers = [];
        if (cell.staff_id) slotTeachers.push({ id: cell.staff_id, role: 'Primary' });
        if (cell.secondary_staff_id && cell.secondary_staff_id !== cell.staff_id) {
          slotTeachers.push({ id: cell.secondary_staff_id, role: 'Co-Teacher' });
        }

        slotTeachers.forEach(({ id: teacherId, role }) => {
          currentSections.forEach(sec => {
            const clash = allTimetables.find(t => 
              t.day_of_week === row.day && 
              t.period_number === col.period_number && 
              t.staff_id === teacherId &&
              !(t.class_level === editingClass.class_level && t.section === sec)
            );
            if (clash && !clashes.find(c => c.staff_id === teacherId && c.period === col.period_number && c.day === row.day)) {
              const teacherObj = teachers.find(t => t.id === teacherId);
              clashes.push({
                type: 'period_clash',
                day: row.day,
                period: col.period_number,
                staff_id: teacherId,
                message: `${role} Teacher "${teacherObj?.name || 'Staff'}" is already scheduled in Class ${clash.class_level} - ${clash.section} at Period ${col.period_number} on ${row.day}.`
              });
            }
          });
        });
      });
    });

    // 2. Check 6-classes-per-day maximum limit per teacher
    const checkedDaysTeachers = new Set();
    days.forEach(day => {
      teachers.forEach(teacher => {
        const pairKey = `${day}_${teacher.id}`;
        if (checkedDaysTeachers.has(pairKey)) return;
        checkedDaysTeachers.add(pairKey);

        const totalOnDay = getTeacherDayClassCount(teacher.id, day);
        if (totalOnDay > 6) {
          clashes.push({
            type: 'daily_limit',
            day,
            staff_id: teacher.id,
            count: totalOnDay,
            message: `Teacher "${teacher.name}" has ${totalOnDay} classes assigned on ${day}. A teacher cannot have more than 6 classes in a single day.`
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
        if (cell && (cell.subject || cell.staff_id || cell.secondary_staff_id)) {
          // Primary teacher entry
          if (cell.staff_id || (!cell.staff_id && !cell.secondary_staff_id)) {
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

          // Secondary teacher / co-teacher entry (if assigned and different from primary)
          if (cell.secondary_staff_id && cell.secondary_staff_id !== cell.staff_id) {
            entriesToSave.push({
              day_of_week: row.day,
              period_number: col.period_number,
              subject: cell.subject || null,
              staff_id: cell.secondary_staff_id,
              start_time: col.start ? `${col.start}:00` : null,
              end_time: col.end ? `${col.end}:00` : null,
              is_published: isPublished
            });
          }
        }
      });
    });
    return entriesToSave;
  };

  const handleSave = async (isPublished) => {
    if (!editingClass) return;
    
    const clashes = checkClashes();
    if (clashes.length > 0) {
      const clashMessages = clashes.slice(0, 4).map(c => `• ${c.message}`).join('\n');
      const moreMsg = clashes.length > 4 ? `\n...and ${clashes.length - 4} more conflict(s).` : '';
      alert(`Cannot save! Schedule conflicts or daily limits detected:\n\n${clashMessages}${moreMsg}\n\nPlease resolve them before saving.`);
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

  const handleAutoFillCurrentClass = async () => {
    if (!editingClass) return;
    if (!window.confirm(`Auto-fill schedule for Class ${editingClass.class_level} adhering to all 17 rules? This will populate the grid.`)) return;

    try {
      setModalLoading(true);
      const res = await axios.post(`${apiUrl}/timetables/auto-generate`, {
        targetClassLevels: [editingClass.class_level],
        weekdayPeriods: 7,
        saturdayPeriods: 5
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.timetables && res.data.timetables.length > 0) {
        const targetSec = editingSection === 'ALL' ? 'A' : editingSection;
        loadTimetableForSection(editingClass, targetSec, res.data.timetables);
        alert(`17-Rule Schedule generated for Class ${editingClass.class_level} and loaded into the grid! Review and click Save.`);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to auto-generate schedule for this class');
    } finally {
      setModalLoading(false);
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
        const periodEntries = clsTimetable.filter(t => t.day_of_week === day && t.period_number === i);
        if (periodEntries.length > 0) {
          const teacherNames = periodEntries
            .map(e => teachers.find(tchr => tchr.id === e.staff_id)?.name)
            .filter(Boolean)
            .join(' & ');
          const time = periodEntries[0].start_time ? `\n(${periodEntries[0].start_time.substring(0,5)} - ${periodEntries[0].end_time?.substring(0,5) || ''})` : '';
          row.push(`${periodEntries[0].subject || '-'}\n${teacherNames}${time}`);
        } else {
          row.push('-');
        }
      }
      return row;
    });

    autoTable(doc, {
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
    const normClass = String(cls.class_level || '').toUpperCase();
    const isHS = normClass.includes('XI') || normClass.includes('XII') || normClass.includes('11') || normClass.includes('12');

    const addSub = (s) => {
      const name = s.subjects?.name || s.name || '';
      if (!name) return;
      const isDivided = Boolean(s.is_divided || (s.parts && s.parts.length > 0));
      if (isDivided && s.parts && s.parts.length > 0) {
        s.parts.forEach(p => {
          const pName = (typeof p === 'string' ? p : p.name || '').trim();
          if (pName) {
            const formatted = pName.toUpperCase().includes(name.toUpperCase()) ? pName : `${name} (${pName})`;
            subjects.push(formatted);
          }
        });
      } else if (isHS && name.toUpperCase().includes('BIOL')) {
        subjects.push(`${name} (BOTANY)`);
        subjects.push(`${name} (ZOOLOGY)`);
      }
      subjects.push(name);
    };

    (cls.core_subjects || []).forEach(addSub);
    (cls.elective_groups || []).forEach(g => { (g.subjects || []).forEach(addSub); });

    if (subjects.length === 0) {
      if (isHS) {
        return ['ENGLISH', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'BIOLOGY (BOTANY)', 'BIOLOGY (ZOOLOGY)', 'COMPUTER SCIENCE', 'ACCOUNTANCY', 'BUSINESS STUDIES', 'ECONOMICS', 'POLITICAL SCIENCE', 'HISTORY', 'Games', 'Drill'];
      }
      return ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Assamese', 'Computer', 'Games', 'Drill', 'Moral Science', 'General Knowledge'];
    }

    return [...new Set(subjects.filter(Boolean))];
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <FaCalendarAlt className="text-2xl" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-800">Class Timetables</h2>
            <p className="text-gray-500 text-xs mt-0.5">Manage and automatically generate weekly schedules with 17-rule compliance</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAutoModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-5 py-3 rounded-xl hover:from-teal-700 hover:to-emerald-700 transition shadow-md shadow-teal-500/20 text-sm"
        >
          <FaBolt className="text-amber-300" />
          <span>Auto-Generate Timetable</span>
        </button>
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

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAutoFillCurrentClass}
                  disabled={modalLoading || saving}
                  className="bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-amber-100 disabled:opacity-50 transition shadow-xs text-xs"
                  title="Auto-fill this class schedule according to the 17 rules"
                >
                  <FaBolt className="text-amber-500" /> Auto-Fill Class
                </button>
                <button 
                  onClick={() => handleSave(false)}
                  disabled={saving || modalLoading}
                  className="bg-white border-2 border-teal-600 text-teal-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-50 disabled:opacity-50 transition-colors shadow-sm text-xs"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save as Draft
                </button>
                <button 
                  onClick={() => handleSave(true)}
                  disabled={saving || modalLoading}
                  className="bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm text-xs"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaUpload />} Publish Timetable
                </button>
                <button onClick={() => setEditingClass(null)} className="p-2.5 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors ml-1">
                  <FiX size={22} />
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
                            
                            // Check for clash for Teacher 1 (Primary)
                            let clashWarning1 = null;
                            let teacher1ClassesToday = 0;
                            let isOverDailyLimit1 = false;

                            const currentSections = editingSection === 'ALL' 
                              ? (editingClass.sections ? editingClass.sections.split(',') : ['A'])
                              : [editingSection];

                            if (cell?.staff_id) {
                              teacher1ClassesToday = getTeacherDayClassCount(cell.staff_id, row.day);
                              if (teacher1ClassesToday > 6) {
                                isOverDailyLimit1 = true;
                              }

                              currentSections.forEach(sec => {
                                if (!clashWarning1) {
                                  const clash = allTimetables.find(t => 
                                    t.day_of_week === row.day && 
                                    t.period_number === col.period_number && 
                                    t.staff_id === cell.staff_id &&
                                    !(t.class_level === editingClass.class_level && t.section === sec)
                                  );
                                  if (clash) clashWarning1 = clash;
                                }
                              });
                            }

                            // Check for clash for Teacher 2 (Co-Teacher)
                            let clashWarning2 = null;
                            let teacher2ClassesToday = 0;
                            let isOverDailyLimit2 = false;

                            if (cell?.secondary_staff_id) {
                              teacher2ClassesToday = getTeacherDayClassCount(cell.secondary_staff_id, row.day);
                              if (teacher2ClassesToday > 6) {
                                isOverDailyLimit2 = true;
                              }

                              currentSections.forEach(sec => {
                                if (!clashWarning2) {
                                  const clash = allTimetables.find(t => 
                                    t.day_of_week === row.day && 
                                    t.period_number === col.period_number && 
                                    t.staff_id === cell.secondary_staff_id &&
                                    !(t.class_level === editingClass.class_level && t.section === sec)
                                  );
                                  if (clash) clashWarning2 = clash;
                                }
                              });
                            }

                            const isSameTeacherTwice = cell?.staff_id && cell?.secondary_staff_id && cell.staff_id === cell.secondary_staff_id;
                            const hasConflict = clashWarning1 || clashWarning2 || isOverDailyLimit1 || isOverDailyLimit2 || isSameTeacherTwice;
                            const isDualTeaching = cell?.staff_id && cell?.secondary_staff_id && !isSameTeacherTwice;

                            return (
                              <td key={col.period_number} className={`p-2 border-r border-gray-100 align-top ${hasConflict ? 'bg-red-50/60' : isDualTeaching ? 'bg-indigo-50/20' : ''}`}>
                                <div className="flex flex-col gap-1.5">
                                  {/* Subject Dropdown */}
                                  <select
                                    value={cell.subject || ''}
                                    onChange={(e) => handleSubjectChange(dayIdx, col.period_number, e.target.value)}
                                    className={`w-full p-1.5 border rounded-lg text-xs outline-none transition-colors ${hasConflict ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-teal-500'}`}
                                  >
                                    <option value="">-- Select Subject --</option>
                                    <option value="Recess">Recess / Break</option>
                                    {getAvailableSubjects(editingClass).map((sub, i) => (
                                      <option key={i} value={sub}>{sub}</option>
                                    ))}
                                  </select>
                                  
                                  {/* Primary Teacher Dropdown */}
                                  <div>
                                    <select
                                      value={cell.staff_id || ''}
                                      onChange={(e) => updateCell(dayIdx, col.period_number, 'staff_id', e.target.value)}
                                      className={`w-full p-1.5 border rounded-lg text-xs outline-none transition-colors ${
                                        clashWarning1 || isOverDailyLimit1 || isSameTeacherTwice
                                          ? 'border-red-400 bg-white text-red-700 font-bold' 
                                          : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500'
                                      }`}
                                    >
                                      <option value="">-- Primary Teacher --</option>
                                      {teachers.map(t => {
                                        const count = getTeacherDayClassCount(t.id, row.day, col.period_number);
                                        const reachedMax = count >= 6 && cell.staff_id !== t.id;
                                        const isCoTeacher = t.id === cell.secondary_staff_id;
                                        return (
                                          <option key={t.id} value={t.id} disabled={reachedMax || isCoTeacher}>
                                            {t.name} ({count}/6 today){reachedMax ? ' — MAX 6' : ''}{isCoTeacher ? ' [Selected as Co-Teacher]' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  {/* Co-Teacher / 2nd Teacher Dropdown */}
                                  <div>
                                    <select
                                      value={cell.secondary_staff_id || ''}
                                      onChange={(e) => updateCell(dayIdx, col.period_number, 'secondary_staff_id', e.target.value)}
                                      className={`w-full p-1.5 border rounded-lg text-xs outline-none transition-colors ${
                                        clashWarning2 || isOverDailyLimit2 || isSameTeacherTwice
                                          ? 'border-red-400 bg-white text-red-700 font-bold' 
                                          : cell.secondary_staff_id
                                            ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900 font-medium'
                                            : 'border-gray-200 bg-gray-50/80 focus:bg-white focus:border-indigo-500'
                                      }`}
                                    >
                                      <option value="">-- 2nd Teacher (Optional) --</option>
                                      {teachers.map(t => {
                                        const count = getTeacherDayClassCount(t.id, row.day, col.period_number);
                                        const reachedMax = count >= 6 && cell.secondary_staff_id !== t.id;
                                        const isPrimary = t.id === cell.staff_id;
                                        return (
                                          <option key={t.id} value={t.id} disabled={reachedMax || isPrimary}>
                                            {t.name} ({count}/6 today){reachedMax ? ' — MAX 6' : ''}{isPrimary ? ' [Primary Teacher]' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  {/* Dual Teaching Badge */}
                                  {isDualTeaching && (
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-indigo-800 font-bold bg-indigo-100 py-0.5 px-1 rounded border border-indigo-200">
                                      <span>👥 2 Teachers (Co-Teaching)</span>
                                    </div>
                                  )}

                                  {/* Warnings */}
                                  {isSameTeacherTwice && (
                                    <div className="flex items-center gap-1 text-[10px] text-red-700 font-bold bg-red-100 p-1 rounded border border-red-300">
                                      <FaExclamationTriangle className="flex-shrink-0" />
                                      <span>Same teacher selected twice</span>
                                    </div>
                                  )}

                                  {clashWarning1 && (
                                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-100/70 p-1 rounded border border-red-200">
                                      <FaExclamationTriangle className="flex-shrink-0" />
                                      <span>T1 Clashes: Class {clashWarning1.class_level}-{clashWarning1.section}</span>
                                    </div>
                                  )}

                                  {clashWarning2 && (
                                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-100/70 p-1 rounded border border-red-200">
                                      <FaExclamationTriangle className="flex-shrink-0" />
                                      <span>T2 Clashes: Class {clashWarning2.class_level}-{clashWarning2.section}</span>
                                    </div>
                                  )}

                                  {isOverDailyLimit1 && (
                                    <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-100/80 p-1 rounded border border-amber-300">
                                      <FaExclamationTriangle className="flex-shrink-0 text-amber-600" />
                                      <span>T1 Limit: {teacher1ClassesToday}/6 classes today</span>
                                    </div>
                                  )}

                                  {isOverDailyLimit2 && (
                                    <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-100/80 p-1 rounded border border-amber-300">
                                      <FaExclamationTriangle className="flex-shrink-0 text-amber-600" />
                                      <span>T2 Limit: {teacher2ClassesToday}/6 classes today</span>
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

      {/* Auto Timetable Generator Modal */}
      <AutoTimetableModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        apiUrl={apiUrl}
        token={token}
        classesData={classesData}
        onSuccess={() => fetchInitialData()}
      />
    </div>
  );
};

export default TimetableManager;
