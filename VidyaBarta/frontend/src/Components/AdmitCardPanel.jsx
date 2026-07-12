import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaIdBadge, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const AdmitCardPanel = ({ apiUrl, token }) => {
  const [concessions, setConcessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/concessions`, { headers: { Authorization: `Bearer ${token}` } });
      setConcessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcessions();
  }, [apiUrl, token]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${apiUrl}/concessions/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchConcessions();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading fee concessions...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaIdBadge className="text-orange-500 text-2xl" />
        <h2 className="text-2xl font-black text-gray-800">Fee Concessions & Admit Cards</h2>
      </div>

      <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100 mb-8">
        <h3 className="font-bold text-orange-800 mb-4">Pending Requests for Extension/Concession</h3>
        <div className="space-y-4">
          {concessions.filter(c => c.status === 'pending').map(c => (
            <div key={c._id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-800">Student ID: {c.student_id}</div>
                <div className="text-sm text-gray-600">
                  Requesting {c.type === 'concession' ? `₹${c.discount_amount} Discount` : `Time Extension until ${new Date(c.extension_date).toLocaleDateString()}`}
                </div>
                {c.document_url && (
                  <a href={c.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View Principal's Written Order</a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateStatus(c._id, 'approved')} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200" title="Approve">
                  <FaCheckCircle />
                </button>
                <button onClick={() => updateStatus(c._id, 'rejected')} className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200" title="Reject">
                  <FaTimesCircle />
                </button>
              </div>
            </div>
          ))}
          {concessions.filter(c => c.status === 'pending').length === 0 && (
             <div className="text-sm text-gray-400">No pending concession requests.</div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-4">Admit Card Release Status</h3>
        <p className="text-sm text-gray-500 mb-4">Admit cards are auto-released for students with cleared fees or approved extensions. For students with pending fees, you can manually block or release their admit cards below.</p>
        
        {/* Placeholder for the student list regarding a specific exam */}
        <div className="text-center text-gray-400 py-8 border border-dashed rounded-lg bg-white">
           Select an Exam from the Exam Management tab to manage its admit cards here.
        </div>
      </div>
    </div>
  );
};

export default AdmitCardPanel;
