import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaSignInAlt, FaSignOutAlt, FaClock } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffAttendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const res = await axios.get(`${API_URL}/staff/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePunch = (type) => {
    setPunching(true);
    setLocationStatus('Getting GPS location...');
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setPunching(false);
      setLocationStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationStatus('Verifying location...');
      
      try {
        const token = localStorage.getItem('staffToken');
        await axios.post(`${API_URL}/staff/attendance/punch`, 
          { type, location: { lat: latitude, lng: longitude } },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`Successfully punched ${type}!`);
        fetchAttendance();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to punch attendance');
      } finally {
        setPunching(false);
        setLocationStatus('');
      }
    }, (error) => {
      alert('Unable to retrieve your location. Please allow location access.');
      setPunching(false);
      setLocationStatus('');
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = history.find(h => h.date === todayStr);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaClock className="text-blue-600" /> Attendance Management
        </h3>
      </div>
      
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-center">
          <h4 className="font-bold text-blue-900 mb-2 flex justify-center items-center gap-2">
            <FaMapMarkerAlt /> GPS Attendance System
          </h4>
          <p className="text-sm text-blue-700 mb-6">You must be within 200 meters of the school radius to punch your attendance.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handlePunch('entry')}
              disabled={punching || (todayRecord && todayRecord.entry_time)}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaSignInAlt /> Punch IN (Entry)
            </button>
            <button
              onClick={() => handlePunch('exit')}
              disabled={punching || !todayRecord || todayRecord.exit_time}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaSignOutAlt /> Punch OUT (Exit)
            </button>
          </div>
          {locationStatus && <p className="text-xs text-blue-600 font-bold mt-4 animate-pulse">{locationStatus}</p>}
        </div>

        <h4 className="font-bold text-gray-800 mb-4">Attendance History</h4>
        {loading ? (
          <p className="text-gray-500">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Entry Time</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Exit Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{new Date(record.date).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-md">
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 font-mono">{record.entry_time || '--:--'}</td>
                    <td className="p-4 text-gray-600 font-mono">{record.exit_time || '--:--'}</td>
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

export default StaffAttendance;
