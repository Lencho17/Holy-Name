import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoneyCheckAlt, FaTrash } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    staff_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic_salary: '',
    allowances: '0',
    pf_deduction: '0',
    esic_deduction: '0',
    tax_deduction: '0'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [payrollRes, staffRes] = await Promise.all([
        axios.get(`${API_URL}/staff/admin/payroll`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/staff/admin/all-staff`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPayrolls(payrollRes.data);
      setStaffList(staffRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(form.basic_salary) || 0;
    const allow = parseFloat(form.allowances) || 0;
    const pf = parseFloat(form.pf_deduction) || 0;
    const esic = parseFloat(form.esic_deduction) || 0;
    const tax = parseFloat(form.tax_deduction) || 0;
    return basic + allow - pf - esic - tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const net_salary = calculateNetSalary();
      await axios.post(`${API_URL}/staff/admin/payroll`, { ...form, net_salary }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Payroll generated successfully!');
      setForm({ ...form, basic_salary: '', allowances: '0', pf_deduction: '0', esic_deduction: '0', tax_deduction: '0' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate payroll');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/staff/admin/payroll/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      alert('Failed to delete payroll');
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading payroll...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-100 p-3 rounded-lg text-green-600">
          <FaMoneyCheckAlt size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Payroll Management</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Generate Payslip</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select required className="p-3 border rounded-xl bg-gray-50" value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})}>
              <option value="">Select Staff</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
            <select required className="p-3 border rounded-xl bg-gray-50" value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input required type="number" placeholder="Year" className="p-3 border rounded-xl bg-gray-50" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
            
            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Basic Salary (₹)</label>
                <input required type="number" className="w-full p-3 border rounded-xl bg-gray-50" value={form.basic_salary} onChange={e => setForm({...form, basic_salary: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Allowances (₹)</label>
                <input required type="number" className="w-full p-3 border rounded-xl bg-gray-50" value={form.allowances} onChange={e => setForm({...form, allowances: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">PF Deduction (₹)</label>
                <input required type="number" className="w-full p-3 border rounded-xl bg-gray-50" value={form.pf_deduction} onChange={e => setForm({...form, pf_deduction: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ESIC (₹)</label>
                <input required type="number" className="w-full p-3 border rounded-xl bg-gray-50" value={form.esic_deduction} onChange={e => setForm({...form, esic_deduction: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Tax/TDS (₹)</label>
                <input required type="number" className="w-full p-3 border rounded-xl bg-gray-50" value={form.tax_deduction} onChange={e => setForm({...form, tax_deduction: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-4 flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-blue-800 font-bold">Net Salary: ₹{calculateNetSalary()}</span>
              <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Generate Payslip
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Staff</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Period</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Basic</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Net Salary</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrolls.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No payroll records found.</td></tr>
              ) : (
                payrolls.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{p.staff?.name}</p>
                      <p className="text-xs text-gray-500">{p.staff?.email}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-700">{months[p.month-1]} {p.year}</td>
                    <td className="p-4 text-gray-600">₹{p.basic_salary}</td>
                    <td className="p-4 font-bold text-green-600">₹{p.net_salary}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPayroll;
