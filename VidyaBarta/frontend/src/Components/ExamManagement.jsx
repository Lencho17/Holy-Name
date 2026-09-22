import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { 
  FaPlus, FaTrash, FaCheckCircle, FaCalendarAlt, FaArrowLeft, FaDownload, FaSpinner,
  FaFileExcel, FaFilePdf 
} from 'react-icons/fa';
import { 
  FiMove, FiCalendar, FiClock, FiLayers, FiInfo, FiCheck, FiRefreshCw, 
  FiAlignLeft, FiAlertCircle, FiAlertTriangle, FiBookOpen 
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { exportExamRoutineExcelWithImage } from '../utils/excelImageExport';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to count working days (skipping Sundays)
const countWorkingDays = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 0;
  let curr = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(curr.getTime()) || isNaN(end.getTime()) || curr > end) return 0;
  let count = 0;
  while (curr <= end) {
    if (curr.getDay() !== 0) count++;
    curr.setDate(curr.getDate() + 1);
  }
  return count;
};

// Draggable Sortable Card for Timetable Routine
const SortableTimetableCard = ({
  group,
  idx,
  availableSubjects,
  examCategory,
  onUpdateField,
  onRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group._dragId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.75 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-xl p-5 shadow-sm relative transition-all duration-200 ${
        isDragging ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Top Bar: Drag handle, Day tag, Grading badge, and Delete */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Drag to reorder day"
          >
            <FiMove className="text-base" />
          </button>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            Day {idx + 1}
          </span>
          {group.exam_date && (
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Scheduled: {group.exam_date}
            </span>
          )}
          {group.is_grading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Grading Subject (Must precede non-grading)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition w-8 h-8 flex items-center justify-center font-bold text-lg leading-none"
          title="Delete subject"
        >
          ×
        </button>
      </div>

      {/* Main Row: Subject, Total Marks, Passing Marks, Exam Date */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Subject</label>
          <select
            value={group.subject}
            onChange={(e) => {
              const val = e.target.value;
              const selSubj = availableSubjects.find((s) => s.name === val);
              const defTotal = selSubj?.total_marks || (examCategory === 'periodic_assessment' ? 50 : 100);
              const defPass = selSubj?.passing_marks || (examCategory === 'periodic_assessment' ? 20 : 40);
              onUpdateField(idx, {
                subject: val,
                subjectMeta: selSubj || null,
                is_grading: !!selSubj?.is_grading,
                total_marks: defTotal,
                passing_marks: defPass,
                is_divided: selSubj?.is_divided || false,
                papers: []
              });
            }}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold shadow-sm"
          >
            <option value="" className="text-slate-900 bg-white">-- Select Subject --</option>
            {availableSubjects.map((s) => (
              <option key={s.name} value={s.name} className="text-slate-900 bg-white py-1">
                {s.name} {s.is_grading ? '(Grading)' : ''}
              </option>
            ))}
            {group.subject && !availableSubjects.some((s) => s.name === group.subject) && (
              <option value={group.subject} className="text-slate-900 bg-white">{group.subject}</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Total Marks <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={group.total_marks || ''}
            onChange={(e) => onUpdateField(idx, { total_marks: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium shadow-sm"
            placeholder="Total Marks"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Passing Marks <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={group.passing_marks || ''}
            onChange={(e) => onUpdateField(idx, { passing_marks: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium shadow-sm"
            placeholder="Passing Marks"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FaCalendarAlt className="text-indigo-600 text-xs" />
            Exam Date
          </label>
          <input
            type="date"
            value={group.exam_date || ''}
            onChange={(e) => onUpdateField(idx, { exam_date: e.target.value })}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium shadow-sm cursor-pointer"
          />
        </div>
      </div>

      {/* Second Row: Start Time & End Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FiClock className="text-indigo-600 text-xs" />
            Start Time
          </label>
          <input
            type="time"
            value={group.start_time?.substring(0, 5) || '08:30'}
            onChange={(e) => onUpdateField(idx, { start_time: e.target.value })}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium shadow-sm cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FiClock className="text-indigo-600 text-xs" />
            End Time
          </label>
          <input
            type="time"
            value={group.end_time?.substring(0, 5) || '10:30'}
            onChange={(e) => onUpdateField(idx, { end_time: e.target.value })}
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium shadow-sm cursor-pointer"
          />
        </div>
      </div>

      {/* Subject Marking Sections info & Practical toggle */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-3 pt-3 border-t border-slate-100">
        <div>
          {group.subjectMeta?.is_divided && group.subjectMeta.parts?.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Marking Sections:</span>
              <span className="text-slate-600 font-medium">
                {group.subjectMeta.parts.map((p) => (p.name || '') + (p.sub_code ? ` (${p.sub_code})` : '')).join(', ')}
              </span>
              <span className="text-slate-400 text-[11px]">(Sections for marking system)</span>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition shadow-sm">
          <input
            type="checkbox"
            checked={group.has_practical || false}
            onChange={(e) => onUpdateField(idx, { has_practical: e.target.checked })}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer border-slate-300"
          />
          <span>Include Practical</span>
        </label>
      </div>

      {/* Practical Marks Split */}
      {group.has_practical && (
        <div className="flex flex-col gap-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold text-slate-600 w-24">Marks Split:</label>
            <input
              type="number"
              value={group.theory_marks || ''}
              onChange={(e) => onUpdateField(idx, { theory_marks: parseInt(e.target.value) || '' })}
              className="border-slate-300 border p-2 rounded-lg text-xs w-24 bg-white text-slate-900 font-medium"
              placeholder="Theory"
            />
            <input
              type="number"
              value={group.practical_marks || ''}
              onChange={(e) => onUpdateField(idx, { practical_marks: parseInt(e.target.value) || '' })}
              className="border-slate-300 border p-2 rounded-lg text-xs w-24 bg-white text-slate-900 font-medium"
              placeholder="Practical"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold text-slate-600 w-24">Passing Marks:</label>
            <input
              type="number"
              value={group.theory_passing_marks || ''}
              onChange={(e) => onUpdateField(idx, { theory_passing_marks: parseInt(e.target.value) || '' })}
              className="border-slate-300 border p-2 rounded-lg text-xs w-24 bg-white text-slate-900 font-medium"
              placeholder="Th. Pass"
            />
            <input
              type="number"
              value={group.practical_passing_marks || ''}
              onChange={(e) => onUpdateField(idx, { practical_passing_marks: parseInt(e.target.value) || '' })}
              className="border-slate-300 border p-2 rounded-lg text-xs w-24 bg-white text-slate-900 font-medium"
              placeholder="Pr. Pass"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ExamManagement = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [timetablesMap, setTimetablesMap] = useState({});
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Views: 'list', 'timetable'
  const [view, setView] = useState('list');
  const [currentLogicalGroup, setCurrentLogicalGroup] = useState(null);
  const [selectedClassExam, setSelectedClassExam] = useState(null);

  // Timetable State
  const [timetableData, setTimetableData] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [savingTimetable, setSavingTimetable] = useState(false);
  const [finalizingTimetable, setFinalizingTimetable] = useState(false);
  const [autoReorderDates, setAutoReorderDates] = useState(true);
  const [finalizeError, setFinalizeError] = useState(null);

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [submittingExam, setSubmittingExam] = useState(false);

  const [newExam, setNewExam] = useState({
    name: '',
    target_class: 'all',
    type: 'Offline',
    start_date: '',
    default_exam_id: '',
    single_start_time: '08:30',
    single_end_time: '10:30'
  });

  const [classSelectionMode, setClassSelectionMode] = useState('all'); // 'all' | 'custom'
  const [selectedClassLevels, setSelectedClassLevels] = useState([]);

  const { globalClasses, schoolProfile } = useContext(SiteDataContext);
  const allClasses = (globalClasses?.map((c) => c.name) || [
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchExamsAndStatus = async () => {
    try {
      setLoading(true);
      const [examsRes, templatesRes] = await Promise.all([
        axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiUrl}/exams/default-templates`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);

      const examsData = examsRes.data || [];
      setExams(examsData);
      setDefaultTemplates(templatesRes.data || []);

      const ttMap = {};
      examsData.forEach((exam) => {
        const hasTt = exam.exam_timetable && exam.exam_timetable.length > 0;
        const isFin = hasTt && exam.exam_timetable[0].is_finalized;
        ttMap[exam.id] = { created: hasTt, finalized: isFin };
      });
      setTimetablesMap(ttMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsAndStatus();
  }, [apiUrl, token]);

  // Logical Exam Grouping: ONE row per logical event
  const logicalGroups = useMemo(() => {
    const groups = {};
    exams.forEach((exam) => {
      const key = exam.logical_exam_id || exam.id;
      if (!groups[key]) {
        groups[key] = {
          logical_exam_id: key,
          name: exam.name,
          type: exam.type || 'Offline',
          category: exam.category || 'periodic_assessment',
          start_date: exam.start_date,
          end_date: exam.end_date,
          default_exam_id: exam.default_exam_id,
          exams: []
        };
      }
      groups[key].exams.push(exam);
    });

    return Object.values(groups).map((grp) => {
      // Sort class instances
      grp.exams.sort((a, b) => (a.class_level || '').localeCompare(b.class_level || '', undefined, { numeric: true }));
      grp.classes = grp.exams.map((e) => e.class_level);
      grp.totalClasses = grp.exams.length;
      grp.createdCount = grp.exams.filter((e) => timetablesMap[e.id]?.created).length;
      grp.finalizedCount = grp.exams.filter((e) => timetablesMap[e.id]?.finalized).length;
      grp.isFullyFinalized = grp.totalClasses > 0 && grp.finalizedCount === grp.totalClasses;
      return grp;
    });
  }, [exams, timetablesMap]);

  // Select a template during creation
  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setNewExam((prev) => ({
        ...prev,
        name: '',
        default_exam_id: '',
        type: 'Offline',
        target_class: 'all'
      }));
      return;
    }

    const template = defaultTemplates.find((t) => t.id === templateId);
    if (template) {
      setNewExam((prev) => ({
        ...prev,
        name: template.name,
        type: template.type || 'Offline',
        default_exam_id: template.id,
        target_class: 'all'
      }));
    }
  };

  const selectedTemplate = useMemo(() => {
    return defaultTemplates.find((t) => t.id === selectedTemplateId) || defaultTemplates[0] || null;
  }, [defaultTemplates, selectedTemplateId]);

  // Handle Exam Creation with 20-Working-Day Auto-Scheduler
  const handleCreateExam = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newExam.name.trim()) return alert('Please enter exam name');
    if (!newExam.default_exam_id) return alert('Please select a default exam template');
    if (!newExam.start_date) return alert('Please select starting exam date');

    if (classSelectionMode === 'custom' && selectedClassLevels.length === 0) {
      return alert('Please select at least one class for this exam');
    }

    try {
      setSubmittingExam(true);
      const res = await axios.post(
        `${apiUrl}/exams`,
        {
          name: newExam.name.trim(),
          target_class: classSelectionMode === 'all' ? 'all' : (selectedClassLevels.length === 1 ? selectedClassLevels[0] : 'custom'),
          class_levels: classSelectionMode === 'all' ? ['all'] : selectedClassLevels,
          type: newExam.type,
          start_date: newExam.start_date,
          default_exam_id: newExam.default_exam_id,
          category: selectedTemplate?.category || 'periodic_assessment',
          single_start_time: newExam.single_start_time,
          single_end_time: newExam.single_end_time
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowCreate(false);

      await fetchExamsAndStatus();

      // Automatically open Timetable Editor for the newly created logical exam
      if (res.data?.exams && res.data.exams.length > 0) {
        const createdGroup = {
          logical_exam_id: res.data.logical_exam_id,
          name: res.data.exams[0].name,
          category: res.data.exams[0].category,
          type: res.data.exams[0].type,
          start_date: res.data.exams[0].start_date,
          end_date: res.data.exams[0].end_date,
          exams: res.data.exams
        };
        openLogicalTimetable(createdGroup, res.data.exams[0]);
      }
    } catch (error) {
      console.error('Create exam error:', error);
      const resData = error.response?.data;
      alert(resData?.message || 'Failed to create exam');
    } finally {
      setSubmittingExam(false);
    }
  };

  // Delete an entire logical exam event cleanly
  const handleDeleteLogicalExam = async (logicalGroup) => {
    const confirmMsg = `Are you sure you want to delete "${logicalGroup.name}"? This will delete the exam and timetable for all ${logicalGroup.totalClasses} classes.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.delete(`${apiUrl}/exams/logical/${logicalGroup.logical_exam_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams((prev) => prev.filter((e) => (e.logical_exam_id || e.id) !== logicalGroup.logical_exam_id));
      if (currentLogicalGroup?.logical_exam_id === logicalGroup.logical_exam_id) {
        setView('list');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete logical exam');
    }
  };

  // Open Unified Timetable Editor for a Logical Exam Group
  const openLogicalTimetable = async (logicalGroup, initialExam = null) => {
    setCurrentLogicalGroup(logicalGroup);
    const targetExam = initialExam || logicalGroup.exams[0];
    await switchClass(targetExam);
    setView('timetable');
  };

  // Switch Active Class in the Timetable Editor
  const switchClass = async (targetExam) => {
    setSelectedClassExam(targetExam);

    let eligibleSubs = [];
    // 1. Fetch eligible subjects computed by backend for this class and category
    try {
      const { data } = await axios.get(
        `${apiUrl}/exams/${targetExam.id}/eligible-subjects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      eligibleSubs = data || [];
      setAvailableSubjects(eligibleSubs);
    } catch (err) {
      console.error('Error fetching eligible subjects:', err);
    }

    // 2. Fetch existing timetable rows
    try {
      const { data: tt } = await axios.get(`${apiUrl}/exams/${targetExam.id}/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const grouped = [];
      (tt || []).forEach((item, idx) => {
        let existing = grouped.find((g) => g.subject === item.subject);
        if (existing) {
          // Do not duplicate subject cards for sub_subjects
          return;
        }

        const matchedMeta = (eligibleSubs || []).find((s) => s.name === item.subject);
        grouped.push({
          _dragId: `item-${idx}-${item.subject || 'sub'}-${Date.now()}`,
          subject: item.subject,
          is_grading: item.is_grading || !!matchedMeta?.is_grading || false,
          total_marks: item.total_marks || (targetExam.category === 'periodic_assessment' ? 50 : 100),
          passing_marks: item.passing_marks || (targetExam.category === 'periodic_assessment' ? 20 : 40),
          has_practical: item.has_practical || false,
          theory_marks: item.theory_marks || '',
          theory_passing_marks: item.theory_passing_marks || '',
          practical_marks: item.practical_marks || '',
          practical_passing_marks: item.practical_passing_marks || '',
          exam_date: item.exam_date ? item.exam_date.substring(0, 10) : '',
          start_time: item.start_time?.substring(0, 5) || '08:30',
          end_time: item.end_time?.substring(0, 5) || '10:30',
          is_divided: matchedMeta?.is_divided || false,
          subjectMeta: matchedMeta || null
        });
      });
      setTimetableData(grouped);
    } catch (err) {
      console.error('Error loading timetable:', err);
      setTimetableData([]);
    }
  };

  // Add a new row to the timetable editor
  const addTimetableRow = () => {
    let nextDate = '';
    if (timetableData.length > 0) {
      const lastDate = timetableData[timetableData.length - 1].exam_date;
      if (lastDate) {
        const d = new Date(lastDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Skip Sunday
          nextDate = d.toISOString().split('T')[0];
        }
      }
    }

    const cat = selectedClassExam?.category || 'periodic_assessment';
    setTimetableData([
      ...timetableData,
      {
        _dragId: `new-row-${Date.now()}-${timetableData.length}`,
        subject: '',
        is_grading: false,
        total_marks: cat === 'periodic_assessment' ? 50 : 100,
        passing_marks: cat === 'periodic_assessment' ? 20 : 40,
        has_practical: false,
        theory_marks: '',
        theory_passing_marks: '',
        practical_marks: '',
        practical_passing_marks: '',
        exam_date: nextDate,
        start_time: '08:30',
        end_time: '10:30',
        is_divided: false,
        subjectMeta: null
      }
    ]);
  };

  const handleUpdateField = (index, updates) => {
    const updated = [...timetableData];
    updated[index] = { ...updated[index], ...updates };
    setTimetableData(updated);
  };

  const handleRemoveRow = (index) => {
    setTimetableData(timetableData.filter((_, i) => i !== index));
  };

  // Drag-and-drop handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setTimetableData((items) => {
        const oldIndex = items.findIndex((i) => i._dragId === active.id);
        const newIndex = items.findIndex((i) => i._dragId === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;

        let reordered = arrayMove(items, oldIndex, newIndex);

        if (autoReorderDates) {
          const datesInOrder = items
            .map((it) => it.exam_date)
            .filter(Boolean)
            .sort();

          if (datesInOrder.length === items.length) {
            reordered = reordered.map((it, idx) => ({
              ...it,
              exam_date: datesInOrder[idx] || it.exam_date
            }));
          }
        }
        return reordered;
      });
    }
  };

  // One-click date re-aligner
  const handleAlignDatesChronologically = () => {
    const sortedDates = timetableData
      .map((it) => it.exam_date)
      .filter(Boolean)
      .sort();

    if (sortedDates.length === 0) {
      alert('No valid exam dates found to align.');
      return;
    }

    setTimetableData(
      timetableData.map((it, idx) => ({
        ...it,
        exam_date: sortedDates[idx] || it.exam_date
      }))
    );
  };

  // Save Timetable Draft
  const handleSaveTimetable = async () => {
    if (!selectedClassExam) return;
    setSavingTimetable(true);
    try {
      const flatData = timetableData.map((g) => ({
        class_level: selectedClassExam.class_level,
        subject: g.subject,
        is_grading: g.is_grading || false,
        total_marks: parseInt(g.total_marks) || (selectedClassExam.category === 'periodic_assessment' ? 50 : 100),
        passing_marks: parseInt(g.passing_marks) || (selectedClassExam.category === 'periodic_assessment' ? 20 : 40),
        has_practical: g.has_practical || false,
        theory_marks: g.theory_marks || null,
        theory_passing_marks: g.theory_passing_marks || null,
        practical_marks: g.practical_marks || null,
        practical_passing_marks: g.practical_passing_marks || null,
        sub_subject: null,
        exam_date: g.exam_date || null,
        start_time: g.start_time || '08:30',
        end_time: g.end_time || '10:30',
        room_number: ''
      }));

      await axios.post(
        `${apiUrl}/exams/${selectedClassExam.id}/timetable`,
        { timetableData: flatData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Routine for Class ${selectedClassExam.class_level} saved successfully!`);
      setTimetablesMap((prev) => ({
        ...prev,
        [selectedClassExam.id]: { created: true, finalized: false }
      }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save timetable draft');
    } finally {
      setSavingTimetable(false);
    }
  };

  // Finalize Timetable (Strict Server-Side Validation Gate)
  const handleFinalizeTimetable = async () => {
    if (!selectedClassExam) return;
    if (
      !window.confirm(
        `Are you sure you want to finalize the timetable for Class ${selectedClassExam.class_level}? This will lock it from further editing.`
      )
    ) {
      return;
    }

    setFinalizingTimetable(true);
    setFinalizeError(null);
    try {
      await axios.put(
        `${apiUrl}/exams/${selectedClassExam.id}/timetable/finalize`,
        { class_level: selectedClassExam.class_level },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimetablesMap((prev) => ({
        ...prev,
        [selectedClassExam.id]: { created: true, finalized: true }
      }));
      alert(`Class ${selectedClassExam.class_level} timetable finalized successfully!`);
    } catch (error) {
      console.error('Finalization rejection:', error);
      const errMsg = error.response?.data?.message || 'Failed to finalize timetable due to validation errors.';
      setFinalizeError(errMsg);
    } finally {
      setFinalizingTimetable(false);
    }
  };

  // Download PDF for a single class
  const downloadClassPDF = async (examRecord) => {
    try {
      const { data: ttData } = await axios.get(`${apiUrl}/exams/${examRecord.id}/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!ttData || ttData.length === 0) {
        alert('No timetable created yet to download.');
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Exam Routine: ${examRecord.name} - Class ${examRecord.class_level}`, 14, 22);

      const tableColumn = ['Date', 'Time', 'Subject', 'Total Marks', 'Pass Marks', 'Type'];
      const tableRows = [];

      ttData.forEach((row) => {
        const subjectName = `${row.subject} ${row.sub_subject ? `(${row.sub_subject})` : ''}`;
        const timeStr = `${row.start_time?.substring(0, 5) || '--:--'} - ${row.end_time?.substring(0, 5) || '--:--'}`;
        tableRows.push([
          row.exam_date || '-',
          timeStr,
          subjectName,
          row.total_marks || (row.theory_marks || 0) + (row.practical_marks || 0),
          row.passing_marks || '-',
          row.is_grading ? 'Grading' : 'Standard'
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30
      });

      doc.save(`Timetable_${examRecord.name}_Class_${examRecord.class_level}.pdf`);
    } catch (error) {
      console.error(error);
      alert('Failed to download PDF');
    }
  };

  // Download Master Routine for all classes in single A4 landscape PDF
  const exportMasterRoutinePDF = async (logicalGroup) => {
    try {
      const res = await axios.get(`${apiUrl}/exams/logical/${logicalGroup.logical_exam_id}/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { exams: groupExams, timetables: allTtRows } = res.data;

      if (!allTtRows || allTtRows.length === 0) {
        alert('No routine data available to download for this exam.');
        return;
      }

      // Canonical sort of classes
      const classSet = new Set(groupExams.map((e) => e.class_level));
      const sortedClasses = Array.from(classSet).sort((a, b) => {
        const orderA = allClasses.indexOf(a);
        const orderB = allClasses.indexOf(b);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;
        return a.localeCompare(b);
      });

      // Chronological sort of dates
      const dateSet = new Set(allTtRows.map((r) => r.exam_date).filter(Boolean));
      const sortedDates = Array.from(dateSet).sort();

      if (sortedDates.length === 0) {
        alert('No scheduled dates found in timetable.');
        return;
      }

      // Build Matrix: Date -> Class -> Subject(s)
      const matrix = {};
      sortedDates.forEach((d) => {
        matrix[d] = {};
        sortedClasses.forEach((c) => {
          matrix[d][c] = [];
        });
      });

      allTtRows.forEach((r) => {
        if (r.exam_date && matrix[r.exam_date] && matrix[r.exam_date][r.class_level]) {
          const subTitle = r.sub_subject ? `${r.subject} (${r.sub_subject})` : r.subject;
          matrix[r.exam_date][r.class_level].push(subTitle);
        }
      });

      // Initialize Landscape A4 PDF (297mm x 210mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const schoolName = schoolProfile?.name || 'HOLY NAME HIGHER SECONDARY SCHOOL';
      const schoolAddress = schoolProfile?.officeAddress || 'Sivasagar, Assam - 785640';
      const examName = `${logicalGroup.name.toUpperCase()} - EXAMINATION ROUTINE`;
      const startDate = logicalGroup.start_date || sortedDates[0];
      const endDate = logicalGroup.end_date || sortedDates[sortedDates.length - 1];
      const examTiming = (allTtRows[0]?.start_time && allTtRows[0]?.end_time)
        ? `${allTtRows[0].start_time.substring(0, 5)} - ${allTtRows[0].end_time.substring(0, 5)}`
        : '08:30 AM - 10:30 AM';

      let currentY = 8;

      // School Logo
      if (schoolProfile?.logo) {
        try {
          const imgBase64 = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } catch {
                resolve(null);
              }
            };
            img.onerror = () => resolve(null);
            img.src = schoolProfile.logo;
          });

          if (imgBase64) {
            doc.addImage(imgBase64, 'PNG', 12, 7, 20, 20);
          }
        } catch (imgErr) {
          console.warn('Could not load logo for PDF:', imgErr);
        }
      }

      // Headings with dynamic sequential Y calculation to completely prevent overlaps
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 41, 59);
      doc.text(schoolName, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const addressLines = doc.splitTextToSize(schoolAddress || '', 200);
      doc.text(addressLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += (addressLines.length * 3.8) + 2.5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(49, 46, 129);
      doc.text(examName, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const subInfo = `Exam Period: ${startDate} to ${endDate}   |   Exam Timings: ${examTiming} (1-Shift Session)   |   Total Classes: ${sortedClasses.length}`;
      doc.text(subInfo, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4.5;

      const tableStartY = Math.max(currentY, 28);

      // Table Matrix
      const tableHeaders = ['Date & Day', ...sortedClasses.map((c) => `Class ${c}`)];
      const tableBody = sortedDates.map((d) => {
        const dateObj = new Date(d);
        const dayName = isNaN(dateObj.getTime())
          ? ''
          : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dateFormatted = `${d}\n(${dayName})`;

        const row = [dateFormatted];
        sortedClasses.forEach((c) => {
          const subs = matrix[d][c] || [];
          row.push(subs.length > 0 ? subs.join('\n') : '—');
        });
        return row;
      });

      // Adaptive sizing based on row count and column count to guarantee 1-page fit
      const rowCount = sortedDates.length;
      const colCount = sortedClasses.length;

      let cellFontSize = 7.5;
      let cellPadding = 1.8;
      if (rowCount > 12 || colCount > 10) {
        cellFontSize = 6.5;
        cellPadding = 1.2;
      }
      if (rowCount > 16 || colCount > 12) {
        cellFontSize = 6;
        cellPadding = 0.8;
      }

      autoTable(doc, {
        head: [tableHeaders],
        body: tableBody,
        startY: tableStartY,
        margin: { left: 8, right: 8, top: tableStartY, bottom: 8 },
        theme: 'grid',
        tableWidth: 'auto',
        styles: {
          fontSize: cellFontSize,
          cellPadding: cellPadding,
          halign: 'center',
          valign: 'middle',
          overflow: 'linebreak',
          lineWidth: 0.15,
          lineColor: [203, 213, 225],
          textColor: [15, 23, 42]
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.2,
          lineColor: [15, 23, 42]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: {
            fontStyle: 'bold',
            halign: 'center',
            fillColor: [241, 245, 249],
            cellWidth: colCount > 10 ? 24 : 28
          }
        },
        pageBreak: 'avoid',
        rowPageBreak: 'avoid'
      });

      // Ensure strictly 1 page
      while (doc.internal.getNumberOfPages() > 1) {
        doc.deletePage(doc.internal.getNumberOfPages());
      }

      doc.save(`Exam_Routine_${logicalGroup.name}_Master.pdf`);
    } catch (err) {
      console.error('[EXPORT MASTER PDF ERROR]:', err);
      alert('Failed to generate Master PDF: ' + (err.message || 'Unknown error'));
    }
  };

  // Download Master Routine for all classes in Excel (.xlsx) format
  const exportMasterRoutineExcel = async (logicalGroup) => {
    try {
      const res = await axios.get(`${apiUrl}/exams/logical/${logicalGroup.logical_exam_id}/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { exams: groupExams, timetables: allTtRows } = res.data;

      if (!allTtRows || allTtRows.length === 0) {
        alert('No routine data available to download for this exam.');
        return;
      }

      // Canonical sort of classes
      const classSet = new Set(groupExams.map((e) => e.class_level));
      const sortedClasses = Array.from(classSet).sort((a, b) => {
        const orderA = allClasses.indexOf(a);
        const orderB = allClasses.indexOf(b);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;
        return a.localeCompare(b);
      });

      const dateSet = new Set(allTtRows.map((r) => r.exam_date).filter(Boolean));
      const sortedDates = Array.from(dateSet).sort();

      const matrix = {};
      sortedDates.forEach((d) => {
        matrix[d] = {};
        sortedClasses.forEach((c) => {
          matrix[d][c] = [];
        });
      });

      allTtRows.forEach((r) => {
        if (r.exam_date && matrix[r.exam_date] && matrix[r.exam_date][r.class_level]) {
          const subTitle = r.sub_subject ? `${r.subject} (${r.sub_subject})` : r.subject;
          matrix[r.exam_date][r.class_level].push(subTitle);
        }
      });

      await exportExamRoutineExcelWithImage({
        schoolProfile,
        logicalGroup,
        sortedDates,
        sortedClasses,
        matrix,
        allTtRows,
        filename: `Exam_Routine_${(logicalGroup.name || 'Exam').replace(/\s+/g, '_')}_Master.xlsx`
      });
    } catch (err) {
      console.error('[EXPORT MASTER EXCEL ERROR]:', err);
      alert('Failed to generate Excel file: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        <FaSpinner className="animate-spin inline mr-2" /> Loading Exam Management...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 md:p-8 min-h-screen border border-gray-100 shadow-sm">
      {/* ======================= LIST VIEW ======================= */}
      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Exam Management</h2>
              <p className="text-xs text-gray-500 mt-1">
                Schedule standardized exams, manage multi-class routines, and verify subject completeness.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreate(true);
                setClassSelectionMode('all');
                setSelectedClassLevels([]);
                if (defaultTemplates.length > 0) {
                  handleTemplateSelection(defaultTemplates[0].id);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-xs shadow-sm shadow-indigo-600/20"
            >
              <FaPlus /> Create Exam
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="p-4">No.</th>
                  <th className="p-4">Exam Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Targeted Classes</th>
                  <th className="p-4">Exam Dates</th>
                  <th className="p-4">Routine Status</th>
                  <th className="p-4">Finalized</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {logicalGroups.map((grp, idx) => (
                  <tr key={grp.logical_exam_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 font-bold text-gray-700">{idx + 1}</td>
                    <td className="p-4 font-bold text-gray-900">{grp.name}</td>
                    <td className="p-4">
                      {grp.category === 'terminal_examination' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          Terminal Examination
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                          Periodic Assessment
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {grp.type || 'Offline'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {grp.totalClasses === allClasses.length ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-100">
                          All Available Classes ({grp.totalClasses})
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {grp.classes.slice(0, 4).map((c) => (
                            <span key={c} className="px-2 py-0.5 text-xs font-semibold bg-gray-100 rounded border border-gray-200 text-gray-800">
                              Class {c}
                            </span>
                          ))}
                          {grp.classes.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[11px] text-gray-500 font-semibold">
                              +{grp.classes.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs font-medium text-gray-600">
                      {grp.start_date ? (
                        <span>
                          {grp.start_date} {grp.end_date ? `to ${grp.end_date}` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="p-4">
                      {grp.createdCount === grp.totalClasses ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          All Created ({grp.createdCount}/{grp.totalClasses})
                        </span>
                      ) : grp.createdCount > 0 ? (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          Partial ({grp.createdCount}/{grp.totalClasses})
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          Not Created
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {grp.isFullyFinalized ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          Finalized ({grp.finalizedCount}/{grp.totalClasses})
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          Draft ({grp.finalizedCount}/{grp.totalClasses})
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openLogicalTimetable(grp)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 h-8 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
                          title="Manage Routine & Timetable"
                        >
                          <FaCalendarAlt size={11} /> Manage
                        </button>
                        <button
                          onClick={() => exportMasterRoutinePDF(grp)}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 h-8 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
                          title="Download Landscape A4 Master Routine PDF (All Classes)"
                        >
                          <FaFilePdf size={11} /> PDF
                        </button>
                        <button
                          onClick={() => exportMasterRoutineExcel(grp)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 h-8 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
                          title="Download Master Routine Excel (All Classes)"
                        >
                          <FaFileExcel size={11} /> Excel
                        </button>
                        {!grp.isFullyFinalized && (
                          <button
                            onClick={() => handleDeleteLogicalExam(grp)}
                            className="bg-gray-600 hover:bg-gray-700 text-white w-8 h-8 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                            title="Delete Exam Event"
                          >
                            <FaTrash size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {logicalGroups.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-400 font-medium">
                      No exams created yet. Click "Create Exam" to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================= TIMETABLE ROUTINE BUILDER ======================= */}
      {view === 'timetable' && selectedClassExam && currentLogicalGroup && (
        <div className="bg-gray-50/70 p-4 md:p-8 rounded-2xl border border-gray-200">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-gray-800">
                  Exam Routine: {selectedClassExam.name}
                </h2>
                {selectedClassExam.category === 'terminal_examination' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    Terminal Examination (100 Marks)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    Periodic Assessment (50 Marks)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500 font-medium">
                {selectedClassExam.start_date && (
                  <span>
                    Exam Period: {selectedClassExam.start_date} to {selectedClassExam.end_date || 'N/A'} (1-Shift Session)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => exportMasterRoutinePDF(currentLogicalGroup)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                title="Download Master Routine Landscape A4 PDF (All Classes)"
              >
                <FaFilePdf size={12} /> Master PDF (A4 Landscape)
              </button>
              <button
                type="button"
                onClick={() => exportMasterRoutineExcel(currentLogicalGroup)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                title="Download Master Routine Excel (.xlsx)"
              >
                <FaFileExcel size={12} /> Master Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  setView('list');
                  fetchExamsAndStatus();
                }}
                className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-900 transition flex items-center gap-1.5"
              >
                <FaArrowLeft /> Back to Exam List
              </button>
            </div>
          </div>

          {/* Unified Class Switcher Tabs */}
          {currentLogicalGroup.exams?.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 custom-scrollbar border-b border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1 shrink-0">
                Class Routine:
              </span>
              {currentLogicalGroup.exams.map((clsExam) => {
                const isActive = selectedClassExam?.id === clsExam.id;
                const isFin = timetablesMap[clsExam.id]?.finalized;
                return (
                  <button
                    key={clsExam.id}
                    type="button"
                    onClick={() => switchClass(clsExam)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>Class {clsExam.class_level}</span>
                    {isFin && (
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Notice for Grading Priority in Terminal Examination */}
          {selectedClassExam.category === 'terminal_examination' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 mb-6 text-xs text-purple-900 flex items-start gap-2.5">
              <FiInfo className="text-purple-600 text-base shrink-0 mt-0.5" />
              <div>
                <strong>Terminal Examination Rule:</strong> All grading subjects (e.g. Moral Science, Computer, Physical Education) must be conducted before any non-grading subjects. The finalization gate will enforce this ordering.
              </div>
            </div>
          )}

          {/* Interactive Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={autoReorderDates}
                  onChange={(e) => setAutoReorderDates(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Auto-Reorder Dates with Drag (Keeps Chronological Sequence)</span>
              </label>

              <button
                type="button"
                onClick={handleAlignDatesChronologically}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
                title="Sort all dates in order and assign them to the current subject sequence"
              >
                <FiAlignLeft /> Align Dates to Sequence
              </button>
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <FiMove className="text-indigo-600" />
              <span>Drag handle to rearrange days. Click dates or times to edit directly.</span>
            </div>
          </div>

          {/* DRAGGABLE CARDS LIST */}
          <div className="mb-8">
            {timetableData.length === 0 ? (
              <div className="bg-white p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500 mb-3">No subjects in this exam timetable yet.</p>
                <button
                  type="button"
                  onClick={addTimetableRow}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  <FaPlus className="inline mr-1" /> Add Subject
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={timetableData.map((g) => g._dragId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {timetableData.map((group, idx) => (
                      <SortableTimetableCard
                        key={group._dragId}
                        group={group}
                        idx={idx}
                        availableSubjects={availableSubjects}
                        examCategory={selectedClassExam.category}
                        onUpdateField={handleUpdateField}
                        onRemove={handleRemoveRow}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky bottom-4 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={addTimetableRow}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
              >
                <FaPlus /> Add Subject Day
              </button>
              <button
                onClick={() => downloadClassPDF(selectedClassExam)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-sm"
              >
                <FaDownload /> Download Class PDF
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveTimetable}
                disabled={savingTimetable}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {savingTimetable ? 'Saving Draft...' : 'Save Draft Routine'}
              </button>

              <button
                onClick={handleFinalizeTimetable}
                disabled={finalizingTimetable}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <FaCheckCircle />
                {finalizingTimetable ? 'Finalizing...' : 'Finalize Timetable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= CREATE EXAM MODAL ======================= */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              ✕
            </button>

            <h2 className="text-xl font-black text-gray-800 mb-1">Create New Exam</h2>
            <p className="text-xs text-gray-500 mb-5">
              Select a SuperAdmin exam template to schedule routines and verify class capacity.
            </p>

            <form onSubmit={handleCreateExam} className="space-y-4">
              {/* Template Selection */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Select SuperAdmin Exam Template *
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelection(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-900 font-semibold text-sm shadow-sm"
                >
                  {defaultTemplates.map((t) => (
                    <option key={t.id} value={t.id} className="text-slate-900 bg-white py-1">
                      {t.name} ({t.category === 'terminal_examination' ? 'Terminal Examination' : 'Periodic Assessment'})
                    </option>
                  ))}
                </select>

                {/* Inherited Category Banner (Read-only) */}
                {selectedTemplate && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    selectedTemplate.category === 'terminal_examination'
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <FiInfo className="text-base shrink-0 mt-0.5 text-indigo-600" />
                    <div>
                      <div className="font-bold mb-0.5 text-slate-900">
                        {selectedTemplate.category === 'terminal_examination'
                          ? 'Terminal Examination (100 Marks)'
                          : 'Periodic Assessment (50 Marks)'}
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedTemplate.category === 'terminal_examination'
                          ? 'Covers all subjects (Core, Elective, MIL, Minor, and Grading Sets). Grading subjects will be scheduled first.'
                          : 'Covers only Core, Elective, and MIL subjects configured by the school for each class.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Exam Name *</label>
                <input
                  required
                  type="text"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  className="w-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-sm shadow-sm"
                  placeholder="e.g. Half Yearly Examination 2026"
                />
              </div>

              {/* Targeted Classes Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Targeted Classes *
                  </label>
                  <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {classSelectionMode === 'all'
                      ? 'All Classes Selected'
                      : `${selectedClassLevels.length} Class${selectedClassLevels.length === 1 ? '' : 'es'} Selected`}
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setClassSelectionMode('all');
                      setNewExam((prev) => ({ ...prev, target_class: 'all' }));
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      classSelectionMode === 'all'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Available Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClassSelectionMode('custom');
                      if (selectedClassLevels.length === 0) {
                        setSelectedClassLevels(allClasses.slice(0, 4));
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      classSelectionMode === 'custom'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Select Specific Classes
                  </button>
                </div>

                {classSelectionMode === 'all' ? (
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                    <span className="font-bold">All Available Classes ({allClasses.length}): </span>
                    <span className="text-slate-600">Class {allClasses.join(', ')}</span>
                    <p className="text-[11px] text-indigo-600 mt-1">
                      Distinct class exam instances will be automatically generated and linked under one unified exam event.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
                      <span className="text-slate-500 font-semibold text-[11px]">Click classes to include:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedClassLevels([...allClasses])}
                          className="text-xs text-indigo-600 hover:underline font-bold"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedClassLevels([])}
                          className="text-xs text-rose-500 hover:underline font-bold"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pt-1">
                      {allClasses.map((cls) => {
                        const isSelected = selectedClassLevels.includes(cls);
                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => {
                              setSelectedClassLevels((prev) =>
                                prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {isSelected && <span className="text-[10px]">✓</span>}
                            <span>Class {cls}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedClassLevels.length === 0 && (
                      <p className="text-[11px] text-rose-500 font-semibold pt-1">
                        Please select at least one class for this exam.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Type, Start Date, and 1-Shift Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Exam Type</label>
                  <select
                    value={newExam.type}
                    onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium shadow-sm"
                  >
                    <option value="Offline" className="text-slate-900 bg-white">Offline</option>
                    <option value="Online" className="text-slate-900 bg-white">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Starting Exam Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={newExam.start_date}
                    onChange={(e) => setNewExam({ ...newExam, start_date: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium shadow-sm cursor-pointer"
                  />
                </div>
              </div>

              {/* 1-Shift Exam Timings */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Exam Timings (1-Shift Morning Session)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newExam.single_start_time}
                      onChange={(e) => setNewExam({ ...newExam, single_start_time: e.target.value })}
                      className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 rounded-lg text-xs font-semibold shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={newExam.single_end_time}
                      onChange={(e) => setNewExam({ ...newExam, single_end_time: e.target.value })}
                      className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 rounded-lg text-xs font-semibold shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Scheduling Rules Banner */}
              <div className="text-[11px] bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-800 text-xs">
                  <FiCalendar className="text-sm shrink-0" />
                  <span>Automated 20 Working Days Scheduler</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                  <li><strong>1-Shift System:</strong> Exactly 1 non-grading subject per day (no double shifts).</li>
                  <li><strong>Grading Subjects:</strong> Conducted within at most 2 working dates (Day 1 & Day 2) before non-grading subjects.</li>
                  <li><strong>Class IX–XII MIL:</strong> Conducted on 1 unified day labeled as "MIL" in the routine.</li>
                  <li><strong>Duration:</strong> Routine auto-ends within 20 working days (excluding Sundays).</li>
                </ul>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExam}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submittingExam ? 'Scheduling...' : 'Create Exam & Auto-Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= FINALIZATION REJECTION MODAL ======================= */}
      {finalizeError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <FiAlertCircle className="text-2xl shrink-0" />
              <h3 className="text-lg font-bold text-gray-900">Finalization Verification Failed</h3>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5 text-sm text-rose-800 leading-relaxed font-medium">
              {finalizeError}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setFinalizeError(null)}
                className="bg-gray-800 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-gray-900"
              >
                Understood, Let Me Fix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
