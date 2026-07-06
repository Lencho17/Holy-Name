import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBullhorn, FaTrash } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', target_class: 'All' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/staff/admin/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/staff/admin/announcements`, form, { headers: { Authorization: `Bearer ${token}` } });
      alert('Announcement sent successfully!');
      setForm({ title: '', message: '', target_class: 'All' });
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to send announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/staff/admin/announcements/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading announcements...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">
          <FaBullhorn size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">School Announcements</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">New Broadcast</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Audience</label>
                <select 
                  className="w-full p-3 border rounded-xl bg-gray-50"
                  value={form.target_class}
                  onChange={(e) => setForm({...form, target_class: e.target.value})}
                >
                  <option value="All">All Staff & Classes</option>
                  <option value="Staff Only">Staff Only</option>
                  <option value="10-A">Class 10-A</option>
                  <option value="10-B">Class 10-B</option>
                  <option value="9-A">Class 9-A</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Holiday on Friday"
                  className="w-full p-3 border rounded-xl bg-gray-50"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Type your message here..."
                  className="w-full p-3 border rounded-xl bg-gray-50"
                  value={form.message}
                  onChange={(e) => setForm({...form, message: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 transition-colors">
                Send Announcement
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[500px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Past Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No announcements yet.</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 relative group">
                    <button 
                      onClick={() => handleDelete(a.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">
                        Target: {a.target_class}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg">{a.title}</h4>
                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                    {a.staff && (
                      <p className="text-xs text-gray-400 mt-3 font-medium">Posted by: {a.staff.name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
