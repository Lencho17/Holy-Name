import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaUser, FaEnvelope, FaPhone, FaLock, FaExclamationCircle } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

import axios from 'axios';

function AdminSignUp() {
  const { schoolProfile } = useContext(SiteDataContext);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simple validation
    if (!name || !username || !contact) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    // Reset error message
    setError("");

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${apiBase}/auth/apply-admin`, {
        name: name,
        email: username,
        phone: contact
      });
      
      setStep(2);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!otp) {
      setError("Please enter the verification code");
      setLoading(false);
      return;
    }

    setError("");

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${apiBase}/auth/verify-admin-otp`, {
        email: username,
        otp: otp
      });
      
      alert("OTP verified successfully. A temporary password has been sent to your email. The superadmin will review your request before you can log in.");
      window.location.href = "/adminLogin";
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-sans relative overflow-hidden py-12">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-primary">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-xl px-6">
        
        {/* Header Area */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <FaUserPlus className="text-4xl text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Create Admin Account</h1>
          <p className="text-white/80 font-medium">{schoolProfile?.name || "School"} Portal</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
          
          <form onSubmit={step === 1 ? handleRequestOtp : handleVerifyOtp} className="space-y-5">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start text-sm font-medium animate-fade-in">
                <FaExclamationCircle className="mt-0.5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1" htmlFor="name">
                        Full Name
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaUser className="text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white:bg-[#1E293B]:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800"
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        />
                    </div>
                    </div>

                    <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1" htmlFor="username">
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaEnvelope className="text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white:bg-[#1E293B]:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800"
                        id="username"
                        type="email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe@example.com"
                        />
                    </div>
                    </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1" htmlFor="contact">
                    Contact Number
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white:bg-[#1E293B]:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800"
                      id="contact"
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <button
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl:shadow-none:shadow-none transition-all flex items-center justify-center transform hover:-translate-y-1 relative overflow-hidden"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm">
                    We've sent a 6-digit verification code to <span className="font-bold text-gray-800">{username}</span>.
                  </p>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1" htmlFor="otp">
                    Verification Code (OTP)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white:bg-[#1E293B]:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 tracking-widest text-center text-xl font-mono"
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all"
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    className="flex-[2] bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center relative overflow-hidden"
                    type="submit"
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Verify & Create Account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-gray-500 text-sm">
              Already have an account?{" "}
              <Link to="/adminLogin" className="text-primary font-bold hover:text-amber-600 transition-colors">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSignUp;
