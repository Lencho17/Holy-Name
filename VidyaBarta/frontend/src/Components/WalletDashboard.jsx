import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWallet, FaRupeeSign, FaHistory, FaSpinner, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';

const WalletDashboard = ({ apiUrl, token }) => {
  const [data, setData] = useState({ balance: 0, totalEarnings: 0, payouts: [] });
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processing, setProcessing] = useState(false);

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

    try {
      setProcessing(true);
      const res = await axios.post(`${apiUrl}/wallet/payout`, { amount: payoutAmount }, { headers: { Authorization: `Bearer ${token}` } });
      alert(res.data.message);
      setPayoutAmount('');
      fetchWallet(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payout');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><FaSpinner className="animate-spin text-3xl text-blue-500" /></div>;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <FaWallet className="text-blue-600 text-3xl" />
        <div>
          <h2 className="text-2xl font-black text-gray-800">Escrow Wallet & Payouts</h2>
          <p className="text-sm text-gray-500 font-medium">Manage your fee collections and request cash-outs to your bank account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Balances Card */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <p className="text-blue-200 font-bold tracking-widest text-sm uppercase mb-2">Available Balance (Escrow)</p>
            <h3 className="text-5xl font-black mb-6 flex items-center">
              <FaRupeeSign className="text-3xl mr-1 opacity-80" />
              {data.balance.toLocaleString()}
            </h3>
            
            <div className="pt-6 border-t border-blue-700/50 flex justify-between items-end">
              <div>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">Total Lifetime Earnings</p>
                <p className="text-xl font-bold flex items-center">
                  <FaRupeeSign className="text-sm mr-1 opacity-70" />
                  {data.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Request Form */}
        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex flex-col justify-center">
          <h3 className="font-black text-gray-800 text-xl mb-4">Request Cash-out</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
            Transfer funds from your platform wallet directly to your registered school bank account via NEFT/RTGS. You will receive an email confirmation instantly.
          </p>
          
          <form onSubmit={handlePayout} className="space-y-4">
            <div className="relative">
              <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="number" 
                value={payoutAmount} 
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder="Enter amount to withdraw" 
                className="w-full pl-10 pr-4 py-4 rounded-xl border border-gray-200 font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                max={data.balance}
                min="100"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={processing || data.balance < 100}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {processing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              {processing ? 'Processing Transfer...' : 'Initiate NEFT/RTGS Transfer'}
            </button>
            {data.balance < 100 && <p className="text-xs text-red-500 text-center font-bold">Minimum cash-out amount is ₹100</p>}
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
          <FaHistory className="text-gray-400" /> Payout History
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.payouts.length > 0 ? data.payouts.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 text-sm font-medium text-gray-700">
                    {new Date(p.requested_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-bold text-gray-800 flex items-center">
                    <FaRupeeSign className="text-xs text-gray-500 mr-1" /> {p.amount.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <FaCheckCircle /> {p.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-400 font-medium">No cash-out history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
