import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyCheckAlt, FaLandmark, FaExchangeAlt, FaSpinner, FaFileInvoiceDollar, FaBullhorn } from 'react-icons/fa';
import FeeConfiguration from './FeeConfiguration';
import BankDetails from './BankDetails';
import ReadmissionCampaign from './ReadmissionCampaign';

const FeeManagement = ({ apiUrl, token }) => {
  const [activeTab, setActiveTab] = useState('configuration');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/fees/transactions`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, apiUrl, token]);

  const stats = {
    totalGross: transactions.reduce((acc, t) => acc + parseFloat(t.gross_amount), 0),
    totalNet: transactions.reduce((acc, t) => acc + parseFloat(t.net_to_school), 0),
    totalTransactions: transactions.length
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Fee Management</h2>
          <p className="text-gray-500 mt-2">Configure fee structures and manage payouts.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('configuration')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'configuration' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FaMoneyCheckAlt className="inline mr-2" /> Fee Structure
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'bank' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FaLandmark className="inline mr-2" /> Bank Details
        </button>
        <button
          onClick={() => setActiveTab('readmission')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'readmission' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FaBullhorn className="inline mr-2" /> Readmissions
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <FaExchangeAlt className="inline mr-2" /> Transactions
        </button>
      </div>

      {activeTab === 'configuration' && <FeeConfiguration apiUrl={apiUrl} token={token} />}
      {activeTab === 'bank' && <BankDetails apiUrl={apiUrl} token={token} />}
      {activeTab === 'readmission' && <ReadmissionCampaign apiUrl={apiUrl} token={token} />}
      
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                <FaFileInvoiceDollar />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Transactions</p>
                <p className="text-2xl font-black text-gray-800">{stats.totalTransactions}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                <FaExchangeAlt />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gross Volume</p>
                <p className="text-2xl font-black text-gray-800">₹{stats.totalGross.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl">
                <FaLandmark />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Net Payout to Bank</p>
                <p className="text-2xl font-black text-gray-800">₹{stats.totalNet.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Recent Transactions</h3>
            {loading ? (
              <div className="py-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Student</th>
                      <th className="pb-3">Gross Amount</th>
                      <th className="pb-3 text-red-500">Platform Deduction</th>
                      <th className="pb-3 text-green-600">Net to School</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-4 text-gray-600">{new Date(t.created_at).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}</td>
                        <td className="py-4 font-bold text-gray-800">{t.students?.student_name} <span className="text-xs text-gray-400 font-normal ml-1">(Class {t.students?.grade})</span></td>
                        <td className="py-4 text-gray-700">₹{parseFloat(t.gross_amount).toFixed(2)}</td>
                        <td className="py-4 text-red-500">-₹{(parseFloat(t.platform_fee_amount) + parseFloat(t.transaction_fee_amount)).toFixed(2)}</td>
                        <td className="py-4 font-bold text-green-600">₹{parseFloat(t.net_to_school).toFixed(2)}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            t.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
