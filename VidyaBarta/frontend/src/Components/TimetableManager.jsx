import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaPlus, FaSave, FaSpinner, FaTrash } from 'react-icons/fa';

const TimetableManager = ({ apiUrl, token }) => {
  const [classLevel, setClassLevel] = useState('9');
  const [section, setSection] = useState('A');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/timetables/${classLevel}/${section}`, { headers: { Authorization: `Bearer ${token}` } });
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [classLevel, section, apiUrl, token]);

  const handleCellChange = (day, period, field, value) => {
    const newTimetable = [...timetable];
    const existingIndex = newTimetable.findIndex(t => t.day_of_week === day && t.period_number === period);
    
    if (existingIndex >= 0) {
      newTimetable[existingIndex][field] = value;
    } else {
      newTimetable.push({
        day_of_week: day,
        period_number: period,
        [field]: value,
        start_time: '09:00:00', // Default dummy values, could be enhanced
        end_time: '09:45:00'
      });
    }
    setTimetable(newTimetable);
  };

  const getCellData = (day, period) => {
    return timetable.find(t => t.day_of_week === day && t.period_number === period) || { subject: '', staff_id: '' };
  };

  const saveTimetable = async () => {
    try {
      setSaving(true);
      await axios.post(`${apiUrl}/timetables`, {
        class_level: classLevel,
        section: section,
        entries: timetable.filter(t => t.subject && t.subject.trim() !== '')
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Timetable saved successfully!');
    } catch (err) {
      alert('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-blue-600 text-2xl" />
          <h2 className="text-2xl font-black text-gray-800">Class Timetable</h2>
        </div>
        <button 
          onClick={saveTimetable}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Timetable
        </button>
      </div>

      <div className="flex gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Class Level</label>
          <select value={classLevel} onChange={e => setClassLevel(e.target.value)} className="border-gray-200 p-2 rounded-lg min-w-[120px]">
            {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Class {i+1}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Section</label>
          <select value={section} onChange={e => setSection(e.target.value)} className="border-gray-200 p-2 rounded-lg min-w-[120px]">
            {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading timetable...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 border-b font-bold w-32">Day / Period</th>
                {periods.map(p => <th key={p} className="p-3 border-b font-bold text-center">P {p}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-bold text-gray-800 bg-gray-50">{day}</td>
                  {periods.map(period => {
                    const data = getCellData(day, period);
                    return (
                      <td key={period} className="p-2 border-l border-gray-100 align-top">
                        <input 
                          type="text" 
                          placeholder="Subject" 
                          value={data.subject || ''} 
                          onChange={(e) => handleCellChange(day, period, 'subject', e.target.value)}
                          className="w-full p-1.5 mb-1 border border-gray-200 rounded text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Teacher ID" 
                          value={data.staff_id || ''} 
                          onChange={(e) => handleCellChange(day, period, 'staff_id', e.target.value)}
                          className="w-full p-1.5 border border-gray-200 rounded text-xs bg-gray-50"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TimetableManager;
