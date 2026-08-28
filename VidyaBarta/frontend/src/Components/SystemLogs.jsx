import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiClock, FiUser, FiActivity, FiMapPin, FiRefreshCw, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { HumanReadableLog, parseLogDetails } from '../utils/logFormatter';

export default function SystemLogs({ API_URL, adminUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/system/logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('employeeToken')}` }
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

      {(() => {
        // We include predefined actions plus any dynamically found ones
        const predefinedActions = ['LOGIN', 'LOGOUT', 'UPDATE', 'DELETE', 'CREATE', 'SETTINGS_CHANGE'];
        const dynamicActions = logs.map(l => (l.action || '').replace('AUDIT_', '')).filter(Boolean);
        const uniqueActions = ['All', ...new Set([...predefinedActions, ...dynamicActions])];
        
        const filteredLogs = logs.filter(log => {
          if (filterAction !== 'All' && (log.action || '').replace('AUDIT_', '') !== filterAction) return false;
          if (filterUser && !(log.email || '').toLowerCase().includes(filterUser.toLowerCase())) return false;
          if (filterDate) {
            const logDate = new Date(log.created_at).toISOString().split('T')[0];
            if (logDate !== filterDate) return false;
          }
          return true;
        }).sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-wrap">
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Search User</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Email address..." 
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-56 transition-all"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter by Action</label>
                  <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                      className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white w-full sm:w-48 transition-all cursor-pointer"
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                    >
                      {uniqueActions.map(act => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Filter by Date</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-48 transition-all"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col w-full md:w-auto mt-2 md:mt-0">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 hidden md:block">&nbsp;</label>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors bg-white font-bold text-gray-700 w-full shadow-sm"
                >
                  <FiClock className="mr-2 text-primary" />
                  {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  {sortOrder === 'desc' ? <FiChevronDown className="ml-2" /> : <FiChevronUp className="ml-2" />}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {loading && logs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading system logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiFilter className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-800">No logs found matching your filters.</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria.</p>
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
                      {filteredLogs.map(log => (
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
                      {(() => {
                        const { title } = parseLogDetails(log.user_agent);
                        const isAuth = log.action === 'LOGIN' || log.action === 'LOGOUT';
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                            log.action === 'LOGOUT' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {isAuth ? log.action : title}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      <div className="flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" />
                        {log.ip_address}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-700 bg-gray-50/80 rounded-xl m-2 border border-gray-100">
                      <HumanReadableLog logText={log.user_agent} />
                    </td>
                  </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
