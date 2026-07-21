import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FaSpinner, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';
import { ManageSchools } from './ManageSchools';

// Premium Page Wrapper
const PageWrapper = ({ title, children }) => (
  <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
    <div className="mb-8">
      <h1 className="text-headline-lg font-bold text-neutral font-headline tracking-tight">{title}</h1>
      <div className="h-1 w-20 bg-primary mt-4 rounded-full"></div>
    </div>
    <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6">
      {children}
    </div>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    totalPackages: 0
  });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Fetch stats and schools concurrently
        const [statsRes, schoolsRes] = await Promise.all([
          axios.get(`${API_URL}/superadmin/dashboard-stats`, config).catch(() => ({ data: {
            totalSchools: 0, activeSchools: 0, inactiveSchools: 0, totalPackages: 0
          }})),
          axios.get(`${API_URL}/superadmin/schools`, config).catch(() => ({ data: [] }))
        ]);

        if (statsRes.data) {
          setStats({
            totalSchools: statsRes.data.totalSchools || 0,
            activeSchools: statsRes.data.activeSchools || 0,
            inactiveSchools: statsRes.data.inactiveSchools || 0,
            totalPackages: statsRes.data.totalPackages || 0
          });
        }
        
        if (schoolsRes.data && Array.isArray(schoolsRes.data)) {
          setSchools(schoolsRes.data.slice(0, 5)); // Just take top 5 for recent
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Schools', value: loading ? '...' : stats.totalSchools, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Schools', value: loading ? '...' : stats.activeSchools, color: 'text-primary', bg: 'bg-primary-50' },
    { label: 'Inactive Schools', value: loading ? '...' : stats.inactiveSchools, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Packages', value: loading ? '...' : stats.totalPackages, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  return (
    <PageWrapper title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border border-outline-variant hover:shadow-soft transition-shadow duration-300 bg-white group">
            <p className="text-body-sm font-medium text-on-surface-variant mb-2 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-center justify-between">
              <h3 className="text-display-sm font-bold text-neutral group-hover:text-primary transition-colors">
                {stat.value}
              </h3>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <div className="w-6 h-6 bg-current opacity-50 rounded-md"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Transaction Chart Area */}
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant p-6 bg-white shadow-sm flex flex-col min-h-[400px]">
        <h3 className="text-title-md font-bold text-neutral mb-4">Revenue & Transactions</h3>
        <div className="flex-1 rounded-xl bg-background/50 flex flex-col justify-center items-center border border-dashed border-outline-variant">
          <p className="text-on-surface-variant font-medium">Transaction Chart Area</p>
          <p className="text-label-md text-outline">Chart component will be rendered here</p>
        </div>
      </div>

      {/* Schools List Area */}
      <div className="rounded-2xl border border-outline-variant p-6 bg-white shadow-sm flex flex-col min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-title-md font-bold text-neutral">Recent Schools</h3>
          <button className="text-primary text-label-md font-bold hover:underline">View All</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {loading ? (
            <p className="text-on-surface-variant text-center py-8">Loading...</p>
          ) : schools.length > 0 ? (
            schools.map((school) => (
              <div key={school.id || school._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 transition-colors border border-transparent hover:border-outline-variant">
                <div>
                  <p className="text-label-lg font-bold text-neutral">{school.name}</p>
                  <p className="text-body-sm text-on-surface-variant">{school.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    school.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {school.status || 'Unknown'}
                  </span>
                  <span className="text-[10px] text-outline font-medium">
                    {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-on-surface-variant font-medium">No schools registered yet.</p>
              <p className="text-body-sm text-outline mt-1">When schools are added, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </PageWrapper>
  );
};

export { ManageSchools as Schools };
export const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', features: {} });

  const allFeatures = ['admission', 'career', 'tenders', 'appointment', 'gallery', 'studentPortal', 'faculty', 'alumestron', 'excellence', 'complaints'];

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/superadmin/packages`, { headers: { Authorization: `Bearer ${token}` } });
      setPackages(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPackages(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (formData.id) {
        await axios.put(`${API_URL}/superadmin/packages/${formData.id}`, formData, { headers });
      } else {
        await axios.post(`${API_URL}/superadmin/packages`, formData, { headers });
      }
      fetchPackages();
      setIsModalOpen(false);
    } catch (err) { alert('Failed to save package'); }
  };

  const handleDelete = async (id) => {
    if(!confirm('Delete package?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/superadmin/packages/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchPackages();
    } catch (err) { alert('Failed to delete package'); }
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] }
    }));
  };

  return (
    <PageWrapper title="Packages">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-title-lg font-bold">Subscription Packages</h2>
        <button onClick={() => { setFormData({ id: null, name: '', features: {} }); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all">Add Package</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? <p className="text-on-surface-variant">Loading packages...</p> : packages.map(pkg => (
          <div key={pkg.id} className="border border-outline-variant p-6 rounded-2xl bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <h3 className="text-title-md font-bold text-neutral mb-4">{pkg.name}</h3>
            <ul className="flex-1 space-y-2 mb-6 grid grid-cols-2 gap-x-2 gap-y-1">
              {allFeatures.map(f => (
                <li key={f} className="text-body-sm flex items-center gap-2">
                  <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] ${pkg.features[f] ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {pkg.features[f] ? '✓' : '✕'}
                  </span> 
                  <span className="capitalize">{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button onClick={() => { setFormData(pkg); setIsModalOpen(true); }} className="flex-1 py-2 bg-surface-variant hover:bg-surface-variant/80 rounded-xl font-bold text-neutral transition-colors">Edit</button>
              <button onClick={() => handleDelete(pkg.id)} className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {packages.length === 0 && !loading && (
          <div className="col-span-full py-8 text-center bg-surface rounded-2xl border border-dashed border-outline-variant">
            <p className="text-on-surface-variant">No packages defined yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scaleIn">
            <h2 className="text-title-lg font-bold mb-6 text-neutral">{formData.id ? 'Edit' : 'Add'} Package</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-label-md font-medium text-neutral mb-2">Package Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary rounded-xl" placeholder="e.g. Premium" />
              </div>
              <div>
                <label className="block text-label-md font-medium text-neutral mb-3">Allowed Features</label>
                <div className="grid grid-cols-2 gap-3 p-4 bg-surface rounded-xl border border-outline-variant">
                  {allFeatures.map(f => (
                    <label key={f} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.features[f] || false} onChange={() => handleFeatureToggle(f)} className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                      <span className="text-body-md capitalize text-on-surface-variant">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-outline-variant hover:bg-surface-variant rounded-xl font-bold text-neutral transition-colors">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">Save Package</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
export const Addons = () => <PageWrapper title="Addons"><p>Manage system addons.</p></PageWrapper>;
export const Features = () => <PageWrapper title="Features"><p>Toggle and manage system features.</p></PageWrapper>;
export const Subscription = () => <PageWrapper title="Subscription"><p>View active subscriptions.</p></PageWrapper>;
export { RevenueSettlements } from './RevenueSettlements';
export { default as Wallets } from './SuperAdminWallets';
// export const SubscriptionTransaction

// Staff Management
export const RolePermission = () => <PageWrapper title="Role & Permission"><p>Manage roles and permissions.</p></PageWrapper>;
export const Staff = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({ employee_id: '', title: '', description: '' });
  const [taskFilterStatus, setTaskFilterStatus] = useState('all');
  const [taskSortDate, setTaskSortDate] = useState('newest');
  
  const [formData, setFormData] = useState({
    id: null, name: '', email: '', phone: '', dob: '', address: '', payment_type: 'monthly', salary_amount: '', role: 'helpdesk'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/superadmin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async () => {
    setLoadingPayroll(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/superadmin/employees/payouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayrollData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/superadmin/employees/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    else if (activeTab === 'payroll') fetchPayroll();
    else if (activeTab === 'tasks') fetchTasks();
  }, [activeTab]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/superadmin/employees/tasks`, taskFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsTaskModalOpen(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleDownloadTasks = () => {
    let filteredTasks = [...tasks];
    if (taskFilterStatus !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.status === taskFilterStatus);
    }
    // simple sort
    filteredTasks.sort((a, b) => {
      if (taskSortDate === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });

    const csvContent = [
      ['Task ID', 'Employee Name', 'Title', 'Description', 'Status', 'Assigned At', 'Finished At'],
      ...filteredTasks.map(t => [
        t.id, 
        t.employee?.name || 'Unknown', 
        `"${t.title.replace(/"/g, '""')}"`, 
        `"${(t.description || '').replace(/"/g, '""')}"`, 
        t.status, 
        new Date(t.created_at).toLocaleString(), 
        t.finished_at ? new Date(t.finished_at).toLocaleString() : ''
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `employee_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (formData.id) {
        await axios.put(`${API_URL}/superadmin/employees/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Employee updated successfully!');
      } else {
        await axios.post(`${API_URL}/superadmin/employees`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Employee added and welcome email sent!');
      }
      fetchEmployees();
      setIsAddModalOpen(false);
      setFormData({ id: null, name: '', email: '', phone: '', dob: '', address: '', payment_type: 'monthly', salary_amount: '', role: 'helpdesk' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleEdit = (emp) => {
    setFormData({
      id: emp.id,
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      dob: emp.dob || '',
      address: emp.address || '',
      payment_type: emp.payment_type || 'monthly',
      salary_amount: emp.salary_amount || '',
      role: emp.role || 'helpdesk'
    });
    setIsAddModalOpen(true);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) return alert('Please select a CSV file');
    
    const formDataObj = new FormData();
    formDataObj.append('file', bulkFile);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/superadmin/employees/bulk`, formDataObj, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(`Bulk upload complete: ${res.data.added} added. ${res.data.errors.length} errors.`);
      fetchEmployees();
      setIsBulkModalOpen(false);
      setBulkFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to bulk upload');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/superadmin/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  return (
    <PageWrapper title="Vidyabarta Staff">
      <div className="flex border-b border-outline-variant mb-6">
        <button 
          onClick={() => setActiveTab('employees')} 
          className={`py-3 px-6 font-bold text-label-lg transition-colors border-b-2 ${activeTab === 'employees' ? 'border-primary text-primary' : 'border-transparent text-neutral hover:text-primary'}`}
        >
          Manage Employees
        </button>
        <button 
          onClick={() => setActiveTab('payroll')} 
          className={`py-3 px-6 font-bold text-label-lg transition-colors border-b-2 ${activeTab === 'payroll' ? 'border-primary text-primary' : 'border-transparent text-neutral hover:text-primary'}`}
        >
          Payroll & Timesheets
        </button>
        <button 
          onClick={() => { setActiveTab('tasks'); if(employees.length===0) fetchEmployees(); }} 
          className={`py-3 px-6 font-bold text-label-lg transition-colors border-b-2 ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-neutral hover:text-primary'}`}
        >
          Tasks & Assignments
        </button>
      </div>

      {activeTab === 'employees' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-on-surface-variant">Manage Vidyabarta internal employees.</p>
            <div className="flex gap-3">
          <button onClick={() => setIsBulkModalOpen(true)} className="px-4 py-2 bg-surface-variant text-neutral rounded-xl font-bold hover:bg-outline-variant transition-colors">
            Bulk Upload
          </button>
          <button onClick={() => { setFormData({ id: null, name: '', email: '', phone: '', dob: '', address: '', payment_type: 'monthly', salary_amount: '', role: 'helpdesk' }); setIsAddModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2 transition-colors">
            <FaPlus /> Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full text-left">
          <thead className="bg-surface-variant/50 text-label-md text-neutral uppercase">
            <tr>
              <th className="p-4 font-bold">Name & Role</th>
              <th className="p-4 font-bold">Email / Phone</th>
              <th className="p-4 font-bold">Payment / Salary</th>
              <th className="p-4 font-bold">Joined</th>
              <th className="p-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant"><FaSpinner className="animate-spin inline mr-2"/> Loading...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No employees found.</td></tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id} className="hover:bg-surface-variant/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-neutral">{emp.name}</div>
                    <div className="text-body-sm font-medium text-primary capitalize">{emp.role || 'helpdesk'}</div>
                    <div className="text-body-sm text-outline">{emp.is_first_login ? 'Pending 1st Login' : 'Active'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-body-md text-neutral">{emp.email}</div>
                    <div className="text-body-sm text-outline">{emp.phone || '-'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-body-md text-neutral capitalize">{emp.payment_type || 'N/A'}</div>
                    <div className="text-body-sm font-bold text-emerald-600">{emp.salary_amount ? `₹${emp.salary_amount}` : '-'}</div>
                  </td>
                  <td className="p-4 text-body-md text-neutral">
                    {new Date(emp.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(emp)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Employee">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Employee">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      ) : activeTab === 'payroll' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-on-surface-variant">Current month payroll estimations based on timesheets.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full text-left">
              <thead className="bg-surface-variant/50 text-label-md text-neutral uppercase">
                <tr>
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Payment Type</th>
                  <th className="p-4 font-bold">Base Salary</th>
                  <th className="p-4 font-bold">Hours Tracked</th>
                  <th className="p-4 font-bold">Est. Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loadingPayroll ? (
                  <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant"><FaSpinner className="animate-spin inline mr-2"/> Loading...</td></tr>
                ) : payrollData.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No payroll data found.</td></tr>
                ) : (
                  payrollData.map(emp => (
                    <tr key={emp.id} className="hover:bg-surface-variant/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-neutral">{emp.name}</div>
                        <div className="text-body-sm font-medium text-primary capitalize">{emp.role}</div>
                      </td>
                      <td className="p-4 capitalize text-neutral">
                        {emp.payment_type || 'N/A'}
                      </td>
                      <td className="p-4 text-neutral font-medium">
                        {emp.salary_amount ? `₹${emp.salary_amount}` : '-'}
                      </td>
                      <td className="p-4 text-neutral font-medium">
                        {emp.total_hours} hrs
                        <div className="text-[10px] text-on-surface-variant">({emp.timesheet_count} sessions)</div>
                      </td>
                      <td className="p-4 font-bold text-emerald-600 text-lg">
                        ₹{emp.estimated_payout?.toFixed(2) || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : activeTab === 'tasks' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-on-surface-variant">Manage employee task assignments.</p>
            <div className="flex gap-3">
              <select value={taskFilterStatus} onChange={e => setTaskFilterStatus(e.target.value)} className="px-4 py-2 bg-surface border border-outline-variant rounded-xl font-medium outline-none">
                <option value="all">All Status</option>
                <option value="unfinished">Unfinished</option>
                <option value="finished">Finished</option>
              </select>
              <select value={taskSortDate} onChange={e => setTaskSortDate(e.target.value)} className="px-4 py-2 bg-surface border border-outline-variant rounded-xl font-medium outline-none">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <button onClick={handleDownloadTasks} className="px-4 py-2 bg-surface-variant text-neutral rounded-xl font-bold hover:bg-outline-variant transition-colors">
                Download Log
              </button>
              <button onClick={() => { setTaskFormData({ employee_id: '', title: '', description: '' }); setIsTaskModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">
                Assign Task
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-outline-variant">
            <table className="w-full text-left">
              <thead className="bg-surface-variant/50 text-label-md text-neutral uppercase">
                <tr>
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Task</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loadingTasks ? (
                  <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant"><FaSpinner className="animate-spin inline mr-2"/> Loading...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">No tasks found.</td></tr>
                ) : (
                  tasks
                    .filter(t => taskFilterStatus === 'all' || t.status === taskFilterStatus)
                    .sort((a, b) => {
                      if (taskSortDate === 'newest') return new Date(b.created_at) - new Date(a.created_at);
                      return new Date(a.created_at) - new Date(b.created_at);
                    })
                    .map(task => (
                    <tr key={task.id} className="hover:bg-surface-variant/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-neutral">{task.employee?.name || 'Unknown'}</div>
                        <div className="text-body-sm text-outline capitalize">{task.employee?.role || ''}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-neutral">{task.title}</div>
                        <div className="text-body-sm text-on-surface-variant max-w-sm truncate">{task.description}</div>
                      </td>
                      <td className="p-4">
                        {task.status === 'finished' ? (
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold uppercase">Finished</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold uppercase">Unfinished</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-neutral">
                        <div>Assigned: {new Date(task.created_at).toLocaleDateString()}</div>
                        {task.finished_at && <div className="text-emerald-600">Finished: {new Date(task.finished_at).toLocaleDateString()}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-neutral/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-xl shadow-2xl">
            <h2 className="text-title-lg font-bold text-neutral mb-6">{formData.id ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Date of Birth</label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
                </div>
                <div className="col-span-2">
                  <label className="block text-label-md font-bold text-neutral mb-1">Address</label>
                  <textarea rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral"></textarea>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Payment Type</label>
                  <select value={formData.payment_type} onChange={e => setFormData({...formData, payment_type: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral">
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Salary Amount</label>
                  <input type="number" value={formData.salary_amount} onChange={e => setFormData({...formData, salary_amount: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
                </div>
                <div>
                  <label className="block text-label-md font-bold text-neutral mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral">
                    <option value="helpdesk">Helpdesk</option>
                    <option value="developer">Developer</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-neutral hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">{formData.id ? 'Update Employee' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-neutral/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-title-lg font-bold text-neutral mb-4">Bulk Upload Employees</h2>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Upload a CSV file with the following headers: <strong>name, email, phone, dob, address, payment_type, salary, role</strong>
            </p>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <input type="file" accept=".csv" required onChange={e => setBulkFile(e.target.files[0])} className="w-full border border-outline-variant rounded-xl p-3 bg-surface text-neutral" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-neutral hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-neutral/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-title-lg font-bold text-neutral mb-6">Assign Task</h2>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Employee</label>
                <select required value={taskFormData.employee_id} onChange={e => setTaskFormData({...taskFormData, employee_id: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral">
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Task Title</label>
                <input type="text" required value={taskFormData.title} onChange={e => setTaskFormData({...taskFormData, title: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Description (Optional)</label>
                <textarea rows="3" value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-neutral hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

// Web Settings
export const WebGeneralSettings = () => {
  const [settings, setSettings] = useState({ contact_email: '', contact_phone: '', contact_address: '' });
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/saas-settings`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data) setSettings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/saas-settings`, settings, { headers: { Authorization: `Bearer ${token}` } });
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper title="General Web Settings">
      <div className="max-w-2xl">
        <h3 className="text-xl font-bold text-neutral mb-6">Contact Information</h3>
        {loading ? (
          <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-primary text-3xl" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-label-md font-bold text-neutral mb-2">Contact Email</label>
              <input type="email" value={settings.contact_email || ''} onChange={(e) => setSettings({...settings, contact_email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-variant/30 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-neutral transition-all" placeholder="sales@vidyabarta.com" required />
            </div>
            <div>
              <label className="block text-label-md font-bold text-neutral mb-2">Contact Phone</label>
              <input type="text" value={settings.contact_phone || ''} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-variant/30 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-neutral transition-all" placeholder="+91 98765 43210" required />
            </div>
            <div>
              <label className="block text-label-md font-bold text-neutral mb-2">Contact Address</label>
              <textarea value={settings.contact_address || ''} onChange={(e) => setSettings({...settings, contact_address: e.target.value})} rows="3" className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-variant/30 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-neutral transition-all" placeholder="123 Education St..."></textarea>
            </div>
            <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}
      </div>
    </PageWrapper>
  );
};
export const FeatureSections = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, icon: 'FiMonitor', title: '', description: '', order_index: 0 });

  const fetchFeatures = async () => {
    try {
      const res = await axios.get(`${API_URL}/saas-settings/features`);
      setFeatures(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_URL}/saas-settings/features/${formData.id}`, formData);
      } else {
        await axios.post(`${API_URL}/saas-settings/features`, formData);
      }
      fetchFeatures();
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save Feature');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Feature?')) return;
    try {
      await axios.delete(`${API_URL}/saas-settings/features/${id}`);
      fetchFeatures();
    } catch (err) {
      alert('Failed to delete Feature');
    }
  };

  const openModal = (feature = { id: null, icon: 'FiMonitor', title: '', description: '', order_index: 0 }) => {
    setFormData(feature);
    setIsModalOpen(true);
  };

  return (
    <PageWrapper title="Feature Sections">
      <div className="flex justify-between items-center mb-6">
        <p className="text-on-surface-variant">Manage Feature Sections for the SaaS Home page.</p>
        <button onClick={() => openModal()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 font-bold transition-all">
          <FaPlus /> Add Feature
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-primary text-3xl" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(feature => (
            <div key={feature.id} className="bg-surface-variant/30 border border-outline-variant p-6 rounded-2xl flex justify-between items-start gap-4 hover:shadow-sm transition-all">
              <div>
                <div className="text-sm font-semibold text-primary mb-1">Icon: {feature.icon}</div>
                <h3 className="font-bold text-neutral text-title-md mb-2">{feature.title}</h3>
                <p className="text-on-surface-variant text-body-md whitespace-pre-wrap">{feature.description}</p>
                <div className="text-xs text-on-surface-variant mt-2">Order: {feature.order_index}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openModal(feature)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(feature.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {features.length === 0 && <p className="text-center text-on-surface-variant py-8 md:col-span-2">No Features found.</p>}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-title-lg font-bold text-neutral mb-6">{formData.id ? 'Edit Feature' : 'Add Feature'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Icon (e.g. FiMonitor, FiShield)</label>
                <input type="text" required value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Description</label>
                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral resize-none"></textarea>
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Order Index (Sort)</label>
                <input type="number" value={formData.order_index} onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 0})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-neutral hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
export const Faqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, question: '', answer: '', order_index: 0 });

  const fetchFaqs = async () => {
    try {
      const res = await axios.get(`${API_URL}/saas-settings/faqs`);
      setFaqs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_URL}/saas-settings/faqs/${formData.id}`, formData);
      } else {
        await axios.post(`${API_URL}/saas-settings/faqs`, formData);
      }
      fetchFaqs();
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save FAQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await axios.delete(`${API_URL}/saas-settings/faqs/${id}`);
      fetchFaqs();
    } catch (err) {
      alert('Failed to delete FAQ');
    }
  };

  const openModal = (faq = { id: null, question: '', answer: '', order_index: 0 }) => {
    setFormData(faq);
    setIsModalOpen(true);
  };

  return (
    <PageWrapper title="FAQs">
      <div className="flex justify-between items-center mb-6">
        <p className="text-on-surface-variant">Manage Frequently Asked Questions for the SaaS Home page.</p>
        <button onClick={() => openModal()} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 font-bold transition-all">
          <FaPlus /> Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-primary text-3xl" /></div>
      ) : (
        <div className="space-y-4">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-surface-variant/30 border border-outline-variant p-6 rounded-2xl flex justify-between items-start gap-4 hover:shadow-sm transition-all">
              <div>
                <h3 className="font-bold text-neutral text-title-md mb-2">{faq.question}</h3>
                <p className="text-on-surface-variant text-body-md whitespace-pre-wrap">{faq.answer}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openModal(faq)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(faq.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {faqs.length === 0 && <p className="text-center text-on-surface-variant py-8">No FAQs found.</p>}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-title-lg font-bold text-neutral mb-6">{formData.id ? 'Edit FAQ' : 'Add FAQ'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Question</label>
                <input type="text" required value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Answer</label>
                <textarea required rows="4" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral resize-none"></textarea>
              </div>
              <div>
                <label className="block text-label-md font-bold text-neutral mb-1">Order Index (Sort)</label>
                <input type="number" value={formData.order_index} onChange={e => setFormData({...formData, order_index: parseInt(e.target.value) || 0})} className="w-full border border-outline-variant rounded-xl p-3 bg-surface focus:border-primary outline-none text-neutral" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-neutral hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

// System Settings
export { default as StudentPortalSettings } from './StudentPortalSettings';
export { default as ManagePricing } from './ManagePricing';
export { DomainRequests } from './DomainRequests';

const AHSEC_SEBA_SUBJECTS = [
  "Accountancy", "Advanced Mathematics", "Alternative English", "Anthropology", "Arabic",
  "Art", "Artificial Intelligence", "Assamese", "Bengali", "Bihu", "Biology", "Biotechnology",
  "Bodo", "Bookkeeping", "Business Studies", "Chemistry", "Classical Languages",
  "Commercial Mathematics and Statistics", "Computer Science", "Computer Science & Application",
  "Dance", "Economic Geography", "Economics", "Education", "English", "Entrepreneurship Development",
  "Finance", "Financial Literacy", "Fine Art", "Garo", "General Studies", "Geography", "Geology",
  "Hindi", "History", "Hmar", "Home Science", "Information Technology", "Khasi", "Logic & Philosophy",
  "Manipuri", "Mathematics", "Mizo", "Modern Indian Languages", "Music", "Nepali", "Persian",
  "Physical Education", "Physics", "Political Science", "Psychology", "Salesmanship & Advertising",
  "Sanskrit", "Science", "Sign Language", "Social Science", "Sociology", "Statistics", "Swadesh Adhyayan",
  "Urdu"
];

export const GlobalSubjects = () => {
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [newGlobalSubject, setNewGlobalSubject] = useState({ name: '', marking_system: 'Marking' });
  const [loading, setLoading] = useState(true);
  
  // Filtering and Sorting state
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('All');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const fetchGlobalSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global?sortBy=${sortBy}&filterBy=${filterBy}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGlobalSubjects(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalSubjects();
  }, [sortBy, filterBy]);

  const handleCreateGlobalSubject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGlobalSubject)
      });
      if (res.ok) {
        setNewGlobalSubject({ name: '', marking_system: 'Marking' });
        fetchGlobalSubjects();
        alert('Draft Subject Created successfully.');
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error creating global subject');
      }
    } catch (err) {
      alert('Error creating global subject');
    }
  };
  
  const handleUpdateDraft = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${editSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editSubject.name, marking_system: editSubject.marking_system })
      });
      if (res.ok) {
        setIsEditing(false);
        setEditSubject(null);
        fetchGlobalSubjects();
        alert('Draft updated successfully.');
      } else {
         const errorData = await res.json();
         alert(errorData.message || 'Error updating draft');
      }
    } catch(err) {
      alert('Error updating draft');
    }
  };

  const handleFinalize = async (id) => {
    if (!window.confirm('Are you sure you want to finalize this subject? Once finalized, the code will be generated and it cannot be edited.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${id}/finalize`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        alert('Subject finalized and code generated successfully!');
        fetchGlobalSubjects();
      } else {
         const errorData = await res.json();
         alert(errorData.message || 'Error finalizing subject');
      }
    } catch (err) {}
  };

  const handleDeleteGlobalSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/subjects/global/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchGlobalSubjects();
    } catch (err) {}
  };

  return (
    <PageWrapper title="Global Subjects">
      {/* Create / Edit Form */}
      {isEditing && editSubject ? (
        <form onSubmit={handleUpdateDraft} className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
            <input 
              type="text" required autoFocus
              placeholder="e.g. Mathematics"
              value={editSubject.name} 
              onChange={e => setEditSubject({...editSubject, name: e.target.value})} 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Marking System</label>
            <select required value={editSubject.marking_system} onChange={e => setEditSubject({...editSubject, marking_system: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary outline-none">
              <option value="Marking">Marking</option>
              <option value="Grade">Grade</option>
            </select>
          </div>
          <div className="flex gap-2">
             <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 flex-1">Save Draft</button>
             <button type="button" onClick={() => { setIsEditing(false); setEditSubject(null); }} className="bg-gray-300 text-gray-800 p-2.5 rounded-lg font-bold hover:bg-gray-400 flex-1">Cancel</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreateGlobalSubject} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Subject Name</label>
            <input 
              type="text" required 
              placeholder="e.g. Mathematics"
              value={newGlobalSubject.name} 
              onChange={e => setNewGlobalSubject({...newGlobalSubject, name: e.target.value})} 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Marking System</label>
            <select required value={newGlobalSubject.marking_system} onChange={e => setNewGlobalSubject({...newGlobalSubject, marking_system: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-primary outline-none">
              <option value="Marking">Marking</option>
              <option value="Grade">Grade</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-white p-2.5 rounded-lg font-bold hover:bg-primary-dark w-full">Add Subject (Draft)</button>
        </form>
      )}

      {/* Filter and Sort Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Filter:</label>
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="border border-gray-300 text-sm p-2 rounded-lg bg-gray-50">
            <option value="All">All Systems</option>
            <option value="Marking">Marking</option>
            <option value="Grade">Grade</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 text-sm p-2 rounded-lg bg-gray-50">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-surface-variant text-on-surface-variant text-sm font-bold uppercase">
            <tr>
              <th className="p-4">Subject Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Marking System</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant bg-surface">
            {globalSubjects.map(sub => (
              <tr key={sub.id} className="hover:bg-surface-variant/50">
                <td className="p-4 font-semibold text-on-surface">{sub.name}</td>
                <td className="p-4">
                  <span className="font-mono font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200 mr-2">{sub.code}</span>
                  {!sub.is_finalized && (
                    <span className="text-xs text-orange-500 font-semibold italic bg-orange-100 px-2 py-1 rounded">Draft</span>
                  )}
                </td>
                <td className="p-4 text-sm text-on-surface-variant">{sub.marking_system}</td>
                <td className="p-4 text-right flex justify-end items-center gap-2">
                  {!sub.is_finalized && (
                    <>
                      <button onClick={() => { setIsEditing(true); setEditSubject(sub); }} className="text-blue-600 hover:text-blue-800 p-1.5 font-bold text-sm bg-blue-50 rounded border border-blue-100">
                        Edit
                      </button>
                      <button onClick={() => handleFinalize(sub.id)} className="text-green-700 hover:text-green-900 p-1.5 font-bold text-sm bg-green-50 rounded border border-green-100">
                        Finalize
                      </button>
                    </>
                  )}
                  {!sub.is_finalized && (
                    <button onClick={() => handleDeleteGlobalSubject(sub.id)} className="text-error hover:text-error/80 p-2 bg-red-50 rounded ml-2 border border-red-100">
                      <FaTrash />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {globalSubjects.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-on-surface-variant">No global subjects found.</td></tr>}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};
