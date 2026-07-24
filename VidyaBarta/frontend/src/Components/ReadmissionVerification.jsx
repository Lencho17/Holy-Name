import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { StudentAuthContext } from '../context/StudentAuthContext';
import { FaUserShield, FaExclamationTriangle } from 'react-icons/fa';

const ReadmissionVerification = () => {
  const { API_URL } = useContext(SiteDataContext);
  const { token, student } = useContext(StudentAuthContext);
  
  const [formData, setFormData] = useState({
    contact_number: '',
    email: '',
    address: '',
    guardian_name: '',
    blood_group: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch full student profile
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/students/${student.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        setFormData({
          contact_number: data.contact_number || '',
          email: data.email || '',
          address: data.address || '',
          guardian_name: data.guardian_name || '',
          blood_group: data.blood_group || ''
        });
      } catch (err) {
        setError('Failed to load your profile. Please contact administration.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [API_URL, token, student.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await axios.put(`${API_URL}/student-portal/verify-readmission`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Force reload to refresh auth context and student object
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-8 text-center text-white">
          <FaUserShield className="text-5xl mx-auto mb-4 text-white/90" />
          <h1 className="text-3xl font-bold mb-2">Readmission Verification</h1>
          <p className="text-white/80">Please review and update your details to continue with your readmission.</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-start gap-3">
              <FaExclamationTriangle className="mt-1 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Guardian Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({...formData, guardian_name: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                <input 
                  type="text" 
                  required
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Blood Group</label>
                <input 
                  type="text" 
                  value={formData.blood_group}
                  onChange={(e) => setFormData({...formData, blood_group: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. O+, B-"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Residential Address</label>
                <textarea 
                  required
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>
            </div>
            
            <div className="pt-4 mt-6 border-t border-gray-100 text-center">
              <button 
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Confirm Details & Proceed'}
              </button>
              <p className="text-xs text-gray-400 mt-4">By confirming, you agree that the details provided are accurate.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReadmissionVerification;
