import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa";

function SuperAdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const existingToken = localStorage.getItem('adminToken');
    if (existingToken) {
      navigate('/superadmin', { replace: true });
    }
  }, [navigate]);

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
        name: 'System Admin',
        email: 'lenchosolutions17@gmail.com',
        role: 'superadmin'
      };
      localStorage.setItem('adminToken', 'hardcoded-superadmin-token');
      localStorage.setItem('adminData', JSON.stringify(userInfo));
      localStorage.setItem('loginTimestamp', Date.now().toString());
      navigate('/superadmin', { replace: true });
      setLoading(false);
      return;
    }
    
    setError("Invalid credentials. Please try again.");
    setLoading(false);
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
          <img src="/logo.png" alt="VidyaBarta" className="h-auto w-40 md:w-48 xl:w-56 object-contain" />
        </div>

        <div className="w-full max-w-md mt-10 lg:mt-0">
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight font-headline">System Portal</h2>
            <p className="text-slate-500 text-base">Enter your credentials to access the dashboard.</p>
          </div>

          {error && (
            <div className="p-4 mb-8 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-start text-sm font-medium">
              <FaExclamationCircle className="mt-0.5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                placeholder="admin@vidyabarta.in"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
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

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-16">
            &copy; {new Date().getFullYear()} VidyaBarta Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLogin;
