import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaPlus, FaTrash, FaSpinner } from 'react-icons/fa';

const HolidaySettings = ({ apiUrl, token }) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', description: '' });

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(`${apiUrl}/holidays`);
      setHolidays(res.data);
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [apiUrl]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return alert('Name and date required');
    setAdding(true);
    try {
      await axios.post(`${apiUrl}/holidays`, newHoliday, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewHoliday({ name: '', date: '', description: '' });
      fetchHolidays();
    } catch (err) {
      console.error('Failed to add holiday:', err);
      alert('Error adding holiday');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await axios.delete(`${apiUrl}/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHolidays();
    } catch (err) {
      console.error('Failed to delete holiday:', err);
      alert('Error deleting holiday');
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading holidays...</div>;

  return (
    <div className="mt-8 bg-purple-50 p-6 rounded-xl border border-purple-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
          <FaCalendarAlt size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-800">Holiday Calendar Management</h4>
          <p className="text-xs text-gray-500">Manually add school holidays (not PDF upload).</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input 
          type="text"
          placeholder="Holiday Name (e.g. Diwali)"
          value={newHoliday.name}
          onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
          className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
          required
        />
        <input 
          type="date"
          value={newHoliday.date}
          onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
          className="p-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
          required
        />
        <input 
          type="text"
          placeholder="Description (Optional)"
          value={newHoliday.description}
          onChange={e => setNewHoliday({...newHoliday, description: e.target.value})}
          className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
        />
        <button 
          type="submit"
          disabled={adding}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {adding ? <FaSpinner className="animate-spin" /> : <FaPlus />} Add
        </button>
      </form>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {holidays.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">No holidays added yet.</div>
        ) : (
          holidays.map(h => (
            <div key={h.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
              <div>
                <div className="font-bold text-sm text-gray-800">{h.name}</div>
                <div className="text-xs text-gray-500">{new Date(h.holiday_date).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')} {h.description && `- ${h.description}`}</div>
              </div>
              <button 
                onClick={() => handleDelete(h.id)}
                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                title="Delete holiday"
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HolidaySettings;
