import React, { useState, useContext } from 'react';
import axios from 'axios';
import { FaFileInvoiceDollar, FaCheckCircle, FaSpinner, FaRupeeSign, FaExclamationCircle } from 'react-icons/fa';
import { SiteDataContext } from "../context/SiteDataContext";
import PaymentCheckout from './PaymentCheckout';

const StudentDues = () => {
  const { API_URL } = useContext(SiteDataContext);
  const [formData, setFormData] = useState({ admissionId: '', contactNumber: '', trimester: '1', isNewAdmission: 'false' });
  const [duesData, setDuesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  const fetchDues = async (e, overrideTrimester = formData.trimester) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('studentToken');
      const res = await axios.get(`${API_URL}/fees/my-dues`, {
        params: { ...formData, trimester: overrideTrimester },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDuesData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dues. Please check your credentials.');
      setDuesData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (token) {
      fetchDues();
    }
  }, []);

  const handlePay = async () => {
    setPaying(true);
    try {
      // Initialize payment with SBI ePay
      const res = await axios.post(`${API_URL}/payments/initiate`, {
        fee_record_id: duesData.fee_record_id,
        amount: duesData.totalAmount,
        student_id: duesData.student_id,
        school_id: duesData.school_id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('studentToken') || 'placeholder'}` }
      });
      
      setCheckoutData(res.data);
    } catch (err) {
      alert('Failed to initiate payment gateway');
    } finally {
      setPaying(false);
    }
  };

  if (checkoutData) {
    return (
      <PaymentCheckout 
        paymentUrl={checkoutData.paymentUrl} 
        encData={checkoutData.encData} 
        merchantId={checkoutData.merchantId} 
      />
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <FaFileInvoiceDollar className="text-3xl text-green-600" />
        <h2 className="text-2xl font-black text-gray-800">My Dues & Payments</h2>
      </div>

      {!duesData ? (
        <form onSubmit={fetchDues} className="max-w-xl">
          <div className="space-y-4 mb-6">
            {!localStorage.getItem('studentToken') && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Admission ID</label>
                  <input required type="text" value={formData.admissionId} onChange={e => setFormData({...formData, admissionId: e.target.value})} className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="e.g. ADM-2026-001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Registered Mobile Number</label>
                  <input required type="text" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="10-digit mobile number" />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Trimester</label>
                <select value={formData.trimester} onChange={e => setFormData({...formData, trimester: e.target.value})} className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500">
                  <option value="1">Trimester 1</option>
                  <option value="2">Trimester 2</option>
                  <option value="3">Trimester 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Admission?</label>
                <select value={formData.isNewAdmission} onChange={e => setFormData({...formData, isNewAdmission: e.target.value})} className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-green-500">
                  <option value="false">No (Returning Student)</option>
                  <option value="true">Yes (New Student)</option>
                </select>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="flex items-start bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6">
              <FaExclamationCircle className="text-xl mr-3 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
            {loading ? <FaSpinner className="animate-spin" /> : <FaFileInvoiceDollar />} Check Dues
          </button>
        </form>
      ) : (
        <div className="animate-fadeIn">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hello, {duesData.student_name}</h3>
            <p className="text-gray-500 text-sm mb-6">Here is your fee breakdown for Trimester {formData.trimester}:</p>
            
            <div className="space-y-3 mb-6">
              {Object.keys(duesData.breakdown).map(item => (
                <div key={item} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">{item}</span>
                  <span className="text-gray-800 font-bold">₹{duesData.breakdown[item].toFixed(2)}</span>
                </div>
              ))}
              {Object.keys(duesData.breakdown).length === 0 && (
                <div className="text-center text-gray-400 py-4 italic">No fees configured for your class yet.</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-black text-gray-800">Total Due Amount</span>
              <span className="text-2xl font-black text-green-600">₹{duesData.total.toFixed(2)}</span>
            </div>
            
            {duesData.isPaid && (
              <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-xl font-bold flex justify-center items-center gap-2 border border-green-200">
                <FaCheckCircle className="text-xl" />
                Fees Paid for this Trimester
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setDuesData(null)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
              Back
            </button>
            {duesData.total > 0 && !duesData.isPaid && (
              <button onClick={handlePay} disabled={paying} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                {paying ? <FaSpinner className="animate-spin" /> : <FaRupeeSign />} Pay with UPI / SBI Epay
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDues;
