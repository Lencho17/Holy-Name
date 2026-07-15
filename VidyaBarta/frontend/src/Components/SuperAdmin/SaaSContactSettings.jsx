import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SaaSContactSettings() {
  const [settings, setSettings] = useState({
    contact_email: '',
    contact_phone: '',
    contact_address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiBase}/saas-settings`);
        setSettings(res.data);
      } catch (error) {
        console.error('Failed to fetch contact settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put(`${apiBase}/saas-settings`, settings);
      alert('Contact settings updated successfully');
    } catch (error) {
      console.error('Error saving contact settings', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Contact Us Settings</h2>
      <p className="text-gray-600 mb-8">Update the global contact information displayed on the VidyaBarta SaaS marketing website.</p>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Contact Email Address</label>
          <input 
            type="email" 
            required 
            value={settings.contact_email} 
            onChange={e => setSettings({...settings, contact_email: e.target.value})} 
            className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            placeholder="sales@vidyabarta.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Contact Phone Number</label>
          <input 
            type="text" 
            required 
            value={settings.contact_phone} 
            onChange={e => setSettings({...settings, contact_phone: e.target.value})} 
            className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Physical Address (Optional)</label>
          <textarea 
            rows="3"
            value={settings.contact_address || ''} 
            onChange={e => setSettings({...settings, contact_address: e.target.value})} 
            className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
            placeholder="123 Education Street, City"
          ></textarea>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
