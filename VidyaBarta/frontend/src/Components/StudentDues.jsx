import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { FaFileInvoiceDollar, FaCheckCircle, FaSpinner, FaRupeeSign, FaExclamationCircle } from 'react-icons/fa';
import { SiteDataContext } from "../context/SiteDataContext";
import PaymentCheckout from './PaymentCheckout';
import { FiShield } from 'react-icons/fi';

const StudentDues = () => {
  const { API_URL } = useContext(SiteDataContext);
  const [formData, setFormData] = useState({ admissionId: '', contactNumber: '', isNewAdmission: 'false' });
  const [allDues, setAllDues] = useState(null); // Array of 3 items
  const [loading, setLoading] = useState(false);
  const [payingTrimester, setPayingTrimester] = useState(null);
  const [error, setError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  const fetchAllDues = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('studentToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const promises = [1, 2, 3].map(tri => 
        axios.get(`${API_URL}/fees/my-dues`, {
          params: { ...formData, trimester: tri },
          headers
        }).then(res => ({ trimester: tri, data: res.data }))
      );

      const results = await Promise.all(promises);
      setAllDues(results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dues. Please check your credentials.');
      setAllDues(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (token) {
      fetchAllDues();
    }
  }, [formData.isNewAdmission]); // Refetch if they change the new admission toggle while logged in

  const handlePay = async (duesData, trimester) => {
    setPayingTrimester(trimester);
    try {
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
      setPayingTrimester(null);
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

  const token = localStorage.getItem('studentToken');

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <FaFileInvoiceDollar className="text-3xl text-green-600" />
        <h2 className="text-2xl font-black text-gray-800">My Dues & Payments</h2>
      </div>

      {(!allDues || !token) && (
        <form onSubmit={fetchAllDues} className="max-w-xl mb-12">
          <div className="space-y-4 mb-6">
            {!token && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Admission ID</label>
                  <input required type="text" value={formData.admissionId} onChange={e => setFormData({...formData, admissionId: e.target.value})} className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="e.g. ADM-2026-001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Registered Mobile Number</label>
                  <input required type="text" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className="w-full border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="10-digit mobile number" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Are you a new admission this year?</label>
              <select value={formData.isNewAdmission} onChange={e => setFormData({...formData, isNewAdmission: e.target.value})} className="w-full md:w-1/2 border-gray-300 border p-3 rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="false">No (Returning Student)</option>
                <option value="true">Yes (New Student)</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="flex items-start bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6">
              <FaExclamationCircle className="text-xl mr-3 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {!token && (
            <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" /> : <FaFileInvoiceDollar />} Check Dues
            </button>
          )}
        </form>
      )}

      {loading && token && !allDues && (
        <div className="flex items-center justify-center py-20 text-blue-600">
          <FaSpinner className="animate-spin text-4xl" />
        </div>
      )}

      {allDues && (
        <div className="animate-fadeIn mt-8">
          <div className="text-center mb-12">
            <h2 className="text-headline-lg font-bold font-headline text-neutral mb-2">Fee Schedules</h2>
            <p className="text-title-md text-on-surface-variant max-w-2xl mx-auto">
              {allDues[0].data.student_name}'s fee breakdown for the academic year.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {allDues.map(({ trimester, data }) => {
              const isPopular = trimester === 1; // Highlight first trimester or next unpaid
              const CardWrapper = isPopular ? 'div' : 'div';
              const isPaid = data.isPaid;
              const hasNoFees = Object.keys(data.breakdown).length === 0;

              if (isPopular) {
                return (
                  <div key={trimester} className="bg-primary p-8 rounded-3xl shadow-xl border border-primary flex flex-col relative transform md:-translate-y-4">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-label-sm font-bold uppercase tracking-wide">Trimester {trimester}</div>
                    
                    <h3 className="text-title-lg font-bold text-white mb-2">Current Dues</h3>
                    <p className="text-body-sm text-white/80 mb-6">Standard fee schedule for this term.</p>
                    
                    <p className="text-display-sm font-bold text-white mb-6">
                      ₹{data.total.toFixed(2)}<span className="text-title-sm font-normal text-white/80 ml-1">total</span>
                    </p>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                      {Object.keys(data.breakdown).map(item => (
                        <li key={item} className="flex justify-between items-center gap-3 text-body-md text-white">
                          <div className="flex items-center gap-2">
                            <FiShield className="text-white shrink-0" />
                            <span>{item}</span>
                          </div>
                          <span className="font-bold">₹{data.breakdown[item].toFixed(2)}</span>
                        </li>
                      ))}
                      {hasNoFees && (
                        <li className="text-white/70 italic text-sm py-4">No fees configured yet.</li>
                      )}
                    </ul>

                    {isPaid ? (
                      <div className="w-full py-3 rounded-xl bg-white/20 backdrop-blur text-white font-bold flex justify-center items-center gap-2 border border-white/20">
                        <FaCheckCircle /> Paid
                      </div>
                    ) : data.total > 0 ? (
                      <button 
                        onClick={() => handlePay(data, trimester)}
                        disabled={payingTrimester === trimester}
                        className="w-full py-3 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-colors shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        {payingTrimester === trimester ? <FaSpinner className="animate-spin" /> : <FaRupeeSign />} Pay Now
                      </button>
                    ) : (
                      <div className="w-full py-3 rounded-xl bg-white/10 text-white/50 text-center font-bold">No Dues</div>
                    )}
                  </div>
                );
              }

              return (
                <div key={trimester} className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant flex flex-col hover:-translate-y-1 transition-transform duration-300 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-variant text-on-surface-variant border border-outline-variant px-4 py-1 rounded-full text-label-sm font-bold uppercase tracking-wide">Trimester {trimester}</div>
                  
                  <h3 className="text-title-lg font-bold text-neutral mb-2 mt-2">Upcoming Dues</h3>
                  <p className="text-body-sm text-on-surface-variant mb-6">Standard fee schedule for this term.</p>
                  
                  <p className="text-display-sm font-bold text-neutral mb-6">
                    ₹{data.total.toFixed(2)}<span className="text-title-sm font-normal text-on-surface-variant ml-1">total</span>
                  </p>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {Object.keys(data.breakdown).map(item => (
                      <li key={item} className="flex justify-between items-center gap-3 text-body-md text-neutral">
                        <div className="flex items-center gap-2">
                          <FiShield className="text-primary shrink-0" />
                          <span>{item}</span>
                        </div>
                        <span className="font-bold">₹{data.breakdown[item].toFixed(2)}</span>
                      </li>
                    ))}
                    {hasNoFees && (
                      <li className="text-on-surface-variant/70 italic text-sm py-4">No fees configured yet.</li>
                    )}
                  </ul>

                  {isPaid ? (
                    <div className="w-full py-3 rounded-xl bg-green-50 text-green-700 font-bold flex justify-center items-center gap-2 border border-green-200">
                      <FaCheckCircle /> Paid
                    </div>
                  ) : data.total > 0 ? (
                    <button 
                      onClick={() => handlePay(data, trimester)}
                      disabled={payingTrimester === trimester}
                      className="w-full py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {payingTrimester === trimester ? <FaSpinner className="animate-spin" /> : <FaRupeeSign />} Pay Now
                    </button>
                  ) : (
                    <div className="w-full py-3 rounded-xl bg-surface-variant text-on-surface-variant/50 text-center font-bold">No Dues</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDues;
