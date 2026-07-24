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
        <div className="animate-fadeIn max-w-lg mx-auto mt-6">
          <div className="bg-primary p-8 rounded-3xl shadow-xl border border-primary flex flex-col relative transform transition-all">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-6 py-1.5 rounded-full text-label-sm font-bold uppercase tracking-wide shadow-md">
              Trimester {formData.trimester} Dues
            </div>
            
            <h3 className="text-title-lg font-bold text-white mb-1 text-center">Hello, {duesData.student_name}</h3>
            <p className="text-body-sm text-white/80 mb-8 text-center">Here is your fee breakdown</p>

            <p className="text-display-sm font-bold text-white mb-8 text-center border-b border-white/10 pb-8">
              ₹{duesData.total.toFixed(2)}<span className="text-title-sm font-normal text-white/70 ml-1">total due</span>
            </p>

            <ul className="space-y-4 mb-8 flex-1">
              {Object.keys(duesData.breakdown).map(item => (
                <li key={item} className="flex justify-between items-center text-body-md text-white group">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-white/60 group-hover:text-white shrink-0 transition-colors" />
                    <span className="text-white/90 group-hover:text-white transition-colors">{item}</span>
                  </div>
                  <span className="font-bold">₹{duesData.breakdown[item].toFixed(2)}</span>
                </li>
              ))}
              {Object.keys(duesData.breakdown).length === 0 && (
                <li className="text-center text-white/60 py-4 italic text-sm">No fees configured for your class yet.</li>
              )}
            </ul>
            
            {duesData.isPaid && (
              <div className="mb-8 p-4 bg-green-500/20 backdrop-blur border border-green-400/30 text-green-50 rounded-xl font-bold flex justify-center items-center gap-2">
                <FaCheckCircle className="text-xl" />
                Fees Paid for this Trimester
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setDuesData(null)} 
                className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors shadow-sm"
              >
                Back
              </button>
              {duesData.total > 0 && !duesData.isPaid && (
                <button 
                  onClick={handlePay} 
                  disabled={paying} 
                  className="flex-1 py-3 bg-white text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-lg transition-colors disabled:opacity-50"
                >
                  {paying ? <FaSpinner className="animate-spin" /> : <FaRupeeSign />} Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDues;
