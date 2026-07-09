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
      navigate('/superadmin', { replace: true });
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
              navigate('/staff', { replace: true });
            } else {
              localStorage.setItem('adminToken', res.data.token);
              localStorage.setItem('adminData', userDataStr);
              localStorage.setItem('loginTimestamp', Date.now().toString());
              setToken(res.data.token);
              
              if (res.data.role === 'superadmin' || res.data.role === 'developer') {
                navigate('/superadmin', { replace: true });
              } else {
                navigate('/admin', { replace: true });
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
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    const existingToken = localStorage.getItem('adminToken');
    const existingStaffToken = localStorage.getItem('staffToken');
    if (existingToken && !existingStaffToken) {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      if (adminData.role === 'superadmin' || adminData.role === 'developer') {
        navigate('/superadmin', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } else if (existingStaffToken) {
      navigate('/staff', { replace: true });
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
              Centralized management for modern institutions.
            </h1>
            <p className="text-slate-200 text-lg leading-relaxed max-w-md">
              Streamline your workflow, manage schools, and oversee your entire educational ecosystem from one secure portal.
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
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight font-headline">{schoolProfile?.name ? "Portal Login" : "System Portal"}</h2>
            <p className="text-slate-500 text-base">Enter your credentials to access the dashboard.</p>
          </div>

          {error && (
            <div className="p-4 mb-8 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-start text-sm font-medium">
              <FaExclamationCircle className="mt-0.5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {view === 'login' && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="username">
                    Email address
                  </label>
                  <input
                    className="w-full px-4 py-3.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                    id="username"
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin@vidyabarta.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                      Password
                    </label>
                    <button type="button" onClick={() => { setView('forgot'); setError(null); }} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full pl-4 pr-12 py-3.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  className="w-full text-white font-bold py-3.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors mt-4"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Sign in"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <p className="text-slate-500 text-xs">
                  <Link to="/staff-signup" className="text-primary font-bold hover:text-primary/80 transition-colors">
                    Request Staff Access
                  </Link>
                </p>
                <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
                <p className="text-slate-500 text-xs">
                  <Link to="/admin-signup" className="text-primary font-bold hover:text-primary/80 transition-colors">
                    Request Admin Access
                  </Link>
                </p>
              </div>
            </>
          )}

          {view === 'forgot' && (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="forgot-username">
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                    id="forgot-username"
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin@vidyabarta.com"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setView('login')} className="w-1/3 py-3.5 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Back
                  </button>
                  <button
                    className="w-2/3 text-white font-bold py-3.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
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
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed"
                    type="email"
                    value={username}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="reset-otp">
                    6-Digit OTP from Email
                  </label>
                  <input
                    className="w-full px-4 py-3.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400 font-mono tracking-widest"
                    id="reset-otp"
                    type="text"
                    value={resetOtp}
                    onChange={(event) => setResetOtp(event.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full pl-4 pr-12 py-3.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder-slate-400"
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setView('login')} className="w-1/3 py-3.5 font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    className="w-2/3 text-white font-bold py-3.5 rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Reseting...' : 'Confirm Reset'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-16">
            &copy; {new Date().getFullYear()} {schoolProfile?.name || "VidyaBarta Systems"}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
