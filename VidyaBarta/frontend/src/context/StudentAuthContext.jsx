import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SiteDataContext } from './SiteDataContext';

export const StudentAuthContext = createContext();

export const StudentAuthProvider = ({ children }) => {
  const { API_URL } = useContext(SiteDataContext);
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studentToken'));
  const [loading, setLoading] = useState(true);

  // Load student on mount
  useEffect(() => {
    const fetchStudent = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/student-auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudent(data.student);
      } catch (error) {
        console.error('Failed to load student profile', error);
        localStorage.removeItem('studentToken');
        setToken(null);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [token, API_URL]);

  const login = async (rollNumber, password, schoolId) => {
    try {
      const { data } = await axios.post(`${API_URL}/student-auth/login`, {
        rollNumber,
        password,
        schoolId
      });
      
      localStorage.setItem('studentToken', data.token);
      setToken(data.token);
      setStudent(data.student);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('studentToken');
    setToken(null);
    setStudent(null);
  };

  return (
    <StudentAuthContext.Provider value={{
      student,
      token,
      loading,
      login,
      logout
    }}>
      {children}
    </StudentAuthContext.Provider>
  );
};
