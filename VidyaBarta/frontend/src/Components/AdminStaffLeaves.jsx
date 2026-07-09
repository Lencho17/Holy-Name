import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminStaffLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/staff/admin/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(res.data);
    } catch (err) {
      console.error('Failed to fetch staff leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_URL}/staff/admin/leaves/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Leave ${status.toLowerCase()} successfully`);
      fetchLeaves();
    } catch (err) {
      alert('Failed to update leave status');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leave requests...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800">Staff Leave Requests</h3>
      </div>
      
      <div className="p-6">
        {leaves.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No leave applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Staff</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Dates</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Reason</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.map((leave, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{leave.staff?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{leave.staff?.email || 'N/A'}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600 font-bold">{leave.leave_type}</td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                    <td className="p-4">
                      {leave.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-md">
                          <FaCheckCircle /> Approved
                        </span>
                      ) : leave.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-md">
                          <FaTimesCircle /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-md">
                          <FaClock /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {leave.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleStatusUpdate(leave.id, 'Approved')} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded">Approve</button>
                          <button onClick={() => handleStatusUpdate(leave.id, 'Rejected')} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded">Reject</button>
                        </div>
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

export default AdminStaffLeaves;
