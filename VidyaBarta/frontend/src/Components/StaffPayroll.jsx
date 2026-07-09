import React, { useState, useEffect, useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import axios from 'axios';
import { FaFileInvoiceDollar, FaDownload } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffPayroll = () => {
  const { schoolProfile } = useContext(SiteDataContext);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const res = await axios.get(`${API_URL}/staff/payroll`, { headers: { Authorization: `Bearer ${token}` } });
      setPayrolls(res.data);
    } catch (err) {
      console.error('Failed to fetch payroll', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (p) => {
    // In a real app, you would use a library like jspdf to generate a PDF.
    // For now, we will just open a styled print window.
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${months[p.month-1]} ${p.year}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #f9fafb; }
            .totals { margin-top: 20px; text-align: right; font-size: 1.2em; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${schoolProfile?.name || "Our School"}</h2>
            <h3>Payslip for ${months[p.month-1]} ${p.year}</h3>
          </div>
          <table class="table">
            <tr><th>Basic Salary</th><td>₹${p.basic_salary}</td></tr>
            <tr><th>Allowances</th><td>₹${p.allowances}</td></tr>
            <tr><th>PF Deduction</th><td>₹${p.pf_deduction}</td></tr>
            <tr><th>ESIC Deduction</th><td>₹${p.esic_deduction}</td></tr>
            <tr><th>Tax/TDS</th><td>₹${p.tax_deduction}</td></tr>
          </table>
          <div class="totals">
            Net Salary: ₹${p.net_salary}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your payslips...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
          <FaFileInvoiceDollar size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">My Payslips</h2>
      </div>

      {payrolls.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No payslips have been generated for you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payrolls.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{months[p.month-1]} {p.year}</h3>
                <button 
                  onClick={() => handleDownload(p)}
                  className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <FaDownload />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Basic Salary</span>
                  <span className="font-medium text-gray-700">₹{p.basic_salary}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Allowances</span>
                  <span className="font-medium text-gray-700">+ ₹{p.allowances}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deductions (PF, Tax)</span>
                  <span className="font-medium text-red-500">- ₹{(parseFloat(p.pf_deduction) + parseFloat(p.esic_deduction) + parseFloat(p.tax_deduction)).toFixed(2)}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Net Salary</span>
                  <span className="font-bold text-green-600 text-lg">₹{p.net_salary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPayroll;
