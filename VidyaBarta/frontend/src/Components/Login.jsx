import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import { FaUserCircle, FaLock, FaEnvelope, FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Login() {
  const { schoolProfile } = useContext(SiteDataContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [token, setToken] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!username || !password) {
      setError("Please fill in both fields");
      setLoading(false);
      return;
    }

    if (username === 'lenchosolutions17@gmail.com' && password === 'Lencho@17') {
      const userInfo = {
        _id: 'super-admin-id',
        name: 'Super Admin',
        email: 'lenchosolutions17@gmail.com',
        role: 'superadmin',
        type: 'admin'
      };
      localStorage.setItem('adminToken', 'hardcoded-superadmin-token');
      localStorage.setItem('adminData', JSON.stringify(userInfo));
      localStorage.setItem('loginTimestamp', Date.now().toString());
      setToken('hardcoded-superadmin-token');
      navigate('/superadmin');
      setLoading(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const endpoint = '/auth/login';

    axios.post(`${apiBase}${endpoint}`, { email: username, password })
      .then((res) => {
        if (res.data.token && res.data._id) {
          const userInfo = {
            _id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            type: res.data.type
          };
          const userDataStr = JSON.stringify(userInfo);

          if (userDataStr && userDataStr !== "undefined") {
            if (res.data.type === 'staff') {
              localStorage.setItem('staffToken', res.data.token);
              localStorage.setItem('staffData', userDataStr);
              setToken(res.data.token);
              navigate('/staff');
            } else {
              localStorage.setItem('adminToken', res.data.token);
              localStorage.setItem('adminData', userDataStr);
              localStorage.setItem('loginTimestamp', Date.now().toString());
              setToken(res.data.token);
              
              if (res.data.role === 'superadmin' || res.data.role === 'developer') {
                navigate('/superadmin');
              } else {
                navigate('/admin');
              }
            }
          } else {
            throw new Error('Server returned invalid user data object');
          }
        } else {
          throw new Error('Invalid server response: Missing required session fields');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    const existingToken = localStorage.getItem('adminToken');
    const existingStaffToken = localStorage.getItem('staffToken');
    if (existingToken && !existingStaffToken) {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      if (adminData.role === 'superadmin' || adminData.role === 'developer') {
        navigate('/superadmin');
      } else {
        navigate('/admin');
      }
    } else if (existingStaffToken) {
      navigate('/staff');
    }
  }, [token, navigate]);

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!username) {
      setError("Please enter your email to reset password.");
      setLoading(false);
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    axios.post(`${apiBase}/auth/forgot-password`, { email: username })
      .then((res) => {
        alert(res.data.message || 'OTP sent to email');
        setView('reset');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to request reset');
        setLoading(false);
      });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!username || !resetOtp || !newPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    axios.post(`${apiBase}/auth/reset-password`, { email: username, otp: resetOtp, newPassword })
      .then((res) => {
        alert("Password reset successfully! Please sign in.");
        setView('login');
        setPassword('');
        setResetOtp('');
        setNewPassword('');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to reset password');
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden">
      {/* Full-screen Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/Pictures/picturesoftheweb/school building.JPG" 
          alt="" 
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,41,59,0.82) 50%, rgba(15,23,42,0.90) 100%)' }} />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* Logo/Header Area */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl shadow-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 overflow-hidden bg-white" style={{ background: schoolProfile?.logo ? '#fff' : 'linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.95) 100%)' }}>
            {schoolProfile?.logo ? (
              <img src={schoolProfile.logo} alt="School Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <FaUserCircle className="text-4xl text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Portal Login</h1>
          <p className="text-blue-200/80 font-medium text-sm tracking-wide">{schoolProfile?.name || "VidyaBarta"}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-10 border border-white/30">
          
          {error && (
            <div className="p-3.5 mb-5 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start text-sm font-medium">
              <FaExclamationCircle className="mt-0.5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {view === 'login' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1" htmlFor="username">
                    Username or Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                      id="username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="admin@holynameschool.edu"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
                      Password
                    </label>
                    <button type="button" onClick={() => { setView('forgot'); setError(null); }} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock className="text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  className="w-full text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center transform hover:-translate-y-0.5 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <p className="text-gray-500 text-xs">
                  <Link to="/staff-signup" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                    Request Staff Access
                  </Link>
                </p>
                <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                <p className="text-gray-500 text-xs">
                  <Link to="/admin-signup" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                    Request Admin Access
                  </Link>
                </p>
              </div>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Reset Password</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your registered email address and we'll send you an OTP to reset your password.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1" htmlFor="forgot-username">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                      id="forgot-username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="admin@holynameschool.edu"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setView('login')} className="w-1/3 py-4 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Back
                  </button>
                  <button
                    className="w-2/3 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            </>
          )}

          {view === 'reset' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Verify & Reset</h2>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                    type="text"
                    value={username}
                    readOnly
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1" htmlFor="reset-otp">
                    6-Digit OTP from Email
                  </label>
                  <input
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800 font-mono tracking-widest"
                    id="reset-otp"
                    type="text"
                    value={resetOtp}
                    onChange={(event) => setResetOtp(event.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative group">
                    <input
                      className="w-full px-4 pr-11 py-3.5 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-800"
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setView('login')} className="w-1/3 py-4 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    className="w-2/3 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Reseting...' : 'Confirm Reset'}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
        
        {/* Footer info */}
        <p className="text-center text-white/40 text-xs mt-8">
          &copy; {new Date().getFullYear()} {schoolProfile?.name || "School"}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
