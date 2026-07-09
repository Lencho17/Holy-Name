import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ role }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let loginTimestamp = localStorage.getItem('loginTimestamp');
    if (!loginTimestamp) {
      loginTimestamp = Date.now().toString();
      localStorage.setItem('loginTimestamp', loginTimestamp);
    }

    const checkSession = () => {
      const storedTimestamp = localStorage.getItem('loginTimestamp');
      if (!storedTimestamp) return;
      
      const elapsed = Date.now() - parseInt(storedTimestamp, 10);
      const maxDuration = 2 * 60 * 60 * 1000; // 2 hours

      if (elapsed >= maxDuration) {
        alert('Your session has expired (2 hour limit). Please log in again.');
        if (role === 'admin') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          navigate('/login', { replace: true });
        } else if (role === 'staff') {
          localStorage.removeItem('staffToken');
          localStorage.removeItem('staffData');
          navigate('/login', { replace: true });
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('staffToken');
          navigate('/login', { replace: true });
        }
      }
    };

    const interval = setInterval(checkSession, 1000);
    checkSession();

    return () => clearInterval(interval);
  }, [navigate, role]);

  if (role === 'admin') {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      return <Navigate to="/login" replace />;
    }
  } else if (role === 'staff') {
    const staffToken = localStorage.getItem('staffToken');
    if (!staffToken) {
      return <Navigate to="/login" replace />;
    }
  } else {
    // If no specific role is required, check if any token exists
    const token = localStorage.getItem('adminToken') || localStorage.getItem('staffToken');
    if (!token) {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
