import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGlobe, FaCheckCircle, FaSpinner, FaTimesCircle, FaLink } from 'react-icons/fa';

export const DomainRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/superadmin/domains`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleMarkLinked = async (id) => {
    if (window.confirm('Are you sure? Only do this after you have actually purchased the domain on GoDaddy and configured its DNS records.')) {
      try {
        await axios.patch(`${apiUrl}/superadmin/domains/${id}/status`, { status: 'Linked' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchRequests();
      } catch (err) {
        alert('Failed to update status');
      }
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><FaSpinner className="animate-spin text-4xl text-primary" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-outline-variant pb-4">
        <FaGlobe className="text-primary text-3xl" />
        <div>
          <h2 className="text-2xl font-black text-on-surface">Domain Requests</h2>
          <p className="text-sm text-on-surface-variant font-medium">Manage custom domain requests from schools. Purchase them manually and mark as Linked.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-surface-variant/30 rounded-2xl border border-outline-variant border-dashed">
          <FaGlobe className="text-5xl text-outline mb-4 mx-auto" />
          <h3 className="text-lg font-bold text-on-surface">No Domain Requests</h3>
          <p className="text-on-surface-variant">Schools haven't requested any custom domains yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    req.status === 'Linked' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status === 'Linked' ? <FaCheckCircle /> : <FaSpinner className="animate-spin" />} {req.status}
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {new Date(req.purchased_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold font-mono text-on-surface mb-1 tracking-tight">{req.domain_name}</h3>
                <p className="text-sm text-primary font-medium mb-4">For: {req.schools?.name} ({req.schools?.subdomain}.vidyabarta.com)</p>
              </div>

              {req.status !== 'Linked' && (
                <button 
                  onClick={() => handleMarkLinked(req.id)}
                  className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <FaLink /> Mark as Linked
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
