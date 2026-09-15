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

// Sortable Row Component for Timetable Routine Builder
const SortableRoutineItem = ({ 
  item, 
  index, 
  globalSubjects, 
  onUpdate, 
  onRemove 
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
    opacity: isDragging ? 0.75 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 mb-3 rounded-xl border transition-all duration-200 ${
        isDragging 
          ? 'bg-primary/5 border-primary shadow-xl scale-[1.01]' 
          : 'bg-surface border-outline-variant/60 hover:border-outline-variant shadow-sm'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        {/* Drag Handle & Day Indicator */}
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 rounded-lg transition"
            title="Drag to reorder day"
          >
            <FiMove className="text-base" />
          </button>
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary whitespace-nowrap">
            Day {index + 1}
          </span>
        </div>

        {/* Subject selection */}
        <div className="flex-1 w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Subject Name
            </label>
            <div className="relative">
              <input
                type="text"
                list={`subjects-list-${index}`}
                placeholder="e.g. English, Mathematics..."
                value={item.subject}
                onChange={(e) => onUpdate(index, 'subject', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface font-medium"
              />
              <datalist id={`subjects-list-${index}`}>
                {globalSubjects.map((s) => (
                  <option key={s.id || s.name} value={s.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={item.start_time?.substring(0, 5) || '09:00'}
              onChange={(e) => onUpdate(index, 'start_time', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              End Time
            </label>
            <input
              type="time"
              value={item.end_time?.substring(0, 5) || '12:00'}
              onChange={(e) => onUpdate(index, 'end_time', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Total / Pass
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Total"
                value={item.total_marks || ''}
                onChange={(e) => onUpdate(index, 'total_marks', parseInt(e.target.value) || 0)}
                className="w-1/2 px-2.5 py-2 text-sm bg-background border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface font-medium text-center"
              />
              <span className="text-on-surface-variant text-xs">/</span>
              <input
                type="number"
                placeholder="Pass"
                value={item.passing_marks || ''}
                onChange={(e) => onUpdate(index, 'passing_marks', parseInt(e.target.value) || 0)}
                className="w-1/2 px-2.5 py-2 text-sm bg-background border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface font-medium text-center"
              />
            </div>
          </div>
        </div>

        {/* Practical toggle & Delete */}
        <div className="flex items-center gap-3 self-end md:self-center mt-2 md:mt-0">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-on-surface-variant select-none">
            <input 
              type="checkbox"
              checked={item.has_practical || false}
              onChange={(e) => onUpdate(index, 'has_practical', e.target.checked)}
              className="rounded text-primary focus:ring-primary border-outline-variant"
            />
            <span>Practical</span>
          </label>

          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
            title="Remove subject"
          >
            <FiTrash2 className="text-base" />
          </button>
        </div>
      </div>

      {/* Practical marks details if enabled */}
      {item.has_practical && (
        <div className="mt-3 pt-3 border-t border-outline-variant/40 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-variant/30 p-2.5 rounded-lg">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Theory Marks</label>
            <input 
              type="number" 
              placeholder="e.g. 70" 
              value={item.theory_marks || ''} 
              onChange={e => onUpdate(index, 'theory_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1 text-xs bg-background border border-outline-variant rounded font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Theory Pass</label>
            <input 
              type="number" 
              placeholder="e.g. 28" 
              value={item.theory_passing_marks || ''} 
              onChange={e => onUpdate(index, 'theory_passing_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1 text-xs bg-background border border-outline-variant rounded font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Practical Marks</label>
            <input 
              type="number" 
              placeholder="e.g. 30" 
              value={item.practical_marks || ''} 
              onChange={e => onUpdate(index, 'practical_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1 text-xs bg-background border border-outline-variant rounded font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Practical Pass</label>
            <input 
              type="number" 
              placeholder="e.g. 12" 
              value={item.practical_passing_marks || ''} 
              onChange={e => onUpdate(index, 'practical_passing_marks', parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1 text-xs bg-background border border-outline-variant rounded font-medium"
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
  const [globalClasses, setGlobalClasses] = useState([]);
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
    description: '',
    class_levels: [],
    default_start_time: '09:00',
    default_end_time: '12:00'
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
      const [examsRes, subjectsRes, classesRes] = await Promise.all([
        fetch(`${API_URL}/superadmin/default-exams`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/subjects/global`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/classes/global`, { headers: getAuthHeaders() }).catch(() => null)
      ]);

      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setDefaultExams(examsData);
      }
      if (subjectsRes && subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setGlobalSubjects(subjectsData);
      }
      if (classesRes && classesRes.ok) {
        const classesData = await classesRes.json();
        setGlobalClasses(classesData);
      } else {
        // Fallback canonical classes
        setGlobalClasses([
          { name: 'PPE-NURSERY' }, { name: 'KG-I' }, { name: 'KG-II' },
          { name: 'I' }, { name: 'II' }, { name: 'III' }, { name: 'IV' }, { name: 'V' },
          { name: 'VI' }, { name: 'VII' }, { name: 'VIII' }, { name: 'IX' }, { name: 'X' },
          { name: 'XI' }, { name: 'XII' }
        ]);
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
      description: '',
      class_levels: globalClasses.map(c => c.name),
      default_start_time: '09:00',
      default_end_time: '12:00'
    });
    setShowExamModal(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name || '',
      type: exam.type || 'Offline',
      description: exam.description || '',
      class_levels: exam.class_levels || [],
      default_start_time: exam.default_start_time?.substring(0, 5) || '09:00',
      default_end_time: exam.default_end_time?.substring(0, 5) || '12:00'
    });
    setShowExamModal(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examForm.name.trim()) return alert('Please enter exam name');

    try {
      if (editingExam) {
        // PUT update
        const res = await fetch(`${API_URL}/superadmin/default-exams/${editingExam.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(examForm)
        });
        if (!res.ok) throw new Error('Failed to update default exam');
      } else {
        // POST create with default initial subjects if available
        const defaultSubjectsList = globalSubjects.slice(0, 6).map((s, idx) => ({
          subject: s.name,
          order_index: idx,
          day_offset: idx,
          start_time: examForm.default_start_time,
          end_time: examForm.default_end_time,
          total_marks: 100,
          passing_marks: 40
        }));

        const res = await fetch(`${API_URL}/superadmin/default-exams`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...examForm,
            timetableData: defaultSubjectsList
          })
        });
        if (!res.ok) throw new Error('Failed to create default exam');
      }

      setShowExamModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving default exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this default exam template? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/superadmin/default-exams/${examId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete');
      setDefaultExams(defaultExams.filter(e => e.id !== examId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete default exam');
    }
  };

  // Open Routine Builder
  const openRoutineBuilder = async (exam) => {
    setActiveRoutineExam(exam);
    try {
      const res = await fetch(`${API_URL}/superadmin/default-exams/${exam.id}/timetable`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = (data || []).map((item, idx) => ({
          ...item,
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
    // Suggest a subject from global subjects that isn't yet added
    const existingNames = new Set(routineItems.map(r => r.subject?.toUpperCase()));
    const suggested = globalSubjects.find(s => !existingNames.has(s.name?.toUpperCase()));

    setRoutineItems([
      ...routineItems,
      {
        _tempId: `temp-${Date.now()}`,
        subject: suggested ? suggested.name : '',
        order_index: nextIdx,
        day_offset: nextIdx,
        start_time: activeRoutineExam?.default_start_time || '09:00',
        end_time: activeRoutineExam?.default_end_time || '12:00',
        total_marks: 100,
        passing_marks: 40,
        has_practical: false,
        theory_marks: null,
        theory_passing_marks: null,
        practical_marks: null,
        practical_passing_marks: null
      }
    ]);
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

  const toggleClassLevel = (clsName) => {
    const current = new Set(examForm.class_levels);
    if (current.has(clsName)) current.delete(clsName);
    else current.add(clsName);
    setExamForm({ ...examForm, class_levels: Array.from(current) });
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
            Create standardized exam templates and default subject routines that schools can immediately adopt.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium text-sm rounded-xl shadow-md shadow-primary/20 transition-all duration-200"
        >
          <FiPlus className="text-lg" />
          Create Default Exam
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">
            <FiLayers />
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral">{defaultExams.length}</div>
            <div className="text-xs font-medium text-on-surface-variant">Default Exams Configured</div>
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
              {defaultExams.filter(e => e.is_active !== false).length} Active
            </div>
            <div className="text-xs font-medium text-on-surface-variant">Live Template Availability</div>
          </div>
        </div>
      </div>

      {/* Table of Default Exams */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral">All Default Exam Templates</h2>
          <span className="text-xs text-on-surface-variant">
            {defaultExams.length} {defaultExams.length === 1 ? 'template' : 'templates'} found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant animate-pulse">
            Loading default exams...
          </div>
        ) : defaultExams.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
              <FiInfo />
            </div>
            <h3 className="text-base font-bold text-neutral">No Default Exams Yet</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Create your first default exam template (such as Half Yearly or Annual Exam) so schools can automatically schedule routines.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover shadow-sm"
            >
              <FiPlus /> Create Exam Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/30 text-on-surface-variant text-xs font-semibold uppercase tracking-wider border-b border-outline-variant">
                  <th className="p-4 pl-6">Exam Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Default Timing</th>
                  <th className="p-4">Routine Sequence</th>
                  <th className="p-4">Applicable Classes</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-body-sm">
                {defaultExams.map((exam) => {
                  const routineCount = exam.default_exam_timetables?.length || 0;
                  return (
                    <tr key={exam.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-neutral">{exam.name}</div>
                        {exam.description && (
                          <div className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{exam.description}</div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
                          {exam.type || 'Offline'}
                        </span>
                      </td>

                      <td className="p-4 text-on-surface-variant text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          <FiClock className="text-primary" />
                          {exam.default_start_time?.substring(0, 5) || '09:00'} - {exam.default_end_time?.substring(0, 5) || '12:00'}
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

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(!exam.class_levels || exam.class_levels.length === 0) ? (
                            <span className="text-xs text-on-surface-variant font-medium">All Classes</span>
                          ) : (
                            <>
                              {exam.class_levels.slice(0, 3).map((cls, i) => (
                                <span key={i} className="px-2 py-0.5 text-[11px] font-semibold bg-surface-variant rounded border border-outline-variant text-neutral">
                                  {cls}
                                </span>
                              ))}
                              {exam.class_levels.length > 3 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-on-surface-variant">
                                  +{exam.class_levels.length - 3} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
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
                            title="Edit Exam"
                          >
                            <FiEdit2 className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Exam"
                          >
                            <FiTrash2 className="text-base" />
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

      {/* CREATE / EDIT DEFAULT EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 bg-secondary/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-variant/20">
              <h3 className="text-lg font-bold font-headline text-neutral flex items-center gap-2">
                <FiCalendar className="text-primary" />
                {editingExam ? 'Edit Default Exam' : 'Create Default Exam Template'}
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
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Half Yearly Examination, Annual Examination, Unit Test 1"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                    Exam Type
                  </label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral uppercase tracking-wider mb-2">
                    Default Start Time
                  </label>
                  <input
                    type="time"
                    value={examForm.default_start_time}
                    onChange={(e) => setExamForm({ ...examForm, default_start_time: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
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
                    className="w-full px-3 py-2.5 text-sm bg-background border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium"
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral uppercase tracking-wider">
                    Applicable Classes
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExamForm({ ...examForm, class_levels: globalClasses.map(c => c.name) })}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-on-surface-variant">|</span>
                    <button
                      type="button"
                      onClick={() => setExamForm({ ...examForm, class_levels: [] })}
                      className="text-xs text-rose-500 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-surface-variant/30 rounded-xl border border-outline-variant flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {globalClasses.map((cls) => {
                    const isSelected = examForm.class_levels.includes(cls.name);
                    return (
                      <button
                        type="button"
                        key={cls.name}
                        onClick={() => toggleClassLevel(cls.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface text-on-surface-variant hover:bg-surface-variant border border-outline-variant/60'
                        }`}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
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
                  {editingExam ? 'Update Exam Template' : 'Create & Proceed to Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE DEFAULT ROUTINE MODAL (DRAG & DROP) */}
      {showRoutineModal && activeRoutineExam && (
        <div className="fixed inset-0 bg-secondary/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-4xl rounded-2xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-variant/20">
              <div>
                <h3 className="text-lg font-bold font-headline text-neutral flex items-center gap-2">
                  <FiCalendar className="text-primary" />
                  Configure Default Routine: {activeRoutineExam.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Drag and drop subjects to set the default exam sequence (Day 1, Day 2, etc.). When a school admin creates an exam and enters start and end dates, these subjects will be pre-allocated automatically.
                </p>
              </div>
              <button
                onClick={() => setShowRoutineModal(false)}
                className="p-2 text-on-surface-variant hover:text-neutral rounded-lg hover:bg-surface-variant"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body: Drag and drop routine builder */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral uppercase tracking-wider">
                  Default Subject Sequence ({routineItems.length} {routineItems.length === 1 ? 'day' : 'days'})
                </span>
                <button
                  type="button"
                  onClick={handleAddRoutineSubject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition"
                >
                  <FiPlus /> Add Subject
                </button>
              </div>

              {routineItems.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-outline-variant rounded-2xl text-center space-y-3">
                  <p className="text-sm text-on-surface-variant">No subjects added to this routine yet.</p>
                  <button
                    type="button"
                    onClick={handleAddRoutineSubject}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm"
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
