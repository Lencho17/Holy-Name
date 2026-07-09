import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaUser, FaEnvelope, FaPhone, FaLock, FaExclamationCircle } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

import axios from 'axios';

function StaffSignUp() {
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
      await axios.post(`${apiBase}/auth/apply-staff`, {
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
      await axios.post(`${apiBase}/auth/verify-staff-otp`, {
        email: username,
        otp: otp
      });
      
      alert("OTP verified successfully. A temporary password has been sent to your email. The admin will review your request before you can log in.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Image Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative">
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10"></div>
        <img
          src="/modern_classroom.png"
          alt="Modern Classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Text Overlay */}
        <div className="relative z-20 flex flex-col justify-end h-full w-full p-12 xl:p-16">
          <div className="mt-auto">
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight font-headline">
              Welcome to {schoolProfile?.name || "School"}
            </h1>
            <p className="text-slate-200 text-lg leading-relaxed max-w-md">
              Join our educational ecosystem. Fill in your details to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        {/* Top Right Logo */}
        <div className="absolute top-8 right-8 xl:top-12 xl:right-12">
          {schoolProfile?.logo ? (
             <img src={schoolProfile.logo} alt={schoolProfile.name} className="h-auto w-32 md:w-40 xl:w-48 object-contain" />
          ) : (
             <img src="/logo.png" alt="VidyaBarta" className="h-auto w-40 md:w-48 xl:w-56 object-contain" />
          )}
        </div>
        
        <div className="w-full max-w-md mt-10 lg:mt-0">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight font-headline">Staff Sign Up</h2>
            <p className="text-slate-500 text-base">Create an account to access the staff portal.</p>
          </div>
          
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
              <Link to="/login" className="text-primary font-bold hover:text-amber-600 transition-colors">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default StaffSignUp;
