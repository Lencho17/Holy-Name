import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSchool, FaBan } from 'react-icons/fa';

const SchoolStatusSettings = ({ apiUrl, token }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [statusMessage, setStatusMessage] = useState('School is open.');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${apiUrl}/settings/school-status`);
        if (res.data) {
          setIsOpen(res.data.is_open);
          setStatusMessage(res.data.status_message || '');
        }
      } catch (err) {
        console.error('Failed to fetch school status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [apiUrl]);

  const handleToggle = async () => {
    const newState = !isOpen;
    const confirmed = window.confirm(`Are you sure you want to mark the school as ${newState ? 'OPEN' : 'CLOSED'}?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      const res = await axios.put(`${apiUrl}/settings/school-status`, {
        isOpen: newState,
        statusMessage: newState ? 'School is open.' : 'School is closed for today/tomorrow.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOpen(res.data.is_open);
      setStatusMessage(res.data.status_message);
      alert(`School status updated to ${newState ? 'OPEN' : 'CLOSED'}`);
    } catch (err) {
      console.error('Failed to update school status:', err);
      alert('Error updating status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading school status...</div>;

  return (
    <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${isOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center`}>
            {isOpen ? <FaSchool size={20} /> : <FaBan size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-gray-800">School Status</h4>
            <p className="text-xs text-gray-500">
              Current status: <span className={`font-bold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>{isOpen ? 'OPEN' : 'CLOSED'}</span>
            </p>
            {!isOpen && <p className="text-[10px] text-red-500 mt-1">{statusMessage}</p>}
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={saving}
          className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
            isOpen
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-100'
            : 'bg-green-500 text-white hover:bg-green-600 shadow-green-100'
          } disabled:opacity-50`}
        >
          {isOpen ? <FaBan /> : <FaSchool />}
          {saving ? 'Saving...' : (isOpen ? 'Mark as Closed' : 'Mark as Open')}
        </button>
      </div>
    </div>
  );
};

export default SchoolStatusSettings;
