import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaFileAlt } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminStaffRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/staff/admin/service-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch staff requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const responseUrl = status === 'Completed' ? prompt('Enter a document URL to provide to the staff (optional):') : null;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_URL}/staff/admin/service-requests/${id}`, { 
        status, 
        response_file_url: responseUrl || null 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Request marked as ${status}`);
      fetchRequests();
    } catch (err) {
      alert('Failed to update request status');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading service requests...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Staff Service Requests</h3>
      </div>
      
      <div className="p-6">
        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No service requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Staff</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Request Type</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Details</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{req.staff?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{req.staff?.email || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-gray-800 font-bold">
                      <span className="flex items-center gap-2"><FaFileAlt className="text-blue-500" /> {req.request_type}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={req.details}>{req.details}</td>
                    <td className="p-4">
                      {req.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-md">
                          <FaCheckCircle /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-md">
                          <FaClock /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleStatusUpdate(req.id, 'Completed')} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded">Mark Completed</button>
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

export default AdminStaffRequests;
