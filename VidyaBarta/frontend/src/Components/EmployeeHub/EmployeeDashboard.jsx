import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { EmployeeAuthContext } from '../../context/EmployeeAuthContext';

const EmployeeDashboard = () => {
  const { employee } = useContext(EmployeeAuthContext);

  if (!employee) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
        <h2 className="text-2xl font-bold text-neutral mb-2">My Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Full Name</p>
              <p className="text-lg text-neutral font-medium">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Email Address</p>
              <p className="text-lg text-neutral font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Role</p>
              <p className="text-lg text-primary font-bold capitalize bg-primary/10 inline-block px-3 py-1 rounded-lg mt-1">{employee.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Phone</p>
              <p className="text-lg text-neutral font-medium">{employee.phone || 'Not Provided'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Date of Birth</p>
              <p className="text-lg text-neutral font-medium">{employee.dob ? new Date(employee.dob).toLocaleDateString() : 'Not Provided'}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Address</p>
              <p className="text-lg text-neutral font-medium">{employee.address || 'Not Provided'}</p>
            </div>
          </div>
          
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
        <h2 className="text-xl font-bold text-neutral mb-4">Compensation Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Payment Type</p>
            <p className="text-lg text-neutral font-medium capitalize">{employee.payment_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Salary Amount</p>
            <p className="text-lg font-bold text-emerald-600">{employee.salary_amount ? `₹${employee.salary_amount}` : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 text-center">
        <h3 className="text-lg font-bold text-primary mb-2">Welcome to the Hub</h3>
        <p className="text-on-surface-variant">Your specific internal tools and responsibilities will appear here based on your role ({employee.role}).</p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
