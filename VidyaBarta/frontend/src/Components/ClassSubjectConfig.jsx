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
    
    data.mil_subjects = milGroup.subjects;
    data.mil_selectable = milGroup.selectable_count;
    data.elective_subjects = electiveGroup.subjects;
    data.elective_selectable = electiveGroup.selectable_count;
    
    setEditData(data);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/mapping/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          class_level: editData.class_level,
          medium: editData.medium || '',
          has_semester: editData.has_semester || false,
          sections: editData.sections || '',
          core_subjects: editData.core_subjects.map(c => c.subject_id),
          elective_groups: [
            ...(editData.mil_subjects?.length > 0 ? [{
              group_name: 'MIL',
              selectable_count: parseInt(editData.mil_selectable) || 1,
              subjects: editData.mil_subjects.map(s => s.subject_id)
            }] : []),
            ...(editData.elective_subjects?.length > 0 ? [{
              group_name: 'Elective',
              selectable_count: parseInt(editData.elective_selectable) || 1,
              subjects: editData.elective_subjects.map(s => s.subject_id)
            }] : [])
          ]
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Class : {editData.class_level}</h2>
            <div className="flex items-center gap-4 mt-2">
              <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                Semester Included: 
                <select className="border border-gray-300 rounded p-1 text-sm" value={editData.has_semester ? 'Yes' : 'No'} onChange={e => setEditData({...editData, has_semester: e.target.value === 'Yes'})}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                Medium: 
                <input type="text" className="border border-gray-300 rounded p-1 text-sm w-32" value={editData.medium} onChange={e => setEditData({...editData, medium: e.target.value})} placeholder="e.g. English" />
              </label>
              <label className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                Sections: 
                <input type="text" className="border border-gray-300 rounded p-1 text-sm w-32" value={editData.sections} onChange={e => setEditData({...editData, sections: e.target.value})} placeholder="e.g. A,B,C" />
              </label>
            </div>
          </div>
          <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700"><FiX size={24} /></button>
        </div>

        {/* Core Subjects */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Core Subjects <span className="text-xs bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">i</span></h3>
          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
            {editData.core_subjects.map((coreSub, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <select 
                  className="flex-1 border border-gray-300 p-2.5 rounded text-sm text-gray-700"
                  value={coreSub.subject_id}
                  onChange={(e) => {
                    const newCore = [...editData.core_subjects];
                    newCore[idx].subject_id = e.target.value;
                    setEditData({...editData, core_subjects: newCore});
                  }}
                >
                  <option value="">Select a Subject...</option>
                  {globalSubjects.map(gs => <option key={gs.id} value={gs.id}>{gs.name} - {gs.type} ({gs.code})</option>)}
                </select>
                <button onClick={() => {
                  const newCore = editData.core_subjects.filter((_, i) => i !== idx);
                  setEditData({...editData, core_subjects: newCore});
                }} className="bg-red-50 text-red-500 p-3 rounded hover:bg-red-100"><FiX /></button>
              </div>
            ))}
            <button onClick={() => setEditData({...editData, core_subjects: [...editData.core_subjects, { subject_id: '' }]})} className="bg-[#E6F8F5] text-teal-600 font-semibold text-sm w-full py-2.5 rounded flex items-center justify-center gap-2 hover:bg-teal-50">
              Core Subjects <FiPlus />
            </button>
          </div>
        </div>

        <hr className="my-8" />

        {/* Elective Subjects */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Elective Subjects <span className="text-xs bg-gray-200 text-gray-600 rounded-full w-4 h-4 flex items-center justify-center">i</span></h3>
          
          <div className="space-y-8">
            {editData.elective_groups.map((group, gIdx) => (
              <div key={gIdx} className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-gray-700 text-sm">Group {gIdx + 1}</span>
                  <button onClick={() => {
                    const newGroups = editData.elective_groups.filter((_, i) => i !== gIdx);
                    setEditData({...editData, elective_groups: newGroups});
                  }} className="text-red-400 hover:text-red-600"><FiX size={14}/></button>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {group.subjects.map((sub, sIdx) => (
                    <React.Fragment key={sIdx}>
                      {sIdx > 0 && <span className="text-gray-400 text-xs font-semibold uppercase">OR</span>}
                      <div className="flex items-center gap-2 relative group flex-1 min-w-[200px]">
                        <select 
                          className="w-full border border-gray-300 p-2.5 rounded text-sm text-gray-700"
                          value={sub.subject_id}
                          onChange={(e) => {
                            const newGroups = [...editData.elective_groups];
                            newGroups[gIdx].subjects[sIdx].subject_id = e.target.value;
                            setEditData({...editData, elective_groups: newGroups});
                          }}
                        >
                          <option value="">Select...</option>
                          {globalSubjects.map(gs => <option key={gs.id} value={gs.id}>{gs.name} - {gs.type}</option>)}
                        </select>
                        <button onClick={() => {
                          const newGroups = [...editData.elective_groups];
                          newGroups[gIdx].subjects = newGroups[gIdx].subjects.filter((_, i) => i !== sIdx);
                          setEditData({...editData, elective_groups: newGroups});
                        }} className="absolute -right-2 -bottom-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><FiX size={10} /></button>
                      </div>
                    </React.Fragment>
                  ))}
                  <button onClick={() => {
                    const newGroups = [...editData.elective_groups];
                    newGroups[gIdx].subjects.push({ subject_id: '' });
                    setEditData({...editData, elective_groups: newGroups});
                  }} className="bg-teal-50 text-teal-600 p-2 rounded hover:bg-teal-100"><FiPlus size={16} /></button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Total Selectable Subjects*</label>
                  <input type="number" min="1" className="border border-gray-300 rounded p-2 text-sm w-32" value={group.selectable_count || 1} onChange={e => {
                    const newGroups = [...editData.elective_groups];
                    newGroups[gIdx].selectable_count = parseInt(e.target.value);
                    setEditData({...editData, elective_groups: newGroups});
                  }} />
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={() => {
             setEditData({
               ...editData, 
               elective_groups: [...editData.elective_groups, { group_name: `Group ${editData.elective_groups.length + 1}`, selectable_count: 1, subjects: [{ subject_id: '' }] }]
             });
          }} className="bg-[#E6F8F5] text-teal-600 font-semibold text-sm w-full mt-4 py-2.5 rounded flex items-center justify-center gap-2 hover:bg-teal-50">
            Elective Subjects <FiPlus />
          </button>
        </div>

        <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
           <button onClick={handleSave} className="bg-[#1C4E80] text-white px-8 py-2.5 rounded text-sm font-bold shadow hover:bg-blue-900 transition">Submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="p-4 text-sm font-semibold text-gray-600">No.</th>
            <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
            <th className="p-4 text-sm font-semibold text-gray-600">Semester</th>
            <th className="p-4 text-sm font-semibold text-gray-600">Medium</th>
            <th className="p-4 text-sm font-semibold text-gray-600">Section</th>
            <th className="p-4 text-sm font-semibold text-gray-600">Core Subjects</th>
            <th className="p-4 text-sm font-semibold text-gray-600">Elective Subjects</th>
            <th className="p-4 text-sm font-semibold text-gray-600 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {classesData.map((cls, idx) => (
            <tr key={cls.class_level} className="hover:bg-gray-50/30">
              <td className="p-4 text-sm text-gray-600 align-top">{idx + 1}</td>
              <td className="p-4 text-sm text-gray-800 font-medium align-top">Class {cls.class_level} {cls.medium ? `- ${cls.medium}` : ''}</td>
              <td className="p-4 align-top">
                <span className={`text-xs font-bold px-2 py-1 rounded ${cls.has_semester ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-500'}`}>
                  {cls.has_semester ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="p-4 text-sm text-gray-600 align-top">{cls.medium || '-'}</td>
              <td className="p-4 text-sm text-gray-600 align-top">{cls.sections || '-'}</td>
              <td className="p-4 text-sm text-gray-600 align-top">
                <ol className="list-decimal pl-4 space-y-1">
                  {cls.core_subjects.map((cs, i) => (
                    <li key={i}>{cs.subjects?.name} - {cs.subjects?.type}</li>
                  ))}
                  {cls.core_subjects.length === 0 && <span className="text-gray-400 italic">None</span>}
                </ol>
              </td>
              <td className="p-4 text-sm text-gray-600 align-top">
                <div className="space-y-4">
                  {cls.elective_groups.map((g, i) => (
                    <div key={i}>
                      <div className="font-bold text-gray-800 text-xs mb-1">Group {i + 1}</div>
                      <ol className="list-decimal pl-4 space-y-1 mb-1">
                        {g.subjects?.map((es, j) => (
                          <li key={j}>{es.subjects?.name} - {es.subjects?.type}</li>
                        ))}
                      </ol>
                      <div className="text-xs font-semibold text-gray-800">Total Subjects : {g.subjects?.length || 0}</div>
                      <div className="text-xs font-semibold text-gray-800">Total Selectable Subjects : {g.selectable_count}</div>
                    </div>
                  ))}
                  {cls.elective_groups.length === 0 && <span className="text-gray-400 italic">None</span>}
                </div>
              </td>
              <td className="p-4 text-center align-top">
                <button onClick={() => handleEdit(cls)} className="bg-[#B684FF] hover:bg-purple-500 text-white p-2 rounded-full shadow-sm transition">
                  <FiEdit2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassSubjectConfig;
