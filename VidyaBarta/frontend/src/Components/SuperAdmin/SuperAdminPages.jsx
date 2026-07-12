import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
// export const SubscriptionTransaction

// Staff Management
export const RolePermission = () => <PageWrapper title="Role & Permission"><p>Manage roles and permissions.</p></PageWrapper>;
export const Staff = () => <PageWrapper title="Staff"><p>Manage super admin staff members.</p></PageWrapper>;

// Web Settings
export const WebGeneralSettings = () => <PageWrapper title="General Web Settings"><p>Manage general website settings.</p></PageWrapper>;
export const FeatureSections = () => <PageWrapper title="Feature Sections"><p>Manage website feature sections.</p></PageWrapper>;
export const Faqs = () => <PageWrapper title="FAQs"><p>Manage Frequently Asked Questions.</p></PageWrapper>;

// System Settings
export const AppSettings = () => <PageWrapper title="App Settings"><p>Manage application settings.</p></PageWrapper>;
export const SystemGeneralSettings = () => <PageWrapper title="General System Settings"><p>Manage general system configurations.</p></PageWrapper>;
export const SubscriptionSettings = () => <PageWrapper title="Subscription Settings"><p>Configure subscription parameters.</p></PageWrapper>;
export const Guidance = () => <PageWrapper title="Guidance"><p>Manage guidance content.</p></PageWrapper>;
export const LanguageSettings = () => <PageWrapper title="Language Settings"><p>Manage system languages.</p></PageWrapper>;
export const NotificationSettings = () => <PageWrapper title="Notification Settings"><p>Configure notification templates.</p></PageWrapper>;
export const EmailConfiguration = () => <PageWrapper title="Email Configuration"><p>Configure SMTP and email settings.</p></PageWrapper>;
export const EmailTemplate = () => <PageWrapper title="Email Template"><p>Manage email templates.</p></PageWrapper>;
export const PaymentSettings = () => <PageWrapper title="Payment Settings"><p>Configure payment gateways.</p></PageWrapper>;
export const PrivacyPolicy = () => <PageWrapper title="Privacy Policy"><p>Manage Privacy Policy content.</p></PageWrapper>;
export const ContactUs = () => <PageWrapper title="Contact Us"><p>Manage Contact Us details.</p></PageWrapper>;
export const AboutUs = () => <PageWrapper title="About Us"><p>Manage About Us content.</p></PageWrapper>;
export const TermsConditions = () => <PageWrapper title="Terms & Conditions"><p>Manage system Terms & Conditions.</p></PageWrapper>;
export const RefundCancellation = () => <PageWrapper title="Refund & Cancellation"><p>Manage refund policies.</p></PageWrapper>;
export const SchoolTermsCondition = () => <PageWrapper title="School Terms & Condition"><p>Manage terms specific to schools.</p></PageWrapper>;

export const SystemUpdate = () => <PageWrapper title="System Update"><p>Check and apply system updates.</p></PageWrapper>;

export { DomainRequests } from './DomainRequests';
