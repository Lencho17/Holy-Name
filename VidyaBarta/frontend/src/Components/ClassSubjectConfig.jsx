import React, { useState, useEffect } from 'react';
import { FiEdit2, FiPlus, FiX } from 'react-icons/fi';

const CATEGORIES = ['MIL', 'Elective', 'Minor', 'Grading Sets'];

const SubjectConfigRow = ({ subjectItem, globalSubjects, onChange, onRemove }) => {
  return (
    <div className="bg-white rounded border border-gray-200 p-2 mb-2">
      <div className="flex items-center gap-2">
        <select 
          className="flex-1 border-none focus:ring-0 text-sm p-1"
          value={subjectItem.subject_id || subjectItem.id || ''}
          onChange={(e) => {
            const name = globalSubjects.find(s => s.id === e.target.value)?.name;
            onChange({ ...subjectItem, subject_id: e.target.value, name });
          }}
        >
          <option value="">Select Subject</option>
          {globalSubjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name} - {sub.marking_system}</option>
          ))}
        </select>
        
        <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded cursor-pointer">
          <input 
            type="checkbox" 
            checked={subjectItem.is_divided || false} 
            onChange={e => onChange({ ...subjectItem, is_divided: e.target.checked })} 
          /> Divide
        </label>
        
        <button onClick={onRemove} className="text-red-400 bg-red-50 p-2 mr-1 rounded hover:text-red-600"><FiX /></button>
      </div>

      {subjectItem.is_divided && (
        <div className="mt-2 ml-2 pl-4 border-l-2 border-teal-200 space-y-2">
          <div className="text-xs font-bold text-gray-500 mb-1">Subject Parts</div>
          {(subjectItem.parts || []).map((p, pIdx) => (
            <div key={pIdx} className="flex gap-2 items-center">
              <input 
                placeholder="Part Name (e.g. Theory)" 
                value={p.name || ''} 
                onChange={e => {
                  const newParts = [...(subjectItem.parts || [])];
                  const newName = e.target.value;
                  const autoSubCode = newName.substring(0, 2).toUpperCase();
                  newParts[pIdx] = { ...p, name: newName, sub_code: autoSubCode };
                  onChange({ ...subjectItem, parts: newParts });
                }} 
                className="text-xs border border-gray-300 p-1.5 rounded flex-1 outline-none focus:border-teal-500"
              />
              <input 
                placeholder="Sub-code (e.g. TH)" 
                value={p.sub_code || ''} 
                readOnly
                className="text-xs border border-gray-200 bg-gray-50 text-gray-500 p-1.5 rounded w-28 outline-none cursor-not-allowed"
              />
              <button 
                onClick={() => {
                  const newParts = (subjectItem.parts || []).filter((_, i) => i !== pIdx);
                  onChange({ ...subjectItem, parts: newParts });
                }} 
                className="text-red-400 hover:text-red-600 p-1"
                title="Remove part"
              ><FiX size={14}/></button>
            </div>
          ))}
          <button 
            onClick={() => {
              const newParts = [...(subjectItem.parts || []), { name: '', sub_code: '' }];
              onChange({ ...subjectItem, parts: newParts });
            }} 
            className="text-xs text-teal-600 font-bold hover:underline mt-1"
          >+ Add Part</button>
        </div>
      )}
    </div>
  );
};

