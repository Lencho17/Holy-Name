import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiPlus, FiTrash2, FiEdit2, FiClock, FiBook, FiCheck, 
  FiX, FiMove, FiLayers, FiAlertCircle, FiCheckCircle, FiInfo 
} from 'react-icons/fi';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Standard Subject Placeholders for Dynamic School Scheduling
const STANDARD_PLACEHOLDERS = [
  { label: 'Core 1', category: 'core', desc: '1st Core Subject Slot' },
  { label: 'Core 2', category: 'core', desc: '2nd Core Subject Slot' },
  { label: 'Core 3', category: 'core', desc: '3rd Core Subject Slot' },
  { label: 'Core 4', category: 'core', desc: '4th Core Subject Slot' },
  { label: 'MIL', category: 'mil', desc: 'Mother Tongue / MIL Slot' },
  { label: 'Elective 1', category: 'elective', desc: '1st Elective Subject Slot' },
  { label: 'Core 5', category: 'core', desc: '5th Core Subject Slot' },
  { label: 'Elective 2', category: 'elective', desc: '2nd Elective Subject Slot' },
  { label: 'Grading 1', category: 'grading', desc: '1st Day Grading Subjects' },
  { label: 'Grading 2', category: 'grading', desc: '2nd Day Grading Subjects' },
  { label: 'Minor', category: 'minor', desc: 'Minor Subject Slot' },
];

