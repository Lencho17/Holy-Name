import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLandmark, FaSave, FaSpinner, FaShieldAlt } from 'react-icons/fa';

const BankDetails = ({ apiUrl, token }) => {
  const [formData, setFormData] = useState({
    account_number: '',
    ifsc_code: '',
    account_holder_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [checkingIfsc, setCheckingIfsc] = useState(false);
  const [branchInfo, setBranchInfo] = useState(null);

  const verifyIfsc = async (code) => {
    if (code.length === 11) {
      setCheckingIfsc(true);
      setBranchInfo(null);
      try {
        const res = await axios.get(`https://ifsc.razorpay.com/${code}`);
        setBranchInfo(res.data);
      } catch (err) {
        setBranchInfo({ error: 'Invalid IFSC Code or branch not found' });
      } finally {
        setCheckingIfsc(false);
      }
    } else {
      setBranchInfo(null);
    }
  };

  const handleIfscChange = (e) => {
    const code = e.target.value.toUpperCase();
    setFormData({...formData, ifsc_code: code});
    verifyIfsc(code);
  };

  // Rest of the component logic...
  const fetchBankDetails = async () => {
    try {
      const res = await axios.get(`${apiUrl}/fees/bank-details`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.account_number) {
        setFormData({
          account_number: res.data.account_number,
          ifsc_code: res.data.ifsc_code,
          account_holder_name: res.data.account_holder_name
        });
        if (res.data.ifsc_code) {
          verifyIfsc(res.data.ifsc_code);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, [apiUrl, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (branchInfo?.error) {
      alert('Please enter a valid IFSC code before saving.');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${apiUrl}/fees/bank-details`, formData, { headers: { Authorization: `Bearer ${token}` } });
      alert('Bank details saved securely!');
    } catch (err) {
      alert('Failed to save bank details');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading bank details...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <FaLandmark className="text-9xl text-green-600" />
      </div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <FaLandmark className="text-green-600" /> Settlement Bank Details
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl text-sm">
            Please provide the bank account details where your school's share of the fee collections should be deposited. Payouts are settled automatically based on these details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">Account Holder Name</label>
          <input 
            required 
            type="text" 
            value={formData.account_holder_name} 
            onChange={e => setFormData({...formData, account_holder_name: e.target.value})} 
            className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500" 
            placeholder="e.g. Holy Name High School" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
          <input 
            required 
            type="password" 
            value={formData.account_number} 
            onChange={e => setFormData({...formData, account_number: e.target.value})} 
            className={`w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500 ${branchInfo && !branchInfo.error ? 'border-green-500 ring-1 ring-green-500' : ''}`} 
            placeholder="Enter account number" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">IFSC Code</label>
          <input 
            required 
            type="text" 
            value={formData.ifsc_code} 
            onChange={handleIfscChange} 
            className={`w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500 uppercase ${branchInfo && !branchInfo.error ? 'border-green-500 ring-1 ring-green-500' : ''} ${branchInfo?.error ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
            placeholder="e.g. SBIN0001234" 
            maxLength={11}
          />
          {checkingIfsc && <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><FaSpinner className="animate-spin" /> Verifying IFSC...</p>}
          {branchInfo && !branchInfo.error && (
            <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
              <span className="font-bold">{branchInfo.BANK}</span> - {branchInfo.BRANCH}<br/>
              <span className="text-green-600">{branchInfo.CITY}, {branchInfo.STATE}</span>
            </div>
          )}
          {branchInfo?.error && (
            <p className="mt-2 text-xs text-red-600 font-bold">{branchInfo.error}</p>
          )}
        </div>

        <div className="md:col-span-2 flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FaShieldAlt className="text-green-600 text-xl" />
            <span>Your details are encrypted and securely stored.</span>
          </div>
          <button type="submit" disabled={saving} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Securely Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankDetails;