const ClassSubjectConfig = ({ API_URL }) => {
  const [classesData, setClassesData] = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [globalClasses, setGlobalClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const resConfig = await fetch(`${API_URL}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } });
      const configData = await resConfig.json();
      setClassesData(configData);

      const resGlobal = await fetch(`${API_URL}/subjects/global`, { headers: { Authorization: `Bearer ${token}` } });
      const globalData = await resGlobal.json();
      setGlobalSubjects(globalData);
      
      const resGlobalClasses = await fetch(`${API_URL}/classes/global`, { headers: { Authorization: `Bearer ${token}` } });
      const globalClassesData = await resGlobalClasses.json();
      setGlobalClasses(globalClassesData);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const handleEdit = (cls) => {
    const data = JSON.parse(JSON.stringify(cls));
    data.core_subjects = data.core_subjects || [];
    
    // Initialize standard categories in editData
    data.categories = {};
    CATEGORIES.forEach(cat => {
      const group = data.elective_groups?.find(g => g.group_name === cat) || { subjects: [], selectable_count: 1 };
      data.categories[cat] = {
        subjects: group.subjects || [],
        selectable_count: group.selectable_count || 1
      };
    });
    
    setEditData(data);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const elective_groups = [];
      CATEGORIES.forEach(cat => {
        const catData = editData.categories[cat];
        if (catData && catData.subjects.length > 0) {
          elective_groups.push({
            group_name: cat,
            selectable_count: parseInt(catData.selectable_count) || 1,
            subjects: catData.subjects.map(s => ({
              subject_id: s.subject_id || s.id,
              is_divided: s.is_divided,
              parts: s.parts || []
            })).filter(s => s.subject_id)
          });
        }
      });
      
      const res = await fetch(`${API_URL}/subjects/mapping/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          class_level: editData.class_level,
          medium: editData.medium || '',
          has_semester: editData.has_semester || false,
          sections: editData.sections || '',
          core_subjects: (editData.core_subjects || []).map(c => ({
            subject_id: c.subject_id || c.id,
            is_divided: c.is_divided,
            parts: c.parts || []
          })).filter(c => c.subject_id),
          elective_groups: elective_groups
        })
      });
      if (res.ok) {
        setIsEditing(false);
        fetchData();
      } else {
        alert("Failed to save config");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving config");
    }
  };

  const handleDeleteClass = async (className) => {
    if (!window.confirm(`Are you sure you want to delete configuration for ${className}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/mapping/class/${encodeURIComponent(className)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete class");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting class");
    }
  };

  const handleAddNewClass = () => {
    if (!newClassName.trim()) return;
    // Just add to local state and open edit mode so admin can configure it
    const newClassData = {
      class_level: newClassName.trim().toUpperCase(),
      medium: '',
      has_semester: false,
      sections: '',
      core_subjects: [],
      elective_groups: []
    };
    setClassesData([...classesData, newClassData]);
    setNewClassName('');
    setIsAddingClass(false);
    handleEdit(newClassData);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (isEditing && editData) {
    return (
      <div className="bg-[#FAF9F6] rounded-xl border border-gray-200 p-6 shadow-sm max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Manage class subject</h2>
            <div className="flex flex-col gap-1 mt-4">
              <span className="text-sm font-semibold text-gray-700">Class : {editData.class_level}</span>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Semester included : 
                <select className="bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 ml-1" value={editData.has_semester ? 'Yes' : 'No'} onChange={e => setEditData({...editData, has_semester: e.target.value === 'Yes'})}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
            </div>
          </div>
          <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 self-start"><FiX size={24} /></button>
        </div>

        <div className="grid grid-cols-1 gap-10">
          
          {/* CORE SUBJECTS */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Core Subjects <span className="text-xs bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">i</span></h3>
            
            <div className="space-y-3">
              {(editData.core_subjects || []).map((cs, idx) => (
                <SubjectConfigRow 
                  key={idx}
                  subjectItem={cs}
                  globalSubjects={globalSubjects}
                  onChange={(updatedItem) => {
                    const newCore = [...(editData.core_subjects || [])];
                    newCore[idx] = updatedItem;
                    setEditData({...editData, core_subjects: newCore});
                  }}
                  onRemove={() => {
                    const newCore = editData.core_subjects.filter((_, i) => i !== idx);
                    setEditData({...editData, core_subjects: newCore});
                  }}
                />
              ))}
              
              <button 
                onClick={() => setEditData({...editData, core_subjects: [...(editData.core_subjects || []), { subject_id: '', name: '' }]})}
                className="py-2.5 px-8 bg-[#E6F8F5] text-teal-600 font-semibold rounded text-sm hover:bg-teal-50 transition"
              >
                Core Subjects <FiPlus className="inline ml-1" />
              </button>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* DYNAMIC CATEGORIES */}
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">{cat} Subjects <span className="text-xs bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">i</span></h3>
              
              <div className="space-y-3">
                {(editData.categories[cat]?.subjects || []).map((cs, idx) => (
                  <SubjectConfigRow 
                    key={idx}
                    subjectItem={cs}
                    globalSubjects={globalSubjects}
                    onChange={(updatedItem) => {
                      const newCatSubjects = [...(editData.categories[cat].subjects || [])];
                      newCatSubjects[idx] = updatedItem;
                      setEditData({...editData, categories: { ...editData.categories, [cat]: { ...editData.categories[cat], subjects: newCatSubjects } } });
                    }}
                    onRemove={() => {
                      const newCatSubjects = editData.categories[cat].subjects.filter((_, i) => i !== idx);
                      setEditData({...editData, categories: { ...editData.categories, [cat]: { ...editData.categories[cat], subjects: newCatSubjects } } });
                    }}
                  />
                ))}
                
                {(editData.categories[cat]?.subjects || []).length > 0 && ['MIL', 'Elective'].includes(cat) && (
                  <div className="mt-4 mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">*Total Selectable Subjects :</label>
                    <input 
                      type="number" 
                      className="w-48 p-2 text-sm border border-gray-300 rounded"
                      min="1" 
                      value={editData.categories[cat]?.selectable_count || 1}
                      onChange={(e) => {
                        setEditData({...editData, categories: { ...editData.categories, [cat]: { ...editData.categories[cat], selectable_count: parseInt(e.target.value) || 1 } } });
                      }}
                    />
                  </div>
                )}
                
                <button 
                  onClick={() => {
                     const newCatSubjects = [...(editData.categories[cat].subjects || []), { subject_id: '', name: '' }];
                     setEditData({...editData, categories: { ...editData.categories, [cat]: { ...editData.categories[cat], subjects: newCatSubjects } } });
                  }}
                  className="py-2.5 px-8 bg-[#E6F8F5] text-teal-600 font-semibold rounded text-sm hover:bg-teal-50 transition"
                >
                  {cat} Subjects <FiPlus className="inline ml-1" />
                </button>
              </div>
              <hr className="border-gray-200 my-10" />
            </div>
          ))}
          
        </div>

        <div className="flex justify-end mt-4 pt-6">
           <button onClick={handleSave} className="bg-[#1C4E80] text-white px-10 py-2.5 rounded text-sm font-bold shadow hover:bg-blue-900 transition">submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-x-auto p-4 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Class Configurations</h2>
        <button onClick={() => setIsAddingClass(true)} className="flex items-center gap-2 bg-[#1C4E80] text-white px-4 py-2 rounded font-bold hover:bg-blue-900 transition">
          <FiPlus /> Add New Class
        </button>
      </div>

      {isAddingClass && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-end gap-4 animate-fade-in">
          <div className="flex-1 max-w-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Class *</label>
            <select value={newClassName} onChange={e => setNewClassName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#1C4E80] outline-none">
              <option value="">Select a class...</option>
              {globalClasses.map(gc => (
                <option key={gc.id} value={gc.name}>{gc.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAddNewClass} className="bg-teal-600 text-white px-6 py-2.5 rounded font-bold hover:bg-teal-700 transition">Create</button>
          <button onClick={() => setIsAddingClass(false)} className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded font-bold hover:bg-gray-300 transition">Cancel</button>
        </div>
      )}

      <table className="w-full text-left border-collapse min-w-max mt-4">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">No.</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Semester</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Medium</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Section</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Core Subjects</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Elective/Minor Groups</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {classesData.map((cls, idx) => {
            return (
              <tr key={cls.class_level} className="hover:bg-gray-50/30">
                <td className="p-4 text-sm text-gray-600 align-top">{idx + 1}</td>
                <td className="p-4 text-sm text-gray-800 font-medium align-top">Class {cls.class_level} {cls.medium ? `- ${cls.medium}` : ''}</td>
                <td className="p-4 align-top">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${cls.has_semester ? 'bg-pink-100 text-pink-500' : 'bg-pink-100 text-pink-500'}`}>
                    {cls.has_semester ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600 align-top">{cls.medium || '-'}</td>
                <td className="p-4 text-sm text-gray-600 align-top">{cls.sections || 'A,B,C'}</td>
                <td className="p-4 align-top">
                  <ul className="text-xs space-y-1 text-gray-700">
                    {(cls.core_subjects || []).map((s, i) => (
                      <li key={i}>{i+1}. {s.subjects?.name || s.name} - {s.subjects?.marking_system || s.marking_system || '-'}</li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-6">
                    {CATEGORIES.map(cat => {
                      const group = (cls.elective_groups || []).find(g => g.group_name === cat);
                      if (group && group.subjects?.length > 0) {
                        return (
                          <div key={cat} className="text-xs">
                            <div className="font-bold text-gray-800 mb-1">{cat}</div>
                            <ul className="space-y-1 text-gray-600 mb-1">
                              {group.subjects.map((s, j) => (
                                <li key={j}>{j+1}. {s.subjects?.name || s.name} - {s.subjects?.marking_system || s.marking_system || '-'}</li>
                              ))}
                            </ul>
                            <div className="font-bold text-gray-800 mt-2">Total Selectable: {group.selectable_count}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </td>
                <td className="p-4 align-top text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(cls)} title="Edit Configuration" className="text-[#9854CB] bg-[#F3E8FF] p-2 rounded-full hover:bg-purple-200">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteClass(cls.class_level)} title="Delete Class" className="text-red-500 bg-red-50 p-2 rounded-full hover:bg-red-100">
                      <FiX size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {classesData.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-400">No configurations found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default ClassSubjectConfig;
