import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaLayerGroup, 
  FaPlus, 
  FaFileImport, 
  FaEdit, 
  FaTrashAlt, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaTimes, 
  FaSpinner, 
  FaSyncAlt,
  FaCheck,
  FaUsers,
  FaUserTie
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { sortClasses } from '../utils/classOrder';

const ManageSchoolClasses = ({ API_URL }) => {
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [globalClasses, setGlobalClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Import modal state
  // { [className]: { selected: boolean, alreadyImported: boolean, availableSections: [], selectedSections: [], medium: 'English', capacity: 40, sectionTeachers: { [sec]: teacherId } } }
  const [selectedGlobalClasses, setSelectedGlobalClasses] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schoolRes, globalRes, staffRes] = await Promise.all([
        fetch(`${API_URL}/classes/school`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/classes/global`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/staff/admin/all-staff`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      if (schoolRes.ok) {
        const data = await schoolRes.json();
        setSchoolClasses(sortClasses(data || [], c => c.class_level));
      }
      if (globalRes.ok) {
        const data = await globalRes.json();
        setGlobalClasses(sortClasses(data || [], c => c.name));
      }
      if (staffRes && staffRes.ok) {
        const staffData = await staffRes.json();
        const sortedStaff = (staffData || [])
          .filter(s => s && s.id)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setTeachers(sortedStaff);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      toast.error('Failed to load class configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  // Map of teacherId -> { class_level, section, teacher_name } for already saved classes in the school
  const assignedTeachersMap = useMemo(() => {
    const map = new Map();
    (schoolClasses || []).forEach(cls => {
      const secData = cls.sections_data || [];
      secData.forEach(sec => {
        if (sec.class_teacher_id) {
          map.set(String(sec.class_teacher_id), {
            class_level: cls.class_level,
            section: sec.name,
            teacher_name: sec.class_teacher_name
          });
        }
      });
    });
    return map;
  }, [schoolClasses]);

  // Map of teacherId -> { class_level, section } currently selected inside the import modal across all selected classes
  const modalSelectedTeachersMap = useMemo(() => {
    const map = new Map();
    Object.entries(selectedGlobalClasses).forEach(([clsName, val]) => {
      if (val.selected && !val.alreadyImported && val.sectionTeachers) {
        (val.selectedSections || []).forEach(sec => {
          const tId = val.sectionTeachers[sec];
          if (tId) {
            map.set(String(tId), {
              class_level: clsName,
              section: sec
            });
          }
        });
      }
    });
    return map;
  }, [selectedGlobalClasses]);

  // Open import modal and initialize selection state
  const handleOpenImportModal = () => {
    const initialSelection = {};
    const importedNames = new Set(schoolClasses.map(c => c.class_level));

    globalClasses.forEach(gc => {
      const isImported = importedNames.has(gc.name);
      const rawSections = Array.isArray(gc.sections) 
        ? gc.sections 
        : (gc.sections ? String(gc.sections).split(',').map(s => s.trim()) : ['A', 'B', 'C']);

      initialSelection[gc.name] = {
        selected: false,
        alreadyImported: isImported,
        availableSections: rawSections,
        selectedSections: [...rawSections],
        sectionTeachers: {}, // { [sectionName]: teacherId }
        medium: 'English',
        capacity: 40
      };
    });

    setSelectedGlobalClasses(initialSelection);
    setImportModalOpen(true);
  };

  const toggleSelectClass = (className) => {
    setSelectedGlobalClasses(prev => ({
      ...prev,
      [className]: {
        ...prev[className],
        selected: !prev[className]?.selected
      }
    }));
  };

  const toggleSectionForClass = (className, section) => {
    setSelectedGlobalClasses(prev => {
      const cls = prev[className];
      if (!cls) return prev;
      const exists = cls.selectedSections.includes(section);
      const updated = exists 
        ? cls.selectedSections.filter(s => s !== section)
        : [...cls.selectedSections, section];
      
      const updatedTeachers = { ...(cls.sectionTeachers || {}) };
      if (exists && updatedTeachers[section]) {
        delete updatedTeachers[section];
      }

      return {
        ...prev,
        [className]: {
          ...cls,
          selectedSections: updated,
          sectionTeachers: updatedTeachers
        }
      };
    });
  };

  const handleSetImportSectionTeacher = (className, section, teacherId) => {
    setSelectedGlobalClasses(prev => {
      const cls = prev[className];
      if (!cls) return prev;
      return {
        ...prev,
        [className]: {
          ...cls,
          sectionTeachers: {
            ...(cls.sectionTeachers || {}),
            [section]: teacherId || ''
          }
        }
      };
    });
  };

  const handleSelectAllAvailable = (select = true) => {
    setSelectedGlobalClasses(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (!next[key].alreadyImported) {
          next[key].selected = select;
        }
      });
      return next;
    });
  };

  const handleExecuteImport = async () => {
    const toImport = Object.entries(selectedGlobalClasses)
      .filter(([_, val]) => val.selected && !val.alreadyImported)
      .map(([className, val]) => {
        const activeSecs = val.selectedSections.length > 0 ? val.selectedSections : ['A'];
        return {
          class_level: className,
          medium: val.medium || 'English',
          sections: activeSecs,
          sections_data: activeSecs.map(s => {
            const tId = val.sectionTeachers?.[s] || null;
            const tObj = teachers.find(t => String(t.id) === String(tId));
            return {
              name: s,
              capacity: parseInt(val.capacity, 10) || 40,
              class_teacher_id: tId || null,
              class_teacher_name: tObj ? tObj.name : null
            };
          })
        };
      });

    if (toImport.length === 0) {
      toast.error('Please select at least one class to import');
      return;
    }

    // Duplicate Teacher Check across the import payload & existing classes
    const seenTeachersInImport = new Map();
    for (const cls of toImport) {
      for (const sec of cls.sections_data) {
        if (sec.class_teacher_id) {
          const tId = String(sec.class_teacher_id);
          // 1. Check duplicate inside this import batch
          if (seenTeachersInImport.has(tId)) {
            const prev = seenTeachersInImport.get(tId);
            const tName = sec.class_teacher_name || teachers.find(t => String(t.id) === tId)?.name || 'This teacher';
            toast.error(`Duplicate Class Teacher: ${tName} cannot be assigned to both ${prev.class_level} Sec ${prev.section} and ${cls.class_level} Sec ${sec.name}. One teacher can be class teacher for one class only.`);
            return;
          }
          seenTeachersInImport.set(tId, { class_level: cls.class_level, section: sec.name });

          // 2. Check against already configured classes
          const already = assignedTeachersMap.get(tId);
          if (already) {
            const tName = sec.class_teacher_name || teachers.find(t => String(t.id) === tId)?.name || 'This teacher';
            toast.error(`Conflict: ${tName} is already assigned as Class Teacher for ${already.class_level} Sec ${already.section}. One teacher can be class teacher for one class only.`);
            return;
          }
        }
      }
    }

    try {
      setIsImporting(true);
      const res = await fetch(`${API_URL}/classes/school/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ classes: toImport })
      });

      if (res.ok) {
        toast.success(`Successfully imported ${toImport.length} classes!`);
        setImportModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to import classes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error communicating with server');
    } finally {
      setIsImporting(false);
    }
  };

  // Edit class handler
  const handleOpenEdit = (cls) => {
    let sectionsData = cls.sections_data;
    if (!sectionsData || !Array.isArray(sectionsData) || sectionsData.length === 0) {
      const rawSecs = cls.sections ? cls.sections.split(',').map(s => s.trim()).filter(Boolean) : ['A'];
      sectionsData = rawSecs.map(s => ({ name: s, capacity: 40, class_teacher_id: null, class_teacher_name: null }));
    } else {
      sectionsData = sectionsData.map(s => {
        const tObj = s.class_teacher_id ? teachers.find(t => String(t.id) === String(s.class_teacher_id)) : null;
        return {
          name: s.name,
          capacity: s.capacity || 40,
          class_teacher_id: s.class_teacher_id || null,
          class_teacher_name: s.class_teacher_name || tObj?.name || null
        };
      });
    }

    setEditingClass({
      ...cls,
      medium: cls.medium || 'English',
      has_semester: cls.has_semester || false,
      sections_data: sectionsData,
      newSectionName: '',
      newSectionCap: 40,
      newSectionTeacherId: ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingClass) return;

    if (!editingClass.sections_data || editingClass.sections_data.length === 0) {
      toast.error('Class must have at least one section');
      return;
    }

    // 1. Validate no duplicate class teachers within this class's sections
    const seenLocal = new Map();
    for (const sec of editingClass.sections_data) {
      if (sec.class_teacher_id) {
        const tId = String(sec.class_teacher_id);
        if (seenLocal.has(tId)) {
          const prevSec = seenLocal.get(tId);
          const tName = sec.class_teacher_name || teachers.find(t => String(t.id) === tId)?.name || 'This teacher';
          toast.error(`Duplicate Class Teacher: ${tName} cannot be assigned to multiple sections (Section ${prevSec} and Section ${sec.name}). One teacher can be class teacher for one class only.`);
          return;
        }
        seenLocal.set(tId, sec.name);

        // 2. Validate against other classes in school
        const inOtherCls = assignedTeachersMap.get(tId);
        if (inOtherCls && String(inOtherCls.class_level).trim().toLowerCase() !== String(editingClass.class_level).trim().toLowerCase()) {
          const tName = sec.class_teacher_name || teachers.find(t => String(t.id) === tId)?.name || 'This teacher';
          toast.error(`Conflict: ${tName} is already assigned as Class Teacher for Class ${inOtherCls.class_level} Sec ${inOtherCls.section}. One teacher can be class teacher for one class only.`);
          return;
        }
      }
    }

    const sectionsList = editingClass.sections_data.map(s => s.name);

    try {
      setIsSavingEdit(true);
      const res = await fetch(`${API_URL}/classes/school/${encodeURIComponent(editingClass.class_level)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medium: editingClass.medium,
          has_semester: editingClass.has_semester,
          sections: sectionsList,
          sections_data: editingClass.sections_data
        })
      });

      if (res.ok) {
        toast.success(`Class ${editingClass.class_level} updated!`);
        setEditModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to update class');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving class');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteSchoolClass = async (className) => {
    if (!window.confirm(`Are you sure you want to remove ${className} from your school? Note: This will not delete historical student data, but will remove it from active lists and unassign its class teacher.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/classes/school/${encodeURIComponent(className)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`Class ${className} removed successfully.`);
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to remove class');
      }
    } catch (err) {
      toast.error('Error removing class');
    }
  };

  const handleAddSectionToEdit = () => {
    const name = editingClass.newSectionName?.trim()?.toUpperCase();
    if (!name) {
      toast.error('Please enter a section name (e.g. D)');
      return;
    }
    if (editingClass.sections_data.some(s => s.name === name)) {
      toast.error('Section already exists');
      return;
    }
    const cap = parseInt(editingClass.newSectionCap, 10) || 40;
    const tId = editingClass.newSectionTeacherId || null;
    const tObj = tId ? teachers.find(t => String(t.id) === String(tId)) : null;

    if (tId) {
      const inOtherSec = editingClass.sections_data.find(s => String(s.class_teacher_id) === String(tId));
      if (inOtherSec) {
        toast.error(`Teacher is already assigned to Section ${inOtherSec.name} in this class.`);
        return;
      }
      const inOtherCls = assignedTeachersMap.get(String(tId));
      if (inOtherCls && String(inOtherCls.class_level).trim().toLowerCase() !== String(editingClass.class_level).trim().toLowerCase()) {
        toast.error(`Teacher is already assigned as Class Teacher for ${inOtherCls.class_level} Sec ${inOtherCls.section}.`);
        return;
      }
    }

    setEditingClass({
      ...editingClass,
      sections_data: [
        ...editingClass.sections_data,
        {
          name,
          capacity: cap,
          class_teacher_id: tId,
          class_teacher_name: tObj ? tObj.name : null
        }
      ],
      newSectionName: '',
      newSectionCap: 40,
      newSectionTeacherId: ''
    });
  };

  const handleRemoveSectionFromEdit = (secName) => {
    if (editingClass.sections_data.length <= 1) {
      toast.error('A class must have at least one section');
      return;
    }
    setEditingClass({
      ...editingClass,
      sections_data: editingClass.sections_data.filter(s => s.name !== secName)
    });
  };

  const totalSectionsCount = schoolClasses.reduce((acc, c) => {
    const secs = c.sections_data?.length || (c.sections ? c.sections.split(',').length : 0);
    return acc + secs;
  }, 0);

  const totalAssignedClassTeachers = schoolClasses.reduce((acc, c) => {
    const secs = c.sections_data || [];
    return acc + secs.filter(s => s.class_teacher_id).length;
  }, 0);

  const importedClassNames = new Set(schoolClasses.map(c => c.class_level));
  const availableToImportCount = globalClasses.filter(g => !importedClassNames.has(g.name)).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <FaLayerGroup className="text-primary" />
            Classes & Sections Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Import official classes from the SuperAdmin master list, configure sections and capacities, and assign dedicated Class Teachers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            title="Refresh"
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={handleOpenImportModal}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition"
          >
            <FaFileImport />
            Import from Master List
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black">
            {schoolClasses.length}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Classes</div>
            <div className="text-lg font-black text-gray-800">{schoolClasses.length} Classes Configured</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-black">
            {totalSectionsCount}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Sections</div>
            <div className="text-lg font-black text-gray-800">{totalSectionsCount} Total Sections</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black">
            <FaUserTie />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Teachers</div>
            <div className="text-lg font-black text-gray-800">{totalAssignedClassTeachers} / {totalSectionsCount} Assigned</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black">
            {availableToImportCount}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available in Master</div>
            <div className="text-lg font-black text-gray-800">{availableToImportCount} Ready to Import</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-base">Your School's Active Classes</h3>
          <span className="text-xs font-semibold text-gray-500">
            Showing {schoolClasses.length} configured classes
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <FaSpinner className="animate-spin text-2xl text-primary" />
            <span>Loading school classes...</span>
          </div>
        ) : schoolClasses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaLayerGroup />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-1">No classes imported yet</h4>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Your school has not imported any classes yet. Click below to view the SuperAdmin's master list and choose the classes your school offers.
            </p>
            <button 
              onClick={handleOpenImportModal}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 inline-flex items-center gap-2 transition"
            >
              <FaFileImport />
              Import Classes Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Class Level</th>
                  <th className="p-4">Medium</th>
                  <th className="p-4">Active Sections & Class Teachers</th>
                  <th className="p-4">Format</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schoolClasses.map((cls, idx) => {
                  const sectionsList = cls.sections_data && cls.sections_data.length > 0 
                    ? cls.sections_data 
                    : (cls.sections ? cls.sections.split(',').map(s => ({ name: s.trim(), capacity: 40, class_teacher_id: null, class_teacher_name: null })) : [{ name: 'A', capacity: 40, class_teacher_id: null, class_teacher_name: null }]);

                  return (
                    <tr key={cls.id || idx} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 text-sm font-semibold text-gray-400 text-center">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-base">{cls.class_level}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-medium">
                        {cls.medium || 'English'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {sectionsList.map((sec, sIdx) => {
                            const teacherName = sec.class_teacher_name || teachers.find(t => String(t.id) === String(sec.class_teacher_id))?.name;
                            return (
                              <div 
                                key={sIdx} 
                                className="inline-flex flex-col bg-white border border-gray-200 rounded-xl p-2 shadow-xs min-w-[130px] hover:border-primary/40 transition"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="bg-blue-50 text-blue-700 font-black text-xs px-2 py-0.5 rounded-md border border-blue-100">
                                    Section {sec.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {sec.capacity || 40} cap
                                  </span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                                  {teacherName ? (
                                    <span 
                                      className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 truncate max-w-[160px]" 
                                      title={`Class Teacher: ${teacherName}`}
                                    >
                                      <FaUserTie className="text-[10px] text-emerald-600 flex-shrink-0" />
                                      <span className="truncate">{teacherName}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-gray-400 text-[10px] italic">
                                      <FaUserTie className="text-[9px] text-gray-300 flex-shrink-0" />
                                      No CT assigned
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls.has_semester ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {cls.has_semester ? 'Semester' : 'Annual'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <FaCheckCircle className="text-[10px]" /> Active
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(cls)}
                            title="Edit Sections & Class Teachers"
                            className="p-2.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl transition flex items-center gap-1.5 font-bold text-xs"
                          >
                            <FaEdit size={14} />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteSchoolClass(cls.class_level)}
                            title="Remove Class from School"
                            className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition"
                          >
                            <FaTrashAlt size={14} />
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

      {/* IMPORT FROM MASTER LIST MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <FaFileImport className="text-primary" />
                  Import Classes from Master List
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Select which classes and sections your school operates and optionally assign dedicated Class Teachers.
                </p>
              </div>
              <button 
                onClick={() => setImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-700">
                {Object.values(selectedGlobalClasses).filter(v => v.selected && !v.alreadyImported).length} classes selected for import
              </span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => handleSelectAllAvailable(true)}
                  className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-bold text-gray-700 transition"
                >
                  Select All Available
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSelectAllAvailable(false)}
                  className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-bold text-gray-700 transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {globalClasses.map((gc) => {
                const state = selectedGlobalClasses[gc.name] || {};
                const isImported = state.alreadyImported;

                return (
                  <div 
                    key={gc.id} 
                    className={`p-4 rounded-2xl border transition ${
                      isImported 
                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                        : state.selected 
                          ? 'bg-purple-50/40 border-primary ring-1 ring-primary' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id={`chk-${gc.id}`}
                          disabled={isImported}
                          checked={isImported || state.selected}
                          onChange={() => toggleSelectClass(gc.name)}
                          className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label 
                          htmlFor={`chk-${gc.id}`} 
                          className={`font-black text-base cursor-pointer ${isImported ? 'text-gray-400' : 'text-gray-800'}`}
                        >
                          {gc.name}
                        </label>
                      </div>

                      {isImported ? (
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                          Already Imported
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 font-semibold">
                          Available in Master List
                        </span>
                      )}
                    </div>

                    {/* Section Selector & Configuration for this class if selected */}
                    {state.selected && !isImported && (
                      <div className="mt-4 pt-3 border-t border-purple-100 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-gray-700 mb-1.5">Select Sections to Enable:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {state.availableSections.map(sec => {
                                const isChecked = state.selectedSections.includes(sec);
                                return (
                                  <button 
                                    key={sec}
                                    type="button"
                                    onClick={() => toggleSectionForClass(gc.name, sec)}
                                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                                      isChecked 
                                        ? 'bg-primary text-white shadow-sm' 
                                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {isChecked && <FaCheck size={10} />}
                                    Section {sec}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">Medium</label>
                              <select 
                                value={state.medium}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedGlobalClasses(prev => ({
                                    ...prev,
                                    [gc.name]: { ...prev[gc.name], medium: val }
                                  }));
                                }}
                                className="p-1.5 border rounded-lg bg-white text-xs font-medium"
                              >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Bengali">Bengali</option>
                                <option value="Regional">Regional</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">Capacity/Sec</label>
                              <input 
                                type="number" 
                                min="1"
                                max="200"
                                value={state.capacity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedGlobalClasses(prev => ({
                                    ...prev,
                                    [gc.name]: { ...prev[gc.name], capacity: val }
                                  }));
                                }}
                                className="w-16 p-1.5 border rounded-lg bg-white text-xs text-center font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Assign Class Teachers per section */}
                        {state.selectedSections.length > 0 && (
                          <div className="pt-2 border-t border-purple-100">
                            <div className="font-bold text-gray-700 text-xs mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <FaUserTie className="text-primary text-xs" />
                                <span>Assign Class Teachers <span className="text-gray-400 font-normal">(1 teacher per class only)</span>:</span>
                              </span>
                              <span className="text-[11px] text-gray-400 font-normal">Optional</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {state.selectedSections.map(sec => {
                                const currentTeacherId = state.sectionTeachers?.[sec] || '';
                                return (
                                  <div key={sec} className="bg-white p-2.5 rounded-xl border border-purple-200/70 shadow-xs flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center">
                                          {sec}
                                        </span>
                                        <span>Section {sec} Teacher</span>
                                      </span>
                                      {currentTeacherId && (
                                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                          <FaCheckCircle className="text-[9px]" /> Selected
                                        </span>
                                      )}
                                    </div>

                                    <select
                                      value={currentTeacherId}
                                      onChange={(e) => handleSetImportSectionTeacher(gc.name, sec, e.target.value)}
                                      className="w-full p-1.5 border border-gray-200 rounded-lg bg-gray-50/70 text-xs text-gray-800 font-medium focus:bg-white focus:border-primary outline-none"
                                    >
                                      <option value="">-- No Class Teacher --</option>
                                      {teachers.map(t => {
                                        const tid = String(t.id);
                                        const isCurrent = tid === String(currentTeacherId);
                                        const assignedAlready = assignedTeachersMap.get(tid);
                                        const selectedInModal = modalSelectedTeachersMap.get(tid);

                                        let disabled = false;
                                        let suffix = '';

                                        if (!isCurrent) {
                                          if (assignedAlready) {
                                            disabled = true;
                                            suffix = ` (Assigned: ${assignedAlready.class_level} Sec ${assignedAlready.section})`;
                                          } else if (selectedInModal) {
                                            disabled = true;
                                            suffix = ` (Selected: ${selectedInModal.class_level} Sec ${selectedInModal.section})`;
                                          }
                                        }

                                        return (
                                          <option key={t.id} value={t.id} disabled={disabled}>
                                            {t.name}{suffix}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setImportModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition text-sm"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50 text-sm"
              >
                {isImporting ? <FaSpinner className="animate-spin" /> : <FaFileImport />}
                {isImporting ? 'Importing...' : 'Import Selected Classes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CLASS & SECTIONS MODAL */}
      {editModalOpen && editingClass && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <FaEdit className="text-primary" />
                  Configure Class {editingClass.class_level}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Update class medium, academic format, active sections, capacity, and assign dedicated Class Teachers.
                </p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Medium of Instruction</label>
                  <input 
                    type="text" 
                    value={editingClass.medium}
                    onChange={e => setEditingClass({ ...editingClass, medium: e.target.value })}
                    placeholder="e.g. English"
                    className="w-full p-2.5 border rounded-xl text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Academic Format</label>
                  <select 
                    value={editingClass.has_semester ? 'true' : 'false'}
                    onChange={e => setEditingClass({ ...editingClass, has_semester: e.target.value === 'true' })}
                    className="w-full p-2.5 border rounded-xl text-sm bg-white font-medium"
                  >
                    <option value="false">Annual (Yearly)</option>
                    <option value="true">Semester Based</option>
                  </select>
                </div>
              </div>

              {/* Sections & Class Teachers Manager */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Active Sections & Class Teachers:</span>
                  <span className="text-[11px] text-gray-400 font-normal">Each teacher can lead 1 class/section only</span>
                </label>

                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                  {editingClass.sections_data.map((sec, i) => (
                    <div key={i} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            {sec.name}
                          </span>
                          <span className="font-black text-gray-800 text-sm">Section {sec.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 font-semibold">Max Capacity:</span>
                            <input 
                              type="number" 
                              min="1"
                              max="250"
                              value={sec.capacity}
                              onChange={(e) => {
                                const newCap = parseInt(e.target.value, 10) || 40;
                                const updated = [...editingClass.sections_data];
                                updated[i].capacity = newCap;
                                setEditingClass({ ...editingClass, sections_data: updated });
                              }}
                              className="w-16 p-1 border rounded-lg text-xs text-center font-bold bg-white"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSectionFromEdit(sec.name)}
                            className="text-red-400 hover:text-red-600 p-1.5 transition rounded-lg hover:bg-red-50"
                            title="Remove section"
                          >
                            <FaTrashAlt size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Class Teacher Field */}
                      <div className="pt-2 border-t border-gray-200/80">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FaUserTie className="text-primary text-xs" />
                            Class Teacher:
                          </span>
                          {sec.class_teacher_id && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FaCheckCircle className="text-[10px]" /> Assigned
                            </span>
                          )}
                        </label>
                        <select
                          value={sec.class_teacher_id || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selectedTeacher = teachers.find(t => String(t.id) === String(val));
                            const updated = [...editingClass.sections_data];
                            updated[i] = {
                              ...updated[i],
                              class_teacher_id: val || null,
                              class_teacher_name: selectedTeacher ? selectedTeacher.name : null
                            };
                            setEditingClass({ ...editingClass, sections_data: updated });
                          }}
                          className="w-full p-2 border rounded-xl bg-white text-xs text-gray-800 font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="">-- No Class Teacher Assigned --</option>
                          {teachers.map(t => {
                            const tid = String(t.id);
                            const isCurrentForThisSection = tid === String(sec.class_teacher_id);
                            
                            // Check if assigned in another section of editingClass
                            const assignedInOtherSectionOfThisClass = editingClass.sections_data.find(
                              (otherSec, oIdx) => oIdx !== i && String(otherSec.class_teacher_id) === tid
                            );
                            
                            // Check if assigned in another class altogether (from schoolClasses)
                            const assignedInOtherClass = assignedTeachersMap.get(tid);
                            const isAssignedToDifferentClass = assignedInOtherClass && 
                              String(assignedInOtherClass.class_level).trim().toLowerCase() !== String(editingClass.class_level).trim().toLowerCase();

                            let disabled = false;
                            let suffix = '';

                            if (!isCurrentForThisSection) {
                              if (assignedInOtherSectionOfThisClass) {
                                disabled = true;
                                suffix = ` (Assigned to Section ${assignedInOtherSectionOfThisClass.name})`;
                              } else if (isAssignedToDifferentClass) {
                                disabled = true;
                                suffix = ` (Assigned: Class ${assignedInOtherClass.class_level} Sec ${assignedInOtherClass.section})`;
                              }
                            }

                            return (
                              <option key={t.id} value={t.id} disabled={disabled}>
                                {t.name}{suffix}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new section card */}
                <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <FaPlus size={11} /> Add New Section
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      placeholder="Sec Name (e.g. D)"
                      value={editingClass.newSectionName}
                      onChange={e => setEditingClass({ ...editingClass, newSectionName: e.target.value })}
                      className="p-2 border rounded-xl text-xs bg-white uppercase font-bold outline-none focus:border-primary"
                    />
                    <input 
                      type="number" 
                      placeholder="Capacity (e.g. 40)"
                      value={editingClass.newSectionCap}
                      onChange={e => setEditingClass({ ...editingClass, newSectionCap: e.target.value })}
                      className="p-2 border rounded-xl text-xs bg-white text-center font-bold outline-none focus:border-primary"
                    />
                    <select
                      value={editingClass.newSectionTeacherId || ''}
                      onChange={e => setEditingClass({ ...editingClass, newSectionTeacherId: e.target.value })}
                      className="p-2 border rounded-xl text-xs bg-white font-medium outline-none focus:border-primary"
                    >
                      <option value="">-- Class Teacher (Optional) --</option>
                      {teachers.map(t => {
                        const tid = String(t.id);
                        const assignedInClass = editingClass.sections_data.find(s => String(s.class_teacher_id) === tid);
                        const assignedInOtherClass = assignedTeachersMap.get(tid);
                        const isDiffClass = assignedInOtherClass && 
                          String(assignedInOtherClass.class_level).trim().toLowerCase() !== String(editingClass.class_level).trim().toLowerCase();

                        let disabled = false;
                        let suffix = '';
                        if (assignedInClass) {
                          disabled = true;
                          suffix = ` (Sec ${assignedInClass.name})`;
                        } else if (isDiffClass) {
                          disabled = true;
                          suffix = ` (${assignedInOtherClass.class_level}-${assignedInOtherClass.section})`;
                        }

                        return (
                          <option key={t.id} value={t.id} disabled={disabled}>
                            {t.name}{suffix}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={handleAddSectionToEdit}
                      className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FaPlus size={10} /> Add Section
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSavingEdit}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50 text-sm"
                >
                  {isSavingEdit ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  {isSavingEdit ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchoolClasses;
