import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { useNavigate } from 'react-router-dom';
import { StudentAuthContext } from '../context/StudentAuthContext';
import { FaUserGraduate, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';

function StudentLogin() {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const { login } = useContext(StudentAuthContext);
  const { API_URL } = useContext(SiteDataContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/student-auth/schools`);
        setSchools(data);
        if (data.length > 0) setSchoolId(data[0].id);
      } catch (error) {
        console.error("Failed to load schools", error);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, [API_URL]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!rollNumber || !schoolId) {
      setError('Please select a school and enter your Roll Number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/student-auth/reset-password`, {
        rollNumber,
        schoolId
      });
      setSuccessMsg(data.message || 'Password reset instructions have been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (isResetMode) {
      handlePasswordReset(e);
    } else {
      handleLogin(e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!rollNumber || !password || !schoolId) {
      setError('Please select a school and enter both Roll Number and Password.');
      return;
    }

    setLoading(true);
    const result = await login(rollNumber, password, schoolId);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <main className="flex min-h-screen font-body-md bg-background text-on-background">
      {/* Left Side: Immersive Image */}
      <section className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary-container">
        <div className="absolute inset-0 z-0 scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out">
          <img className="w-full h-full object-cover" src="/images/login-bg.png" alt="University Campus"/>
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
        <div className="relative z-20 flex flex-col justify-end p-xl h-full w-full">
          <div className="max-w-md animate-fade-in-up">
            <div className="flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary-fixed text-[40px]" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
              <span className="text-white font-headline-lg text-headline-lg font-bold">VidyaBarta Platform</span>
            </div>
            <h2 className="text-white font-display-lg text-display-lg mb-md leading-tight">Empowering your academic journey.</h2>
            <p className="text-primary-fixed font-body-lg text-body-lg opacity-90">Access your personalized learning environment, institutional resources, and collaborative tools in one precision-engineered portal.</p>
          </div>
        </div>
      </section>
      
      {/* Right Side: Login Form */}
      <section className="w-full lg:w-1/2 bg-surface flex items-center justify-center p-gutter relative">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary text-[32px]" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
          <span className="text-primary font-title-lg text-title-lg font-bold">VidyaBarta Platform</span>
        </div>
        
        <div className="w-full max-w-[440px] space-y-xl z-10">
          {/* Header */}
          <div className="space-y-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {isResetMode ? 'Reset Password' : 'Welcome Back'}
            </h1>
            <p className="text-on-surface-variant font-body-md text-body-md">
              {isResetMode 
                ? 'Enter your institutional credentials below to receive a password reset link to your registered email.'
                : 'Please enter your institutional credentials to access your student portal account.'}
            </p>
          </div>
          
          {/* Form */}
          <form className="space-y-lg" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-lg font-body-sm flex items-start gap-2">
                <span className="material-symbols-outlined">error</span>
                <p>{error}</p>
              </div>
            )}
            
            {successMsg && (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg font-body-sm flex items-start gap-2 border border-green-200">
                <span className="material-symbols-outlined">check_circle</span>
                <p>{successMsg}</p>
              </div>
            )}
            
            {/* School Selection */}
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="school">Select School</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">account_balance</span>
                <select 
                  id="school" 
                  name="school" 
                  required 
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  disabled={loadingSchools}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded focus:border-primary focus:ring-0 text-on-surface appearance-none transition-all focus:shadow-[0_0_0_2px_rgba(0,44,152,0.1)]"
                >
                  {loadingSchools ? (
                    <option value="">Loading schools...</option>
                  ) : (
                    schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">arrow_drop_down</span>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="student-id">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                <input 
                  id="student-id" 
                  name="student-id" 
                  type="email" 
                  required 
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g., student.name@university.edu" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline transition-all focus:shadow-[0_0_0_2px_rgba(0,44,152,0.1)]" 
                />
              </div>
            </div>
            
            {/* Password - Only in Login Mode */}
            {!isResetMode && (
              <div className="space-y-xs">
                <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password (Date of Birth)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="YYYY-MM-DD or DDMMYYYY" 
                    className="w-full pl-10 pr-12 py-3 bg-white border border-outline-variant rounded focus:border-primary focus:ring-0 text-on-surface placeholder:text-outline transition-all focus:shadow-[0_0_0_2px_rgba(0,44,152,0.1)]" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Options */}
            <div className="flex items-center justify-between">
              {!isResetMode ? (
                <>
                  <label className="flex items-center gap-sm cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container cursor-pointer transition-all" />
                    <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface">Remember me</span>
                  </label>
                  <button type="button" onClick={() => { setIsResetMode(true); setError(''); setSuccessMsg(''); }} className="font-label-md text-label-md text-primary hover:underline transition-all">Forgot password?</button>
                </>
              ) : (
                <button type="button" onClick={() => { setIsResetMode(false); setError(''); setSuccessMsg(''); }} className="font-label-md text-label-md text-primary hover:underline transition-all flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Login
                </button>
              )}
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-[48px] bg-primary text-white font-title-lg text-title-lg rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all duration-200 shadow-sm flex items-center justify-center gap-sm group disabled:opacity-70"
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin">progress_activity</span> {isResetMode ? 'Sending...' : 'Authenticating...'}</>
              ) : (
                <>{isResetMode ? 'Send Reset Email' : 'Login'} <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{isResetMode ? 'mail' : 'arrow_forward'}</span></>
              )}
            </button>
          </form>
          
          {/* Footer Support */}
          <div className="pt-lg border-t border-outline-variant flex flex-col items-center gap-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">Having trouble signing in?</p>
            <div className="flex gap-lg">
              <a href="#" className="flex items-center gap-xs font-label-md text-label-md text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">help</span> Help Center
              </a>
              <a href="#" className="flex items-center gap-xs font-label-md text-label-md text-secondary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">support_agent</span> Contact IT
              </a>
            </div>
          </div>
        </div>
        
        {/* Institutional Footnote */}
        <div className="absolute bottom-8 text-center w-full px-gutter z-10 hidden md:block">
          <p className="font-label-md text-label-md text-outline">© 2024 Academic Precision Institutional Systems. All rights reserved.</p>
        </div>
      </section>
    </main>
  );
}

export default StudentLogin;
