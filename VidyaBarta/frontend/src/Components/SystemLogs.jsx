import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiClock, FiUser, FiActivity, FiMapPin, FiRefreshCw } from 'react-icons/fi';

export default function SystemLogs({ API_URL, adminUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/system/logs`, {
        headers: { Authorization: `Bearer ${adminUser.token}` }
      });
      setLogs(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch system logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [API_URL, adminUser]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiActivity className="mr-2 text-primary" /> System Audit Logs
          </h2>
          <p className="text-gray-500 text-sm mt-1">Detailed log of all changes made across the school system.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm"
        >
          <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            Loading system logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No system logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">IP Address</th>
                  <th className="p-4 font-semibold w-1/3">Details</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiClock className="mr-2 text-gray-400" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-blue-500" />
                        {log.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action.replace('AUDIT_', '')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      <div className="flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" />
                        {log.ip_address}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-600 bg-gray-50 break-words rounded-md m-2 border border-gray-100">
                      <div className="max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {log.user_agent}
                      </div>
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
}
