import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const navigate = useNavigate();
  const { API_URL } = useContext(SiteDataContext);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setStatus('failed');
        return;
      }
      try {
        const res = await axios.post(`${API_URL}/fees/verify-payment`, { orderId });
        if (res.data.status === 'SUCCESS' || res.data.status === 'completed') {
          setStatus('success');
        } else {
          setStatus('failed');
        }
      } catch (err) {
        setStatus('failed');
      }
    };
    verifyPayment();
  }, [orderId, API_URL]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 w-full max-w-md text-center">
        {status === 'verifying' && (
          <>
            <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Verifying Payment...</h2>
            <p className="text-gray-500">Please wait while we confirm with SBI ePay.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-8">Your fee payment (Order: {orderId}) has been successfully processed.</p>
            <button 
              onClick={() => navigate('/student-portal')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-500 mb-8">We could not verify your payment. If money was deducted, it will be refunded within 3-5 business days.</p>
            <button 
              onClick={() => navigate('/student-portal')}
              className="w-full py-3 border border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
