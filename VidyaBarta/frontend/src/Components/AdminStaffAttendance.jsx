import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserTie, FaSave, FaSpinner } from 'react-icons/fa';

const AdminStaffAttendance = ({ apiUrl, token }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/attendance/staff?date=${date}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStaff(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, apiUrl, token]);

  const handleFieldChange = (staffId, field, value) => {
    setStaff(staff.map(st => 
      st.id === staffId ? { ...st, [field]: value } : st
    ));
  };

  const handleMarkAll = (status) => {
    setStaff(staff.map(st => ({ ...st, attendance_status: status })));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const attendanceData = staff.map(st => ({
        staff_id: st.id,
        status: st.attendance_status === 'Not Marked' ? 'Present' : st.attendance_status,
        entry_time: st.entry_time,
        exit_time: st.exit_time
      }));
      
      await axios.post(`${apiUrl}/attendance/staff`, { date, attendance: attendanceData }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert('Staff Attendance saved successfully');
      fetchAttendance();
    } catch (err) {
      alert('Failed to save staff attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaUserTie className="text-orange-600 text-2xl" />
          <h2 className="text-2xl font-black text-gray-800">Staff Attendance</h2>
        </div>
        <button 
          onClick={saveAttendance}
          disabled={saving || staff.length === 0}
          className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Records
        </button>
      </div>

      <div className="flex gap-4 mb-6 bg-orange-50/50 p-4 rounded-xl border border-orange-100 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-gray-200 p-2.5 rounded-lg text-sm w-48" />
        </div>
        
        <div className="ml-auto flex gap-2">
          <button onClick={() => handleMarkAll('Present')} className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-bold border border-green-200 hover:bg-green-200">Mark All Present</button>
          <button onClick={() => handleMarkAll('Absent')} className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-200">Mark All Absent</button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading staff roster...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4 border-b font-bold">Staff Name</th>
                <th className="p-4 border-b font-bold">Role / Dept</th>
                <th className="p-4 border-b font-bold">Status</th>
                <th className="p-4 border-b font-bold">Entry Time</th>
                <th className="p-4 border-b font-bold">Exit Time</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((st) => (
                <tr key={st.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-800">{st.name}</td>
                  <td className="p-4 text-gray-600">{st.role} • {st.department || 'N/A'}</td>
                  <td className="p-4">
                    <select 
                      value={st.attendance_status} 
                      onChange={(e) => handleFieldChange(st.id, 'attendance_status', e.target.value)}
                      className={`border-gray-200 p-2 rounded text-xs font-bold shadow-sm ${
                        st.attendance_status === 'Present' ? 'bg-green-50 text-green-700' :
                        st.attendance_status === 'Absent' ? 'bg-red-50 text-red-700' :
                        'bg-white'
                      }`}
                    >
                      <option value="Not Marked">Not Marked</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <input 
                      type="time" 
                      value={st.entry_time || ''} 
                      onChange={e => handleFieldChange(st.id, 'entry_time', e.target.value)}
                      className="border border-gray-200 p-1.5 rounded text-xs" 
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="time" 
                      value={st.exit_time || ''} 
                      onChange={e => handleFieldChange(st.id, 'exit_time', e.target.value)}
                      className="border border-gray-200 p-1.5 rounded text-xs" 
                    />
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">No staff records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminStaffAttendance;
