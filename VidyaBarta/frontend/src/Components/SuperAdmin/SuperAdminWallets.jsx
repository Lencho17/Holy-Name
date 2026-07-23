import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaWallet, FaRupeeSign, FaSpinner, FaCheckCircle,
  FaTimesCircle, FaClock, FaUniversity, FaExchangeAlt,
  FaChevronDown, FaChevronUp, FaSearch
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const SuperAdminWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingId, setProcessingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [expandedPayout, setExpandedPayout] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('adminToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletsRes, payoutsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/wallet/all-wallets`, config),
        axios.get(`${API_URL}/wallet/all-payouts`, config),
        axios.get(`${API_URL}/wallet/summary`, config),
      ]);
      setWallets(walletsRes.data.wallets || []);
      setPayouts(payoutsRes.data.payouts || []);
      setSummary(summaryRes.data || {});
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayoutAction = async (payoutId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this payout request?`)) return;
    
    try {
      setProcessingId(payoutId);
      await axios.patch(`${API_URL}/wallet/payout/${payoutId}/status`, {
        status,
        admin_note: adminNote || undefined
      }, config);
      setAdminNote('');
      setExpandedPayout(null);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} payout`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-700 border-amber-200',
      Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Processed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    const icons = {
      Pending: <FaClock className="text-[10px]" />,
      Approved: <FaCheckCircle className="text-[10px]" />,
      Processed: <FaCheckCircle className="text-[10px]" />,
      Rejected: <FaTimesCircle className="text-[10px]" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const pendingPayouts = payouts.filter(p => p.status === 'Pending');
  const processedPayouts = payouts.filter(p => p.status !== 'Pending');
  
  const filteredWallets = wallets.filter(w =>
    !searchQuery || (w.schools?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.schools?.subdomain || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <div className="flex justify-center items-center p-16">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
            <p className="text-on-surface-variant font-medium">Loading wallet data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-neutral font-headline tracking-tight">Wallets & Payouts</h1>
        <div className="h-1 w-20 bg-primary mt-4 rounded-full"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.03] rounded-full -mr-12 -mt-12"></div>
          <p className="text-blue-200 font-bold tracking-widest text-[10px] uppercase mb-2">Total Escrow Held</p>
          <p className="text-3xl font-black flex items-center">
            <FaRupeeSign className="text-xl mr-1 opacity-80" />
            {Number(summary.totalEscrow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-blue-200 text-xs mt-2 font-medium">{summary.totalWallets || 0} active wallets</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <FaClock />
          </div>
          <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-1">Pending Payouts</p>
          <p className="text-2xl font-black text-gray-800">{summary.pendingPayoutCount || 0}</p>
          <p className="text-xs text-amber-600 font-bold mt-1">
            ₹{Number(summary.pendingPayoutAmount || 0).toLocaleString('en-IN')} awaiting
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <FaCheckCircle />
          </div>
          <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-1">Total Processed</p>
          <p className="text-2xl font-black text-gray-800">
            ₹{Number(summary.totalProcessedPayouts || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-600 font-bold mt-1">Approved & settled</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <FaUniversity />
          </div>
          <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-1">Active Wallets</p>
          <p className="text-2xl font-black text-gray-800">{summary.totalWallets || 0}</p>
          <p className="text-xs text-purple-600 font-bold mt-1">Schools with wallets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl">
        {[
          { key: 'overview', label: 'School Wallets', icon: <FaWallet className="text-sm" /> },
          { key: 'pending', label: `Pending Approvals (${pendingPayouts.length})`, icon: <FaClock className="text-sm" /> },
          { key: 'history', label: 'All Payouts', icon: <FaExchangeAlt className="text-sm" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-neutral'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* School Wallets Overview */}
      {activeTab === 'overview' && (
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant">
            <div className="relative max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">School</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Subdomain</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Wallet Balance</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.length > 0 ? filteredWallets.map(w => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {(w.schools?.name || 'S')[0]}
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{w.schools?.name || 'Unknown School'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-500 font-mono">{w.schools?.subdomain || '—'}</td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-base ${Number(w.balance) > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      ₹{Number(w.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-gray-400 font-medium">
                    {w.last_updated ? new Date(w.last_updated).toLocaleDateString('en-GB').replace(/\//g, '-') : '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-400 font-medium">
                    {searchQuery ? 'No schools match your search.' : 'No school wallets found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingPayouts.length > 0 ? pendingPayouts.map(p => (
            <div key={p.id} className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedPayout(expandedPayout === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FaClock className="text-lg" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{p.schools?.name || 'Unknown School'}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Requested {new Date(p.requested_at).toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + new Date(entry?.created_at || new Date()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-gray-800">
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </span>
                  {expandedPayout === p.id ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                </div>
              </div>

              {expandedPayout === p.id && (
                <div className="p-5 pt-0 border-t border-gray-100">
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Admin Note (Optional)</label>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        placeholder="Add a note for the school admin..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handlePayoutAction(p.id, 'Approved')}
                        disabled={processingId === p.id}
                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        {processingId === p.id ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                        Approve & Process
                      </button>
                      <button
                        onClick={() => handlePayoutAction(p.id, 'Rejected')}
                        disabled={processingId === p.id}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processingId === p.id ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                        Reject & Refund
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-surface rounded-2xl border border-outline-variant p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-2xl" />
              </div>
              <p className="text-gray-800 font-bold mb-1">All caught up!</p>
              <p className="text-gray-500 text-sm font-medium">No pending payout requests to review.</p>
            </div>
          )}
        </div>
      )}

      {/* All Payouts History */}
      {activeTab === 'history' && (
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">School</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Processed By</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length > 0 ? payouts.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    {new Date(p.requested_at).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </td>
                  <td className="p-4 font-bold text-gray-800 text-sm">{p.schools?.name || '—'}</td>
                  <td className="p-4">
                    <span className="font-black text-gray-800 flex items-center">
                      <FaRupeeSign className="text-xs text-gray-400 mr-0.5" />
                      {Number(p.amount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="p-4">{getStatusBadge(p.status)}</td>
                  <td className="p-4 text-sm text-gray-500 hidden md:table-cell">{p.processed_by || '—'}</td>
                  <td className="p-4 text-sm text-gray-500 hidden md:table-cell max-w-[200px] truncate">{p.admin_note || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 font-medium">No payout history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuperAdminWallets;
