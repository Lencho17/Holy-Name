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
    navigate('/adminLogin');
    if (onClick) onClick();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
      {isLoggedIn ? (
        <>
          {location.pathname !== '/admin' && (
            <button
              className="flex items-center justify-center w-full sm:w-auto px-5 py-2 bg-primary text-white rounded-full hover:bg-primary-container transition-colors shadow-sm font-semibold text-sm h-10"
              onClick={handleDashboard}
            >
              <FaUserShield className="mr-2" size={16} />
              Dashboard
            </button>
          )}
          <button
            className="flex items-center justify-center w-full sm:w-auto px-5 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm font-semibold text-sm h-10"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="mr-2" size={16} />
            Logout
          </button>
        </>
      ) : (
        <button
          className="flex items-center justify-center w-full sm:w-auto px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-container transition-colors shadow-md hover:shadow-lg font-medium text-sm"
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