const getPlaceholderBadge = (subject) => {
  const up = (subject || '').trim().toUpperCase();
  if (up.includes('GRADING') || up.includes('GRADE')) {
    return { label: 'Grading Slot', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (up.startsWith('CORE') || up.includes('CORE')) {
    return { label: 'Core Slot', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (up.includes('MIL')) {
    return { label: 'MIL Slot', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  if (up.startsWith('ELECTIVE') || up.includes('ELECTIVE')) {
    return { label: 'Elective Slot', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (up.startsWith('MINOR') || up.includes('MINOR')) {
    return { label: 'Minor Slot', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
  return { label: 'Exact Subject', color: 'bg-slate-50 text-slate-600 border-slate-200' };
};

// Sortable Row Component for Timetable Routine Builder
const SortableRoutineItem = ({ 
  item, 
  index, 
  globalSubjects, 
  onUpdate, 
  onRemove,
  examCategory
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item._tempId || item.id || `item-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1
  };

  const isPeriodic = examCategory === 'periodic_assessment';
  const badge = getPlaceholderBadge(item.subject);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 mb-3.5 rounded-2xl border transition-all duration-200 ${
        isDragging 
          ? 'bg-indigo-50/70 border-indigo-500 shadow-xl scale-[1.01] z-30' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:items-center gap-3.5">
        {/* Drag Handle & Day Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button" 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            title="Drag to reorder day"
          >
            <FiMove className="text-base" />
          </button>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
            Day {index + 1}
          </span>
        </div>

        {/* Fields Row */}
        <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center gap-3">
          {/* Subject / Placeholder selection */}
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Subject / Placeholder
              </label>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                list={`subjects-list-${index}`}
                placeholder="e.g. Core 1, MIL, Elective 1..."
                value={item.subject}
                onChange={(e) => onUpdate(index, 'subject', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-bold shadow-sm placeholder-slate-400"
              />
              <datalist id={`subjects-list-${index}`}>
                {STANDARD_PLACEHOLDERS.map((p) => (
                  <option key={p.label} value={p.label}>{p.desc}</option>
                ))}
                {globalSubjects.map((s) => (
                  <option key={s.id || s.name} value={s.name} />
                ))}
              </datalist>
            </div>
            {/* Quick Placeholder Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium">Quick Slot:</span>
              {(isPeriodic
                ? ['Core 1', 'Core 2', 'Core 3', 'Core 4', 'MIL', 'Elective 1', 'Core 5']
                : ['Grading 1', 'Grading 2', 'Core 1', 'Core 2', 'Core 3', 'Core 4', 'MIL', 'Elective 1', 'Minor']
              ).map((placeholder) => (
                <button
                  key={placeholder}
                  type="button"
                  onClick={() => onUpdate(index, 'subject', placeholder)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition border ${
                    item.subject === placeholder
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {placeholder}
                </button>
              ))}
            </div>
          </div>

          {/* Start Time */}
          <div className="w-36 shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={item.start_time?.substring(0, 5) || '08:30'}
              onChange={(e) => onUpdate(index, 'start_time', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-medium shadow-sm cursor-pointer"
            />
          </div>

          {/* End Time */}
          <div className="w-36 shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              End Time
            </label>
            <input
              type="time"
              value={item.end_time?.substring(0, 5) || '10:30'}
              onChange={(e) => onUpdate(index, 'end_time', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-medium shadow-sm cursor-pointer"
            />
          </div>

          {/* Total & Pass Marks */}
          <div className="shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">
              Total / Pass
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <input
                type="number"
                placeholder={isPeriodic ? '50' : '100'}
                value={item.total_marks ?? ''}
                onChange={(e) => onUpdate(index, 'total_marks', parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-bold text-center shadow-sm"
                title="Total Marks"
              />
              <span className="text-slate-400 font-bold text-xs">/</span>
              <input
                type="number"
                placeholder={isPeriodic ? '20' : '40'}
                value={item.passing_marks ?? ''}
                onChange={(e) => onUpdate(index, 'passing_marks', parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-bold text-center shadow-sm"
                title="Passing Marks"
              />
            </div>
          </div>
        </div>

        {/* Practical toggle & Delete */}
        <div className="flex items-center gap-3 shrink-0 self-end xl:self-center pt-2 xl:pt-0">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition shadow-sm">
            <input 
              type="checkbox"
              checked={item.has_practical || false}
              onChange={(e) => onUpdate(index, 'has_practical', e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer"
            />
            <span>Practical</span>
          </label>

          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-100"
            title="Remove subject"
          >
            <FiTrash2 className="text-base" />
          </button>
        </div>
      </div>

      {/* Practical marks details if enabled */}
      {item.has_practical && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Theory Marks</label>
            <input 
              type="number" 
              placeholder={isPeriodic ? '35' : '70'} 
              value={item.theory_marks || ''} 
              onChange={e => onUpdate(index, 'theory_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold shadow-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Theory Pass</label>
            <input 
              type="number" 
              placeholder={isPeriodic ? '14' : '28'} 
              value={item.theory_passing_marks || ''} 
              onChange={e => onUpdate(index, 'theory_passing_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold shadow-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Practical Marks</label>
            <input 
              type="number" 
              placeholder={isPeriodic ? '15' : '30'} 
              value={item.practical_marks || ''} 
              onChange={e => onUpdate(index, 'practical_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold shadow-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Practical Pass</label>
            <input 
              type="number" 
              placeholder={isPeriodic ? '6' : '12'} 
              value={item.practical_passing_marks || ''} 
              onChange={e => onUpdate(index, 'practical_passing_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const DefaultExams = () => {
  const [defaultExams, setDefaultExams] = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showExamModal, setShowExamModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [activeRoutineExam, setActiveRoutineExam] = useState(null);
  const [routineItems, setRoutineItems] = useState([]);
  const [savingRoutine, setSavingRoutine] = useState(false);

  // Form State for Exam details
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'Offline',
    category: 'periodic_assessment',
    description: '',
    default_start_time: '08:30',
    default_end_time: '10:30'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [examsRes, subjectsRes] = await Promise.all([
        fetch(`${API_URL}/superadmin/default-exams`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/subjects/global`, { headers: getAuthHeaders() })
      ]);

      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setDefaultExams(examsData);
      }
      if (subjectsRes && subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setGlobalSubjects(subjectsData);
      }
    } catch (err) {
      console.error('Error fetching default exams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingExam(null);
    setExamForm({
      name: '',
      type: 'Offline',
      category: 'periodic_assessment',
      description: '',
      default_start_time: '08:30',
      default_end_time: '10:30'
    });
    setShowExamModal(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name || '',
      type: 'Offline',
      category: exam.category || 'periodic_assessment',
      description: exam.description || '',
      default_start_time: exam.default_start_time?.substring(0, 5) || '08:30',
      default_end_time: exam.default_end_time?.substring(0, 5) || (exam.category === 'periodic_assessment' ? '10:30' : '11:30')
    });
    setShowExamModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!editingExam) return;

    try {
      const res = await fetch(`${API_URL}/superadmin/default-exams/${editingExam.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(examForm)
      });
      if (!res.ok) throw new Error('Failed to update default exam');

      setShowExamModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving default exam');
    }
  };

  // Open Routine Builder
  const openRoutineBuilder = async (exam) => {
    setActiveRoutineExam(exam);
    const isPeriodic = exam.category === 'periodic_assessment';
    try {
      const res = await fetch(`${API_URL}/superadmin/default-exams/${exam.id}/timetable`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = (data || []).map((item, idx) => ({
          ...item,
          total_marks: isPeriodic && item.total_marks === 100 ? 50 : (item.total_marks || (isPeriodic ? 50 : 100)),
          passing_marks: isPeriodic && item.passing_marks === 40 ? 20 : (item.passing_marks || (isPeriodic ? 20 : 40)),
          _tempId: item.id || `routine-${idx}-${Date.now()}`
        }));
        setRoutineItems(formatted);
      } else {
        setRoutineItems([]);
      }
    } catch (err) {
      console.error(err);
      setRoutineItems([]);
    }
    setShowRoutineModal(true);
  };

  // Routine Item Management
  const handleAddRoutineSubject = () => {
    const nextIdx = routineItems.length;
    const isPeriodic = activeRoutineExam?.category === 'periodic_assessment';
    const defaultTotal = isPeriodic ? 50 : 100;
    const defaultPass = isPeriodic ? 20 : 40;

    // Suggest next logical placeholder
    const periodicSequence = ['Core 1', 'Core 2', 'Core 3', 'Core 4', 'MIL', 'Elective 1', 'Core 5', 'Elective 2'];
    const terminalSequence = ['Grading 1', 'Grading 2', 'Core 1', 'Core 2', 'Core 3', 'Core 4', 'MIL', 'Elective 1', 'Core 5', 'Elective 2', 'Minor'];
    const seq = isPeriodic ? periodicSequence : terminalSequence;
    const suggested = seq[nextIdx] || `Core ${nextIdx + 1}`;

    setRoutineItems([
      ...routineItems,
      {
        _tempId: `temp-${Date.now()}`,
        subject: suggested,
        order_index: nextIdx,
        day_offset: nextIdx,
        start_time: activeRoutineExam?.default_start_time?.substring(0, 5) || '08:30',
        end_time: activeRoutineExam?.default_end_time?.substring(0, 5) || (isPeriodic ? '10:30' : '11:30'),
        total_marks: defaultTotal,
        passing_marks: defaultPass,
        has_practical: false,
        theory_marks: null,
        theory_passing_marks: null,
        practical_marks: null,
        practical_passing_marks: null
      }
    ]);
  };

  const handleApplyStandardPlaceholders = () => {
    if (!activeRoutineExam) return;
    const isPeriodic = activeRoutineExam.category === 'periodic_assessment';
    const defaultTotal = isPeriodic ? 50 : 100;
    const defaultPass = isPeriodic ? 20 : 40;
    const startTime = activeRoutineExam.default_start_time?.substring(0, 5) || '08:30';
    const endTime = activeRoutineExam.default_end_time?.substring(0, 5) || (isPeriodic ? '10:30' : '11:30');

    const placeholders = isPeriodic ? [
      'Core 1', 'Core 2', 'Core 3', 'Core 4', 'MIL', 'Elective 1', 'Core 5', 'Elective 2'
    ] : [
      'Grading 1', 'Grading 2', 'Core 1', 'Core 2', 'Core 3', 'Core 4', 'MIL', 'Elective 1', 'Core 5', 'Elective 2', 'Minor'
    ];

    setRoutineItems(placeholders.map((name, idx) => ({
      _tempId: `std-${idx}-${Date.now()}`,
      subject: name,
      order_index: idx,
      day_offset: idx,
      start_time: startTime,
      end_time: endTime,
      total_marks: defaultTotal,
      passing_marks: defaultPass,
      has_practical: false,
      theory_marks: null,
      theory_passing_marks: null,
      practical_marks: null,
      practical_passing_marks: null
    })));
  };

  const handleUpdateRoutineItem = (idx, field, value) => {
    const updated = [...routineItems];
    updated[idx][field] = value;
    setRoutineItems(updated);
  };

  const handleRemoveRoutineItem = (idx) => {
    setRoutineItems(routineItems.filter((_, i) => i !== idx));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setRoutineItems((items) => {
        const oldIndex = items.findIndex((i) => (i._tempId || i.id) === active.id);
        const newIndex = items.findIndex((i) => (i._tempId || i.id) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveRoutine = async () => {
    if (!activeRoutineExam) return;
    setSavingRoutine(true);
    try {
      const payload = routineItems.map((item, idx) => ({
        ...item,
        order_index: idx,
        day_offset: idx
      }));

      const res = await fetch(`${API_URL}/superadmin/default-exams/${activeRoutineExam.id}/timetable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ timetableData: payload })
      });

      if (!res.ok) throw new Error('Failed to save default routine');
      alert('Default Exam Routine saved successfully!');
      setShowRoutineModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving routine');
    } finally {
      setSavingRoutine(false);
    }
  };



  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-neutral tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FiCalendar className="text-2xl" />
            </span>
            Default Exams & Timetables
          </h1>
          <p className="text-on-surface-variant text-body-sm mt-1">
            Standardized offline exam templates configured strictly for Periodic Assessment and Terminal Assessment.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 shadow-sm">
          <FiCheckCircle className="text-emerald-600 text-base" />
          <span>Strictly 2 Fixed Offline Templates</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">
            <FiLayers />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral">2 Fixed Templates</div>
            <div className="text-xs font-medium text-on-surface-variant">Periodic & Terminal Assessment</div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">
            <FiBook />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral">
              {defaultExams.reduce((acc, ex) => acc + (ex.default_exam_timetables?.length || 0), 0)}
            </div>
            <div className="text-xs font-medium text-on-surface-variant">Total Routine Subjects</div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
            <FiClock />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral">
              Offline Only
            </div>
            <div className="text-xs font-medium text-on-surface-variant">Standardized Examination Mode</div>
          </div>
        </div>
      </div>

      {/* Table of Default Exams */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral">Offline Default Exam Templates</h2>
          <span className="text-xs text-on-surface-variant font-semibold">
            2 Fixed System Templates
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant animate-pulse">
            Loading default exams...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/30 text-on-surface-variant text-xs font-semibold uppercase tracking-wider border-b border-outline-variant">
                  <th className="p-4 pl-6">Exam Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Default Timing</th>
                  <th className="p-4">Routine Sequence</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-body-sm">
                {defaultExams.map((exam) => {
                  const routineCount = exam.default_exam_timetables?.length || 0;
                  return (
                    <tr key={exam.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-neutral flex items-center gap-2">
                          {exam.name}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">Fixed</span>
                        </div>
                        {exam.description && (
                          <div className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{exam.description}</div>
                        )}
                      </td>

                      <td className="p-4">
                        {exam.category === 'terminal_examination' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                            Terminal Examination (100 Marks)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            Periodic Assessment (50 Marks)
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
                          Offline
                        </span>
                      </td>

                      <td className="p-4 text-on-surface-variant text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          <FiClock className="text-primary" />
                          {exam.default_start_time?.substring(0, 5) || '08:30'} - {exam.default_end_time?.substring(0, 5) || '10:30'}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => openRoutineBuilder(exam)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition"
                        >
                          <FiCalendar />
                          {routineCount} {routineCount === 1 ? 'Subject' : 'Subjects'} in Routine
                        </button>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRoutineBuilder(exam)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                            title="Configure Routine"
                          >
                            <FiCalendar className="text-base" />
                          </button>
                          <button
                            onClick={() => openEditModal(exam)}
                            className="p-2 text-on-surface-variant hover:text-neutral hover:bg-surface-variant rounded-lg transition"
                            title="Edit Timings & Settings"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT DEFAULT EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 bg-secondary/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-variant/20">
              <h3 className="text-lg font-bold font-headline text-neutral flex items-center gap-2">
                <FiCalendar className="text-primary" />
                Configure {editingExam?.name}
              </h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="p-2 text-on-surface-variant hover:text-neutral rounded-lg hover:bg-surface-variant"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                  Exam Name (Fixed System Template)
                </label>
                <input
                  type="text"
                  disabled
                  value={examForm.name}
                  className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-outline-variant rounded-xl text-slate-700 font-bold cursor-not-allowed select-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">This template name is fixed system-wide for offline examinations.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                  Exam Category & Default Marks
                </label>
                <div className="px-4 py-2.5 text-sm bg-slate-100 border border-outline-variant rounded-xl text-slate-800 font-semibold select-none">
                  {examForm.category === 'terminal_examination'
                    ? 'Terminal Examination (All subjects including Grading • 100 Marks / 40 Pass)'
                    : 'Periodic Assessment (Core, Elective, MIL • 50 Marks / 20 Pass)'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                    Exam Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Offline"
                    className="w-full px-3 py-2.5 text-sm bg-slate-100 border border-outline-variant rounded-xl text-slate-700 font-bold cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                    Default Start Time
                  </label>
                  <input
                    type="time"
                    value={examForm.default_start_time}
                    onChange={(e) => setExamForm({ ...examForm, default_start_time: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                    Default End Time
                  </label>
                  <input
                    type="time"
                    value={examForm.default_end_time}
                    onChange={(e) => setExamForm({ ...examForm, default_end_time: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                  Description / Instructions
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional notes or instructions for this exam..."
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  className="w-full px-4 py-2 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-variant rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE DEFAULT ROUTINE MODAL (DRAG & DROP) */}
      {showRoutineModal && activeRoutineExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl xl:max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-xl font-bold font-headline text-slate-900 flex items-center gap-2.5">
                  <FiCalendar className="text-indigo-600" />
                  Configure Default Routine: {activeRoutineExam.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Drag and drop subject placeholders to set the standardized exam sequence (Day 1, Day 2, etc.). When a school admin creates an exam, each class's distinct subjects will dynamically replace these placeholders.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 mt-3">
                  {activeRoutineExam.category === 'periodic_assessment' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Periodic Assessment (50 Marks Standard)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Terminal Examination (100 Marks Standard)
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyStandardPlaceholders}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm transition cursor-pointer"
                    title="Populate recommended placeholder sequence for this template"
                  >
                    ✨ Apply Standard Placeholders
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const isPeriodic = activeRoutineExam.category === 'periodic_assessment';
                      const targetTotal = isPeriodic ? 50 : 100;
                      const targetPass = isPeriodic ? 20 : 40;
                      setRoutineItems(routineItems.map(item => ({
                        ...item,
                        total_marks: targetTotal,
                        passing_marks: targetPass
                      })));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition cursor-pointer"
                    title="Sync all subjects to standard category marks"
                  >
                    ⚡ Sync Standard Marks ({activeRoutineExam.category === 'periodic_assessment' ? '50 / 20' : '100 / 40'})
                  </button>
                </div>
                <div className="mt-2.5 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
                  <FiInfo className="text-indigo-600 text-sm shrink-0" />
                  <span>
                    <strong>Dynamic Substitution Rule:</strong> Placeholders like <em>Core 1</em>, <em>Core 2</em>, <em>MIL</em>, and <em>Elective</em> will be replaced by the school's actual subjects for each class (e.g. English, Science, Mathematics for Class I-X, or Physics/History/Accountancy for Class XI-XII).
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRoutineModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Body: Drag and drop routine builder */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Default Subject Sequence ({routineItems.length} {routineItems.length === 1 ? 'day' : 'days'})
                </span>
                <button
                  type="button"
                  onClick={handleAddRoutineSubject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <FiPlus /> Add Subject
                </button>
              </div>

              {routineItems.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 bg-white rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-500">No subjects added to this routine yet.</p>
                  <button
                    type="button"
                    onClick={handleAddRoutineSubject}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700"
                  >
                    <FiPlus /> Add First Subject
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={routineItems.map((item, idx) => item._tempId || item.id || `item-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {routineItems.map((item, index) => (
                        <SortableRoutineItem
                          key={item._tempId || item.id || `item-${index}`}
                          item={item}
                          index={index}
                          globalSubjects={globalSubjects}
                          onUpdate={handleUpdateRoutineItem}
                          onRemove={handleRemoveRoutineItem}
                          examCategory={activeRoutineExam?.category}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-outline-variant bg-surface-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <FiMove className="text-primary" />
                <span>Tip: Grab the handle on the left to drag subjects and reorder the sequence.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRoutineModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-variant rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingRoutine}
                  onClick={handleSaveRoutine}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition disabled:opacity-50"
                >
                  {savingRoutine ? 'Saving...' : 'Save Default Routine'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefaultExams;
