import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { EmployeeAuthContext } from '../../context/EmployeeAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmployeeLogin = () => {
  const { employee, login } = useContext(EmployeeAuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (employee) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/employee-auth/login`, { email, password });
      login(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-variant flex items-center justify-center p-4 font-sans">
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Vidyabarta</h1>
          <p className="text-on-surface-variant">Employee Hub Login</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-neutral mb-1">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none transition"
              placeholder="name@vidyabarta.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90 transition disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
