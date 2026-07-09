import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserShield, FaSignOutAlt } from 'react-icons/fa';

function AdminLoginBtn({ onClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsLoggedIn(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsLoggedIn(false);
    navigate('/');
    if (onClick) onClick();
  };

  const handleDashboard = () => {
    navigate('/admin');
    if (onClick) onClick();
  };

  const handleLogin = () => {
    window.location.href = 'https://www.vidyabarta.com/login';
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
      {isLoggedIn ? (
        <>
          {location.pathname !== '/admin' && (
            <button
              className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-fast font-semibold text-sm h-10 focus-ring dark:hover:bg-blue-600"
              onClick={handleDashboard}
            >
              <FaUserShield className="mr-2" size={16} />
              Dashboard
            </button>
          )}
          <button
            className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg shadow-soft hover:shadow-medium transition-all duration-fast font-semibold text-sm h-10 focus-ring border border-red-200 dark:border-red-800"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="mr-2" size={16} />
            Logout
          </button>
        </>
      ) : (
        <button
          className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-fast font-semibold text-sm h-10 focus-ring dark:hover:bg-blue-600"
          onClick={handleLogin}
        >
          <FaUserShield className="mr-2" size={16} />
          Admin Login
        </button>
      )}
    </div>
  );
}

export default AdminLoginBtn;
