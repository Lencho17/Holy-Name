import React, { useState, useEffect } from 'react';
import { FiEdit2, FiPlus, FiX } from 'react-icons/fi';

const ClassSubjectConfig = ({ API_URL }) => {
  const [classesData, setClassesData] = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

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
    const milGroup = data.elective_groups?.find(g => g.group_name === 'MIL') || { subjects: [], selectable_count: 1 };
    const electiveGroup = data.elective_groups?.find(g => g.group_name === 'Elective') || { subjects: [], selectable_count: 1 };
    
    data.mil_subjects = milGroup.subjects || [];
    data.mil_selectable = milGroup.selectable_count || 1;
    data.elective_subjects = electiveGroup.subjects || [];
    data.elective_selectable = electiveGroup.selectable_count || 1;
    data.core_subjects = data.core_subjects || [];
    
    setEditData(data);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const elective_groups = [];
      if (editData.mil_subjects && editData.mil_subjects.length > 0) {
        elective_groups.push({
          group_name: 'MIL',
          selectable_count: parseInt(editData.mil_selectable) || 1,
          subjects: editData.mil_subjects.map(s => s.subject_id || s.id).filter(Boolean)
        });
      }
      if (editData.elective_subjects && editData.elective_subjects.length > 0) {
        elective_groups.push({
          group_name: 'Elective',
          selectable_count: parseInt(editData.elective_selectable) || 1,
          subjects: editData.elective_subjects.map(s => s.subject_id || s.id).filter(Boolean)
        });
      }
      
      const res = await fetch(`${API_URL}/subjects/mapping/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          class_level: editData.class_level,
          medium: editData.medium || '',
          has_semester: editData.has_semester || false,
          sections: editData.sections || '',
          core_subjects: (editData.core_subjects || []).map(c => c.subject_id || c.id).filter(Boolean),
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
                <div key={idx} className="flex items-center gap-2 bg-white rounded border border-gray-200 p-1">
                  <select 
                    className="flex-1 border-none focus:ring-0 text-sm"
                    value={cs.subject_id || cs.id || ''}
                    onChange={(e) => {
                      const newCore = [...(editData.core_subjects || [])];
                      newCore[idx] = { subject_id: e.target.value, name: globalSubjects.find(s => s.id === e.target.value)?.name };
                      setEditData({...editData, core_subjects: newCore});
                    }}
                  >
                    <option value="">Select Subject</option>
                    {globalSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} - {sub.marking_system}</option>
                    ))}
                  </select>
                  <button onClick={() => {
                    const newCore = editData.core_subjects.filter((_, i) => i !== idx);
                    setEditData({...editData, core_subjects: newCore});
                  }} className="text-red-400 bg-red-50 p-2 mr-1 rounded hover:text-red-600"><FiX /></button>
                </div>
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

          {/* MIL SUBJECTS */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">MIL Subjects <span className="text-xs bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">i</span></h3>
            
            <div className="space-y-3">
              {(editData.mil_subjects || []).map((cs, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded border border-gray-200 p-1">
                  <select 
                    className="flex-1 border-none focus:ring-0 text-sm"
                    value={cs.subject_id || cs.id || ''}
                    onChange={(e) => {
                      const newMil = [...(editData.mil_subjects || [])];
                      newMil[idx] = { subject_id: e.target.value, name: globalSubjects.find(s => s.id === e.target.value)?.name };
                      setEditData({...editData, mil_subjects: newMil});
                    }}
                  >
                    <option value="">Select Subject</option>
                    {globalSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} - {sub.marking_system}</option>
                    ))}
                  </select>
                  <button onClick={() => {
                    const newMil = editData.mil_subjects.filter((_, i) => i !== idx);
                    setEditData({...editData, mil_subjects: newMil});
                  }} className="text-red-400 bg-red-50 p-2 mr-1 rounded hover:text-red-600"><FiX /></button>
                </div>
              ))}
              
              {(editData.mil_subjects || []).length > 0 && (
                <div className="mt-4 mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">*Total Selectable Subjects :</label>
                  <input 
                    type="number" 
                    className="w-48 p-2 text-sm border border-gray-300 rounded"
                    min="1" 
                    value={editData.mil_selectable || 1}
                    onChange={(e) => setEditData({...editData, mil_selectable: parseInt(e.target.value) || 1})}
                  />
                </div>
              )}
              
              <button 
                onClick={() => setEditData({...editData, mil_subjects: [...(editData.mil_subjects || []), { subject_id: '', name: '' }]})}
                className="py-2.5 px-8 bg-[#E6F8F5] text-teal-600 font-semibold rounded text-sm hover:bg-teal-50 transition"
              >
                MIL Subjects <FiPlus className="inline ml-1" />
              </button>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* ELECTIVE SUBJECTS */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Elective Subjects <span className="text-xs bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">i</span></h3>
            
            <div className="space-y-3">
              {(editData.elective_subjects || []).map((cs, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded border border-gray-200 p-1">
                  <select 
                    className="flex-1 border-none focus:ring-0 text-sm"
                    value={cs.subject_id || cs.id || ''}
                    onChange={(e) => {
                      const newElec = [...(editData.elective_subjects || [])];
                      newElec[idx] = { subject_id: e.target.value, name: globalSubjects.find(s => s.id === e.target.value)?.name };
                      setEditData({...editData, elective_subjects: newElec});
                    }}
                  >
                    <option value="">Select Subject</option>
                    {globalSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} - {sub.marking_system}</option>
                    ))}
                  </select>
                  <button onClick={() => {
                    const newElec = editData.elective_subjects.filter((_, i) => i !== idx);
                    setEditData({...editData, elective_subjects: newElec});
                  }} className="text-red-400 bg-red-50 p-2 mr-1 rounded hover:text-red-600"><FiX /></button>
                </div>
              ))}
              
              {(editData.elective_subjects || []).length > 0 && (
                <div className="mt-4 mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">*Total Selectable Subjects :</label>
                  <input 
                    type="number" 
                    className="w-48 p-2 text-sm border border-gray-300 rounded"
                    min="1" 
                    value={editData.elective_selectable || 1}
                    onChange={(e) => setEditData({...editData, elective_selectable: parseInt(e.target.value) || 1})}
                  />
                </div>
              )}
              
              <button 
                onClick={() => setEditData({...editData, elective_subjects: [...(editData.elective_subjects || []), { subject_id: '', name: '' }]})}
                className="py-2.5 px-8 bg-[#E6F8F5] text-teal-600 font-semibold rounded text-sm hover:bg-teal-50 transition"
              >
                Elective Subjects <FiPlus className="inline ml-1" />
              </button>
            </div>
          </div>
          
        </div>

        <div className="flex justify-end mt-12 pt-6 border-t border-gray-200">
           <button onClick={handleSave} className="bg-[#1C4E80] text-white px-10 py-2.5 rounded text-sm font-bold shadow hover:bg-blue-900 transition">submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">No.</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Semester</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Medium</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Section</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Core Subjects</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Elective Subjects</th>
            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {classesData.map((cls, idx) => {
            const milGroup = (cls.elective_groups || []).find(g => g.group_name === 'MIL');
            const electiveGroup = (cls.elective_groups || []).find(g => g.group_name === 'Elective');
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
                      <li key={i}>{i+1}. {s.name} - {s.marking_system}</li>
                    ))}
                  </ul>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-6">
                    {milGroup && milGroup.subjects?.length > 0 && (
                      <div className="text-xs">
                        <div className="font-bold text-gray-800 mb-1">MIL</div>
                        <ul className="space-y-1 text-gray-600 mb-1">
                          {milGroup.subjects.map((s, j) => (
                            <li key={j}>{j+1}. {s.name} - {s.marking_system}</li>
                          ))}
                        </ul>
                        <div className="font-bold text-gray-800 mt-2">Total Selectable Subjects: {milGroup.selectable_count}</div>
                      </div>
                    )}
                    
                    {electiveGroup && electiveGroup.subjects?.length > 0 && (
                      <div className="text-xs">
                        <div className="font-bold text-gray-800 mb-1">Elective</div>
                        <ul className="space-y-1 text-gray-600 mb-1">
                          {electiveGroup.subjects.map((s, j) => (
                            <li key={j}>{j+1}. {s.name} - {s.marking_system}</li>
                          ))}
                        </ul>
                        <div className="font-bold text-gray-800 mt-2">Total Selectable Subjects: {electiveGroup.selectable_count}</div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 align-top text-center">
                  <button onClick={() => handleEdit(cls)} className="text-[#9854CB] bg-[#F3E8FF] p-2 rounded-full hover:bg-purple-200">
                    <FiEdit2 size={14} />
                  </button>
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
