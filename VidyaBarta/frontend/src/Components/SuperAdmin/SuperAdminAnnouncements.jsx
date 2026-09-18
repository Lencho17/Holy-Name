import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiSend, FiTrash2, FiMail, FiBell, FiAlertCircle, FiCheckCircle, 
  FiGlobe, FiLayers, FiShield, FiCalendar, FiExternalLink, FiFilter, FiCheckSquare, FiSquare, FiCheck
} from 'react-icons/fi';
import { FaBullhorn, FaSpinner, FaMagic, FaSchool } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const SAAS_TEMPLATES = [
  {
    label: 'Scheduled Maintenance Window',
    category: 'Maintenance',
    priority: 'Critical',
    title: 'Notice: Scheduled Platform Maintenance & Brief Downtime',
    message: 'Dear School Administration,\n\nPlease be informed that VidyaBarta will undergo essential scheduled database and infrastructure upgrades this Sunday between 02:00 AM - 04:00 AM IST. \n\nDuring this maintenance window, the School Portal and Student Portal may experience intermittent availability. We recommend informing your staff and students accordingly.\n\nThank you for your patience and partnership.\nVidyaBarta Engineering Operations',
    action_label: 'View System Status',
    action_url: 'https://vidyabarta.com'
  },
  {
    label: 'Major Feature Release',
    category: 'Platform Update',
    priority: 'Important',
    title: 'Exciting Update: New Automated Exam Timetable & Fee System Launched!',
    message: 'Dear School Partners,\n\nWe are delighted to announce the release of our enhanced automated timetable scheduler and dynamic fee concession module on your VidyaBarta admin dashboard.\n\nExplore the latest tools by visiting your Admin Panel under Academics and Fees. For walkthrough assistance, feel free to contact our customer success team.\n\nWarm Regards,\nVidyaBarta Product Team',
    action_label: 'Explore Features',
    action_url: 'https://vidyabarta.com'
  },
  {
    label: 'Subscription & Billing Advisory',
    category: 'Billing',
    priority: 'Important',
    title: 'Reminder: Upcoming SaaS Subscription Cycle',
    message: 'Dear School Administrator,\n\nThis is a notification regarding your school\'s upcoming platform subscription settlement. Please review your active school plan and ensure your payment details are verified.\n\nFor custom package inquiries or invoice assistance, please visit your SuperAdmin settings or reach out to our billing desk.\n\nVidyaBarta Accounts Section',
    action_label: 'Review Subscription',
    action_url: '/superadmin/subscription'
  }
];

const SuperAdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [schools, setSchools] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'Platform Update',
    priority: 'Normal',
    target_type: 'all', // 'all', 'specific', 'package', 'status'
    target_school_ids: [],
    target_package: '',
    target_status: 'Active',
    channels: ['in_app', 'email'],
    action_url: '',
    action_label: ''
  });

  // Live Recipient Preview State
  const [preview, setPreview] = useState({ schoolsCount: 0, adminsCount: 0, totalEmailRecipients: 0, schools: [] });
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [form.target_type, form.target_school_ids, form.target_package, form.target_status]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const [annRes, schoolsRes, pkgRes] = await Promise.all([
        axios.get(`${API_URL}/superadmin/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/schools`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/saas-pricing`).catch(() => ({ data: [] }))
      ]);

      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);
      setSchools(Array.isArray(schoolsRes.data) ? schoolsRes.data : []);
      setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    try {
      setPreviewLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        target_type: form.target_type
      });

      if (form.target_type === 'specific' && form.target_school_ids.length > 0) {
        params.append('target_school_ids', form.target_school_ids.join(','));
      }
      if (form.target_type === 'package' && form.target_package) {
        params.append('target_package', form.target_package);
      }
      if (form.target_type === 'status' && form.target_status) {
        params.append('target_status', form.target_status);
      }

      const res = await axios.get(`${API_URL}/superadmin/announcements/preview-recipients?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreview(res.data);
    } catch (err) {
      console.error('Preview error', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyTemplate = (tpl) => {
    setForm(prev => ({
      ...prev,
      title: tpl.title,
      message: tpl.message,
      category: tpl.category,
      priority: tpl.priority,
      action_label: tpl.action_label || '',
      action_url: tpl.action_url || ''
    }));
  };

  const handleToggleSchoolSelection = (schoolId) => {
    setForm(prev => {
      const exists = prev.target_school_ids.includes(schoolId);
      const updated = exists
        ? prev.target_school_ids.filter(id => id !== schoolId)
        : [...prev.target_school_ids, schoolId];
      return { ...prev, target_school_ids: updated };
    });
  };

  const handleSelectAllSchools = () => {
    if (form.target_school_ids.length === schools.length) {
      setForm(prev => ({ ...prev, target_school_ids: [] }));
    } else {
      setForm(prev => ({ ...prev, target_school_ids: schools.map(s => s.id) }));
    }
  };

  const handleToggleChannel = (channel) => {
    setForm(prev => {
      const exists = prev.channels.includes(channel);
      if (exists && prev.channels.length === 1) {
        alert('At least one delivery channel must remain selected.');
        return prev;
      }
      return {
        ...prev,
        channels: exists ? prev.channels.filter(c => c !== channel) : [...prev.channels, channel]
      };
    });
  };

  const handleSelectBothChannels = () => {
    setForm(prev => ({ ...prev, channels: ['in_app', 'email'] }));
  };

  const handleSelectSingleChannel = (channel) => {
    setForm(prev => ({ ...prev, channels: [channel] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return alert('Please enter both announcement title and message.');
    }

    if (preview.schoolsCount === 0) {
      return alert('No schools match current targeting criteria.');
    }

    const confirmMsg = `Publish announcement to ${preview.schoolsCount} schools?\n` +
      `• School In-App Dashboards: ${form.channels.includes('in_app') ? 'Yes' : 'No'}\n` +
      `• Email Broadcast: ${form.channels.includes('email') ? `${preview.totalEmailRecipients} recipient emails` : 'No'}`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/superadmin/announcements`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Broadcast successful! Delivered to ${res.data.summary?.schools_count || preview.schoolsCount} schools.`);
      setForm({
        title: '',
        message: '',
        category: 'Platform Update',
        priority: 'Normal',
        target_type: 'all',
        target_school_ids: [],
        target_package: '',
        target_status: 'Active',
        channels: ['in_app', 'email'],
        action_url: '',
        action_label: ''
      });
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this platform announcement and remove all associated school notifications?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/superadmin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInitialData();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/25">
            <FaBullhorn size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral tracking-tight">SaaS School Broadcasts</h1>
            <p className="text-sm text-on-surface-variant">Publish platform announcements, maintenance advisories, and feature updates to schools.</p>
          </div>
        </div>

        {/* Live Audience Counter */}
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 px-4 py-2.5 rounded-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-bold text-primary">
            {previewLoading ? (
              <span className="flex items-center gap-1.5"><FaSpinner className="animate-spin text-xs" /> Calculating...</span>
            ) : (
              <span>Targeting <strong>{preview.schoolsCount}</strong> Schools ({preview.totalEmailRecipients} Email Contacts)</span>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-outline-variant shadow-sm">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-neutral flex items-center gap-2">
                <FiSend className="text-primary text-base" /> New Platform Broadcast
              </h2>

              {/* Template Quick Loader */}
              <div className="relative inline-block text-left group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-xl hover:text-primary transition-colors"
                >
                  <FaMagic className="text-amber-500 text-xs" /> Preset Templates
                </button>
                <div className="absolute right-0 mt-1 w-72 bg-surface rounded-2xl shadow-xl border border-outline-variant p-2 hidden group-hover:block z-20">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-3 py-1">Select Preset</p>
                  {SAAS_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Audience Targeting Filter Card */}
              <div className="bg-surface-variant/40 p-5 rounded-2xl border border-outline-variant space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <FiFilter className="text-primary" /> Target Audience Filters
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Type */}
                  <div>
                    <label className="block text-xs font-bold text-neutral mb-1">Audience Scope</label>
                    <select
                      className="w-full p-2.5 text-sm font-semibold border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={form.target_type}
                      onChange={e => setForm({ ...form, target_type: e.target.value })}
                    >
                      <option value="all">All Schools (Entire Platform)</option>
                      <option value="specific">Specific Selected Schools</option>
                      <option value="package">By Package / Subscription Tier</option>
                      <option value="status">By School Status</option>
                    </select>
                  </div>

                  {/* Conditional sub-filter */}
                  {form.target_type === 'package' && (
                    <div>
                      <label className="block text-xs font-bold text-neutral mb-1">Select Package</label>
                      <select
                        className="w-full p-2.5 text-sm font-semibold border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={form.target_package}
                        onChange={e => setForm({ ...form, target_package: e.target.value })}
                      >
                        <option value="">Choose Package</option>
                        {packages.map(p => (
                          <option key={p.id || p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.target_type === 'status' && (
                    <div>
                      <label className="block text-xs font-bold text-neutral mb-1">School Status</label>
                      <select
                        className="w-full p-2.5 text-sm font-semibold border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={form.target_status}
                        onChange={e => setForm({ ...form, target_status: e.target.value })}
                      >
                        <option value="Active">Active Schools Only</option>
                        <option value="Inactive">Inactive / Suspended Schools</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Specific Schools Multi-select Picker */}
                {form.target_type === 'specific' && (
                  <div className="space-y-2 pt-2 border-t border-outline-variant">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral">Select Partner Schools:</span>
                      <button
                        type="button"
                        onClick={handleSelectAllSchools}
                        className="text-primary font-bold hover:underline"
                      >
                        {form.target_school_ids.length === schools.length ? 'Deselect All' : 'Select All Schools'}
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 bg-surface p-3 rounded-xl border border-outline-variant">
                      {schools.map(s => {
                        const isChecked = form.target_school_ids.includes(s.id);
                        return (
                          <label key={s.id} className="flex items-center gap-2.5 text-xs text-neutral cursor-pointer hover:bg-surface-variant p-1.5 rounded-lg">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSchoolSelection(s.id)}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span className="font-semibold">{s.name}</span>
                            <span className="text-[10px] text-on-surface-variant ml-auto">
                              {s.package || 'Standard'} • {s.status || 'Active'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delivery Channels */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <label className="block text-xs font-bold text-neutral">
                        Delivery Channels
                      </label>
                      <p className="text-[11px] text-on-surface-variant">
                        Select one or both channels to broadcast this announcement.
                      </p>
                    </div>

                    {/* Quick Selection Presets */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleSelectBothChannels}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                          form.channels.includes('in_app') && form.channels.includes('email')
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        <FiCheck className="text-emerald-600" />
                        <span>Both Channels</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectSingleChannel('in_app')}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                          form.channels.length === 1 && form.channels.includes('in_app')
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        In-App Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectSingleChannel('email')}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                          form.channels.length === 1 && form.channels.includes('email')
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        Email Only
                      </button>
                    </div>
                  </div>

                  {/* Channel Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* In-App Channel */}
                    <button
                      type="button"
                      onClick={() => handleToggleChannel('in_app')}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        form.channels.includes('in_app')
                          ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30 shadow-sm'
                          : 'bg-surface border-outline-variant opacity-70 hover:opacity-100 hover:border-outline'
                      }`}
                    >
                      <div className="mt-0.5 text-lg">
                        {form.channels.includes('in_app') ? (
                          <FiCheckSquare className="text-primary text-xl" />
                        ) : (
                          <FiSquare className="text-on-surface-variant text-xl" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FiBell className={form.channels.includes('in_app') ? 'text-primary' : 'text-on-surface-variant'} />
                          <span className={`text-xs font-bold ${form.channels.includes('in_app') ? 'text-neutral' : 'text-on-surface-variant'}`}>
                            School Admin In-App Alerts
                          </span>
                          <span className={`text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full ${
                            form.channels.includes('in_app')
                              ? 'bg-primary/10 text-primary'
                              : 'bg-surface-variant text-on-surface-variant'
                          }`}>
                            {form.channels.includes('in_app') ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                          Instant bell notifications & priority alert banner on partner school admin dashboards.
                        </p>
                      </div>
                    </button>

                    {/* Email Channel */}
                    <button
                      type="button"
                      onClick={() => handleToggleChannel('email')}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        form.channels.includes('email')
                          ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300 shadow-sm'
                          : 'bg-surface border-outline-variant opacity-70 hover:opacity-100 hover:border-outline'
                      }`}
                    >
                      <div className="mt-0.5 text-lg">
                        {form.channels.includes('email') ? (
                          <FiCheckSquare className="text-indigo-600 text-xl" />
                        ) : (
                          <FiSquare className="text-on-surface-variant text-xl" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FiMail className={form.channels.includes('email') ? 'text-indigo-600' : 'text-on-surface-variant'} />
                          <span className={`text-xs font-bold ${form.channels.includes('email') ? 'text-indigo-950' : 'text-on-surface-variant'}`}>
                            Email Broadcast
                          </span>
                          <span className={`text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full ${
                            form.channels.includes('email')
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-surface-variant text-on-surface-variant'
                          }`}>
                            {form.channels.includes('email') ? `${preview.totalEmailRecipients} RECIPIENTS` : 'OFF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                          Direct HTML broadcast to {preview.totalEmailRecipients} verified school principal & administrative inboxes.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Summary Status Pill */}
                  {form.channels.includes('in_app') && form.channels.includes('email') && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600 flex-shrink-0" />
                      <span>
                        <strong>Dual-Channel Broadcast Ready:</strong> This announcement will deliver simultaneously to School Dashboards AND Email inboxes.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral mb-1">Category</label>
                    <select
                      className="w-full p-3 text-sm font-semibold border border-outline-variant rounded-xl bg-surface-variant/30 focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="Platform Update">Platform Update</option>
                      <option value="Maintenance">Scheduled Maintenance</option>
                      <option value="Billing">Billing & Subscription</option>
                      <option value="Policy">Policy & Compliance</option>
                      <option value="General">General Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral mb-1">Priority</label>
                    <select
                      className="w-full p-3 text-sm font-semibold border border-outline-variant rounded-xl bg-surface-variant/30 focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Critical">🚨 Critical (Urgent Advisory)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral mb-1">Announcement Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Scheduled Platform Upgrade Notice"
                    className="w-full p-3 text-sm font-semibold border border-outline-variant rounded-xl bg-surface-variant/30 focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral mb-1 flex justify-between">
                    <span>Message Body</span>
                    <span className="text-on-surface-variant font-normal">{form.message.length} chars</span>
                  </label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Compose platform announcement for schools..."
                    className="w-full p-3.5 text-sm border border-outline-variant rounded-xl bg-surface-variant/30 focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none leading-relaxed"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                {/* Optional Call to Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-outline-variant">
                  <div>
                    <label className="block text-xs font-bold text-neutral mb-1">Action Button Label (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Review Settings"
                      className="w-full p-2.5 text-xs font-semibold border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={form.action_label}
                      onChange={e => setForm({ ...form, action_label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral mb-1">Action URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://vidyabarta.com or /admin"
                      className="w-full p-2.5 text-xs font-semibold border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={form.action_url}
                      onChange={e => setForm({ ...form, action_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || preview.schoolsCount === 0}
                className="w-full py-4 px-6 rounded-2xl font-black text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2.5 text-sm"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin text-base" /> Broadcasting to Schools...
                  </>
                ) : (
                  <>
                    <FiSend /> Broadcast to {preview.schoolsCount} Schools ({preview.totalEmailRecipients} Contacts)
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: Platform Broadcasts History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface p-6 sm:p-7 rounded-3xl border border-outline-variant shadow-sm min-h-[550px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-neutral">Sent Broadcasts</h2>
              <span className="text-xs font-bold text-on-surface-variant">{announcements.length} Dispatched</span>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
                <FaSpinner className="animate-spin mr-2" /> Loading platform broadcasts...
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
                <FaSchool className="text-outline-variant text-4xl mb-3" />
                <p className="font-bold text-neutral">No Platform Broadcasts Yet</p>
                <p className="text-xs text-on-surface-variant mt-1 max-w-xs">Publish your first broadcast to inform partner schools about updates or maintenance.</p>
              </div>
            ) : (
              <div className="space-y-3.5 overflow-y-auto max-h-[700px] pr-1">
                {announcements.map(a => {
                  const isCritical = a.priority === 'Critical';
                  return (
                    <div 
                      key={a.id} 
                      className="p-4 rounded-2xl border border-outline-variant bg-surface-variant/30 hover:bg-surface hover:shadow-md transition-all group relative"
                    >
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="absolute top-4 right-4 text-on-surface-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Delete Announcement"
                      >
                        <FiTrash2 size={14} />
                      </button>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md ${
                          isCritical ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'
                        }`}>
                          {a.category || 'Platform Notice'}
                        </span>
                        {isCritical && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-md">
                            CRITICAL
                          </span>
                        )}
                        <span className="text-[11px] text-on-surface-variant ml-auto mr-5">
                          {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="font-bold text-neutral text-base leading-snug mb-1">{a.title}</h4>
                      <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed whitespace-pre-wrap">{a.message}</p>

                      {/* Delivery Stats Bar */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-outline-variant text-[11px] text-on-surface-variant">
                        <span className="font-semibold text-neutral">
                          Scope: {a.target_type === 'all' ? 'All Schools' : a.target_type}
                        </span>
                        {a.stats && (
                          <div className="flex items-center gap-2 ml-auto text-[10px] font-bold">
                            {a.stats.schools_count > 0 && (
                              <span className="text-primary flex items-center gap-1">
                                <FaSchool size={10} /> {a.stats.schools_count} Schools
                              </span>
                            )}
                            {a.stats.email_sent > 0 && (
                              <span className="text-indigo-600 flex items-center gap-1">
                                <FiMail size={10} /> {a.stats.email_sent} Emails
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SuperAdminAnnouncements;
