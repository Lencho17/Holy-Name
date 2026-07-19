import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const EmployeeAuthContext = createContext();

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('employeeToken');
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/employee-auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEmployee(res.data);
        } catch (error) {
          console.error("Failed to fetch employee", error);
          localStorage.removeItem('employeeToken');
        }
      }
      setLoading(false);
    };

    fetchEmployee();
  }, []);

  const login = (token) => {
    localStorage.setItem('employeeToken', token);
    // Reload to fetch user or just decode token, but reloading is simpler to guarantee clean state
    window.location.href = '/dashboard';
  };

  const logout = () => {
    localStorage.removeItem('employeeToken');
    setEmployee(null);
    window.location.href = '/login';
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, setEmployee, loading, login, logout }}>
      {!loading && children}
    </EmployeeAuthContext.Provider>
  );
};
