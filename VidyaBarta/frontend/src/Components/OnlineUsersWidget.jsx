import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiClock, FiMapPin, FiRefreshCw, FiShield, FiActivity, FiX } from 'react-icons/fi';
import { HumanReadableLog, parseLogDetails } from '../utils/logFormatter';

export default function OnlineUsersWidget({ API_URL, adminUser }) {
  const [onlineData, setOnlineData] = useState({ count: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchUserLogs = async (email) => {
    setSelectedUser(email);
    setLogsLoading(true);
    setUserLogs([]);
    try {
      const res = await axios.get(`${API_URL}/system/logs?email=${email}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('employeeToken')}` }
      });
      setUserLogs(res.data);
    } catch(err) {
      console.error("Error fetching user logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

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
            <div 
              key={idx} 
              onClick={() => fetchUserLogs(user.email)}
              className="bg-white cursor-pointer rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-green-400 group-hover:bg-blue-400 transition-colors"></div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg truncate pr-2" title={user.name || user.email}>
                    {user.name || user.email.split('@')[0]}
                  </h3>
                  <p className="text-sm text-gray-500 truncate" title={user.email}>{user.email}</p>
                  <div className="flex items-center text-[10px] font-black uppercase mt-2 px-2 py-0.5 rounded bg-blue-50 text-blue-600 w-max tracking-widest border border-blue-100">
                    <FiShield className="mr-1" /> {user.role || 'Unknown'}
                  </div>
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

      {/* User Activity Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="font-black text-lg text-gray-800 flex items-center">
                  <FiActivity className="mr-2 text-blue-500" /> Recent Activity
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">{selectedUser}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors self-start"
              >
                <FiX className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                  <div className="animate-spin h-10 w-10 border-4 border-gray-200 border-t-blue-500 rounded-full"></div>
                  <p className="text-gray-500 font-medium text-sm animate-pulse">Loading activity logs...</p>
                </div>
              ) : userLogs.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-gray-100">
                  <FiActivity className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No recent audit logs found for this user.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userLogs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                        {i !== userLogs.length - 1 && <div className="w-px h-full bg-blue-100 my-1"></div>}
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-bold text-gray-800 capitalize">
                            {(() => {
                              const { title } = parseLogDetails(log.user_agent);
                              const isAuth = log.action === 'LOGIN' || log.action === 'LOGOUT';
                              return isAuth ? log.action.replace('AUDIT_', '').replace(/_/g, ' ') : title;
                            })()}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.user_agent && (
                          <div className="mt-2 bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                            <HumanReadableLog logText={log.user_agent} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
