import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeePayouts = () => {
  const [payoutData, setPayoutData] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('employeeToken');
        const [payoutRes, timesheetsRes] = await Promise.all([
          axios.get(`${API_URL}/employee-auth/payout`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/employee-auth/timesheets`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setPayoutData(payoutRes.data);
        setTimesheets(timesheetsRes.data);
      } catch (error) {
        console.error("Failed to fetch payout data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant font-bold animate-pulse">Loading payout details...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Payout Summary Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
        <h2 className="text-2xl font-bold text-neutral mb-6">Current Month Payout</h2>
        
        {payoutData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-primary/5 p-6 rounded-xl border border-primary/10">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Payment Type</p>
              <p className="text-xl font-bold text-neutral capitalize">{payoutData.payment_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Hours Logged</p>
              <p className="text-xl font-bold text-neutral">{payoutData.total_hours} hrs</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Estimated Payout</p>
              <p className="text-3xl font-bold text-emerald-600">₹{payoutData.estimated_payout}</p>
            </div>
          </div>
        )}
      </div>

      {/* Timesheet History */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 overflow-hidden">
        <h3 className="text-xl font-bold text-neutral mb-4">Timesheet History</h3>
        
        {timesheets.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">No timesheet records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant text-on-surface-variant text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold rounded-tl-xl">Date</th>
                  <th className="p-4 font-bold">Clock In</th>
                  <th className="p-4 font-bold">Clock Out</th>
                  <th className="p-4 font-bold">Duration</th>
                  <th className="p-4 font-bold rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {timesheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-surface-variant/50 transition-colors">
                    <td className="p-4 font-medium text-neutral">
                      {new Date(sheet.clock_in).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-on-surface-variant">
                      {new Date(sheet.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-4 text-on-surface-variant">
                      {sheet.clock_out 
                        ? new Date(sheet.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : '-'}
                    </td>
                    <td className="p-4 font-bold text-neutral">
                      {sheet.duration_minutes !== null 
                        ? `${Math.floor(sheet.duration_minutes / 60)}h ${sheet.duration_minutes % 60}m` 
                        : 'Tracking...'}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        sheet.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {sheet.status}
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

export default EmployeePayouts;
