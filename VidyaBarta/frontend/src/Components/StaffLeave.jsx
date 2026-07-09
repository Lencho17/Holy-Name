import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffLeave = ({ staffData: initialStaffData }) => {
  const [staffData, setStaffData] = useState(initialStaffData);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'CL',
    reason: '',
    proof_file_url: ''
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const resLeaves = await axios.get(`${API_URL}/staff/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(resLeaves.data);
      
      const resProfile = await axios.get(`${API_URL}/staff/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffData(resProfile.data);
      
      // Update local storage so other components get the latest
      localStorage.setItem('staffData', JSON.stringify(resProfile.data));
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const token = localStorage.getItem('staffToken');
      await axios.post(`${API_URL}/staff/leave`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Leave applied successfully! Pending admin approval.');
      setShowApply(false);
      setFormData({ start_date: '', end_date: '', leave_type: 'CL', reason: '', proof_file_url: '' });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaCalendarPlus className="text-blue-600" /> Leave Management
        </h3>
        {!showApply && (
          <button 
            onClick={() => setShowApply(true)}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Apply for Leave
          </button>
        )}
      </div>
      
      <div className="p-8">
        {/* CL Balance Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-center items-center">
            <p className="text-sm font-bold text-gray-500 uppercase">Total CL</p>
            <p className="text-3xl font-black text-gray-800">{staffData?.total_cl || 12}</p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-center items-center">
            <p className="text-sm font-bold text-gray-500 uppercase">Used CL</p>
            <p className="text-3xl font-black text-red-500">{staffData?.used_cl || 0}</p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-center items-center">
            <p className="text-sm font-bold text-gray-500 uppercase">Remaining CL</p>
            <p className="text-3xl font-black text-green-500">{(staffData?.total_cl || 12) - (staffData?.used_cl || 0)}</p>
          </div>
        </div>

        {showApply && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-4">New Leave Application</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                  <input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                  <input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Leave Type</label>
                  <select name="leave_type" value={formData.leave_type} onChange={handleChange} className="w-full p-2 border rounded-lg">
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="Medical">Medical Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proof Document URL (Optional)</label>
                  <input type="text" name="proof_file_url" value={formData.proof_file_url} onChange={handleChange} placeholder="https://..." className="w-full p-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                  <textarea required name="reason" value={formData.reason} onChange={handleChange} rows="2" className="w-full p-2 border rounded-lg resize-none"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowApply(false)} className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={applying} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{applying ? 'Submitting...' : 'Submit Application'}</button>
              </div>
            </form>
          </div>
        )}

        <h4 className="font-bold text-gray-800 mb-4">Past Applications</h4>
        {loading ? (
          <p className="text-gray-500">Loading leaves...</p>
        ) : leaves.length === 0 ? (
          <p className="text-gray-500">No leave applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Dates</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Reason</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((leave, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600 font-bold">{leave.leave_type}</td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="p-4">
                      {leave.status === 'Approved' ? (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><FaCheckCircle /> Approved</span>
                      ) : leave.status === 'Cancelled' ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-sm"><FaTimesCircle /> Cancelled</span>
                      ) : (
                        <span className="text-yellow-600 font-bold text-sm">{leave.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffLeave;
