import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  FaChalkboardTeacher,
  FaBookOpen,
  FaLayerGroup,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaTrash,
  FaSearch,
  FaTimes,
  FaSave,
  FaUserTie,
  FaCrown,
  FaCopy,
  FaArrowRight,
  FaFilter,
  FaGraduationCap,
  FaInfoCircle,
  FaSyncAlt,
  FaCheck,
  FaUserPlus
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { sortClasses } from '../utils/classOrder';

const ClassSubjectTeacher = ({ API_URL, onNavigateToClasses, onNavigateToSubjects }) => {
  // School Data
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [classMappings, setClassMappings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state (selected from classes available in this school)
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Local assignment state for the selected class & section
  // key: subjectKey -> { teacher_ids: [id1, id2, ...], subject_name: string, ... }
  const [subjectTeachersState, setSubjectTeachersState] = useState({});
  const [initialStateHash, setInitialStateHash] = useState('');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  // UI state
  const [searchSubject, setSearchSubject] = useState('');
  const [subjectFilterTab, setSubjectFilterTab] = useState('all'); // all, core, elective, assigned, unassigned
  const [activeSubjectKey, setActiveSubjectKey] = useState(null);
  const [openTeacherPickerKey, setOpenTeacherPickerKey] = useState(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceSection, setCopySourceSection] = useState('');
  const [quickAssignSubjectKey, setQuickAssignSubjectKey] = useState('');

  const subjectRefs = useRef({});
  const pickerDropdownRef = useRef(null);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // Helper to extract sections from a school class
  const getSectionsForClass = (className, sClasses = schoolClasses) => {
    if (!className) return ['A'];
    const sCls = (sClasses || []).find(
      c => (c.class_level || '').trim().toLowerCase() === String(className).trim().toLowerCase()
    );
    if (sCls) {
      if (Array.isArray(sCls.sections_data) && sCls.sections_data.length > 0) {
        const names = sCls.sections_data.map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
        if (names.length > 0) return names;
      }
      if (typeof sCls.sections === 'string' && sCls.sections.trim()) {
        const parts = sCls.sections.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
      }
      if (Array.isArray(sCls.sections) && sCls.sections.length > 0) {
        return sCls.sections;
      }
    }
    return ['A', 'B', 'C'];
  };

  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sClassRes, mappingRes, staffRes, assignRes] = await Promise.all([
        axios.get(`${API_URL}/classes/school`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/subjects/mapping`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/staff/admin/teachers-list`, { headers }).catch(async () => {
          return axios.get(`${API_URL}/staff/admin/all-staff`, { headers }).catch(() => ({ data: [] }));
        }),
        axios.get(`${API_URL}/assignments`, { headers }).catch(() => ({ data: [] }))
      ]);

      const sortedSchoolClasses = sortClasses(sClassRes.data || [], c => c.class_level);
      setSchoolClasses(sortedSchoolClasses);
      setClassMappings(mappingRes.data || []);

      const sortedTeachers = (staffRes.data || [])
        .filter(t => t && t.id)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setTeachers(sortedTeachers);

      const allAssignments = Array.isArray(assignRes.data) ? assignRes.data : [];
      setAssignments(allAssignments);

      // Auto-select first class & section if none selected yet
      if (!selectedClass && sortedSchoolClasses.length > 0) {
        const firstClass = sortedSchoolClasses[0].class_level;
        setSelectedClass(firstClass);
        const sections = getSectionsForClass(firstClass, sortedSchoolClasses);
        if (sections.length > 0) {
          setSelectedSection(sections[0]);
        }
      }
    } catch (err) {
      console.error('Error loading data for Class Subject Teacher:', err);
      toast.error('Failed to load classes or teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  // Available sections for currently selected class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    return getSectionsForClass(selectedClass, schoolClasses);
  }, [selectedClass, schoolClasses]);

  // When selectedClass changes, ensure selectedSection is valid
  const handleSelectClass = (className) => {
    setSelectedClass(className);
    const secs = getSectionsForClass(className, schoolClasses);
    if (secs.length > 0) {
      if (!secs.includes(selectedSection)) {
        setSelectedSection(secs[0]);
      }
    } else {
      setSelectedSection('A');
    }
  };

  // Calculate teacher workloads across all classes (how many classes/sections they teach)
  const teacherWorkloadMap = useMemo(() => {
    const map = {};
    (assignments || []).forEach(assn => {
      (assn.subject_teachers || []).forEach(st => {
        const ids = Array.isArray(st.teacher_ids) && st.teacher_ids.length > 0
          ? st.teacher_ids.filter(Boolean)
          : [st.teacher_id, st.secondary_teacher_id].filter(Boolean);
        ids.forEach(tId => {
          map[tId] = (map[tId] || 0) + 1;
        });
      });
    });
    return map;
  }, [assignments]);

  // Derive all subjects for the selected class from classMappings
  const subjectsList = useMemo(() => {
    if (!selectedClass) return [];
    const normClass = String(selectedClass).replace(/^Class\s*/i, '').trim().toLowerCase();

    const clsConfig = (classMappings || []).find(c => {
      const cNorm = String(c.class_level || '').replace(/^Class\s*/i, '').trim().toLowerCase();
      return cNorm === normClass;
    });

    const list = [];
    const addedKeys = new Set();

    if (clsConfig) {
      // Core subjects
      (clsConfig.core_subjects || []).forEach((sub, idx) => {
        const name = sub.subjects?.name || sub.name;
        if (!name) return;
        const isDivided = Boolean(sub.is_divided || (sub.parts && sub.parts.length > 0));

        if (isDivided && sub.parts && sub.parts.length > 0) {
          sub.parts.forEach((p, pIdx) => {
            const pName = (typeof p === 'string' ? p : p.name || '').trim();
            if (!pName) return;
            const formatted = pName.toUpperCase().includes(name.toUpperCase()) ? pName : `${name} (${pName})`;
            const key = `core_${sub.id || sub.subject_id || idx}_part_${pIdx}_${pName}`;
            if (!addedKeys.has(key)) {
              addedKeys.add(key);
              list.push({
                key,
                name: formatted,
                parentName: name,
                partName: pName,
                is_divided_part: true,
                code: sub.subjects?.code || sub.code || '',
                marking_system: sub.subjects?.marking_system || sub.marking_system || 'Marks',
                is_core: true,
                category: 'Core',
                subject_id: sub.subject_id || sub.id
              });
            }
          });
        } else {
          const key = `core_${sub.id || sub.subject_id || idx}_${name}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            list.push({
              key,
              name,
              code: sub.subjects?.code || sub.code || '',
              marking_system: sub.subjects?.marking_system || sub.marking_system || 'Marks',
              is_core: true,
              category: 'Core',
              subject_id: sub.subject_id || sub.id
            });
          }
        }
      });

      // Elective groups
      (clsConfig.elective_groups || []).forEach((group, gIdx) => {
        (group.subjects || []).forEach((sub, sIdx) => {
          const name = sub.subjects?.name || sub.name;
          if (!name) return;
          const isDivided = Boolean(sub.is_divided || (sub.parts && sub.parts.length > 0));

          if (isDivided && sub.parts && sub.parts.length > 0) {
            sub.parts.forEach((p, pIdx) => {
              const pName = (typeof p === 'string' ? p : p.name || '').trim();
              if (!pName) return;
              const formatted = pName.toUpperCase().includes(name.toUpperCase()) ? pName : `${name} (${pName})`;
              const key = `elective_${group.group_name || gIdx}_${sub.id || sub.subject_id || sIdx}_part_${pIdx}_${pName}`;
              if (!addedKeys.has(key)) {
                addedKeys.add(key);
                list.push({
                  key,
                  name: formatted,
                  parentName: name,
                  partName: pName,
                  is_divided_part: true,
                  code: sub.subjects?.code || sub.code || '',
                  marking_system: sub.subjects?.marking_system || sub.marking_system || 'Marks',
                  is_core: false,
                  category: group.group_name || 'Elective',
                  subject_id: sub.subject_id || sub.id
                });
              }
            });
          } else {
            const key = `elective_${group.group_name || gIdx}_${sub.id || sub.subject_id || sIdx}_${name}`;
            if (!addedKeys.has(key)) {
              addedKeys.add(key);
              list.push({
                key,
                name,
                code: sub.subjects?.code || sub.code || '',
                marking_system: sub.subjects?.marking_system || sub.marking_system || 'Marks',
                is_core: false,
                category: group.group_name || 'Elective',
                subject_id: sub.subject_id || sub.id
              });
            }
          }
        });
      });
    }

    // Default canonical subjects fallback if none found
    if (list.length === 0) {
      const defaultSubs = ['English', 'Mathematics', 'Science', 'Social Science', 'Second Language', 'Computer'];
      defaultSubs.forEach((sName, idx) => {
        list.push({
          key: `default_${idx}_${sName}`,
          name: sName,
          code: `VB-${sName.slice(0, 4).toUpperCase()}`,
          marking_system: 'Marks',
          is_core: true,
          category: 'Core',
          subject_id: null,
          is_default_fallback: true
        });
      });
    }

    return list;
  }, [selectedClass, classMappings]);

  // Load existing assignments for currently selected class and section
  useEffect(() => {
    if (!selectedClass || !selectedSection) {
      setSubjectTeachersState({});
      setInitialStateHash('');
      setClassTeacherId('');
      return;
    }

    const normClass = String(selectedClass).replace(/^Class\s*/i, '').trim().toLowerCase();
    const normSec = String(selectedSection).trim().toLowerCase();

    const existingAssn = (assignments || []).find(a => {
      const aClass = String(a.class_name || '').replace(/^Class\s*/i, '').trim().toLowerCase();
      const aSec = String(a.section || 'A').trim().toLowerCase();
      return aClass === normClass && aSec === normSec;
    });

    const stateObj = {};
    const existingSubjectTeachers = existingAssn?.subject_teachers || [];
    const loadedClassTeacherId = existingAssn?.class_teacher_id || '';
    setClassTeacherId(loadedClassTeacherId);

    subjectsList.forEach(s => {
      // Find matching entry in existing assignment
      const sNameLower = s.name.toLowerCase().trim();
      let matched = existingSubjectTeachers.find(st => 
        st.subject && st.subject.toLowerCase().trim() === sNameLower
      );

      // Part name or parent match fallback
      if (!matched && s.partName) {
        matched = existingSubjectTeachers.find(st => 
          st.subject && (
            st.subject.toLowerCase().trim() === s.partName.toLowerCase().trim() ||
            st.subject.toLowerCase().includes(s.partName.toLowerCase())
          )
        );
      }

      if (matched) {
        const ids = Array.isArray(matched.teacher_ids) && matched.teacher_ids.length > 0
          ? matched.teacher_ids.filter(Boolean)
          : [matched.teacher_id, matched.secondary_teacher_id].filter(Boolean);
        stateObj[s.key] = {
          teacher_ids: ids
        };
      } else {
        stateObj[s.key] = {
          teacher_ids: []
        };
      }
    });

    setSubjectTeachersState(stateObj);
    setInitialStateHash(JSON.stringify({ subjectTeachers: stateObj, classTeacherId: loadedClassTeacherId }));
  }, [selectedClass, selectedSection, assignments, subjectsList]);

  // Map of teacherId -> { class_name, section } for other classes where this teacher is already assigned as Class Teacher
  const otherClassTeacherMap = useMemo(() => {
    const map = new Map();
    const currClassNorm = String(selectedClass || '').replace(/^Class\s*/i, '').trim().toLowerCase();
    const currSecNorm = String(selectedSection || 'A').trim().toLowerCase();

    (assignments || []).forEach(a => {
      if (a.class_teacher_id) {
        const aClassNorm = String(a.class_name || '').replace(/^Class\s*/i, '').trim().toLowerCase();
        const aSecNorm = String(a.section || 'A').trim().toLowerCase();
        const isCurrentClassSec = aClassNorm === currClassNorm && aSecNorm === currSecNorm;
        if (!isCurrentClassSec) {
          map.set(String(a.class_teacher_id), {
            class_name: a.class_name,
            section: a.section || 'A'
          });
        }
      }
    });
    return map;
  }, [assignments, selectedClass, selectedSection]);

  const assignedClassTeacher = useMemo(() => {
    if (!classTeacherId) return null;
    return teachers.find(t => String(t.id) === String(classTeacherId)) || null;
  }, [classTeacherId, teachers]);

  // Subjects where current Class Teacher is assigned to teach
  const classTeacherSubjects = useMemo(() => {
    if (!classTeacherId) return [];
    return subjectsList.filter(s => {
      const assigned = subjectTeachersState[s.key]?.teacher_ids || [];
      return assigned.map(String).includes(String(classTeacherId));
    });
  }, [classTeacherId, subjectsList, subjectTeachersState]);

  const handleSelectClassTeacher = (teacherId) => {
    if (!teacherId) {
      setClassTeacherId('');
      setQuickAssignSubjectKey('');
      return;
    }
    const other = otherClassTeacherMap.get(String(teacherId));
    if (other) {
      const teacherObj = teachers.find(t => String(t.id) === String(teacherId));
      const confirmMove = window.confirm(
        `"${teacherObj?.name || 'This teacher'}" is already assigned as Class Teacher for Class ${other.class_name} (Section ${other.section}).\n\nRule 9: A teacher can be the Class Teacher of only 1 class across the school.\n\nDo you want to reassign them to Class ${selectedClass} (Section ${selectedSection})?`
      );
      if (!confirmMove) return;
    }
    setClassTeacherId(teacherId);

    // Pre-populate quick-assign dropdown if this teacher does not currently teach any subject in this class
    const teachesAny = subjectsList.some(s => {
      const assigned = subjectTeachersState[s.key]?.teacher_ids || [];
      return assigned.map(String).includes(String(teacherId));
    });
    if (!teachesAny && subjectsList.length > 0) {
      const unassignedSub = subjectsList.find(s => (subjectTeachersState[s.key]?.teacher_ids || []).length === 0);
      setQuickAssignSubjectKey(unassignedSub ? unassignedSub.key : subjectsList[0].key);
    }
  };

  const handleQuickAssignClassTeacherToSubject = (subjectKeyToAssign) => {
    const key = subjectKeyToAssign || quickAssignSubjectKey;
    if (!key) {
      toast.error('Please select a subject to assign to the Class Teacher');
      return;
    }
    if (!classTeacherId) {
      toast.error('Please select a Class Teacher first');
      return;
    }
    handleAddTeacherToSubject(key, classTeacherId);
    setQuickAssignSubjectKey('');
    const subObj = subjectsList.find(s => s.key === key);
    toast.success(`Assigned ${assignedClassTeacher?.name || 'Class Teacher'} to ${subObj?.name || 'subject'}`);
  };

  // Check if state is dirty (has unsaved modifications)
  const isDirty = useMemo(() => {
    if (!initialStateHash) return false;
    return JSON.stringify({ subjectTeachers: subjectTeachersState, classTeacherId }) !== initialStateHash;
  }, [subjectTeachersState, classTeacherId, initialStateHash]);

  // Teacher assignment handlers
  const handleAddTeacherToSubject = (subjectKey, teacherId) => {
    if (!teacherId) return;
    setSubjectTeachersState(prev => {
      const current = prev[subjectKey] || { teacher_ids: [] };
      const currentIds = Array.isArray(current.teacher_ids) ? current.teacher_ids : [];
      if (currentIds.includes(teacherId)) return prev;
      return {
        ...prev,
        [subjectKey]: {
          ...current,
          teacher_ids: [...currentIds, teacherId]
        }
      };
    });
    setOpenTeacherPickerKey(null);
    setTeacherSearchQuery('');
  };

  const handleRemoveTeacherFromSubject = (subjectKey, teacherIdToRemove) => {
    setSubjectTeachersState(prev => {
      const current = prev[subjectKey] || { teacher_ids: [] };
      const currentIds = Array.isArray(current.teacher_ids) ? current.teacher_ids : [];
      return {
        ...prev,
        [subjectKey]: {
          ...current,
          teacher_ids: currentIds.filter(id => id !== teacherIdToRemove)
        }
      };
    });
  };

  const handleClearSubjectTeachers = (subjectKey) => {
    setSubjectTeachersState(prev => ({
      ...prev,
      [subjectKey]: { teacher_ids: [] }
    }));
  };

  // Save changes to database via POST /api/assignments
  const handleSaveAssignments = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select both a class and a section');
      return;
    }

    // Validation: Class Teacher must be assigned at least one subject to teach
    if (classTeacherId && subjectsList.length > 0) {
      const hasSubject = subjectsList.some(s => {
        const assignedIds = (subjectTeachersState[s.key]?.teacher_ids || []).filter(Boolean);
        return assignedIds.map(String).includes(String(classTeacherId));
      });

      if (!hasSubject) {
        toast.error(
          `Validation Error: The Class Teacher (${assignedClassTeacher?.name || 'Selected Teacher'}) must get at least one subject to teach in Class ${selectedClass} (${selectedSection}).`,
          { duration: 6000 }
        );
        return;
      }
    }

    try {
      setSaving(true);
      const subject_teachers = subjectsList.map(s => {
        const assignedIds = (subjectTeachersState[s.key]?.teacher_ids || []).filter(Boolean);
        return {
          subject: s.name,
          subject_id: s.subject_id || null,
          teacher_id: assignedIds[0] || null,
          secondary_teacher_id: assignedIds[1] || null,
          teacher_ids: assignedIds
        };
      });

      const payload = {
        class_name: selectedClass,
        section: selectedSection,
        class_teacher_id: classTeacherId || null,
        subject_teachers
      };

      const res = await axios.post(`${API_URL}/assignments`, payload, { headers });
      if (res.status === 200 || res.status === 201) {
        toast.success(`Assignments saved for Class ${selectedClass} (${selectedSection})`);
        
        // Refresh assignments list from server
        const refreshRes = await axios.get(`${API_URL}/assignments`, { headers }).catch(() => null);
        if (refreshRes && Array.isArray(refreshRes.data)) {
          setAssignments(refreshRes.data);
        }
        setInitialStateHash(JSON.stringify({ subjectTeachers: subjectTeachersState, classTeacherId }));
      } else {
        toast.error('Failed to save assignments');
      }
    } catch (err) {
      console.error('Error saving assignments:', err);
      toast.error(err.response?.data?.message || 'Error saving subject teachers');
    } finally {
      setSaving(false);
    }
  };

  // Copy assignments from another section of the same class
  const handleCopyFromSection = (sourceSec) => {
    if (!sourceSec) return;
    const normClass = String(selectedClass).replace(/^Class\s*/i, '').trim().toLowerCase();
    const sourceAssn = (assignments || []).find(a => {
      const aClass = String(a.class_name || '').replace(/^Class\s*/i, '').trim().toLowerCase();
      const aSec = String(a.section || 'A').trim().toLowerCase();
      return aClass === normClass && aSec === sourceSec.toLowerCase().trim();
    });

    if (!sourceAssn || !sourceAssn.subject_teachers || sourceAssn.subject_teachers.length === 0) {
      toast.error(`Section ${sourceSec} has no saved subject teachers to copy`);
      return;
    }

    const nextState = { ...subjectTeachersState };
    subjectsList.forEach(s => {
      const sNameLower = s.name.toLowerCase().trim();
      let matched = sourceAssn.subject_teachers.find(st =>
        st.subject && st.subject.toLowerCase().trim() === sNameLower
      );
      if (!matched && s.partName) {
        matched = sourceAssn.subject_teachers.find(st =>
          st.subject && st.subject.toLowerCase().includes(s.partName.toLowerCase())
        );
      }
      if (matched) {
        const ids = Array.isArray(matched.teacher_ids) && matched.teacher_ids.length > 0
          ? matched.teacher_ids.filter(Boolean)
          : [matched.teacher_id, matched.secondary_teacher_id].filter(Boolean);
        nextState[s.key] = { teacher_ids: ids };
      }
    });

    setSubjectTeachersState(nextState);
    setShowCopyModal(false);
    toast.success(`Copied subject teachers from Section ${sourceSec}! Remember to click Save.`);
  };

  // Filtered subjects for left-hand display
  const filteredSubjects = useMemo(() => {
    return subjectsList.filter(s => {
      const assignedCount = (subjectTeachersState[s.key]?.teacher_ids || []).length;
      if (subjectFilterTab === 'core' && !s.is_core) return false;
      if (subjectFilterTab === 'elective' && s.is_core) return false;
      if (subjectFilterTab === 'assigned' && assignedCount === 0) return false;
      if (subjectFilterTab === 'unassigned' && assignedCount > 0) return false;

      if (searchSubject.trim()) {
        const q = searchSubject.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCode = (s.code || '').toLowerCase().includes(q);
        const matchesCategory = (s.category || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesCategory;
      }
      return true;
    });
  }, [subjectsList, subjectFilterTab, searchSubject, subjectTeachersState]);

  // Statistics
  const stats = useMemo(() => {
    const total = subjectsList.length;
    let assigned = 0;
    const uniqueTeacherIds = new Set();

    subjectsList.forEach(s => {
      const ids = (subjectTeachersState[s.key]?.teacher_ids || []).filter(Boolean);
      if (ids.length > 0) assigned++;
      ids.forEach(id => uniqueTeacherIds.add(id));
    });

    const percent = total > 0 ? Math.round((assigned / total) * 100) : 0;
    return {
      total,
      assigned,
      unassigned: total - assigned,
      uniqueTeachers: uniqueTeacherIds.size,
      percent
    };
  }, [subjectsList, subjectTeachersState]);

  // Scroll to subject when clicked in left list
  const scrollToSubject = (key) => {
    setActiveSubjectKey(key);
    const element = subjectRefs.current[key];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Close teacher picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerDropdownRef.current && !pickerDropdownRef.current.contains(e.target)) {
        setOpenTeacherPickerKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered teachers inside the picker (with Class Teacher prioritized at top)
  const filteredTeachersForPicker = useMemo(() => {
    let list = teachers;
    if (teacherSearchQuery.trim()) {
      const q = teacherSearchQuery.toLowerCase();
      list = teachers.filter(t => 
        (t.name || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.role || '').toLowerCase().includes(q) ||
        (t.job_profile || '').toLowerCase().includes(q)
      );
    }
    if (classTeacherId) {
      return [...list].sort((a, b) => {
        const aIsCT = String(a.id) === String(classTeacherId);
        const bIsCT = String(b.id) === String(classTeacherId);
        if (aIsCT && !bIsCT) return -1;
        if (!aIsCT && bIsCT) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    return list;
  }, [teachers, teacherSearchQuery, classTeacherId]);

  // Helper to get teacher avatar color
  const getAvatarColor = (name = '') => {
    const colors = [
      'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
      'bg-emerald-500', 'bg-purple-500', 'bg-rose-500',
      'bg-amber-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                <FaChalkboardTeacher size={24} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Class Subject Teacher
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  Select a class & section for this school, review class subjects on the left, and assign specialized teachers.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedClass && availableSections.length > 1 && (
              <button
                type="button"
                onClick={() => setShowCopyModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 transition shadow-sm cursor-pointer"
                title="Copy teacher assignments from another section"
              >
                <FaCopy className="text-slate-500" />
                <span>Clone from Section...</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Data"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} size={15} />
            </button>

            <button
              type="button"
              onClick={handleSaveAssignments}
              disabled={saving || !selectedClass || !selectedSection}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition cursor-pointer ${
                isDirty
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-200 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <FaSave size={14} />
              <span>{saving ? 'Saving...' : 'Save Assignments'}</span>
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-300 ring-4 ring-amber-400/40" />
              )}
            </button>
          </div>
        </div>

        {/* School Class & Section Selector Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Class Selector from School Classes */}
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FaLayerGroup className="text-indigo-600" />
                1. Select Class
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {schoolClasses.length} school classes
              </span>
            </label>
            <div className="relative">
              <select
                id="school-class-select"
                value={selectedClass}
                onChange={(e) => handleSelectClass(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition shadow-inner cursor-pointer"
              >
                <option value="">-- Choose Class --</option>
                {schoolClasses.map((cls) => (
                  <option key={cls.id || cls.class_level} value={cls.class_level}>
                    Class {cls.class_level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section Selector */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FaGraduationCap className="text-blue-600" />
                2. Select Section
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {availableSections.length} available
              </span>
            </label>
            <div className="flex items-center gap-2">
              {availableSections.length <= 5 ? (
                <div className="flex items-center gap-2 w-full">
                  {availableSections.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl font-black text-sm border-2 transition cursor-pointer ${
                        selectedSection === sec
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  id="section-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition shadow-inner cursor-pointer"
                >
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Active Context Badge */}
          <div className="md:col-span-3">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                  Configuring For
                </span>
                <span className="text-base font-black text-indigo-950">
                  {selectedClass ? `Class ${selectedClass} - Sec ${selectedSection || 'A'}` : 'Select Class & Sec'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black shadow-sm border border-indigo-100 text-sm">
                {selectedSection || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Class Teacher Assignment Section */}
        {selectedClass && selectedSection && (
          <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/40 to-slate-50 border border-amber-200/90 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                  <FaCrown className="text-xl text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                      Class Teacher
                      <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/80">
                        Class {selectedClass} ({selectedSection})
                      </span>
                    </span>
                    {assignedClassTeacher ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <FaCheckCircle className="text-[10px]" /> Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <FaInfoCircle className="text-[10px]" /> Not Assigned
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 bg-white/90 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                      Rule 9: 1 Teacher per Class Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {assignedClassTeacher ? (
                      <span>
                        <strong>{assignedClassTeacher.name}</strong> is designated as the primary Class Teacher. They receive daily Period 1 and oversee student attendance and reports.
                      </span>
                    ) : (
                      <span>
                        Assign a dedicated Class Teacher who will have the first period everyday and manage class records.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Class Teacher Select Box & Clear Button */}
              <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
                <div className="relative flex-1 lg:w-80">
                  <select
                    id="class-teacher-selector"
                    value={classTeacherId || ''}
                    onChange={(e) => handleSelectClassTeacher(e.target.value)}
                    className="w-full bg-white border-2 border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none transition shadow-xs cursor-pointer"
                  >
                    <option value="">-- Assign Class Teacher --</option>
                    {teachers.map((t) => {
                      const tid = String(t.id);
                      const otherAssn = otherClassTeacherMap.get(tid);
                      const isCurrent = tid === String(classTeacherId);
                      const isAssignedElsewhere = Boolean(otherAssn && !isCurrent);
                      return (
                        <option 
                          key={t.id} 
                          value={t.id}
                          disabled={isAssignedElsewhere}
                          className={isAssignedElsewhere ? 'text-slate-400 bg-slate-50' : ''}
                        >
                          {t.name} ({t.role || 'Teacher'}) {isCurrent ? '👑 [Current Class Teacher]' : ''} {isAssignedElsewhere ? `— [Already CT for Class ${otherAssn.class_name} (${otherAssn.section || 'A'})]` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {classTeacherId && (
                  <button
                    type="button"
                    onClick={() => handleSelectClassTeacher('')}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs transition shrink-0 cursor-pointer shadow-xs"
                    title="Remove Class Teacher"
                  >
                    <FaTrash size={12} />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Class Teacher Subjects Status & Quick Assign */}
            {assignedClassTeacher && (
              <>
                {classTeacherSubjects.length === 0 ? (
                  <div className="mt-4 pt-3.5 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <div>
                        <span className="text-xs font-black text-rose-950 block">
                          Subject Required for Class Teacher
                        </span>
                        <span className="text-[11px] font-medium text-rose-700">
                          <strong>{assignedClassTeacher.name}</strong> must get a subject to teach in Class {selectedClass} ({selectedSection}).
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <select
                        value={quickAssignSubjectKey}
                        onChange={(e) => setQuickAssignSubjectKey(e.target.value)}
                        className="flex-1 sm:flex-initial bg-white border border-rose-300 focus:border-rose-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none shadow-xs"
                      >
                        <option value="">-- Choose Subject to Teach --</option>
                        {subjectsList.map((s) => {
                          const numAssigned = (subjectTeachersState[s.key]?.teacher_ids || []).length;
                          return (
                            <option key={s.key} value={s.key}>
                              {s.name} ({numAssigned === 0 ? 'Unassigned' : `${numAssigned} assigned`})
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleQuickAssignClassTeacherToSubject(quickAssignSubjectKey)}
                        disabled={!quickAssignSubjectKey}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <FaPlus size={10} />
                        <span>Assign Subject</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3.5 border-t border-amber-200/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <FaBookOpen className="text-amber-600" />
                      Teaching ({classTeacherSubjects.length}):
                    </span>
                    {classTeacherSubjects.map((s) => {
                      const assignedIds = subjectTeachersState[s.key]?.teacher_ids || [];
                      const isPrimary = assignedIds[0] === classTeacherId;
                      return (
                        <span
                          key={s.key}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-800 border border-amber-300 shadow-xs"
                        >
                          <span>{s.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${isPrimary ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {isPrimary ? 'Primary' : 'Co-Teacher'}
                          </span>
                          {classTeacherSubjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTeacherFromSubject(s.key, classTeacherId)}
                              className="text-slate-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                              title={`Remove from ${s.name}`}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      );
                    })}
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 ml-auto flex items-center gap-1">
                      <FaCheckCircle size={10} /> Active Subject Assigned
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Unsaved changes alert banner */}
        {isDirty && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm font-semibold animate-fade-in">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-amber-500 shrink-0 text-base" />
              <span>
                You have unsaved teacher assignment changes for <strong>Class {selectedClass} - Section {selectedSection}</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(initialStateHash);
                    setSubjectTeachersState(parsed.subjectTeachers || {});
                    setClassTeacherId(parsed.classTeacherId || '');
                  } catch (e) {}
                }}
                className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 text-xs transition cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={saving}
                className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm transition cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          </div>
        )}

        {/* Quick stats bar */}
        {selectedClass && selectedSection && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Subjects</span>
              <span className="text-xl font-black text-slate-800">{stats.total}</span>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Assigned</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-emerald-700">{stats.assigned}</span>
                <span className="text-xs font-bold text-emerald-600">({stats.percent}%)</span>
              </div>
            </div>
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Needs Teacher</span>
              <span className="text-xl font-black text-amber-700">{stats.unassigned}</span>
            </div>
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Teachers Assigned</span>
              <span className="text-xl font-black text-indigo-800">{stats.uniqueTeachers}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column View */}
      {!selectedClass || !selectedSection ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-2xl mx-auto my-12">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
            <FaChalkboardTeacher size={36} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Select Class & Section to Begin</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Choose a class and section from the options above. The subjects for that class will instantly appear on the left hand side for teacher assignment.
          </p>
          {schoolClasses.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {schoolClasses.slice(0, 8).map((c) => (
                <button
                  key={c.id || c.class_level}
                  type="button"
                  onClick={() => handleSelectClass(c.class_level)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white font-bold text-xs text-slate-700 transition cursor-pointer"
                >
                  Class {c.class_level}
                </button>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs text-center">
                <p className="font-bold mb-2">No classes have been configured for this school yet.</p>
                {onNavigateToClasses && (
                  <button
                    type="button"
                    onClick={onNavigateToClasses}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Configure Classes in Classes & Sections →
                  </button>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        /* Two-column layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT HAND SIDE: Subject List for that Class               */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm sticky top-4 max-h-[calc(100vh-140px)] flex flex-col">
            {/* Header & Filter Controls */}
            <div className="pb-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FaBookOpen className="text-indigo-600" />
                    Subjects List
                  </h3>
                  <span className="text-xs text-slate-500">
                    Class {selectedClass} • {subjectsList.length} total subjects
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Sec {selectedSection}
                </span>
              </div>

              {/* Search box */}
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Filter subjects..."
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
                {searchSubject && (
                  <button
                    type="button"
                    onClick={() => setSearchSubject('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
                {[
                  { id: 'all', label: `All (${subjectsList.length})` },
                  { id: 'core', label: 'Core' },
                  { id: 'elective', label: 'Elective' },
                  { id: 'assigned', label: `Assigned (${stats.assigned})` },
                  { id: 'unassigned', label: `Unassigned (${stats.unassigned})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSubjectFilterTab(tab.id)}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                      subjectFilterTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list of subjects */}
            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 custom-scrollbar">
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400">
                  <FaBookOpen className="text-3xl mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-xs font-semibold">No subjects match the filter</p>
                </div>
              ) : (
                filteredSubjects.map((sub) => {
                  const assignedIds = (subjectTeachersState[sub.key]?.teacher_ids || []).filter(Boolean);
                  const isAssigned = assignedIds.length > 0;
                  const isActive = activeSubjectKey === sub.key;

                  const assignedTeacherNames = assignedIds
                    .map(id => teachers.find(t => t.id === id)?.name)
                    .filter(Boolean);

                  return (
                    <div
                      key={sub.key}
                      onClick={() => scrollToSubject(sub.key)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate tracking-tight">
                            {sub.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {sub.code && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {sub.code}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              sub.is_core ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                              {sub.category}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isAssigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              <FaCheckCircle className="text-emerald-600 text-[10px]" />
                              {assignedIds.length} {assignedIds.length === 1 ? 'Teacher' : 'Teachers'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <FaExclamationTriangle className="text-amber-500 text-[9px]" />
                              Needs Teacher
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display assigned teacher names preview */}
                      {isAssigned && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium truncate">
                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                            {assignedIds.slice(0, 3).map((tId) => {
                              const t = teachers.find(item => item.id === tId);
                              const tName = t?.name || 'T';
                              return (
                                <div
                                  key={tId}
                                  title={tName}
                                  className={`w-5 h-5 rounded-full ${getAvatarColor(tName)} text-white flex items-center justify-center text-[9px] font-black ring-2 ring-white`}
                                >
                                  {tName.charAt(0)}
                                </div>
                              );
                            })}
                          </div>
                          <span className="truncate">
                            {assignedTeacherNames.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom helper */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Click a subject to jump to assignment</span>
              {onNavigateToSubjects && (
                <button
                  type="button"
                  onClick={onNavigateToSubjects}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Edit Subjects →
                </button>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT HAND SIDE: Teacher Assignment Against Every Subject */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Assign Teachers to Class {selectedClass} (Section {selectedSection})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign one primary teacher and optionally one or more co-teachers against each subject.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {stats.assigned} of {stats.total} configured
                </span>
              </div>
            </div>

            {/* Subject Assignment Cards */}
            {filteredSubjects.map((sub, index) => {
              const assignedIds = (subjectTeachersState[sub.key]?.teacher_ids || []).filter(Boolean);
              const isPickerOpen = openTeacherPickerKey === sub.key;

              return (
                <div
                  key={sub.key}
                  ref={(el) => (subjectRefs.current[sub.key] = el)}
                  className={`bg-white rounded-3xl p-5 border transition-all duration-200 ${
                    activeSubjectKey === sub.key
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md'
                      : 'border-slate-200/80 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {/* Subject Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">
                            {sub.name}
                          </h4>
                          {sub.code && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {sub.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>{sub.category} Subject</span>
                          <span>•</span>
                          <span>Marking: {sub.marking_system}</span>
                          {sub.is_divided_part && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">Divided Component</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick clear button */}
                    {assignedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearSubjectTeachers(sub.key)}
                        className="text-xs text-slate-400 hover:text-red-500 font-semibold transition cursor-pointer"
                        title="Unassign all teachers for this subject"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Assigned Teachers List */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Assigned Teachers ({assignedIds.length})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {assignedIds.length === 0
                          ? 'No teacher assigned'
                          : assignedIds.length === 1
                          ? '1 Teacher assigned'
                          : `${assignedIds.length} Teachers assigned (Primary + Co-Teachers)`}
                      </span>
                    </div>

                    {/* Teacher Cards Container */}
                    <div className="space-y-2">
                      {assignedIds.map((tId, tIdx) => {
                        const teacher = teachers.find((t) => t.id === tId);
                        const isPrimary = tIdx === 0;
                        const teacherName = teacher?.name || 'Unknown Teacher';
                        const load = teacherWorkloadMap[tId] || 0;

                        return (
                          <div
                            key={tId}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              isPrimary
                                ? 'bg-gradient-to-r from-indigo-50/70 to-blue-50/50 border-indigo-200 shadow-sm'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl ${getAvatarColor(teacherName)} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}
                              >
                                {teacherName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900 truncate">
                                    {teacherName}
                                  </span>
                                  {isPrimary ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                                      <FaCrown className="text-amber-300 text-[9px]" /> Primary
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                      Co-Teacher {tIdx}
                                    </span>
                                  )}
                                  {String(tId) === String(classTeacherId) && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                                      <FaCrown className="text-amber-600 text-[9px]" /> Class Teacher
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                                  <span>{teacher?.role || 'Staff'}</span>
                                  {teacher?.email && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">{teacher.email}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="text-slate-400">Total Load: {load} classes</span>
                                </div>
                              </div>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeacherFromSubject(sub.key, tId)}
                              className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
                              title="Remove teacher from this subject"
                            >
                              <FaTimes size={13} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Empty prompt if 0 teachers */}
                      {assignedIds.length === 0 && (
                        <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center">
                          <p className="text-xs font-medium text-slate-500 mb-2">
                            No teacher assigned to this subject yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add Teacher Button & Dropdown Picker */}
                    <div className="mt-3 relative" ref={isPickerOpen ? pickerDropdownRef : null}>
                      {!isPickerOpen ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenTeacherPickerKey(sub.key);
                              setTeacherSearchQuery('');
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs transition cursor-pointer shadow-xs"
                          >
                            <FaUserPlus size={12} />
                            <span>{assignedIds.length === 0 ? 'Assign Teacher' : '+ Add Co-Teacher'}</span>
                          </button>

                          {/* 1-Click Quick Assign Class Teacher */}
                          {classTeacherId && !assignedIds.includes(classTeacherId) && (
                            <button
                              type="button"
                              onClick={() => handleAddTeacherToSubject(sub.key, classTeacherId)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer shadow-xs"
                              title={`Assign Class Teacher (${assignedClassTeacher?.name}) to teach ${sub.name}`}
                            >
                              <FaCrown className="text-amber-600 text-xs" />
                              <span>+ Class Teacher</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-2xl border border-indigo-300 shadow-xl z-30 animate-fade-in space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <FaUserTie className="text-indigo-600" />
                              Select Teacher for {sub.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setOpenTeacherPickerKey(null)}
                              className="text-slate-400 hover:text-slate-600 text-xs p-1"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Search teacher */}
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search by teacher name or email..."
                              value={teacherSearchQuery}
                              onChange={(e) => setTeacherSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition"
                            />
                          </div>

                          {/* 1-Click Class Teacher Shortcut inside picker */}
                          {classTeacherId && !assignedIds.includes(classTeacherId) && (
                            <button
                              type="button"
                              onClick={() => handleAddTeacherToSubject(sub.key, classTeacherId)}
                              className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-300 text-amber-950 font-bold text-xs hover:from-amber-100 hover:to-amber-200 transition cursor-pointer shadow-xs"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <FaCrown className="text-amber-600 shrink-0" />
                                <span className="truncate">Assign Class Teacher ({assignedClassTeacher?.name})</span>
                              </span>
                              <span className="text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md font-black shrink-0">
                                + Quick Add
                              </span>
                            </button>
                          )}

                          {/* Teachers List */}
                          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                            {filteredTeachersForPicker.length === 0 ? (
                              <div className="text-center py-4 text-xs text-slate-400">
                                No teachers found matching &quot;{teacherSearchQuery}&quot;
                              </div>
                            ) : (
                              filteredTeachersForPicker.map((t) => {
                                const isAlreadyAssigned = assignedIds.includes(t.id);
                                const isCT = String(t.id) === String(classTeacherId);
                                const load = teacherWorkloadMap[t.id] || 0;

                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    disabled={isAlreadyAssigned}
                                    onClick={() => handleAddTeacherToSubject(sub.key, t.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                                      isAlreadyAssigned
                                        ? 'bg-slate-100 opacity-50 cursor-not-allowed'
                                        : isCT
                                        ? 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 font-medium border border-amber-200'
                                        : 'hover:bg-indigo-50 text-slate-700 hover:text-indigo-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-6 h-6 rounded-lg ${getAvatarColor(t.name)} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
                                      >
                                        {t.name ? t.name.charAt(0) : 'T'}
                                      </div>
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold truncate">{t.name}</span>
                                          {isCT && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                                              <FaCrown className="text-amber-600 text-[8px]" /> Class Teacher
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          {t.role || 'Teacher'} {t.email ? `• ${t.email}` : ''}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-2">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                                        {load} classes
                                      </span>
                                      {isAlreadyAssigned ? (
                                        <span className="text-[10px] font-bold text-slate-400">Selected</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-indigo-600 hover:underline">
                                          + Assign
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clone / Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FaCopy />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Copy Teacher Assignments
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Copy teacher assignments from another section of <strong>Class {selectedClass}</strong> directly into <strong>Section {selectedSection}</strong>. This avoids repeating teacher selections.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Source Section to Copy From:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableSections
                  .filter((sec) => sec !== selectedSection)
                  .map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setCopySourceSection(sec)}
                      className={`p-3 rounded-2xl border-2 font-black text-sm text-center transition cursor-pointer ${
                        copySourceSection === sec
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      Section {sec}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!copySourceSection}
                onClick={() => handleCopyFromSection(copySourceSection)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Copy to Section {selectedSection}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSubjectTeacher;
