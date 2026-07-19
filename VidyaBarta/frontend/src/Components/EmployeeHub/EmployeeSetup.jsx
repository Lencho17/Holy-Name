import React, { useState, useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EmployeeAuthContext } from '../../context/EmployeeAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeeSetup = () => {
  const { employee, setEmployee } = useContext(EmployeeAuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    address: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData(prev => ({
        ...prev,
        phone: employee.phone || '',
        dob: employee.dob ? employee.dob.split('T')[0] : '',
        address: employee.address || ''
      }));
    }
  }, [employee]);

  if (!employee) return <Navigate to="/login" replace />;
  if (!employee.is_first_login) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (formData.newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('employeeToken');
      await axios.post(`${API_URL}/employee-auth/setup-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state to reflect that setup is complete
      setEmployee({ ...employee, is_first_login: false });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-surface rounded-2xl shadow-sm border border-outline-variant p-8 mt-10">
      <h2 className="text-title-lg font-bold text-neutral mb-2">Welcome to Vidyabarta!</h2>
      <p className="text-on-surface-variant mb-6">Since this is your first time logging in, please secure your account by changing your temporary password and completing your profile.</p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-neutral mb-1">New Password *</label>
            <input
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({...formData, dob: e.target.value})}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-neutral mb-1">Address</label>
            <textarea
              rows="3"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-70"
        >
          {isLoading ? 'Saving Profile...' : 'Save & Continue to Dashboard'}
        </button>
      </form>
    </div>
  );
};

export default EmployeeSetup;
