import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaWallet, FaRupeeSign, FaHistory, FaSpinner, FaPaperPlane,
  FaCheckCircle, FaArrowDown, FaArrowUp, FaExchangeAlt,
  FaTimesCircle, FaClock, FaReceipt, FaChevronRight
} from 'react-icons/fa';

const WalletDashboard = ({ apiUrl, token }) => {
  const [data, setData] = useState({ balance: 0, totalEarnings: 0, totalPayouts: 0, payouts: [], ledger: [] });
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger');
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handlePayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || payoutAmount <= 0) return alert('Enter a valid amount');
    if (payoutAmount > data.balance) return alert('Insufficient balance');
    if (payoutAmount < 100) return alert('Minimum payout amount is ₹100');
    setShowConfirm(true);
  };

  const confirmPayout = async () => {
    try {
      setProcessing(true);
      setShowConfirm(false);
      const res = await axios.post(`${apiUrl}/wallet/payout`, { amount: payoutAmount }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setPayoutAmount('');
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payout');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-700',
      Approved: 'bg-emerald-100 text-emerald-700',
      Processed: 'bg-emerald-100 text-emerald-700',
      Rejected: 'bg-red-100 text-red-700',
    };
    const icons = {
      Pending: <FaClock className="text-[10px]" />,
      Approved: <FaCheckCircle className="text-[10px]" />,
      Processed: <FaCheckCircle className="text-[10px]" />,
      Rejected: <FaTimesCircle className="text-[10px]" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center p-16">
      <div className="text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading wallet data...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8 border-b pb-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
          <FaWallet className="text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800">Escrow Wallet & Payouts</h2>
          <p className="text-sm text-gray-500 font-medium">Manage your fee collections and request cash-outs to your bank account.</p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-7 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-[0.03] rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white opacity-[0.03] rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <p className="text-blue-200 font-bold tracking-widest text-[10px] uppercase mb-3">Available Balance</p>
            <h3 className="text-4xl font-black flex items-center">
              <FaRupeeSign className="text-2xl mr-1 opacity-80" />
              {Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <FaArrowDown className="text-sm" />
          </div>
          <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-3">Total Earnings</p>
          <h3 className="text-3xl font-black text-gray-800 flex items-center">
            <FaRupeeSign className="text-lg mr-1 text-gray-400" />
            {Number(data.totalEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Lifetime net collections</p>
        </div>

        {/* Total Payouts */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
            <FaArrowUp className="text-sm" />
          </div>
          <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase mb-3">Total Payouts</p>
          <h3 className="text-3xl font-black text-gray-800 flex items-center">
            <FaRupeeSign className="text-lg mr-1 text-gray-400" />
            {Number(data.totalPayouts).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Approved withdrawals</p>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl">
        {[
          { key: 'ledger', label: 'Wallet Ledger', icon: <FaReceipt /> },
          { key: 'payouts', label: 'Payout History', icon: <FaHistory /> },
          { key: 'cashout', label: 'Request Cash-out', icon: <FaPaperPlane /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Wallet Ledger Tab ── */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {data.ledger.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.ledger.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      entry.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {entry.type === 'credit' ? <FaArrowDown className="text-sm" /> : <FaArrowUp className="text-sm" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{entry.description || (entry.type === 'credit' ? 'Funds credited' : 'Funds debited')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + new Date(entry?.created_at || new Date()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {entry.reference_type && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {entry.reference_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-base ${entry.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {entry.type === 'credit' ? '+' : '-'}₹{Number(entry.amount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                      Bal: ₹{Number(entry.balance_after).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mb-4">
                <FaReceipt className="text-2xl" />
              </div>
              <p className="text-gray-400 font-bold mb-1">No transactions yet</p>
              <p className="text-gray-400 text-sm">Wallet activity will appear here once fee payments begin.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Payout History Tab ── */}
      {activeTab === 'payouts' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {data.payouts.length > 0 ? data.payouts.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 text-sm font-medium text-gray-700">
                    {new Date(p.requested_at).toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + new Date(p?.requested_at || new Date()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-bold text-gray-800 flex items-center">
                    <FaRupeeSign className="text-xs text-gray-500 mr-1" /> {Number(p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">{getStatusBadge(p.status)}</td>
                  <td className="p-4 text-sm text-gray-500 hidden md:table-cell">{p.admin_note || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mb-4">
                      <FaHistory className="text-2xl" />
                    </div>
                    <p className="text-gray-400 font-bold">No cash-out history found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Cash-out Tab ── */}
      {activeTab === 'cashout' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
            <h3 className="font-black text-gray-800 text-xl mb-3">Request Cash-out</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              Transfer funds from your platform wallet directly to your registered school bank account via NEFT/RTGS. Your request will be reviewed and processed within 24 hours.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <FaWallet className="text-blue-600 text-xl shrink-0" />
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Available for withdrawal</p>
                <p className="text-2xl font-black text-blue-800 flex items-center mt-0.5">
                  <FaRupeeSign className="text-lg mr-0.5" />
                  {Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <form onSubmit={handlePayout} className="space-y-4">
              <div className="relative">
                <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full pl-10 pr-4 py-4 rounded-xl border border-gray-200 font-bold focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
                  max={data.balance}
                  min="100"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={processing || data.balance < 100}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              >
                {processing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                {processing ? 'Submitting Request...' : 'Submit Payout Request'}
              </button>
              {data.balance < 100 && (
                <p className="text-xs text-red-500 text-center font-bold">Minimum cash-out amount is ₹100</p>
              )}
              <p className="text-xs text-gray-400 text-center font-medium">
                Payouts require approval and are typically processed within 24 hours.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6">
              <FaExchangeAlt className="text-2xl" />
            </div>
            <h3 className="text-xl font-black text-gray-800 text-center mb-2">Confirm Payout Request</h3>
            <p className="text-gray-500 text-center mb-6 font-medium">
              You are requesting a withdrawal of <strong className="text-gray-800">₹{Number(payoutAmount).toLocaleString('en-IN')}</strong> to your registered bank account.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Balance</span>
                <span className="font-bold text-gray-800">₹{Number(data.balance).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Withdrawal Amount</span>
                <span className="font-bold text-red-500">-₹{Number(payoutAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-500">Remaining Balance</span>
                <span className="font-bold text-gray-800">₹{(Number(data.balance) - Number(payoutAmount)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayout}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;
