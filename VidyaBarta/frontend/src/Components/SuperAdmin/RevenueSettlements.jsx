import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyCheckAlt, FaExchangeAlt, FaLandmark, FaSpinner, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const RevenueSettlements = () => {
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');
  const [processingId, setProcessingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const [revRes, payoutsRes] = await Promise.all([
        axios.get(`${API_URL}/fees/global-revenue`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/wallet/all-payouts`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { payouts: [] } }))
      ]);
      setTransactions(revRes.data || []);
      setPayouts(payoutsRes.data.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayoutStatusUpdate = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this payout as ${status}?`)) return;
    
    try {
      setProcessingId(id);
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_URL}/wallet/payout/${id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state instead of full refetch for better UX
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      alert(`Payout request marked as ${status}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payout status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-700',
      Approved: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-red-100 text-red-700',
    };
    const icons = {
      Pending: <FaClock className="text-[10px]" />,
      Approved: <FaCheckCircle className="text-[10px]" />,
      Rejected: <FaTimesCircle className="text-[10px]" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const stats = {
    totalGross: transactions.reduce((acc, t) => acc + parseFloat(t.gross_amount), 0),
    totalPlatformFee: transactions.reduce((acc, t) => acc + parseFloat(t.platform_fee_amount), 0),
    totalTxnFee: transactions.reduce((acc, t) => acc + parseFloat(t.transaction_fee_amount), 0),
    totalSettled: transactions.reduce((acc, t) => acc + parseFloat(t.net_to_school), 0),
    totalTransactions: transactions.length
  };

  const pendingPayoutCount = payouts.filter(p => p.status === 'Pending').length;
  const totalSaaSRevenue = stats.totalPlatformFee + stats.totalTxnFee;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-neutral font-headline tracking-tight">Revenue & Settlements</h1>
        <div className="h-1 w-20 bg-primary mt-4 rounded-full"></div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading financial data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Gross Volume</p>
              <p className="text-3xl font-black text-gray-800">₹{stats.totalGross.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-2">Across {stats.totalTransactions} transactions</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">SaaS Net Revenue</p>
              <p className="text-3xl font-black text-blue-800">₹{totalSaaSRevenue.toFixed(2)}</p>
              <p className="text-xs text-blue-500 mt-2">Platform + Txn Fees</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Platform Fees Earned</p>
              <p className="text-3xl font-black text-gray-800">₹{stats.totalPlatformFee.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-emerald-100/50">
                <FaMoneyCheckAlt size={80} />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">Pending Withdrawals</p>
              <p className="text-3xl font-black text-amber-600 relative z-10">{pendingPayoutCount}</p>
              <p className="text-xs text-gray-400 mt-2 relative z-10">Requires your attention</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button 
                className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('ledger')}
              >
                Global Ledger
              </button>
              <button 
                className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('requests')}
              >
                Withdrawal Requests
                {pendingPayoutCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingPayoutCount}</span>
                )}
              </button>
            </div>

            {/* Content */}
            {activeTab === 'ledger' ? (
              transactions.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No transactions recorded across any school.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">School</th>
                        <th className="pb-3">Gross</th>
                        <th className="pb-3 text-blue-600">SaaS Cut</th>
                        <th className="pb-3 text-green-600">Net Settled</th>
                        <th className="pb-3">Gateway Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="py-4 text-gray-600">{new Date(t.created_at).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</td>
                          <td className="py-4 font-bold text-gray-800">{t.schools?.name}</td>
                          <td className="py-4 text-gray-700">₹{parseFloat(t.gross_amount).toFixed(2)}</td>
                          <td className="py-4 font-bold text-blue-600">
                            ₹{(parseFloat(t.platform_fee_amount) + parseFloat(t.transaction_fee_amount)).toFixed(2)}
                          </td>
                          <td className="py-4 font-bold text-green-600">₹{parseFloat(t.net_to_school).toFixed(2)}</td>
                          <td className="py-4 font-mono text-[10px] text-gray-400">{t.sbi_reference_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              payouts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FaLandmark className="text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No withdrawal requests found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                        <th className="pb-3">Requested On</th>
                        <th className="pb-3">School Name</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payouts.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 text-gray-600">{new Date(p.requested_at).toLocaleString()}</td>
                          <td className="py-4">
                            <p className="font-bold text-gray-800">{p.schools?.name}</p>
                            <p className="text-xs text-gray-400">{p.schools?.subdomain}.vidyabarta.com</p>
                          </td>
                          <td className="py-4 font-black text-gray-800 text-lg">₹{parseFloat(p.amount).toFixed(2)}</td>
                          <td className="py-4">{getStatusBadge(p.status)}</td>
                          <td className="py-4 text-right">
                            {p.status === 'Pending' ? (
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handlePayoutStatusUpdate(p.id, 'Approved')}
                                  disabled={processingId === p.id}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold text-xs transition-colors border border-emerald-200 disabled:opacity-50"
                                >
                                  {processingId === p.id ? '...' : 'Approve Transfer'}
                                </button>
                                <button 
                                  onClick={() => handlePayoutStatusUpdate(p.id, 'Rejected')}
                                  disabled={processingId === p.id}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-xs transition-colors border border-red-200 disabled:opacity-50"
                                >
                                  {processingId === p.id ? '...' : 'Reject'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};
