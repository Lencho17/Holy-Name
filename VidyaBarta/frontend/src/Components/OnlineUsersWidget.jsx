import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiClock, FiMapPin, FiRefreshCw } from 'react-icons/fi';

export default function OnlineUsersWidget({ API_URL, adminUser }) {
  const [onlineData, setOnlineData] = useState({ count: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOnlineUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/system/online-users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('employeeToken')}` }
      });
      setOnlineData(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching online users:', err);
      setError('Failed to fetch online users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [API_URL, adminUser]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiUsers className="mr-2 text-green-500" /> Online Users 
            <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">
              {onlineData.count} Active
            </span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Users who have been active in the last 2 minutes.</p>
        </div>
        <button 
          onClick={fetchOnlineUsers}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && onlineData.users.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            Detecting online users...
          </div>
        ) : onlineData.users.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            No other users are currently online.
          </div>
        ) : (
          onlineData.users.map((user, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-400"></div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg truncate pr-2" title={user.email}>
                    {user.email.split('@')[0]}
                  </h3>
                  <p className="text-sm text-gray-500 truncate" title={user.email}>{user.email}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 grid gap-2">
                <div className="flex items-center text-xs text-gray-500">
                  <FiClock className="mr-2 text-gray-400" />
                  Last Active: {new Date(user.lastActive).toLocaleTimeString()}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <FiMapPin className="mr-2 text-gray-400" />
                  IP: {user.ip || 'Unknown'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
