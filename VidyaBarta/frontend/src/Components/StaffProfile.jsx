import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSave, FaUserEdit, FaCamera } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const res = await axios.get(`${API_URL}/staff/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('staffToken');
      const res = await axios.patch(`${API_URL}/staff/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaUserEdit className="text-blue-600" /> Personal Information
        </h3>
        {!editMode ? (
          <button 
            onClick={() => setEditMode(true)}
            className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => { setEditMode(false); setFormData(profile); }}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Photo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden relative group">
              {formData.photo_url ? (
                <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-gray-300">{formData.name?.charAt(0)}</span>
              )}
              {editMode && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <FaCamera className="text-2xl mb-1" />
                  <span className="text-xs font-bold">Update</span>
                </div>
              )}
            </div>
            {editMode && (
              <>
                <input 
                  type="file" 
                  accept="image/*"
                  id="photo-upload"
                  onChange={handlePhotoUpload} 
                  className="hidden"
                />
                <label 
                  htmlFor="photo-upload"
                  className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  Upload Photo
                </label>
              </>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
              {editMode ? (
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="font-medium text-gray-900">{profile.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email (Read Only)</label>
              <p className="font-medium text-gray-500">{profile.email}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
              {editMode ? (
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="font-medium text-gray-900">{profile.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
              {editMode ? (
                <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="font-medium text-gray-900">{profile.gender || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Extended Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-6 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Father's Name</label>
            {editMode ? (
              <input type="text" name="fathers_name" value={formData.fathers_name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.fathers_name || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mother's Name</label>
            {editMode ? (
              <input type="text" name="mothers_name" value={formData.mothers_name || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.mothers_name || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</label>
            {editMode ? (
              <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-') : 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Blood Group</label>
            {editMode ? (
              <select name="blood_group" value={formData.blood_group || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            ) : (
              <p className="font-medium text-gray-900">{profile.blood_group || 'Not provided'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Address</label>
            {editMode ? (
              <textarea name="address" value={formData.address || ''} onChange={handleChange} rows="2" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            ) : (
              <p className="font-medium text-gray-900">{profile.address || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Post Office</label>
            {editMode ? (
              <input type="text" name="post_office" value={formData.post_office || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.post_office || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Police Station</label>
            {editMode ? (
              <input type="text" name="police_station" value={formData.police_station || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.police_station || 'Not provided'}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">State</label>
                {editMode ? (
                  <input type="text" name="state" value={formData.state || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                ) : (
                  <p className="font-medium text-gray-900">{profile.state || 'N/A'}</p>
                )}
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">PIN Code</label>
                {editMode ? (
                  <input type="text" name="pin_code" value={formData.pin_code || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                ) : (
                  <p className="font-medium text-gray-900">{profile.pin_code || 'N/A'}</p>
                )}
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Job Profile</label>
            {editMode ? (
              <input type="text" name="job_profile" value={formData.job_profile || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.job_profile || 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Joining</label>
            {editMode ? (
              <input type="date" name="date_of_joining" value={formData.date_of_joining || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-') : 'Not provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Experience (Years)</label>
            {editMode ? (
              <input type="number" name="teaching_experience_years" value={formData.teaching_experience_years || ''} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="font-medium text-gray-900">{profile.teaching_experience_years !== null ? profile.teaching_experience_years : 'Not provided'}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
