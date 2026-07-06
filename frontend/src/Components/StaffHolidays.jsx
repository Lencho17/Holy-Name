import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaUmbrellaBeach } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const res = await axios.get(`${API_URL}/staff/holidays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHolidays(res.data);
    } catch (err) {
      console.error('Failed to fetch holidays', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading holidays...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <FaUmbrellaBeach className="text-blue-600" />
        <h3 className="text-lg font-bold text-gray-800">School Holiday List</h3>
      </div>
      <div className="p-6">
        {holidays.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No holidays scheduled currently.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Occasion</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holidays.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm font-bold text-gray-800">
                      {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm text-gray-700">{h.name}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        {h.type || 'General'}
                      </span>
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

export default StaffHolidays;
