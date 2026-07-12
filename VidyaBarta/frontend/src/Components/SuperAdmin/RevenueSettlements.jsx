import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyCheckAlt, FaExchangeAlt, FaLandmark, FaSpinner } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const RevenueSettlements = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/fees/global-revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  const stats = {
    totalGross: transactions.reduce((acc, t) => acc + parseFloat(t.gross_amount), 0),
    totalPlatformFee: transactions.reduce((acc, t) => acc + parseFloat(t.platform_fee_amount), 0),
    totalTxnFee: transactions.reduce((acc, t) => acc + parseFloat(t.transaction_fee_amount), 0),
    totalSettled: transactions.reduce((acc, t) => acc + parseFloat(t.net_to_school), 0),
    totalTransactions: transactions.length
  };

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
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Settled to Schools</p>
              <p className="text-3xl font-black text-green-600">₹{stats.totalSettled.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Global Transaction Ledger</h3>
            
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No transactions recorded across any school.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">School</th>
                      <th className="pb-3">Gross</th>
                      <th className="pb-3 text-blue-600">SaaS Cut (Platform+Txn)</th>
                      <th className="pb-3 text-green-600">Net Settled</th>
                      <th className="pb-3">Gateway Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-4 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
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
            )}
          </div>
        </>
      )}
    </div>
  );
};
