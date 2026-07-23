import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeadset, FaFileAlt } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffServiceRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({
    request_type: '',
    details: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const res = await axios.get(`${API_URL}/staff/service-request`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch service requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.request_type) return alert('Select a request type');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('staffToken');
      await axios.post(`${API_URL}/staff/service-request`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Service request submitted successfully!');
      setShowApply(false);
      setFormData({ request_type: '', details: '' });
      fetchRequests();
    } catch (err) {
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaHeadset className="text-blue-600" /> Service & Document Requests
        </h3>
        {!showApply && (
          <button 
            onClick={() => setShowApply(true)}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            New Request
          </button>
        )}
      </div>

      <div className="p-8">
        {showApply && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-4">Submit New Request</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Request Type</label>
                <select required name="request_type" value={formData.request_type} onChange={handleChange} className="w-full p-2 border rounded-lg">
                  <option value="">Select Document/Service...</option>
                  <option value="Experience Certificate">Experience Certificate</option>
                  <option value="Form 16">Form 16</option>
                  <option value="Salary Certificate">Salary Certificate</option>
                  <option value="ID Card Replacement">ID Card Replacement</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Details / Reason</label>
                <textarea required name="details" value={formData.details} onChange={handleChange} rows="3" placeholder="Provide any context the admin might need..." className="w-full p-2 border rounded-lg resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowApply(false)} className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        )}

        <h4 className="font-bold text-gray-800 mb-4">Your Requests</h4>
        {loading ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">No service requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Details</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}
                    </td>
                    <td className="p-4 font-bold text-gray-800">{req.request_type}</td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{req.details}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.response_file_url ? (
                        <a href={req.response_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 font-bold text-xs hover:underline">
                          <FaFileAlt /> View File
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
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

export default StaffServiceRequest;
