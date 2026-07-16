// Force reload
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGlobe, FaCheckCircle, FaSpinner, FaTimesCircle, FaLink, FaInfoCircle, FaFileInvoice, FaTimes, FaCheck, FaFileUpload } from 'react-icons/fa';

export const DomainRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Modals state
  const [approveModal, setApproveModal] = useState({ open: false, reqId: null, file: null });
  const [rejectModal, setRejectModal] = useState({ open: false, reqId: null, reason: '' });
  const [submitting, setSubmitting] = useState(false);

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

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveModal.file) return alert('Please upload an invoice file');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('invoice', approveModal.file);

    try {
      await axios.post(`${apiUrl}/superadmin/domains/${approveModal.reqId}/approve`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Domain approved and funds deducted successfully!');
      setApproveModal({ open: false, reqId: null, file: null });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve domain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason) return alert('Please provide a reason for rejection');

    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/superadmin/domains/${rejectModal.reqId}/reject`, { reason: rejectModal.reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Domain request rejected and deleted.');
      setRejectModal({ open: false, reqId: null, reason: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject domain');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><FaSpinner className="animate-spin text-4xl text-primary" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex items-center justify-between mb-8 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <FaGlobe className="text-primary text-3xl" />
          <div>
            <h2 className="text-2xl font-black text-on-surface">Domain Requests</h2>
            <p className="text-sm text-on-surface-variant font-medium">Manage custom domain requests. Approve to deduct funds and upload an invoice.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowInstructions(true)}
          className="bg-surface-variant text-on-surface hover:bg-surface-variant/80 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <FaInfoCircle /> Instructions
        </button>
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
                    req.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {req.status === 'Active' ? <FaCheckCircle /> : <FaSpinner className="animate-spin" />} {req.status}
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {new Date(req.purchased_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold font-mono text-on-surface mb-1 tracking-tight">{req.domain_name}</h3>
                <p className="text-sm text-primary font-medium mb-4">For: {req.schools?.name} ({req.schools?.subdomain}.vidyabarta.com)</p>
              </div>

              <div className="mt-4">
                {req.status !== 'Active' ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setApproveModal({ open: true, reqId: req.id, file: null })}
                      className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button 
                      onClick={() => setRejectModal({ open: true, reqId: req.id, reason: '' })}
                      className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                ) : (
                  req.invoice_url && (
                    <a 
                      href={req.invoice_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full bg-surface-variant text-neutral py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-surface-variant/80 transition-colors"
                    >
                      <FaFileInvoice className="text-primary" /> View Invoice
                    </a>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-md w-full relative shadow-xl border border-outline-variant">
            <button onClick={() => setApproveModal({ open: false, reqId: null, file: null })} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors">
              <FaTimesCircle className="text-2xl" />
            </button>
            <h2 className="text-xl font-black text-neutral mb-2">Approve & Upload Invoice</h2>
            <p className="text-sm text-on-surface-variant mb-6">Approving will deduct the cost from the school's wallet and email them this invoice.</p>
            <form onSubmit={handleApprove}>
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center bg-surface-variant/30 mb-6 relative hover:bg-surface-variant/50 transition-colors">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={e => setApproveModal({...approveModal, file: e.target.files[0]})}
                />
                <FaFileUpload className="text-4xl text-primary mb-3" />
                <p className="text-sm font-bold text-neutral">
                  {approveModal.file ? approveModal.file.name : 'Click to select or drag invoice file here'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">Supports PDF, JPG, PNG</p>
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center gap-2">
                {submitting ? <FaSpinner className="animate-spin" /> : 'Confirm Approval'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-md w-full relative shadow-xl border border-outline-variant">
            <button onClick={() => setRejectModal({ open: false, reqId: null, reason: '' })} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors">
              <FaTimesCircle className="text-2xl" />
            </button>
            <h2 className="text-xl font-black text-neutral mb-2 text-red-600">Reject Domain Request</h2>
            <p className="text-sm text-on-surface-variant mb-6">The request will be deleted and the reason will be emailed to the school.</p>
            <form onSubmit={handleReject}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-neutral mb-2">Reason for rejection</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-white border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="e.g. Domain is no longer available at this price..."
                  value={rejectModal.reason}
                  onChange={e => setRejectModal({...rejectModal, reason: e.target.value})}
                ></textarea>
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm flex justify-center items-center gap-2">
                {submitting ? <FaSpinner className="animate-spin" /> : 'Confirm Rejection'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 max-w-2xl w-full relative shadow-xl border border-outline-variant">
            <button onClick={() => setShowInstructions(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors">
              <FaTimesCircle className="text-2xl" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <FaInfoCircle className="text-primary text-3xl" />
              <h2 className="text-2xl font-black text-on-surface">How to Process Requests</h2>
            </div>
            <div className="space-y-4 text-on-surface-variant">
              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">1</div>
                <p>Go to a domain registrar (like GoDaddy) and purchase the requested domain name.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">2</div>
                <p>Point the DNS (CNAME record) to <code>vidyabarta.com</code>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">3</div>
                <p>Download the invoice from the registrar.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">4</div>
                <p>Click <strong>Approve</strong>, upload the invoice, and the system will deduct the cost from the school's wallet and email them the invoice.</p>
              </div>
            </div>
            <button onClick={() => setShowInstructions(false)} className="mt-8 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
