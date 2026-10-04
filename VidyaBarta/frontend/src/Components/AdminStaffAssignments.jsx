import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaChalkboardTeacher, 
  FaTrash, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaPlus, 
  FaUserTie,
  FaBookOpen,
  FaCrown
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminStaffAssignments = () => {
  const [activeTab, setActiveTab] = useState('timetable');
  const [staffList, setStaffList] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [examDuties, setExamDuties] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [mappingData, setMappingData] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);

  // Form states
  const [ttForm, setTtForm] = useState({ 
    class_level: '', 
    section: 'A', 
    day_of_week: 'Monday', 
    period_number: '', 
    subject: '', 
    staff_id: '', 
    secondary_staff_id: '',
    start_time: '', 
    end_time: '' 
  });
  
  const [examForm, setExamForm] = useState({ 
    staff_id: '', 
    exam_date: '', 
    start_time: '', 
    end_time: '', 
    room_no: '', 
    role: 'Main Examiner', 
    venue: 'Own School' 
  });
  
  const [assignForm, setAssignForm] = useState({ 
    class_name: '', 
    section: 'A', 
    class_teacher_id: '', 
    subject_teachers: [] 
  });

  const [newCustomSubject, setNewCustomSubject] = useState('');
  const [newCustomTeacherId, setNewCustomTeacherId] = useState('');
  const [newCustomSecondaryTeacherId, setNewCustomSecondaryTeacherId] = useState('');
  const [newCustomIsClassTeacher, setNewCustomIsClassTeacher] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [staffRes, ttRes, examRes, assignRes, mappingRes, classesRes] = await Promise.all([
        axios.get(`${API_URL}/staff/admin/all-staff`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/staff/admin/timetable`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/staff/admin/exam-duties`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/assignments`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/subjects/mapping`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/classes/school`, { headers }).catch(() => ({ data: [] }))
      ]);

      setStaffList(staffRes.data || []);
      setTimetables(ttRes.data || []);
      setExamDuties(examRes.data || []);
      setClassAssignments(assignRes.data || []);
      setMappingData(mappingRes.data || []);
      setSchoolClasses(classesRes.data || []);

      // If school classes exist, select the first class by default
      if (classesRes.data && classesRes.data.length > 0) {
        const firstCls = classesRes.data[0].class_level;
        initAssignFormForClass(firstCls, 'A', assignRes.data, mappingRes.data);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  const getTeacherDailyClassCount = (staffId, day) => {
    if (!staffId || !day) return 0;
    return timetables.filter(t => 
      t.staff_id === staffId && 
      t.day_of_week === day &&
      t.subject && 
      !t.subject.toLowerCase().includes('recess') && 
      !t.subject.toLowerCase().includes('break')
    ).length;
  };

  // Helper to load or initialize subject mapping when class or section is selected
  const initAssignFormForClass = (className, section, currentAssignments = classAssignments, currentMapping = mappingData) => {
    if (!className) return;

    // Check if an assignment already exists for this class & section
    const normClass = String(className).replace(/^Class\s*/i, '').trim();
    const existing = (currentAssignments || []).find(a => {
      const aNorm = String(a.class_name).replace(/^Class\s*/i, '').trim();
      return aNorm.toLowerCase() === normClass.toLowerCase() && 
             (!a.section || a.section.toLowerCase() === String(section).toLowerCase());
    });

    // Find subjects configured for this class in subject-mapping
    const clsConfig = (currentMapping || []).find(c => {
      const cNorm = String(c.class_level).replace(/^Class\s*/i, '').trim();
      return cNorm.toLowerCase() === normClass.toLowerCase();
    });

    const defaultSubjectNames = new Set();
    const isHS = normClass.toUpperCase().includes('XI') || normClass.toUpperCase().includes('XII') || normClass.includes('11') || normClass.includes('12');

    const addSubToDefaults = (subObj) => {
      const name = subObj.subjects?.name || subObj.name;
      if (!name) return;
      const isDivided = Boolean(subObj.is_divided || (subObj.parts && subObj.parts.length > 0));
      if (isDivided && subObj.parts && subObj.parts.length > 0) {
        subObj.parts.forEach(p => {
          const pName = (typeof p === 'string' ? p : p.name || '').trim();
          if (pName) {
            const formatted = pName.toUpperCase().includes(name.toUpperCase()) ? pName : `${name} (${pName})`;
            defaultSubjectNames.add(formatted);
          }
        });
      } else if (isHS && name.toUpperCase().includes('BIOL')) {
        defaultSubjectNames.add(`${name} (BOTANY)`);
        defaultSubjectNames.add(`${name} (ZOOLOGY)`);
      } else {
        defaultSubjectNames.add(name);
      }
    };

    if (clsConfig) {
      (clsConfig.core_subjects || []).forEach(addSubToDefaults);
      (clsConfig.elective_groups || []).forEach(eg => {
        (eg.subjects || []).forEach(addSubToDefaults);
      });
    }

    // Standard subjects fallback if no configuration yet
    if (defaultSubjectNames.size === 0) {
      ['English', 'Mathematics', 'Science', 'Social Science', 'Second Language', 'Computer'].forEach(s => defaultSubjectNames.add(s));
    }

    // Merge existing subject_teachers with configured subjects
    const subjectTeacherMap = {};
    if (existing && existing.subject_teachers) {
      existing.subject_teachers.forEach(st => {
        if (st.subject) {
          subjectTeacherMap[st.subject] = {
            teacher_id: st.teacher_id || '',
            secondary_teacher_id: st.secondary_teacher_id || ''
          };
        }
      });
    }

    const mergedSubjectTeachers = Array.from(defaultSubjectNames).map(subject => ({
      subject,
      teacher_id: subjectTeacherMap[subject]?.teacher_id || '',
      secondary_teacher_id: subjectTeacherMap[subject]?.secondary_teacher_id || ''
    }));

    // Also include any custom subjects from existing assignments
    if (existing && existing.subject_teachers) {
      existing.subject_teachers.forEach(st => {
        if (!defaultSubjectNames.has(st.subject)) {
          mergedSubjectTeachers.push({ 
            subject: st.subject, 
            teacher_id: st.teacher_id || '',
            secondary_teacher_id: st.secondary_teacher_id || ''
          });
        }
      });
    }

    setAssignForm({
      class_name: className,
      section: section || 'A',
      class_teacher_id: existing?.class_teacher_id || '',
      subject_teachers: mergedSubjectTeachers
    });
  };

  const handleClassSelectionChange = (newClass) => {
    initAssignFormForClass(newClass, assignForm.section);
  };

  const handleSectionSelectionChange = (newSection) => {
    initAssignFormForClass(assignForm.class_name, newSection);
  };

  const getOtherClassTeacherAssignment = (teacherId) => {
    if (!teacherId) return null;
    const targetClassNorm = String(assignForm.class_name || '').replace(/^Class\s*/i, '').trim().toLowerCase();
    const targetSecNorm = String(assignForm.section || 'A').trim().toLowerCase();
    return classAssignments.find(a => 
      a.class_teacher_id === teacherId && 
      !(
        String(a.class_name).replace(/^Class\s*/i, '').trim().toLowerCase() === targetClassNorm && 
        String(a.section || 'A').trim().toLowerCase() === targetSecNorm
      )
    );
  };

  const handleToggleClassTeacher = (teacherId) => {
    if (!teacherId) return;
    if (assignForm.class_teacher_id === teacherId) {
      // Toggle off / unassign
      setAssignForm(prev => ({ ...prev, class_teacher_id: '' }));
      return;
    }
    const clash = getOtherClassTeacherAssignment(teacherId);
    if (clash) {
      const teacher = staffList.find(s => s.id === teacherId);
      alert(`Cannot assign ${teacher?.name || 'this teacher'}: Already assigned as Class Teacher for Class ${clash.class_name} (${clash.section || 'A'}). A single teacher can be the class teacher of only 1 class (Rule 9).`);
      return;
    }
    setAssignForm(prev => ({ ...prev, class_teacher_id: teacherId }));
  };

  const handleSubjectTeacherChange = (subjectName, field, teacherId) => {
    const updated = assignForm.subject_teachers.map(st => 
      st.subject === subjectName ? { ...st, [field]: teacherId } : st
    );
    setAssignForm({ ...assignForm, subject_teachers: updated });
  };

  const handleRemoveSubjectFromMapping = (subjectName) => {
    const updated = assignForm.subject_teachers.filter(st => st.subject !== subjectName);
    setAssignForm({ ...assignForm, subject_teachers: updated });
  };

  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    if (!newCustomSubject.trim()) return;

    const trimmed = newCustomSubject.trim();
    if (assignForm.subject_teachers.some(st => st.subject.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Subject "${trimmed}" already exists in the mapping list.`);
      return;
    }

    if (newCustomTeacherId && newCustomSecondaryTeacherId && newCustomTeacherId === newCustomSecondaryTeacherId) {
      alert('Primary Teacher and Co-Teacher cannot be the same person.');
      return;
    }

    let designatedCT = assignForm.class_teacher_id;
    if (newCustomIsClassTeacher && newCustomTeacherId) {
      const clash = getOtherClassTeacherAssignment(newCustomTeacherId);
      if (clash) {
        const teacher = staffList.find(s => s.id === newCustomTeacherId);
        alert(`Cannot assign ${teacher?.name || 'this teacher'} as Class Teacher: Already assigned for Class ${clash.class_name} (${clash.section || 'A'}). A teacher can only be class teacher of 1 class.`);
      } else {
        designatedCT = newCustomTeacherId;
      }
    }

    setAssignForm({
      ...assignForm,
      class_teacher_id: designatedCT,
      subject_teachers: [
        ...assignForm.subject_teachers,
        { 
          subject: trimmed, 
          teacher_id: newCustomTeacherId, 
          secondary_teacher_id: newCustomSecondaryTeacherId 
        }
      ]
    });
    setNewCustomSubject('');
    setNewCustomTeacherId('');
    setNewCustomSecondaryTeacherId('');
    setNewCustomIsClassTeacher(false);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.class_name) {
      alert('Please select or specify a Class');
      return;
    }

    // Verify no subject has identical primary and co-teacher
    for (const st of assignForm.subject_teachers) {
      if (st.teacher_id && st.secondary_teacher_id && st.teacher_id === st.secondary_teacher_id) {
        alert(`Subject "${st.subject}" cannot have the same teacher selected for both Primary Teacher and Co-Teacher.`);
        return;
      }
    }

    // Validation: A single teacher can be class teacher of only 1 class
    if (assignForm.class_teacher_id) {
      const targetClassNorm = String(assignForm.class_name).replace(/^Class\s*/i, '').trim().toLowerCase();
      const targetSecNorm = String(assignForm.section || 'A').trim().toLowerCase();
      const clash = classAssignments.find(a => {
        if (!a.class_teacher_id || a.class_teacher_id !== assignForm.class_teacher_id) return false;
        const aClassNorm = String(a.class_name).replace(/^Class\s*/i, '').trim().toLowerCase();
        const aSecNorm = String(a.section || 'A').trim().toLowerCase();
        return !(aClassNorm === targetClassNorm && aSecNorm === targetSecNorm);
      });

      if (clash) {
        const teacher = staffList.find(s => s.id === assignForm.class_teacher_id);
        alert(`Validation Error: ${teacher?.name || 'This teacher'} is already assigned as Class Teacher for Class ${clash.class_name} (${clash.section || 'A'}). A single teacher can be the class teacher of only 1 class.`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/assignments`, assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Teacher mapping for Class ${assignForm.class_name} - ${assignForm.section} saved successfully! Email notifications sent to assigned teachers.`);
      
      const res = await axios.get(`${API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      setClassAssignments(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save class & subject teacher assignments');
    }
  };

  // Timetable scheduling submit with 6-class/day constraint
  const handleTtSubmit = async (e) => {
    e.preventDefault();

    if (ttForm.staff_id && ttForm.secondary_staff_id && ttForm.staff_id === ttForm.secondary_staff_id) {
      alert('Primary Teacher and 2nd Teacher cannot be the same person.');
      return;
    }

    // 1. Check client-side daily 6-class limit for both teachers
    const teachersToCheck = [];
    if (ttForm.staff_id) teachersToCheck.push(ttForm.staff_id);
    if (ttForm.secondary_staff_id) teachersToCheck.push(ttForm.secondary_staff_id);

    if (ttForm.day_of_week && ttForm.subject && 
        !ttForm.subject.toLowerCase().includes('recess') && !ttForm.subject.toLowerCase().includes('break')) {
      for (const tId of teachersToCheck) {
        const activeCount = getTeacherDailyClassCount(tId, ttForm.day_of_week);
        if (activeCount >= 6) {
          const teacher = staffList.find(s => s.id === tId);
          alert(`Cannot assign schedule! Teacher "${teacher?.name || 'Staff'}" already has ${activeCount} classes scheduled on ${ttForm.day_of_week}.\nA teacher cannot have more than 6 classes in a single day.`);
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/staff/admin/timetable`, ttForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Timetable period assigned successfully!');
      
      const res = await axios.get(`${API_URL}/staff/admin/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      setTimetables(res.data);
      
      setTtForm({ 
        class_level: '', 
        section: 'A', 
        day_of_week: 'Monday', 
        period_number: '', 
        subject: '', 
        staff_id: '', 
        secondary_staff_id: '',
        start_time: '', 
        end_time: '' 
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign timetable entry');
    }
  };

  // Auto-populate teacher when subject is selected or typed in timetable form
  const handleTtSubjectChange = (subj) => {
    let matchedTeacherId = ttForm.staff_id;
    let matchedSecondaryTeacherId = ttForm.secondary_staff_id;

    if (subj && ttForm.class_level) {
      const normClass = String(ttForm.class_level).replace(/^Class\s*/i, '').trim();
      const assignment = classAssignments.find(a => {
        const aNorm = String(a.class_name).replace(/^Class\s*/i, '').trim();
        return aNorm.toLowerCase() === normClass.toLowerCase() &&
               (!a.section || a.section.toLowerCase() === (ttForm.section || 'A').toLowerCase());
      });

      if (assignment && assignment.subject_teachers) {
        const match = assignment.subject_teachers.find(st => 
          st.subject && st.subject.toLowerCase().trim() === subj.toLowerCase().trim()
        );
        if (match) {
          if (match.teacher_id) matchedTeacherId = match.teacher_id;
          if (match.secondary_teacher_id) matchedSecondaryTeacherId = match.secondary_teacher_id;
        }
      }
    }

    setTtForm({ 
      ...ttForm, 
      subject: subj, 
      staff_id: matchedTeacherId, 
      secondary_staff_id: matchedSecondaryTeacherId 
    });
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/staff/admin/exam-duties`, examForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Exam duty assigned successfully!');
      const res = await axios.get(`${API_URL}/staff/admin/exam-duties`, { headers: { Authorization: `Bearer ${token}` } });
      setExamDuties(res.data);
      setExamForm({ staff_id: '', exam_date: '', start_time: '', end_time: '', room_no: '', role: 'Main Examiner', venue: 'Own School' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign exam duty');
    }
  };

  const deleteTt = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/staff/admin/timetable/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API_URL}/staff/admin/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      setTimetables(res.data);
    } catch (e) { 
      alert('Failed to delete timetable entry'); 
    }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam duty?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/staff/admin/exam-duties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const res = await axios.get(`${API_URL}/staff/admin/exam-duties`, { headers: { Authorization: `Bearer ${token}` } });
      setExamDuties(res.data);
    } catch (e) { 
      alert('Failed to delete exam duty'); 
    }
  };

  const currentSelectedTeacherDayCount = ttForm.staff_id ? getTeacherDailyClassCount(ttForm.staff_id, ttForm.day_of_week) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button 
          onClick={() => setActiveTab('timetable')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'timetable' 
              ? 'text-teal-700 border-b-2 border-teal-600 bg-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FaCalendarAlt /> Class Timetable
        </button>
        <button 
          onClick={() => setActiveTab('class-assignments')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'class-assignments' 
              ? 'text-teal-700 border-b-2 border-teal-600 bg-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FaChalkboardTeacher /> Subject & Teacher Mapping
        </button>
        <button 
          onClick={() => setActiveTab('exams')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'exams' 
              ? 'text-teal-700 border-b-2 border-teal-600 bg-white shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FaUserTie /> Exam Duties
        </button>
      </div>

      <div className="p-6">
        {/* ================= TAB 1: CLASS TIMETABLE ================= */}
        {activeTab === 'timetable' && (
          <div className="space-y-8">
            {/* Policy Info Card */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">6</div>
                <div>
                  <div className="font-bold text-teal-900 text-sm">Workload Policy Enforced</div>
                  <div className="text-teal-700">A teacher cannot have more than <strong>6 classes in a single day</strong> across the entire school schedule.</div>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 bg-white text-teal-800 font-bold rounded-full border border-teal-200 shadow-xs">
                Auto-Validated
              </span>
            </div>

            <form onSubmit={handleTtSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <h4 className="md:col-span-3 font-bold text-gray-800 text-base flex items-center gap-2">
                <FaCalendarAlt className="text-teal-600" /> Assign New Class Timetable Period
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Class</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. 10 or Class 10" 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.class_level} 
                  onChange={e => setTtForm({...ttForm, class_level: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Section</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. A" 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.section} 
                  onChange={e => setTtForm({...ttForm, section: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Day of the Week</label>
                <select 
                  required 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.day_of_week} 
                  onChange={e => setTtForm({...ttForm, day_of_week: e.target.value})}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Subject (e.g. Mathematics)" 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.subject} 
                  onChange={e => handleTtSubjectChange(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Assigned Teacher (Dropdown with Daily Load)
                </label>
                <select 
                  required 
                  className={`w-full p-2.5 border rounded-lg bg-white text-sm outline-none ${
                    currentSelectedTeacherDayCount >= 6 ? 'border-red-400 text-red-700 font-bold' : 'focus:border-teal-500'
                  }`} 
                  value={ttForm.staff_id} 
                  onChange={e => setTtForm({...ttForm, staff_id: e.target.value})}
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffList.map(s => {
                    const countOnDay = getTeacherDailyClassCount(s.id, ttForm.day_of_week);
                    const isFull = countOnDay >= 6;
                    return (
                      <option key={s.id} value={s.id} disabled={isFull}>
                        {s.name} ({countOnDay}/6 classes on {ttForm.day_of_week}){isFull ? ' [MAX REACHED]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  2nd Teacher / Co-Teacher (Optional)
                </label>
                <select 
                  className={`w-full p-2.5 border rounded-lg bg-white text-sm outline-none ${
                    ttForm.secondary_staff_id ? 'border-indigo-300 bg-indigo-50/40 text-indigo-900 font-semibold' : 'focus:border-teal-500'
                  }`} 
                  value={ttForm.secondary_staff_id} 
                  onChange={e => setTtForm({...ttForm, secondary_staff_id: e.target.value})}
                >
                  <option value="">-- None (Single Teacher) --</option>
                  {staffList.map(s => {
                    const countOnDay = getTeacherDailyClassCount(s.id, ttForm.day_of_week);
                    const isFull = countOnDay >= 6;
                    const isSameAsPrimary = s.id === ttForm.staff_id;
                    return (
                      <option key={s.id} value={s.id} disabled={isFull || isSameAsPrimary}>
                        {s.name} ({countOnDay}/6 classes on {ttForm.day_of_week}){isFull ? ' [MAX REACHED]' : ''}{isSameAsPrimary ? ' [Primary Teacher]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Period Number</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max="12" 
                  placeholder="e.g. 1" 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.period_number} 
                  onChange={e => setTtForm({...ttForm, period_number: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Start Time</label>
                <input 
                  required 
                  type="time" 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.start_time} 
                  onChange={e => setTtForm({...ttForm, start_time: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">End Time</label>
                <input 
                  required 
                  type="time" 
                  className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                  value={ttForm.end_time} 
                  onChange={e => setTtForm({...ttForm, end_time: e.target.value})} 
                />
              </div>

              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={currentSelectedTeacherDayCount >= 6}
                  className="w-full bg-teal-600 text-white font-bold p-2.5 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Assign Class Period
                </button>
              </div>

              {currentSelectedTeacherDayCount >= 6 && (
                <div className="md:col-span-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">
                  <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
                  Selected teacher already has 6 classes scheduled on {ttForm.day_of_week}. You cannot assign more classes on this day.
                </div>
              )}
            </form>

            {/* Timetable List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Staff</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Class & Subject</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Schedule</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timetables.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-bold text-gray-800">
                        {t.staff?.name || 'Unassigned'}
                        <div className="text-xs text-gray-400 font-normal">{t.staff?.email}</div>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="font-bold text-teal-700">Class {t.class_level} - {t.section}</span>
                        <span className="text-gray-400 mx-2">|</span>
                        <span className="font-medium text-gray-700">{t.subject}</span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{t.day_of_week}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded ml-2">Period {t.period_number}</span>
                        <div className="text-xs text-gray-400">{t.start_time || '--'} to {t.end_time || '--'}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => deleteTt(t.id)} 
                          className="text-red-400 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                          title="Delete entry"
                        >
                          <FaTrash/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timetables.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400 text-sm">
                        No timetable entries created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SUBJECT & TEACHER MAPPING ================= */}
        {activeTab === 'class-assignments' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-blue-900 text-base flex items-center gap-2">
                  <FaChalkboardTeacher className="text-blue-600" /> Subject-Teacher Mapping with Dropdown Selection
                </h3>
                <p className="text-blue-700 text-xs mt-1">
                  Select a class to view all its configured subjects. Each subject has an assigned teacher dropdown.
                  Teachers are restricted to a maximum of <strong>6 classes in a single day</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-blue-200 font-semibold text-blue-800 shadow-xs">
                <FaCheckCircle className="text-emerald-500" />
                <span>Auto-syncs with Timetable Grid</span>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
              {/* Class & Section Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select Class</label>
                  {schoolClasses.length > 0 ? (
                    <select 
                      className="w-full p-2.5 border rounded-lg bg-white text-sm font-semibold text-gray-800 outline-none focus:border-teal-500"
                      value={assignForm.class_name}
                      onChange={e => handleClassSelectionChange(e.target.value)}
                    >
                      <option value="">-- Choose Class --</option>
                      {schoolClasses.map(c => (
                        <option key={c.id || c.class_level} value={c.class_level}>
                          {c.class_level} {c.medium ? `(${c.medium})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. 10 or Class 10" 
                      className="w-full p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-teal-500" 
                      value={assignForm.class_name} 
                      onChange={e => handleClassSelectionChange(e.target.value)} 
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white text-sm font-semibold text-gray-800 outline-none focus:border-teal-500"
                    value={assignForm.section}
                    onChange={e => handleSectionSelectionChange(e.target.value)}
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FaCrown className="text-amber-500" /> Designated Class Teacher
                    </label>
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      1 Teacher = 1 Class Only
                    </span>
                  </div>
                  <select 
                    className="w-full p-2.5 border rounded-lg bg-white text-sm font-medium outline-none focus:border-teal-500" 
                    value={assignForm.class_teacher_id} 
                    onChange={e => setAssignForm({...assignForm, class_teacher_id: e.target.value})}
                  >
                    <option value="">-- No Class Teacher Assigned (Or select from subjects below) --</option>
                    {staffList.map(s => {
                      const otherAssignment = getOtherClassTeacherAssignment(s.id);
                      const isCurrent = s.id === assignForm.class_teacher_id;
                      const isBusy = !!otherAssignment && !isCurrent;
                      return (
                        <option key={s.id} value={s.id} disabled={isBusy} className={isBusy ? 'text-gray-400 bg-gray-50' : ''}>
                          {s.name} ({s.role || 'Teacher'}) {isCurrent ? '👑 [Current Class Teacher]' : ''} {isBusy ? `— [Already Class Teacher: ${otherAssignment.class_name} ${otherAssignment.section || 'A'}]` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Rule 9: A single teacher can be class teacher of only 1 class and will always have the first period everyday.
                  </p>
                </div>
              </div>

              {/* Subject Table with Teacher Dropdown against each subject */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-gray-100/70 p-3.5 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-2">
                    <FaBookOpen className="text-teal-600" />
                    Subjects Configured for Class {assignForm.class_name || '...'} ({assignForm.subject_teachers.length})
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FaCrown className="text-amber-500" /> Click "Set as Class Teacher" on any subject to designate the class teacher
                  </span>
                </div>

                <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
                  {assignForm.subject_teachers.map((st, i) => {
                    const isPrimaryCT = Boolean(st.teacher_id && st.teacher_id === assignForm.class_teacher_id);
                    const isSecondaryCT = Boolean(st.secondary_teacher_id && st.secondary_teacher_id === assignForm.class_teacher_id);
                    const hasClassTeacherInRow = isPrimaryCT || isSecondaryCT;
                    const primaryOtherAssignment = st.teacher_id ? getOtherClassTeacherAssignment(st.teacher_id) : null;
                    const isPrimaryBusy = Boolean(primaryOtherAssignment && !isPrimaryCT);
                    const secondaryOtherAssignment = st.secondary_teacher_id ? getOtherClassTeacherAssignment(st.secondary_teacher_id) : null;
                    const isSecondaryBusy = Boolean(secondaryOtherAssignment && !isSecondaryCT);

                    return (
                      <div 
                        key={i} 
                        className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition rounded-lg ${
                          hasClassTeacherInRow 
                            ? 'bg-amber-50/60 border-l-4 border-l-amber-500 shadow-xs' 
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                            hasClassTeacherInRow ? 'bg-amber-200 text-amber-900' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-gray-800 text-sm">{st.subject}</span>
                              {hasClassTeacherInRow && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                                  <FaCrown className="text-amber-600 text-xs" /> Class Teacher Subject
                                </span>
                              )}
                              {st.teacher_id && st.secondary_teacher_id && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                  Co-Teaching
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Menus: Primary Teacher + Optional Co-Teacher with Class Teacher option */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 justify-end">
                          {/* Primary Teacher Block */}
                          <div className="flex-1 sm:max-w-xs">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] uppercase font-bold text-gray-500">Primary Teacher</label>
                              {st.teacher_id && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleClassTeacher(st.teacher_id)}
                                  disabled={isPrimaryBusy}
                                  title={
                                    isPrimaryBusy
                                      ? `Already Class Teacher of ${primaryOtherAssignment.class_name} (${primaryOtherAssignment.section || 'A'})`
                                      : isPrimaryCT
                                      ? 'Currently Class Teacher. Click to unassign.'
                                      : `Set as Class Teacher for Class ${assignForm.class_name || ''} (Rule 9: Period 1 everyday)`
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                                    isPrimaryCT
                                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs ring-1 ring-amber-400'
                                      : isPrimaryBusy
                                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                                      : 'bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-800 border-gray-300 hover:border-amber-300'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrimaryCT ? 'bg-amber-600' : 'border border-gray-400'}`}></span>
                                  <FaCrown className={isPrimaryCT ? 'text-amber-600 text-xs' : 'text-gray-400 text-xs'} />
                                  <span>{isPrimaryCT ? 'Class Teacher' : isPrimaryBusy ? 'CT Elsewhere' : 'Set as Class Teacher'}</span>
                                </button>
                              )}
                            </div>
                            <select
                              className={`w-full p-2 border rounded-lg text-xs font-medium outline-none transition ${
                                isPrimaryCT 
                                  ? 'border-amber-400 bg-amber-50/30 text-amber-950 font-semibold ring-1 ring-amber-300' 
                                  : 'bg-white focus:border-teal-500'
                              }`}
                              value={st.teacher_id || ''}
                              onChange={(e) => handleSubjectTeacherChange(st.subject, 'teacher_id', e.target.value)}
                            >
                              <option value="">-- Primary Teacher --</option>
                              {staffList.map(s => {
                                const isCurrentCT = s.id === assignForm.class_teacher_id;
                                const otherAssn = getOtherClassTeacherAssignment(s.id);
                                return (
                                  <option key={s.id} value={s.id} disabled={s.id === st.secondary_teacher_id}>
                                    {s.name} ({s.role || 'Teacher'})
                                    {isCurrentCT ? ' 👑 [Class Teacher]' : ''}
                                    {otherAssn && !isCurrentCT ? ` [Already CT: ${otherAssn.class_name} ${otherAssn.section || 'A'}]` : ''}
                                    {s.id === st.secondary_teacher_id ? ' (Selected as Co-Teacher)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Co-Teacher (Optional) Block */}
                          <div className="flex-1 sm:max-w-xs">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] uppercase font-bold text-gray-500">Co-Teacher (Optional)</label>
                              {st.secondary_teacher_id && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleClassTeacher(st.secondary_teacher_id)}
                                  disabled={isSecondaryBusy}
                                  title={
                                    isSecondaryBusy
                                      ? `Already Class Teacher of ${secondaryOtherAssignment.class_name} (${secondaryOtherAssignment.section || 'A'})`
                                      : isSecondaryCT
                                      ? 'Currently Class Teacher. Click to unassign.'
                                      : `Set as Class Teacher for Class ${assignForm.class_name || ''} (Rule 9: Period 1 everyday)`
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                                    isSecondaryCT
                                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs ring-1 ring-amber-400'
                                      : isSecondaryBusy
                                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
                                      : 'bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-800 border-gray-300 hover:border-amber-300'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSecondaryCT ? 'bg-amber-600' : 'border border-gray-400'}`}></span>
                                  <FaCrown className={isSecondaryCT ? 'text-amber-600 text-xs' : 'text-gray-400 text-xs'} />
                                  <span>{isSecondaryCT ? 'Class Teacher' : isSecondaryBusy ? 'CT Elsewhere' : 'Set as Class Teacher'}</span>
                                </button>
                              )}
                            </div>
                            <select
                              className={`w-full p-2 border rounded-lg text-xs outline-none font-medium transition-colors ${
                                isSecondaryCT
                                  ? 'border-amber-400 bg-amber-50/30 text-amber-950 font-semibold ring-1 ring-amber-300'
                                  : st.secondary_teacher_id 
                                  ? 'border-indigo-300 bg-indigo-50/40 text-indigo-900 font-semibold' 
                                  : 'bg-white text-gray-600 focus:border-teal-500'
                              }`}
                              value={st.secondary_teacher_id || ''}
                              onChange={(e) => handleSubjectTeacherChange(st.subject, 'secondary_teacher_id', e.target.value)}
                            >
                              <option value="">-- 2nd / Co-Teacher (Optional) --</option>
                              {staffList.map(s => {
                                const isCurrentCT = s.id === assignForm.class_teacher_id;
                                const otherAssn = getOtherClassTeacherAssignment(s.id);
                                return (
                                  <option key={s.id} value={s.id} disabled={s.id === st.teacher_id}>
                                    {s.name} ({s.role || 'Teacher'})
                                    {isCurrentCT ? ' 👑 [Class Teacher]' : ''}
                                    {otherAssn && !isCurrentCT ? ` [Already CT: ${otherAssn.class_name} ${otherAssn.section || 'A'}]` : ''}
                                    {s.id === st.teacher_id ? ' (Selected as Primary)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectFromMapping(st.subject)}
                            className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition self-center"
                            title="Remove subject"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {assignForm.subject_teachers.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No subjects configured for this class yet. Select a class or add custom subjects below.
                    </div>
                  )}
                </div>

                {/* Add Custom / Additional Subject Row */}
                <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Add additional subject (e.g. Physics Lab, Sanskrit)"
                    className="p-2 border rounded-lg text-xs flex-1 bg-white outline-none focus:border-teal-500 w-full"
                    value={newCustomSubject}
                    onChange={e => setNewCustomSubject(e.target.value)}
                  />
                  <select
                    className="p-2 border rounded-lg text-xs bg-white outline-none focus:border-teal-500 w-full md:w-52"
                    value={newCustomTeacherId}
                    onChange={e => setNewCustomTeacherId(e.target.value)}
                  >
                    <option value="">-- Primary Teacher (Optional) --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role || 'Teacher'})</option>
                    ))}
                  </select>
                  <select
                    className="p-2 border rounded-lg text-xs bg-white outline-none focus:border-teal-500 w-full md:w-52"
                    value={newCustomSecondaryTeacherId}
                    onChange={e => setNewCustomSecondaryTeacherId(e.target.value)}
                  >
                    <option value="">-- 2nd Teacher (Optional) --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id} disabled={s.id === newCustomTeacherId}>
                        {s.name} ({s.role || 'Teacher'})
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer bg-white px-2.5 py-2 rounded-lg border border-gray-200 hover:border-amber-300 whitespace-nowrap self-stretch md:self-auto">
                    <input
                      type="checkbox"
                      checked={newCustomIsClassTeacher}
                      onChange={e => setNewCustomIsClassTeacher(e.target.checked)}
                      disabled={!newCustomTeacherId}
                      className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <FaCrown className={newCustomIsClassTeacher ? 'text-amber-500 text-xs' : 'text-gray-400 text-xs'} />
                    <span>Set as Class Teacher</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-4 py-2 bg-teal-100 text-teal-800 font-bold rounded-lg text-xs hover:bg-teal-200 transition flex items-center gap-1 w-full md:w-auto justify-center whitespace-nowrap"
                  >
                    <FaPlus /> Add Subject
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  className="bg-teal-700 text-white font-bold px-8 py-3 rounded-xl hover:bg-teal-800 transition shadow-sm text-sm"
                >
                  Save Mapping & Notify Teachers
                </button>
              </div>
            </form>

            {/* Existing Class Assignments Directory */}
            <div className="overflow-x-auto">
              <h4 className="font-bold text-gray-800 text-sm mb-3">All Active Class & Subject Assignments</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Class & Section</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Class Teacher</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Subject Teachers (Primary & Co-Teachers)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classAssignments.map(ca => {
                    const ct = staffList.find(s => s.id === ca.class_teacher_id);
                    return (
                      <tr key={ca.id} className="hover:bg-gray-50">
                        <td className="p-3 text-sm font-bold text-teal-800">
                          {ca.class_name} - {ca.section}
                        </td>
                        <td className="p-3 text-sm text-gray-700 font-medium">
                          {ct ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <FaCrown className="text-amber-500" /> {ct.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex flex-wrap gap-1.5">
                            {ca.subject_teachers?.map((st, i) => {
                              const stt = staffList.find(s => s.id === st.teacher_id);
                              const stt2 = staffList.find(s => s.id === st.secondary_teacher_id);
                              const isCTSubject = Boolean(ca.class_teacher_id && (ca.class_teacher_id === st.teacher_id || ca.class_teacher_id === st.secondary_teacher_id));

                              return (
                                <span key={i} className={`inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${
                                  isCTSubject
                                    ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-medium'
                                    : stt2 ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900' : 'bg-gray-100 border-gray-200'
                                }`}>
                                  {isCTSubject && (
                                    <FaCrown className="text-amber-500 text-[10px]" title="Class Teacher Subject" />
                                  )}
                                  <strong className="text-gray-800">{st.subject}:</strong> 
                                  <span className={stt ? 'text-teal-700 font-semibold' : 'text-gray-400'}>
                                    {stt?.name || 'Unassigned'}
                                    {ca.class_teacher_id === st.teacher_id && ' (CT)'}
                                  </span>
                                  {stt2 && (
                                    <>
                                      <span className="text-gray-400 font-bold">+</span>
                                      <span className="text-indigo-700 font-semibold" title="Co-Teacher / 2nd Teacher">
                                        {stt2.name} (Co-Teacher){ca.class_teacher_id === st.secondary_teacher_id && ' (CT)'}
                                      </span>
                                    </>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {classAssignments.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-6 text-gray-400 text-sm">
                        No class teacher assignments saved yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: EXAM DUTIES ================= */}
        {activeTab === 'exams' && (
          <div className="space-y-8">
            <form onSubmit={handleExamSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <h4 className="md:col-span-3 font-bold text-gray-800 flex items-center gap-2">
                <FaUserTie className="text-blue-600" /> Assign Exam Invigilation / Duty
              </h4>
              <select 
                required 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500" 
                value={examForm.staff_id} 
                onChange={e => setExamForm({...examForm, staff_id: e.target.value})}
              >
                <option value="">Select Staff Member</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
              </select>
              <input 
                required 
                type="date" 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500" 
                value={examForm.exam_date} 
                onChange={e => setExamForm({...examForm, exam_date: e.target.value})} 
              />
              <input 
                required 
                type="text" 
                placeholder="Room No (e.g. Hall 1, Room 204)" 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500" 
                value={examForm.room_no} 
                onChange={e => setExamForm({...examForm, room_no: e.target.value})} 
              />
              <input 
                required 
                type="time" 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500" 
                value={examForm.start_time} 
                onChange={e => setExamForm({...examForm, start_time: e.target.value})} 
              />
              <input 
                required 
                type="time" 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500" 
                value={examForm.end_time} 
                onChange={e => setExamForm({...examForm, end_time: e.target.value})} 
              />
              <select 
                required 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500" 
                value={examForm.role} 
                onChange={e => setExamForm({...examForm, role: e.target.value})}
              >
                <option>Main Examiner</option>
                <option>Reliever</option>
                <option>Assistant</option>
              </select>
              <input 
                type="text" 
                placeholder="Venue" 
                className="p-2.5 border rounded-lg bg-white text-sm outline-none focus:border-blue-500 md:col-span-2" 
                value={examForm.venue} 
                onChange={e => setExamForm({...examForm, venue: e.target.value})} 
              />
              <button 
                type="submit" 
                className="bg-blue-600 text-white font-bold p-2.5 rounded-lg hover:bg-blue-700 transition"
              >
                Assign Exam Duty
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Staff</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Date & Time</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Room & Role</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examDuties.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-bold text-gray-800">{e.staff?.name}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(e.exam_date).toLocaleDateString('en-GB')} | {e.start_time} - {e.end_time}
                      </td>
                      <td className="p-3 text-sm">Room: {e.room_no} | <span className="font-semibold text-blue-600">{e.role}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => deleteExam(e.id)} className="text-red-500 hover:text-red-700 p-2">
                          <FaTrash/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {examDuties.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-400 text-sm">
                        No exam duties assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStaffAssignments;
