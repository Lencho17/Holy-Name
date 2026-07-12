import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserShield, FaPlus, FaTrash, FaSpinner } from 'react-icons/fa';

const SchoolAdminsManager = ({ apiUrl, token }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/auth/school-admins`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(res.data || []);
    } catch (err) {
      console.error('Failed to fetch school admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [apiUrl, token]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/auth/school-admins`, formData, { headers: { Authorization: `Bearer ${token}` } });
      alert('Admin added successfully!');
      setShowAddModal(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', password: '' });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the administration team?`)) return;
    try {
      await axios.delete(`${apiUrl}/auth/school-admins/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(admins.filter(a => a.id !== id));
      alert('Admin removed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  if (loading) return <div className="text-gray-500 py-10 flex items-center justify-center"><FaSpinner className="animate-spin mr-2" /> Loading administrators...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FaUserShield className="text-blue-600" /> Current Administrators ({admins.length}/3)
        </h3>
        <button 
          onClick={() => setShowAddModal(true)} 
          disabled={admins.length >= 3}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FaPlus /> Add Admin
        </button>
      </div>

      <div className="p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">No additional administrators found.</td>
              </tr>
            ) : admins.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-gray-800">{admin.first_name} {admin.last_name}</div>
                  <div className="text-xs text-gray-500 mt-1">Added: {new Date(admin.created_at).toLocaleDateString()}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-gray-700">{admin.email}</div>
                  <div className="text-xs text-gray-500 mt-1">{admin.phone}</div>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(admin.id, admin.first_name)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Remove Admin"
                  >
                    <FaTrash size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn">
            <h2 className="text-xl font-bold mb-2">Add Administrator</h2>
            <p className="text-sm text-gray-500 mb-6">Create a new admin account. They will have full access to manage school operations.</p>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">First Name</label>
                  <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="John" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Last Name</label>
                  <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Doe" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="admin@school.com" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Phone Number</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="+91 9876543210" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Temporary Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Enter secure password" />
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {submitting && <FaSpinner className="animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminsManager;
