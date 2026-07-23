import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyCheckAlt, FaSave, FaSpinner } from 'react-icons/fa';

const FeeConfiguration = ({ apiUrl, token }) => {
  const [structures, setStructures] = useState([]);
  const [classesSubjects, setClassesSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const classes = [
    'Nursery', 'KG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 
    '11 - Science', '11 - Arts', '11 - Commerce', 
    '12 - Science', '12 - Arts', '12 - Commerce'
  ];

  const [formData, setFormData] = useState({
    class_level: 'I',
    base_tuition_fee: '',
    admission_fee: '',
    subject_fees: {}
  });

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/fees/structures`, { headers: { Authorization: `Bearer ${token}` } });
      setStructures(res.data || []);
      
      try {
        const subRes = await axios.get(`${apiUrl}/subjects/mapping`, { headers: { Authorization: `Bearer ${token}` } });
        setClassesSubjects(subRes.data || []);
      } catch (subErr) {
        console.error("Error fetching class subjects:", subErr);
      }
      
      populateForm('I', res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableSubjectsForSelectedClass = () => {
    const cls = classesSubjects.find(c => c.class_level === formData.class_level);
    if (!cls) return [];
    
    let subjects = [];
    (cls.core_subjects || []).forEach(s => {
      if (s.subjects?.name) subjects.push(s.subjects.name);
    });
    
    (cls.elective_groups || []).forEach(g => {
        (g.subjects || []).forEach(s => {
          if (s.subjects?.name) subjects.push(s.subjects.name);
        });
    });
    
    return Array.from(new Set(subjects)).filter(s => s && !formData.subject_fees[s]);
  };

  useEffect(() => {
    fetchStructures();
  }, [apiUrl, token]);

  const populateForm = (classLvl, strList) => {
    const existing = strList.find(s => s.class_level === classLvl);
    setFormData({
      class_level: classLvl,
      base_tuition_fee: existing?.base_tuition_fee || '',
      admission_fee: existing?.admission_fee || '',
      subject_fees: existing?.subject_fees || {}
    });
  };

  const handleClassChange = (e) => {
    const classLvl = e.target.value;
    populateForm(classLvl, structures);
  };

  const handleSubjectFeeChange = (subject, value) => {
    setFormData({
      ...formData,
      subject_fees: {
        ...formData.subject_fees,
        [subject]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean up empty subjects
      const cleanedSubjectFees = {};
      Object.keys(formData.subject_fees).forEach(k => {
        if (formData.subject_fees[k]) {
          cleanedSubjectFees[k] = parseFloat(formData.subject_fees[k]);
        }
      });

      await axios.put(`${apiUrl}/fees/structures/${formData.class_level}`, {
        base_tuition_fee: parseFloat(formData.base_tuition_fee) || 0,
        admission_fee: parseFloat(formData.admission_fee) || 0,
        subject_fees: cleanedSubjectFees
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Fee structure saved successfully!');
      fetchStructures(); // Refresh
    } catch (err) {
      alert('Failed to save fee structure');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading fee structures...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <FaMoneyCheckAlt className="text-blue-600 text-2xl" />
        <h2 className="text-2xl font-black text-gray-800">Class Fee Configuration</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Class to Configure</label>
          <select 
            value={formData.class_level}
            onChange={handleClassChange}
            className="w-full md:w-1/3 border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-4">Core Fees</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Base Tuition Fee (Per Trimester)</label>
                <input required type="number" min="0" value={formData.base_tuition_fee} onChange={e => setFormData({...formData, base_tuition_fee: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg" placeholder="e.g. 5000" />
              </div>
              { (parseInt(formData.class_level.replace(/[^0-9]/g, ''), 10) || 0) < 10 && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">New Admission Fee (One-Time)</label>
                  <input required type="number" min="0" value={formData.admission_fee} onChange={e => setFormData({...formData, admission_fee: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg" placeholder="e.g. 15000" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-purple-800">Subject Specific Fees</h3>
              {showSubjectDropdown ? (
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs border border-purple-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-purple-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({...formData, subject_fees: {...formData.subject_fees, [e.target.value]: ''}});
                        setShowSubjectDropdown(false);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a subject...</option>
                    {availableSubjectsForSelectedClass().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowSubjectDropdown(false)} className="text-red-500 hover:text-red-700 text-lg leading-none font-bold">&times;</button>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setShowSubjectDropdown(true)}
                  className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-lg font-bold hover:bg-purple-300"
                >
                  + Add Subject
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 h-64 overflow-y-auto pr-2">
              {Object.keys(formData.subject_fees).map(subject => (
                <div key={subject} className="relative group">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 truncate pr-6" title={subject}>{subject}</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newSubjectFees = { ...formData.subject_fees };
                      delete newSubjectFees[subject];
                      setFormData({...formData, subject_fees: newSubjectFees});
                    }}
                    className="absolute top-0 right-0 text-red-500 opacity-0 group-hover:opacity-100 text-lg leading-none"
                    title="Remove Subject"
                  >&times;</button>
                  <input type="number" min="0" value={formData.subject_fees[subject]} onChange={e => handleSubjectFeeChange(subject, e.target.value)} className="w-full border-gray-200 p-2 rounded-lg text-sm" placeholder="₹" />
                </div>
              ))}
              {Object.keys(formData.subject_fees).length === 0 && (
                <div className="col-span-2 text-center text-sm text-gray-400 py-8">No specific subjects added yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeeConfiguration;
