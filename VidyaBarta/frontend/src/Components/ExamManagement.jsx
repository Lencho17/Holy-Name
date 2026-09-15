import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { FaPlus, FaTrash, FaCheckCircle, FaCalendarAlt, FaArrowLeft, FaDownload, FaSpinner } from 'react-icons/fa';
import { FiMove, FiCalendar, FiClock, FiLayers, FiInfo, FiCheck, FiRefreshCw, FiAlignLeft } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// Draggable Sortable Card for Timetable Routine
const SortableTimetableCard = ({
  group,
  idx,
  availableSubjects,
  onUpdateField,
  onRemove,
  onUpdatePaper
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
      {/* Top Bar: Drag handle, Day tag, and Delete */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
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

      {/* Main Row: Subject, Total Marks, Passing Marks */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Subject</label>
          <select
            value={group.subject}
            onChange={(e) => {
              const val = e.target.value;
              const selSubj = availableSubjects.find((s) => s.name === val);
              onUpdateField(idx, {
                subject: val,
                subjectMeta: selSubj || null,
                is_divided: false,
                papers: [{ name: '', marks: '', passing_marks: '' }]
              });
            }}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          >
            <option value="">-- Select Subject --</option>
            {availableSubjects.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
            {group.subject && !availableSubjects.some((s) => s.name === group.subject) && (
              <option value={group.subject}>{group.subject}</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            Total Marks <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={group.total_marks || ''}
            onChange={(e) => onUpdateField(idx, { total_marks: parseInt(e.target.value) || 0 })}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Total Marks"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            Passing Marks <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={group.passing_marks || ''}
            onChange={(e) => onUpdateField(idx, { passing_marks: parseInt(e.target.value) || 0 })}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Passing Marks"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <FaCalendarAlt className="text-indigo-600 text-xs" />
            Exam Date
          </label>
          <input
            type="date"
            value={group.exam_date || ''}
            onChange={(e) => onUpdateField(idx, { exam_date: e.target.value })}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Second Row: Start Time & End Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <FiClock className="text-indigo-600 text-xs" />
            Start Time
          </label>
          <input
            type="time"
            value={group.start_time?.substring(0, 5) || '09:00'}
            onChange={(e) => onUpdateField(idx, { start_time: e.target.value })}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <FiClock className="text-indigo-600 text-xs" />
            End Time
          </label>
          <input
            type="time"
            value={group.end_time?.substring(0, 5) || '12:00'}
            onChange={(e) => onUpdateField(idx, { end_time: e.target.value })}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Toggles: Divide Subject & Include Practical */}
      <div className="flex flex-wrap gap-6 items-center mb-3 pt-2 border-t border-gray-100">
        {group.subjectMeta?.is_divided && (
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={group.is_divided}
              onChange={(e) => {
                const checked = e.target.checked;
                let papers = [{ name: '', marks: '', passing_marks: '' }];
                if (checked && group.subjectMeta.parts?.length > 0) {
                  papers = group.subjectMeta.parts.map((p) => ({
                    name: p.name,
                    sub_code: p.sub_code || '',
                    marks: '',
                    passing_marks: ''
                  }));
                }
                onUpdateField(idx, { is_divided: checked, papers });
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Divide Subject Papers</span>
          </label>
        )}
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={group.has_practical || false}
            onChange={(e) => onUpdateField(idx, { has_practical: e.target.checked })}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <span>Include Practical</span>
        </label>
      </div>

      {/* Practical Marks Split */}
      {group.has_practical && (
        <div className="flex flex-col gap-3 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold text-gray-600 w-24">Marks Split:</label>
            <input
              type="number"
              value={group.theory_marks || ''}
              onChange={(e) => onUpdateField(idx, { theory_marks: parseInt(e.target.value) || '' })}
              className="border-gray-300 border p-2 rounded text-xs w-24 bg-white"
              placeholder="Theory"
            />
            <input
              type="number"
              value={group.practical_marks || ''}
              onChange={(e) => onUpdateField(idx, { practical_marks: parseInt(e.target.value) || '' })}
              className="border-gray-300 border p-2 rounded text-xs w-24 bg-white"
              placeholder="Practical"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs font-bold text-gray-600 w-24">Passing Marks:</label>
            <input
              type="number"
              value={group.theory_passing_marks || ''}
              onChange={(e) => onUpdateField(idx, { theory_passing_marks: parseInt(e.target.value) || '' })}
              className="border-gray-300 border p-2 rounded text-xs w-24 bg-white"
              placeholder="Th. Pass"
            />
            <input
              type="number"
              value={group.practical_passing_marks || ''}
              onChange={(e) => onUpdateField(idx, { practical_passing_marks: parseInt(e.target.value) || '' })}
              className="border-gray-300 border p-2 rounded text-xs w-24 bg-white"
              placeholder="Pr. Pass"
            />
          </div>
        </div>
      )}

      {/* Papers List if Divided */}
      {group.is_divided && (
        <div className="space-y-2 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-bold text-gray-600 mb-2">Paper Breakdown</div>
          {group.papers.map((paper, pIdx) => (
            <div key={pIdx} className="flex items-center gap-3">
              <div className="flex-1 text-xs font-bold text-gray-700 bg-white p-2 rounded border border-gray-200">
                {paper.name} {paper.sub_code ? `(${paper.sub_code})` : ''}
              </div>
              <input
                type="number"
                value={paper.marks || ''}
                onChange={(e) => onUpdatePaper(idx, pIdx, 'marks', e.target.value)}
                className="w-24 border border-gray-300 p-2 rounded text-xs bg-white"
                placeholder="Total Marks"
              />
              <input
                type="number"
                value={paper.passing_marks || ''}
                onChange={(e) => onUpdatePaper(idx, pIdx, 'passing_marks', e.target.value)}
                className="w-24 border border-gray-300 p-2 rounded text-xs bg-white"
                placeholder="Pass Marks"
              />
            </div>
          ))}
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
  const [selectedClassExam, setSelectedClassExam] = useState(null);

  // Timetable State
  const [timetableData, setTimetableData] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [savingTimetable, setSavingTimetable] = useState(false);
  const [autoReorderDates, setAutoReorderDates] = useState(true);

  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [creationMode, setCreationMode] = useState('template'); // 'template' or 'custom'
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showBulkDownload, setShowBulkDownload] = useState(false);
  const [bulkExamName, setBulkExamName] = useState('');

  const [newExam, setNewExam] = useState({
    name: '',
    class_levels: [],
    type: 'Offline',
    start_date: '',
    end_date: '',
    default_exam_id: ''
  });

  const { globalClasses } = useContext(SiteDataContext);
  const allClasses = globalClasses?.map((c) => c.name) || [];
  const uniqueExamNames = [...new Set(exams.map((e) => e.name))];

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

      const examsData = examsRes.data;
      setExams(examsData);
      setDefaultTemplates(templatesRes.data || []);

      const ttMap = {};
      await Promise.all(
        examsData.map(async (exam) => {
          try {
            const { data: tt } = await axios.get(`${apiUrl}/exams/${exam.id}/timetable`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (tt.length > 0) {
              ttMap[exam.id] = { created: true, finalized: tt[0].is_finalized || false };
            }
          } catch (e) {}
        })
      );
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

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setNewExam((prev) => ({ ...prev, name: '', default_exam_id: '', type: 'Offline' }));
      return;
    }

    const template = defaultTemplates.find((t) => t.id === templateId);
    if (template) {
      // Pre-populate fields
      setNewExam((prev) => ({
        ...prev,
        name: template.name,
        type: template.type || 'Offline',
        default_exam_id: template.id,
        class_levels: template.class_levels && template.class_levels.length > 0 ? template.class_levels : [...allClasses]
      }));
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (newExam.class_levels.length === 0) return alert('Select at least one class');
    if (newExam.start_date && newExam.end_date && newExam.start_date > newExam.end_date) {
      return alert('Start date cannot be after end date');
    }

    try {
      await axios.post(
        `${apiUrl}/exams`,
        {
          name: newExam.name.trim(),
          class_levels: newExam.class_levels,
          type: newExam.type,
          start_date: newExam.start_date || null,
          end_date: newExam.end_date || null,
          default_exam_id: newExam.default_exam_id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowCreate(false);
      setNewExam({
        name: '',
        class_levels: [],
        type: 'Offline',
        start_date: '',
        end_date: '',
        default_exam_id: ''
      });
      setSelectedTemplateId('');
      fetchExamsAndStatus();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This cannot be undone.')) return;
    try {
      await axios.delete(`${apiUrl}/exams/${examId}`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(exams.filter((e) => e.id !== examId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete exam');
    }
  };

  const handleFinalizeTimetable = async (exam) => {
    if (
      !window.confirm(
        'Are you sure you want to finalize this exam timetable? This will lock it and prevent further edits.'
      )
    )
      return;
    try {
      await axios.put(
        `${apiUrl}/exams/${exam.id}/timetable/finalize`,
        { class_level: exam.class_level },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTimetablesMap((prev) => ({ ...prev, [exam.id]: { ...prev[exam.id], finalized: true } }));
      alert('Exam timetable finalized successfully.');
    } catch (error) {
      console.error(error);
      alert('Failed to finalize exam timetable');
    }
  };

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
      doc.text(`Exam Timetable: ${examRecord.name} - Class ${examRecord.class_level}`, 14, 22);

      const tableColumn = ['Date', 'Time', 'Subject', 'Total Marks', 'Pass Marks', 'Room'];
      const tableRows = [];

      ttData.forEach((row) => {
        const subjectName = `${row.subject} ${row.sub_subject ? `(${row.sub_subject})` : ''} ${
          row.has_practical ? '(Th+Pr)' : ''
        }`;
        const timeStr = `${row.start_time?.substring(0, 5) || '--:--'} - ${
          row.end_time?.substring(0, 5) || '--:--'
        }`;
        tableRows.push([
          row.exam_date || '-',
          timeStr,
          subjectName,
          row.total_marks || (row.theory_marks || 0) + (row.practical_marks || 0),
          row.passing_marks || '-',
          row.room_number || '-'
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

  const downloadBulkPDF = async (e) => {
    e.preventDefault();
    if (!bulkExamName) return alert('Select an exam');
    const examClasses = exams.filter((ex) => ex.name === bulkExamName);
    if (examClasses.length === 0) return;

    try {
      const doc = new jsPDF();
      let hasData = false;

      for (let i = 0; i < examClasses.length; i++) {
        const cls = examClasses[i];
        const { data: ttData } = await axios.get(`${apiUrl}/exams/${cls.id}/timetable`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (ttData && ttData.length > 0) {
          if (hasData) doc.addPage();
          hasData = true;
          doc.setFontSize(18);
          doc.text(`Exam Timetable: ${cls.name} - Class ${cls.class_level}`, 14, 22);

          const tableColumn = ['Date', 'Time', 'Subject', 'Total Marks', 'Pass Marks', 'Room'];
          const tableRows = [];

          ttData.forEach((row) => {
            const subjectName = `${row.subject} ${row.sub_subject ? `(${row.sub_subject})` : ''} ${
              row.has_practical ? '(Th+Pr)' : ''
            }`;
            const timeStr = `${row.start_time?.substring(0, 5) || '--:--'} - ${
              row.end_time?.substring(0, 5) || '--:--'
            }`;
            tableRows.push([
              row.exam_date || '-',
              timeStr,
              subjectName,
              row.total_marks || (row.theory_marks || 0) + (row.practical_marks || 0),
              row.passing_marks || '-',
              row.room_number || '-'
            ]);
          });

          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30
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
      alert('Failed to download bulk PDF');
    }
  };

  const openTimetable = async (examRecord) => {
    setSelectedClassExam(examRecord);
    setView('timetable');

    // Fetch configured subjects for this class
    try {
      const { data: config } = await axios.get(`${apiUrl}/subjects/mapping`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const getBaseClass = (lvl) => {
        if (typeof lvl !== 'string') return lvl;
        const match = lvl.match(/Class\s+([IVX]+)/i) || lvl.match(/^([IVX]+)/i);
        return match ? match[1].toUpperCase() : lvl;
      };
      const examBaseClass = getBaseClass(examRecord.class_level);
      const clsConfig = config.find((c) => getBaseClass(c.class_level) === examBaseClass);
      let subs = [];
      if (clsConfig) {
        subs = [
          ...(clsConfig.core_subjects || []),
          ...((clsConfig.elective_groups || []).flatMap((g) => g.subjects || []))
        ];
      }
      setAvailableSubjects(
        subs
          .map((s) => {
            if (typeof s === 'string') return { name: s };
            return {
              name: s.subjects?.name || s.name || s.subject_name,
              is_divided: s.is_divided || false,
              parts: s.parts || []
            };
          })
          .filter((s) => s.name)
      );
    } catch (err) {
      console.error(err);
    }

    // Fetch existing timetable and structure it with unique drag IDs
    try {
      const { data: tt } = await axios.get(`${apiUrl}/exams/${examRecord.id}/timetable`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const grouped = [];
      tt.forEach((item, idx) => {
        let existing = grouped.find((g) => g.subject === item.subject);
        if (existing) {
          existing.is_divided = true;
          existing.papers.push({ name: item.sub_subject || '', marks: item.total_marks || '' });
        } else {
          grouped.push({
            _dragId: `item-${idx}-${item.subject || 'sub'}-${Date.now()}`,
            subject: item.subject,
            total_marks: item.total_marks || 100,
            passing_marks: item.passing_marks || 40,
            has_practical: item.has_practical || false,
            theory_marks: item.theory_marks || '',
            theory_passing_marks: item.theory_passing_marks || '',
            practical_marks: item.practical_marks || '',
            practical_passing_marks: item.practical_passing_marks || '',
            exam_date: item.exam_date ? item.exam_date.substring(0, 10) : '',
            start_time: item.start_time?.substring(0, 5) || '09:00',
            end_time: item.end_time?.substring(0, 5) || '12:00',
            is_divided: !!item.sub_subject,
            subjectMeta: null,
            papers: [
              {
                name: item.sub_subject || '',
                marks: item.total_marks || '',
                passing_marks: item.passing_marks || ''
              }
            ]
          });
        }
      });
      setTimetableData(grouped.length > 0 ? grouped : []);
    } catch (err) {
      console.error(err);
    }
  };

  const addTimetableRow = () => {
    let nextDate = '';
    if (timetableData.length > 0) {
      const lastDate = timetableData[timetableData.length - 1].exam_date;
      if (lastDate) {
        const d = new Date(lastDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          if (d.getDay() === 0) {
            // Skip Sunday
            d.setDate(d.getDate() + 1);
          }
          nextDate = d.toISOString().split('T')[0];
        }
      }
    }

    setTimetableData([
      ...timetableData,
      {
        _dragId: `new-row-${Date.now()}-${timetableData.length}`,
        subject: '',
        total_marks: 100,
        passing_marks: 40,
        has_practical: false,
        theory_marks: '',
        theory_passing_marks: '',
        practical_marks: '',
        practical_passing_marks: '',
        exam_date: nextDate,
        start_time: '09:00',
        end_time: '12:00',
        is_divided: false,
        subjectMeta: null,
        papers: [{ name: '', marks: '', passing_marks: '' }]
      }
    ]);
  };

  const handleUpdateField = (index, updates) => {
    const updated = [...timetableData];
    updated[index] = { ...updated[index], ...updates };
    setTimetableData(updated);
  };

  const handleUpdatePaper = (groupIndex, paperIndex, field, val) => {
    const updated = [...timetableData];
    updated[groupIndex].papers[paperIndex][field] = val;
    setTimetableData(updated);
  };

  const handleRemoveRow = (index) => {
    setTimetableData(timetableData.filter((_, i) => i !== index));
  };

  // Drag and Drop Handler with optional Chronological Date Sync
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setTimetableData((items) => {
        const oldIndex = items.findIndex((i) => i._dragId === active.id);
        const newIndex = items.findIndex((i) => i._dragId === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;

        let reordered = arrayMove(items, oldIndex, newIndex);

        if (autoReorderDates) {
          // Re-align dates in chronological order matching the sequence
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

  const handleSaveTimetable = async () => {
    setSavingTimetable(true);
    try {
      const flatData = [];
      timetableData.forEach((g) => {
        g.papers.forEach((p) => {
          flatData.push({
            class_level: selectedClassExam.class_level,
            subject: g.subject,
            total_marks: g.is_divided ? parseInt(p.marks) || 0 : g.total_marks,
            passing_marks: g.is_divided
              ? p.passing_marks
                ? parseInt(p.passing_marks)
                : Math.round(((parseInt(p.marks) || 0) / g.total_marks) * g.passing_marks)
              : g.passing_marks,
            has_practical: g.has_practical,
            theory_marks: g.theory_marks || null,
            theory_passing_marks: g.theory_passing_marks || null,
            practical_marks: g.practical_marks || null,
            practical_passing_marks: g.practical_passing_marks || null,
            sub_subject: g.is_divided ? (p.sub_code ? `${p.name} (${p.sub_code})` : p.name) : '',
            exam_date: g.exam_date || null,
            start_time: g.start_time || '09:00',
            end_time: g.end_time || '12:00',
            room_number: ''
          });
        });
      });

      await axios.post(
        `${apiUrl}/exams/${selectedClassExam.id}/timetable`,
        { timetableData: flatData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Exam Routine & Timetable Saved Successfully!');
      setTimetablesMap((prev) => ({
        ...prev,
        [selectedClassExam.id]: { created: true, finalized: false }
      }));
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to save timetable');
    }
    setSavingTimetable(false);
  };

  if (loading)
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        <FaSpinner className="animate-spin inline mr-2" /> Loading Exam Management...
      </div>
    );

  return (
    <div className="bg-white rounded-2xl p-4 md:p-8 min-h-screen border border-gray-100 shadow-sm">
      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Exam Management</h2>
              <p className="text-xs text-gray-500 mt-1">
                Create exams from standardized templates, schedule routines, and customize subject timetables.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkDownload(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-xs shadow-sm"
              >
                <FaDownload /> Bulk Download
              </button>
              <button
                onClick={() => {
                  setShowCreate(true);
                  if (defaultTemplates.length > 0) {
                    setCreationMode('template');
                    handleTemplateSelection(defaultTemplates[0].id);
                  } else {
                    setCreationMode('custom');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-xs shadow-sm shadow-indigo-600/20"
              >
                <FaPlus /> Create Exam
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="p-4">No.</th>
                  <th className="p-4">Exam Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Exam Dates</th>
                  <th className="p-4">Routine Created</th>
                  <th className="p-4">Finalized</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white text-sm">
                {exams.map((exam, idx) => (
                  <tr key={exam.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 font-bold text-gray-700">{idx + 1}</td>
                    <td className="p-4 font-semibold text-gray-900">{exam.name}</td>
                    <td className="p-4 text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {exam.type || 'Offline'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">Class {exam.class_level}</td>
                    <td className="p-4 text-xs font-medium text-gray-600">
                      {exam.start_date ? (
                        <span>
                          {exam.start_date} {exam.end_date ? `to ${exam.end_date}` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="p-4">
                      {timetablesMap[exam.id]?.created ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          Yes
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {timetablesMap[exam.id]?.finalized ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          Yes
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {!timetablesMap[exam.id]?.finalized && (
                          <button
                            onClick={() => openTimetable(exam)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                            title="Manage & Drag-and-Drop Routine"
                          >
                            <FaCalendarAlt size={12} />
                          </button>
                        )}
                        {!timetablesMap[exam.id]?.finalized && timetablesMap[exam.id]?.created && (
                          <button
                            onClick={() => handleFinalizeTimetable(exam)}
                            className="bg-teal-600 hover:bg-teal-700 text-white w-8 h-8 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                            title="Finalize Exam Timetable"
                          >
                            <FaCheckCircle size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => downloadClassPDF(exam)}
                          className="bg-amber-500 hover:bg-amber-600 text-white w-8 h-8 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                          title="Download Timetable PDF"
                        >
                          <FaDownload size={12} />
                        </button>
                        {!timetablesMap[exam.id]?.finalized && (
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="bg-gray-600 hover:bg-gray-700 text-white w-8 h-8 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-400 font-medium">
                      No exams created yet. Click "Create Exam" to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TIMETABLE ROUTINE BUILDER WITH DRAG & DROP */}
      {view === 'timetable' && selectedClassExam && (
        <div className="bg-gray-50/70 p-4 md:p-8 rounded-2xl border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800">
                Exam Routine: {selectedClassExam.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                  Class {selectedClassExam.class_level}
                </span>
                {selectedClassExam.start_date && (
                  <span>
                    Exam Period: {selectedClassExam.start_date} to {selectedClassExam.end_date || 'N/A'}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setView('list')}
              className="bg-gray-800 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-gray-900 transition flex items-center gap-2"
            >
              <FaArrowLeft /> Back to Exam List
            </button>
          </div>

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
              <span>Drag handle on each card to rearrange exam days. Click dates or times to edit directly.</span>
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
                        onUpdateField={handleUpdateField}
                        onRemove={handleRemoveRow}
                        onUpdatePaper={handleUpdatePaper}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky bottom-4 z-20">
            <button
              onClick={addTimetableRow}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
            >
              <FaPlus /> Add Subject Day
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTimetable}
                disabled={savingTimetable}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {savingTimetable ? 'Saving...' : 'Save Exam Routine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DOWNLOAD MODAL */}
      {showBulkDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setShowBulkDownload(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Bulk Download Timetables</h2>
            <form onSubmit={downloadBulkPDF}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                  Select Exam Group
                </label>
                <select
                  required
                  value={bulkExamName}
                  onChange={(e) => setBulkExamName(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">-- Select Exam --</option>
                  {uniqueExamNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 text-white p-3 rounded-xl font-bold hover:bg-amber-600 transition flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <FaDownload /> Download Timetable PDFs
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL (WITH DEFAULT TEMPLATE SELECTION & DATES) */}
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
              Choose a default exam template to automatically pre-fill subjects and dates, or create a custom exam.
            </p>

            {/* Mode Selector Tabs */}
            {defaultTemplates.length > 0 && (
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode('template');
                    if (defaultTemplates.length > 0) handleTemplateSelection(defaultTemplates[0].id);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    creationMode === 'template'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  From Default Exam Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode('custom');
                    setSelectedTemplateId('');
                    setNewExam((prev) => ({ ...prev, default_exam_id: '' }));
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    creationMode === 'custom'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Custom Exam
                </button>
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-4">
              {/* Default Template Dropdown */}
              {creationMode === 'template' && defaultTemplates.length > 0 && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Select Default Exam Template *
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelection(e.target.value)}
                    className="w-full border border-indigo-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-sm"
                  >
                    {defaultTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.type || 'Offline'} - {t.default_exam_timetables?.length || 0} subjects)
                      </option>
                    ))}
                  </select>

                  {/* Routine Preview info */}
                  {selectedTemplateId && (() => {
                    const selT = defaultTemplates.find((t) => t.id === selectedTemplateId);
                    const subs = selT?.default_exam_timetables || [];
                    return (
                      <div className="text-xs text-indigo-800 bg-white/80 p-3 rounded-lg border border-indigo-100 flex items-start gap-2">
                        <FiInfo className="text-indigo-600 text-sm mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold mb-0.5">
                            Pre-configured routine: {subs.length} {subs.length === 1 ? 'subject' : 'subjects'}
                          </div>
                          <div className="text-gray-600 line-clamp-2">
                            {subs.map((s) => s.subject).join(' → ') || 'No default subjects specified.'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Exam Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Exam Name *</label>
                <input
                  required
                  type="text"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                  placeholder="e.g. Half Yearly Examination 2026"
                />
              </div>

              {/* Type and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Exam Type</label>
                  <select
                    value={newExam.type}
                    onChange={(e) => setNewExam({ ...newExam, type: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={newExam.start_date}
                    onChange={(e) => setNewExam({ ...newExam, start_date: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">End Date *</label>
                  <input
                    required
                    type="date"
                    value={newExam.end_date}
                    onChange={(e) => setNewExam({ ...newExam, end_date: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>
              </div>

              {newExam.start_date && newExam.end_date && (
                <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  ⚡ Routine will automatically distribute the exam subjects across working days between {newExam.start_date} and {newExam.end_date} (excluding Sundays). You can drag-and-drop or edit dates afterwards.
                </p>
              )}

              {/* Class Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">Applicable Classes *</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newExam.class_levels.length === allClasses.length) {
                        setNewExam({ ...newExam, class_levels: [] });
                      } else {
                        setNewExam({ ...newExam, class_levels: [...allClasses] });
                      }
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                  >
                    {newExam.class_levels.length === allClasses.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2.5 bg-gray-50 rounded-xl border border-gray-200 custom-scrollbar">
                  {allClasses.map((c) => (
                    <label
                      key={c}
                      className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={newExam.class_levels.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setNewExam({ ...newExam, class_levels: [...newExam.class_levels, c] });
                          else
                            setNewExam({
                              ...newExam,
                              class_levels: newExam.class_levels.filter((cl) => cl !== c)
                            });
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Class {c}</span>
                    </label>
                  ))}
                </div>
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-indigo-600/20"
                >
                  Create Exam & Pre-set Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
