import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChair, FaPlus, FaSave, FaSpinner, FaTrash } from 'react-icons/fa';

const SeatArrangement = ({ apiUrl, token }) => {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newDuty, setNewDuty] = useState({
    staff_id: '',
    exam_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '12:00',
    room_no: '',
    role: 'Invigilator',
    venue: 'Main Building'
  });

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/exam-duties`, { headers: { Authorization: `Bearer ${token}` } });
      setDuties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, [apiUrl, token]);

  const handleAddDuty = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.post(`${apiUrl}/exam-duties`, newDuty, { headers: { Authorization: `Bearer ${token}` } });
      fetchDuties();
      setNewDuty({ ...newDuty, staff_id: '', room_no: '' });
      alert('Exam duty assigned successfully!');
    } catch (err) {
      alert('Failed to assign exam duty');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this duty?')) return;
    try {
      await axios.delete(`${apiUrl}/exam-duties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchDuties();
    } catch (err) {
      alert('Failed to delete duty');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaChair className="text-purple-600 text-2xl" />
        <h2 className="text-2xl font-black text-gray-800">Exam Duties & Seat Arrangement</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ASSIGN FORM */}
        <div className="md:col-span-1">
          <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
            <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2"><FaPlus /> Assign Staff</h3>
            <form onSubmit={handleAddDuty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Staff ID / Name</label>
                <input required type="text" value={newDuty.staff_id} onChange={e => setNewDuty({...newDuty, staff_id: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg text-sm" placeholder="e.g. uuid or name" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
                  <input required type="date" value={newDuty.exam_date} onChange={e => setNewDuty({...newDuty, exam_date: e.target.value})} className="w-full border-gray-200 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Room No</label>
                  <input required type="text" value={newDuty.room_no} onChange={e => setNewDuty({...newDuty, room_no: e.target.value})} className="w-full border-gray-200 p-2 rounded-lg text-sm" placeholder="e.g. 101" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Start Time</label>
                  <input required type="time" value={newDuty.start_time} onChange={e => setNewDuty({...newDuty, start_time: e.target.value})} className="w-full border-gray-200 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">End Time</label>
                  <input required type="time" value={newDuty.end_time} onChange={e => setNewDuty({...newDuty, end_time: e.target.value})} className="w-full border-gray-200 p-2 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Role</label>
                <select value={newDuty.role} onChange={e => setNewDuty({...newDuty, role: e.target.value})} className="w-full border-gray-200 p-2.5 rounded-lg text-sm">
                  <option value="Invigilator">Invigilator</option>
                  <option value="Reliever">Reliever</option>
                  <option value="Examiner">Examiner</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <button disabled={saving} type="submit" className="bg-purple-600 text-white w-full p-2.5 rounded-lg font-bold hover:bg-purple-700 flex justify-center items-center gap-2">
                {saving ? <FaSpinner className="animate-spin" /> : 'Assign Duty'}
              </button>
            </form>
          </div>
        </div>

        {/* LIST OF DUTIES */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-gray-700">Upcoming Duties</h3>
          </div>
          
          {loading ? (
             <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading duties...</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {duties.map(duty => (
                <div key={duty.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:border-purple-200 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-gray-800 text-lg">Room {duty.room_no}</span>
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">{duty.role}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Staff:</strong> {duty.staff_id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(duty.exam_date).toLocaleDateString()} • {duty.start_time} - {duty.end_time} • {duty.venue}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(duty.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <FaTrash />
                  </button>
                </div>
              ))}
              {duties.length === 0 && (
                <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">No exam duties assigned yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatArrangement;
