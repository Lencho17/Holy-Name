import React, { useEffect, useRef } from 'react';
import { FaSpinner, FaShieldAlt } from 'react-icons/fa';

const PaymentCheckout = ({ paymentUrl, encData, merchantId }) => {
  const formRef = useRef(null);

  useEffect(() => {
    // SBI ePay requires a form POST submission with exact parameter names.
    // As soon as this component mounts, we automatically submit the form to redirect the user to the bank's portal.
    if (formRef.current && paymentUrl && encData && merchantId) {
      setTimeout(() => {
        formRef.current.submit();
      }, 1500); // Small delay to let the user see the "Redirecting" message
    }
  }, [paymentUrl, encData, merchantId]);

  if (!paymentUrl || !encData || !merchantId) {
    return (
      <div className="p-12 text-center text-red-500 bg-red-50 rounded-2xl">
        Invalid payment initialization data.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 mt-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-4xl shadow-inner">
          <FaShieldAlt />
        </div>
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-2">Redirecting to Secure Payment Gateway</h2>
      <p className="text-gray-500 mb-8">Please do not refresh the page or click back.</p>
      
      <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-6" />
      
      <div className="text-xs text-gray-400 font-bold tracking-widest uppercase">
        Secured by SBI ePay
      </div>

      {/* Hidden Auto-Submit Form */}
      <form ref={formRef} action={paymentUrl} method="POST" className="hidden">
        <input type="hidden" name="encdata" value={encData} />
        <input type="hidden" name="merchant_id" value={merchantId} />
      </form>
    </div>
  );
};

export default PaymentCheckout;
