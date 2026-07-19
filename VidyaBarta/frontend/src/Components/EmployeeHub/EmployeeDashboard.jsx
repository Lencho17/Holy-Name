import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { EmployeeAuthContext } from '../../context/EmployeeAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeeDashboard = () => {
  const { employee } = useContext(EmployeeAuthContext);
  const [isOnline, setIsOnline] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [duration, setDuration] = useState('00:00:00');
  const [loadingToggle, setLoadingToggle] = useState(false);

  // Fetch current timesheet status on load
  useEffect(() => {
    if (!employee) return;
    
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('employeeToken');
        const res = await axios.get(`${API_URL}/employee-auth/timesheets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Check if latest session is online
        if (res.data && res.data.length > 0) {
          const latest = res.data[0];
          if (latest.status === 'online') {
            setIsOnline(true);
            setSessionStart(new Date(latest.clock_in));
          }
        }
      } catch (error) {
        console.error("Failed to fetch timesheet status", error);
      }
    };
    checkStatus();
  }, [employee]);

  // Live timer updates
  useEffect(() => {
    let interval;
    if (isOnline && sessionStart) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - sessionStart) / 1000); // seconds
        
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        
        setDuration(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      setDuration('00:00:00');
    }
    return () => clearInterval(interval);
  }, [isOnline, sessionStart]);

  const handleToggle = async () => {
    setLoadingToggle(true);
    const token = localStorage.getItem('employeeToken');
    try {
      if (isOnline) {
        // Clock out
        await axios.post(`${API_URL}/employee-auth/clock-out`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsOnline(false);
        setSessionStart(null);
      } else {
        // Clock in
        const res = await axios.post(`${API_URL}/employee-auth/clock-in`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsOnline(true);
        setSessionStart(new Date(res.data.clock_in));
      }
    } catch (error) {
      console.error("Error toggling status", error);
      alert(error.response?.data?.message || "Failed to update status");
    }
    setLoadingToggle(false);
  };

  if (!employee) return null;

  return (
    <div className="space-y-6">
      
      {/* Online/Offline Toggle Header */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral">Work Status</h2>
          <p className="text-on-surface-variant">
            {isOnline 
              ? "You are currently online and your time is being tracked."
              : "You are currently offline. Clock in to start tracking your time."}
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface-variant uppercase">Current Session</p>
            <p className={`text-2xl font-bold font-mono ${isOnline ? 'text-emerald-600' : 'text-neutral'}`}>
              {duration}
            </p>
          </div>
          <button 
            onClick={handleToggle}
            disabled={loadingToggle}
            className={`px-8 py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:transform-none shadow-lg
              ${isOnline ? 'bg-error hover:bg-error/90 shadow-error/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}
            `}
          >
            {loadingToggle ? 'Updating...' : (isOnline ? 'Clock Out' : 'Clock In')}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
        <h2 className="text-2xl font-bold text-neutral mb-2">My Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Full Name</p>
              <p className="text-lg text-neutral font-medium">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Email Address</p>
              <p className="text-lg text-neutral font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Role</p>
              <p className="text-lg text-primary font-bold capitalize bg-primary/10 inline-block px-3 py-1 rounded-lg mt-1">{employee.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Phone</p>
              <p className="text-lg text-neutral font-medium">{employee.phone || 'Not Provided'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Date of Birth</p>
              <p className="text-lg text-neutral font-medium">{employee.dob ? new Date(employee.dob).toLocaleDateString() : 'Not Provided'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Address</p>
              <p className="text-lg text-neutral font-medium">{employee.address || 'Not Provided'}</p>
            </div>
          </div>
          
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
        <h2 className="text-xl font-bold text-neutral mb-4">Compensation Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Payment Type</p>
            <p className="text-lg text-neutral font-medium capitalize">{employee.payment_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Salary Amount</p>
            <p className="text-lg font-bold text-emerald-600">{employee.salary_amount ? `₹${employee.salary_amount}` : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 text-center">
        <h3 className="text-lg font-bold text-primary mb-2">Welcome to the Hub</h3>
        <p className="text-on-surface-variant">Your specific internal tools and responsibilities will appear here based on your role ({employee.role}).</p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
