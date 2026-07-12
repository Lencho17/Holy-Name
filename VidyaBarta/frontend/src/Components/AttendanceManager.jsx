import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserCheck, FaSave, FaSpinner } from 'react-icons/fa';

const AttendanceManager = ({ apiUrl, token }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [grade, setGrade] = useState('9');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/attendance/students?date=${date}&grade=${grade}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, grade, apiUrl, token]);

  const handleStatusChange = (studentId, status) => {
    setStudents(students.map(st => 
      st.id === studentId ? { ...st, attendance_status: status } : st
    ));
  };

  const handleMarkAll = (status) => {
    setStudents(students.map(st => ({ ...st, attendance_status: status })));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const attendanceData = students.map(st => ({
        student_id: st.id,
        status: st.attendance_status === 'Not Marked' ? 'Present' : st.attendance_status // default to Present if saving and not marked
      }));
      
      await axios.post(`${apiUrl}/attendance/students`, { date, attendance: attendanceData }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert('Attendance saved successfully');
      fetchAttendance();
    } catch (err) {
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FaUserCheck className="text-teal-600 text-2xl" />
          <h2 className="text-2xl font-black text-gray-800">Student Attendance</h2>
        </div>
        <button 
          onClick={saveAttendance}
          disabled={saving || students.length === 0}
          className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Records
        </button>
      </div>

      <div className="flex gap-4 mb-6 bg-teal-50/50 p-4 rounded-xl border border-teal-100 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-gray-200 p-2.5 rounded-lg text-sm w-40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Class</label>
          <select value={grade} onChange={e => setGrade(e.target.value)} className="border-gray-200 p-2.5 rounded-lg text-sm min-w-[120px]">
            {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Class {i+1}</option>)}
          </select>
        </div>
        
        <div className="ml-auto flex gap-2">
          <button onClick={() => handleMarkAll('Present')} className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-bold border border-green-200 hover:bg-green-200">Mark All Present</button>
          <button onClick={() => handleMarkAll('Absent')} className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-200">Mark All Absent</button>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading student roster...</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4 border-b font-bold w-16">#</th>
                <th className="p-4 border-b font-bold">Student Name</th>
                <th className="p-4 border-b font-bold">Admission ID</th>
                <th className="p-4 border-b font-bold">Status</th>
                <th className="p-4 border-b font-bold">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{index + 1}</td>
                  <td className="p-4 font-bold text-gray-800">{student.student_name}</td>
                  <td className="p-4 text-gray-600">{student.admission_id}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      student.attendance_status === 'Present' ? 'bg-green-100 text-green-700' :
                      student.attendance_status === 'Absent' ? 'bg-red-100 text-red-700' :
                      student.attendance_status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                      student.attendance_status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {student.attendance_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <select 
                      value={student.attendance_status} 
                      onChange={(e) => handleStatusChange(student.id, e.target.value)}
                      className="border-gray-200 p-1.5 rounded text-xs bg-white shadow-sm"
                    >
                      <option value="Not Marked">Not Marked</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Half Day">Half Day</option>
                    </select>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">No students found for this class.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
