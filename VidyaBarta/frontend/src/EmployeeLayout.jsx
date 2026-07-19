import React, { useContext } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { EmployeeAuthContext } from './context/EmployeeAuthContext';

const EmployeeLayout = () => {
  const { employee, logout } = useContext(EmployeeAuthContext);

  if (!employee) {
    return <Navigate to="/login" replace />;
  }

  // If first login, force them to setup their profile
  if (employee.is_first_login && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <header className="bg-primary text-white p-4 flex justify-between items-center shadow-md">
        <div className="text-xl font-bold">Vidyabarta Employee Hub</div>
        <div className="flex gap-4 items-center">
          <Link to="/dashboard" className="text-white hover:text-white/80 font-bold text-sm hidden md:block">Dashboard</Link>
          <Link to="/payouts" className="text-white hover:text-white/80 font-bold text-sm hidden md:block">Payouts</Link>
          <span className="font-medium text-sm hidden md:block opacity-50 border-l border-white/20 pl-4 ml-2">Welcome, {employee.name}</span>
          <button onClick={logout} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition ml-2">
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      <footer className="p-4 text-center text-outline text-sm">
        &copy; {new Date().getFullYear()} Vidyabarta. All rights reserved.
      </footer>
    </div>
  );
};

export default EmployeeLayout;
