import React, { useState, useEffect, useId } from 'react';
import axios from 'axios';
import { 
  FaBullhorn, FaTrash, FaEnvelope, FaBell, FaUsers, FaExclamationTriangle, 
  FaCheckCircle, FaSearch, FaFilter, FaPaperPlane, FaMagic, FaEye, FaTimes, FaSpinner,
  FaCheckSquare, FaSquare, FaCheck, FaBuilding, FaExternalLinkAlt, FaInfoCircle, FaShieldAlt, FaCalendarAlt
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const QUICK_TEMPLATES = [
  {
    label: 'Fee Payment Reminder',
    category: 'Fee Reminder',
    priority: 'High',
    fee_status: 'due',
    title: 'Urgent: School Fee Payment Pending',
    message: 'Dear Student & Parents,\n\nThis is a gentle reminder that the school fees for the current academic session remain pending. Please clear all outstanding dues at the earliest via the Student Portal or the school accounts desk to ensure uninterrupted access to academic services.\n\nThank you for your cooperation.\nSchool Accounts Section'
  },
  {
    label: 'Admission Fee Due',
    category: 'Fee Reminder',
    priority: 'High',
    fee_status: 'admission_fee_pending',
    title: 'Reminder: Complete Admission Fee Payment',
    message: 'Dear Student & Parents,\n\nYour admission fee for the current academic year is currently recorded as unpaid. Please visit the Student Portal to complete your admission payment and verify your student profile.\n\nRegards,\nAdmissions Office'
  },
  {
    label: 'Emergency Holiday Notice',
    category: 'Holiday',
    priority: 'Urgent',
    fee_status: 'all',
    title: 'Holiday Notice: School Remains Closed Tomorrow',
    message: 'Dear Students & Parents,\n\nPlease be informed that the school shall remain closed tomorrow due to unavoidable circumstances / weather advisory. Regular classes will resume on the following working day as per regular timetable.\n\nRegards,\nPrincipal Office'
  },
  {
    label: 'Upcoming Examination Schedule',
    category: 'Academic',
    priority: 'Normal',
    fee_status: 'all',
    title: 'Notice: Upcoming Term Examinations & Timetable',
    message: 'Dear Students,\n\nThe upcoming term examination schedule has been officially finalized. Please check your Student Portal under "Upcoming Exams" and download your revised timetable. Ensure all preparation is on track.\n\nBest Wishes,\nAcademic Council'
  }
];

const STANDARD_CLASSES = ['All', 'Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const AdminAnnouncements = ({ initialTab = 'school_broadcasts', onTabChange }) => {
  const [activeMainTab, setActiveMainTab] = useState(initialTab);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [classesList, setClassesList] = useState(STANDARD_CLASSES);

  // Platform Announcements from SaaS SuperAdmin
  const [platformNotices, setPlatformNotices] = useState([]);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [platformSearch, setPlatformSearch] = useState('');
  const [platformCategoryFilter, setPlatformCategoryFilter] = useState('All');
  const [platformPriorityFilter, setPlatformPriorityFilter] = useState('All');
  const [platformReadFilter, setPlatformReadFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedPlatformNotice, setSelectedPlatformNotice] = useState(null);
  const [unreadPlatformCount, setUnreadPlatformCount] = useState(0);

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  // Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_class: 'All',
    target_section: 'All',
    target_fee_status: 'all',
    category: 'General',
    priority: 'Normal',
    channels: ['in_app', 'email']
  });

  // Selected individual student IDs (if specific)
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchKeyword, setStudentSearchKeyword] = useState('');

  // Live Recipient Preview State
  const [previewData, setPreviewData] = useState({ totalCount: 0, emailReadyCount: 0, missingEmailCount: 0, students: [] });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAnnouncementDetail, setSelectedAnnouncementDetail] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchClasses();
    fetchPlatformNotices();
  }, []);

  // Whenever filters change, update live recipient counter
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipientPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [form.target_class, form.target_section, form.target_fee_status, selectedStudentIds, studentSearchKeyword]);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformNotices = async () => {
    try {
      setPlatformLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await axios.get(`${API_URL}/system/school-notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = res.data?.notifications || [];
      setPlatformNotices(list);
      setUnreadPlatformCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load platform notices', err);
    } finally {
      setPlatformLoading(false);
    }
  };

  const handleMarkPlatformRead = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/system/school-notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlatformNotices(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
      setUnreadPlatformCount(prev => Math.max(0, prev - 1));
      if (selectedPlatformNotice?.id === id) {
        setSelectedPlatformNotice(prev => ({ ...prev, is_read: true }));
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllPlatformRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/system/school-notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlatformNotices(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadPlatformCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/classes/school`, { headers });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const extracted = res.data
          .map(c => (c.class_level || c.name || c.class_name || '').toString().trim())
          .filter(Boolean);
        if (extracted.length > 0) {
          setClassesList(['All', ...new Set(extracted)]);
          return;
        }
      }
    } catch (e) {
      console.warn('Fallback to standard classes', e);
    }
    setClassesList(STANDARD_CLASSES);
  };

  const fetchRecipientPreview = async () => {
    try {
      setPreviewLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        class_level: form.target_class,
        section: form.target_section,
        fee_status: form.target_fee_status
      });

      if (studentSearchKeyword.trim()) {
        params.append('search', studentSearchKeyword.trim());
      }
      if (selectedStudentIds.length > 0) {
        params.append('student_ids', selectedStudentIds.join(','));
      }

      const res = await axios.get(`${API_URL}/announcements/preview-recipients?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error('Failed to preview recipients', err);
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
      target_fee_status: tpl.fee_status
    }));
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
      return alert('Please enter both title and message.');
    }

    if (previewData.totalCount === 0) {
      return alert('No students match the current criteria. Please broaden your filters.');
    }

    const confirmMsg = `Send announcement to ${previewData.totalCount} students?\n` +
      `• In-App Notifications: ${form.channels.includes('in_app') ? 'Yes' : 'No'}\n` +
      `• Email Broadcast: ${form.channels.includes('email') ? `${previewData.emailReadyCount} emails will be sent` : 'No'}`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const payload = {
        ...form,
        target_student_ids: selectedStudentIds
      };

      const res = await axios.post(`${API_URL}/announcements`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Broadcast successful! Delivered to ${res.data.summary?.total_recipients || previewData.totalCount} students.`);
      setForm({
        title: '',
        message: '',
        target_class: 'All',
        target_section: 'All',
        target_fee_status: 'all',
        category: 'General',
        priority: 'Normal',
        channels: ['in_app', 'email']
      });
      setSelectedStudentIds([]);
      setStudentSearchKeyword('');
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement and all associated student notifications?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/announcements/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const filteredPlatformNotices = platformNotices.filter(notice => {
    if (platformCategoryFilter !== 'All' && notice.category !== platformCategoryFilter) return false;
    if (platformPriorityFilter !== 'All' && notice.priority !== platformPriorityFilter) return false;
    if (platformReadFilter === 'unread' && notice.is_read) return false;
    if (platformReadFilter === 'read' && !notice.is_read) return false;
    if (platformSearch.trim()) {
      const q = platformSearch.toLowerCase().trim();
      const matchTitle = notice.title?.toLowerCase().includes(q);
      const matchMsg = notice.message?.toLowerCase().includes(q);
      const matchCat = notice.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Tab Switcher: School Broadcasts to Students VS VidyaBarta Platform Notices */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveMainTab('school_broadcasts');
              if (onTabChange) onTabChange('school_broadcasts');
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeMainTab === 'school_broadcasts'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
            }`}
          >
            <FaBullhorn />
            <span>School Broadcasts to Students</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMainTab('platform_notices');
              if (onTabChange) onTabChange('platform_notices');
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all relative ${
              activeMainTab === 'platform_notices'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
            }`}
          >
            <FaBuilding />
            <span>VidyaBarta Notices</span>
            {unreadPlatformCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {unreadPlatformCount} New
              </span>
            )}
            <span className="text-[10px] opacity-80 font-normal">
              ({platformNotices.length})
            </span>
          </button>
        </div>

        {/* Lifetime Guarantee Pill */}
        <div className="hidden md:flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-2xl font-semibold">
          <FaShieldAlt className="text-emerald-600" />
          <span>Lifetime Archive: Kept Forever</span>
        </div>
      </div>

      {activeMainTab === 'school_broadcasts' ? (
        <div className="space-y-8">
          {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <FaBullhorn size={26} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">School Broadcast Center</h2>
            <p className="text-sm text-gray-500">Dispatch targeted in-site notifications and email announcements to students.</p>
          </div>
        </div>

        {/* Live Audience Counter Pill */}
        <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-100 px-4 py-2.5 rounded-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-sm font-bold text-blue-900">
            {previewLoading ? (
              <span className="flex items-center gap-1.5"><FaSpinner className="animate-spin text-xs" /> Calculating...</span>
            ) : (
              <span>Targeting <strong>{previewData.totalCount}</strong> Students</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 underline ml-1"
          >
            Preview List
          </button>
        </div>
      </div>

      {/* Main Grid: Composer on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Broadcast Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FaPaperPlane className="text-blue-600 text-base" /> Compose Broadcast
              </h3>
              
              {/* Quick Template Dropdown */}
              <div className="relative inline-block text-left group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <FaMagic className="text-amber-500 text-xs" /> Quick Templates
                </button>
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 hidden group-hover:block z-20">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">Choose Template</p>
                  {QUICK_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Audience Targeting Filter Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FaFilter className="text-blue-500" /> Target Audience Filters
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Class Filter */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Class / Grade</label>
                    <select
                      className="w-full p-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={form.target_class}
                      onChange={e => setForm({ ...form, target_class: e.target.value })}
                    >
                      {classesList.filter(Boolean).map(c => {
                        const label = c === 'All' ? 'All Classes' : (c.startsWith('Class ') ? c : `Class ${c}`);
                        return <option key={c} value={c}>{label}</option>;
                      })}
                    </select>
                  </div>

                  {/* Section Filter */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                    <select
                      className="w-full p-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={form.target_section}
                      onChange={e => setForm({ ...form, target_section: e.target.value })}
                    >
                      <option value="All">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  {/* Fee Status Filter */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Fee Status</label>
                    <select
                      className="w-full p-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={form.target_fee_status}
                      onChange={e => setForm({ ...form, target_fee_status: e.target.value })}
                    >
                      <option value="all">All Students</option>
                      <option value="due">⚠️ Fee Defaulters / Any Dues</option>
                      <option value="admission_fee_pending">Admission Fee Pending</option>
                      <option value="admission_fee_paid">Admission Fee Paid</option>
                      <option value="all_clear">✓ All Clear (Fees Paid)</option>
                    </select>
                  </div>
                </div>

                {/* Individual Student Search */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                    <span>Search Specific Student (Optional)</span>
                    {studentSearchKeyword && (
                      <button 
                        type="button" 
                        onClick={() => setStudentSearchKeyword('')} 
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Clear Search
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Filter by Student Name or Admission ID..."
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={studentSearchKeyword}
                      onChange={e => setStudentSearchKeyword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Delivery Channels */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">
                        Delivery Channels
                      </label>
                      <p className="text-[11px] text-gray-500">
                        Choose one or both delivery channels for targeted students.
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
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FaCheck className="text-emerald-600" />
                        <span>Both Channels</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectSingleChannel('in_app')}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                          form.channels.length === 1 && form.channels.includes('in_app')
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        In-App Only
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectSingleChannel('email')}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                          form.channels.length === 1 && form.channels.includes('email')
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
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
                          ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 shadow-sm'
                          : 'bg-white border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="mt-0.5 text-lg">
                        {form.channels.includes('in_app') ? (
                          <FaCheckSquare className="text-blue-600 text-xl" />
                        ) : (
                          <FaSquare className="text-gray-300 text-xl" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FaBell className={form.channels.includes('in_app') ? 'text-blue-600' : 'text-gray-400'} />
                          <span className={`text-xs font-bold ${form.channels.includes('in_app') ? 'text-gray-900' : 'text-gray-500'}`}>
                            Student Portal Notices & Bell Alerts
                          </span>
                          <span className={`text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full ${
                            form.channels.includes('in_app')
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {form.channels.includes('in_app') ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Permanent in-site notices preserved for lifetime in student announcement feed & bell notifications.
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
                          : 'bg-white border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="mt-0.5 text-lg">
                        {form.channels.includes('email') ? (
                          <FaCheckSquare className="text-indigo-600 text-xl" />
                        ) : (
                          <FaSquare className="text-gray-300 text-xl" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className={form.channels.includes('email') ? 'text-indigo-600' : 'text-gray-400'} />
                          <span className={`text-xs font-bold ${form.channels.includes('email') ? 'text-indigo-950' : 'text-gray-500'}`}>
                            Email Broadcast
                          </span>
                          <span className={`text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full ${
                            form.channels.includes('email')
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {form.channels.includes('email') ? `${previewData.emailReadyCount} RECIPIENTS` : 'OFF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Direct HTML emails sent to verified student and parent inboxes with complete announcement details.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Summary Status Pill */}
                  {form.channels.includes('in_app') && form.channels.includes('email') && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                      <span>
                        <strong>Dual-Channel Broadcast Ready:</strong> Students will receive both permanent in-app portal notices AND direct email broadcasts.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full p-3 text-sm font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="General">General Announcement</option>
                      <option value="Fee Reminder">Fee Reminder</option>
                      <option value="Urgent Notice">Urgent Notice</option>
                      <option value="Academic">Academic & Exams</option>
                      <option value="Holiday">Holiday & Closure</option>
                      <option value="Event">School Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                    <select
                      className="w-full p-3 text-sm font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">⚠️ Urgent (Critical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Announcement Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Important Notice Regarding Term Exam Registration"
                    className="w-full p-3 text-sm font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex justify-between">
                    <span>Message Body</span>
                    <span className="text-gray-400 font-normal">{form.message.length} characters</span>
                  </label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Compose announcement message here..."
                    className="w-full p-3.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none leading-relaxed"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit Button with Dynamic Audience Counter */}
              <button
                type="submit"
                disabled={submitting || previewData.totalCount === 0}
                className="w-full py-4 px-6 rounded-2xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2.5 text-sm"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin text-base" /> Broadcasting to Students...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Send Broadcast to {previewData.totalCount} Students
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: Broadcast History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-gray-100 min-h-[550px] flex flex-col">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-gray-900">Broadcast Archive</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Lifetime
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-400">{announcements.length} Total Broadcasts</span>
              </div>
              {announcements.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search past announcements..."
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-semibold text-gray-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all outline-none"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                <FaSpinner className="animate-spin mr-2" /> Loading broadcast history...
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <FaBullhorn className="text-gray-300 text-4xl mb-3" />
                <p className="font-bold text-gray-600">No Announcements Sent Yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">Use the composer on the left to broadcast your first message to students.</p>
              </div>
            ) : (
              <div className="space-y-3.5 overflow-y-auto max-h-[700px] pr-1">
                {announcements
                  .filter(a => {
                    if (!historySearch.trim()) return true;
                    const q = historySearch.toLowerCase().trim();
                    return (
                      a.title?.toLowerCase().includes(q) ||
                      a.message?.toLowerCase().includes(q) ||
                      a.target_class?.toLowerCase().includes(q) ||
                      a.category?.toLowerCase().includes(q)
                    );
                  })
                  .map(a => {
                  const isUrgent = a.priority === 'Urgent';
                  return (
                    <div 
                      key={a.id} 
                      className="p-4 rounded-2xl border border-gray-100 bg-slate-50/70 hover:bg-white hover:shadow-md transition-all group relative"
                    >
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Delete Announcement"
                      >
                        <FaTrash size={13} />
                      </button>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md ${
                          isUrgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {a.category || 'General'}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-md">
                            URGENT
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto mr-5">
                          {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-base leading-snug mb-1">{a.title}</h4>
                      <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed whitespace-pre-wrap">{a.message}</p>

                      {/* Meta Delivery Bar */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200/60 text-[11px] text-gray-500">
                        <span className="font-semibold text-gray-700">
                          Class: {a.target_class || 'All'}
                        </span>
                        {a.target_fee_status && a.target_fee_status !== 'all' && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            {a.target_fee_status}
                          </span>
                        )}
                        {a.stats && (
                          <div className="flex items-center gap-2 ml-auto text-[10px] font-bold">
                            {a.stats.in_app_count > 0 && (
                              <span className="text-blue-600 flex items-center gap-0.5"><FaBell size={10} /> {a.stats.in_app_count} In-App</span>
                            )}
                            {a.stats.email_sent > 0 && (
                              <span className="text-indigo-600 flex items-center gap-0.5"><FaEnvelope size={10} /> {a.stats.email_sent} Email</span>
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
  ) : (
        /* ======================================================== */
        /* VIDYABARTA PLATFORM NOTICES ARCHIVE (FROM SUPERADMIN) */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <FaBuilding size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">VidyaBarta Notices</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                    Lifetime Archive
                  </span>
                </div>
                <p className="text-sm text-gray-500">Official advisories, maintenance updates, and circulars.</p>
              </div>
            </div>

            {unreadPlatformCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllPlatformRead}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-200 flex items-center gap-1.5"
              >
                <FaCheck />
                <span>Mark All as Read ({unreadPlatformCount})</span>
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={platformSearch}
                onChange={e => setPlatformSearch(e.target.value)}
                placeholder="Search official platform notices by keyword..."
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
              {platformSearch && (
                <button
                  type="button"
                  onClick={() => setPlatformSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={platformCategoryFilter}
                onChange={e => setPlatformCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50 text-gray-700 outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Platform Update">Platform Update</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Billing">Billing & Subscription</option>
                <option value="General">General Notice</option>
              </select>

              <select
                value={platformPriorityFilter}
                onChange={e => setPlatformPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50 text-gray-700 outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">⚠️ Critical / Urgent</option>
                <option value="Important">Important</option>
                <option value="Normal">Normal</option>
              </select>

              <select
                value={platformReadFilter}
                onChange={e => setPlatformReadFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-slate-50 text-gray-700 outline-none"
              >
                <option value="all">All Notices</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>

          {/* Notices Cards List */}
          {platformLoading ? (
            <div className="p-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
              <FaSpinner className="animate-spin text-3xl mx-auto mb-3 text-indigo-500" />
              <p className="font-bold text-gray-700">Loading VidyaBarta notices...</p>
            </div>
          ) : filteredPlatformNotices.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 space-y-3">
              <FaBuilding className="text-4xl text-gray-300 mx-auto" />
              <p className="font-bold text-gray-700 text-base">No VidyaBarta Notices Found</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {platformNotices.length === 0
                  ? 'There are currently no announcements from VidyaBarta for your school.'
                  : 'No notices match your search or filter criteria. Try clearing your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlatformNotices.map(notice => {
                const isCritical = notice.priority === 'Critical' || notice.priority === 'Urgent';
                const isImportant = notice.priority === 'Important';
                return (
                  <div
                    key={notice.id}
                    className={`bg-white rounded-3xl border transition-all p-6 shadow-sm hover:shadow-md relative overflow-hidden ${
                      isCritical
                        ? 'border-red-200 bg-red-50/10'
                        : isImportant
                        ? 'border-amber-200 bg-amber-50/10'
                        : 'border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    {/* Left Colored Accent Bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      isCritical ? 'bg-red-500' : isImportant ? 'bg-amber-500' : 'bg-indigo-500'
                    }`} />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : isImportant
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}>
                          {notice.category || 'Platform Advisory'}
                        </span>

                        {isCritical && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                            CRITICAL
                          </span>
                        )}

                        {!notice.is_read && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> NEW
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FaCalendarAlt size={11} />
                        <span>{new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 tracking-tight mb-2">
                      {notice.title}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-wrap mb-4">
                      {notice.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlatformNotice(notice);
                            if (!notice.is_read) handleMarkPlatformRead(notice.id);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <FaEye />
                          <span>Read Full Notice</span>
                        </button>

                        {notice.action_url && (
                          <a
                            href={notice.action_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 ml-3"
                          >
                            <FaExternalLinkAlt size={10} />
                            <span>{notice.action_label || 'Open Link'}</span>
                          </a>
                        )}
                      </div>

                      {!notice.is_read ? (
                        <button
                          type="button"
                          onClick={() => handleMarkPlatformRead(notice.id)}
                          className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <FaCheck size={11} />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <FaCheckCircle size={12} />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detailed Full Reading Modal for Platform Notice */}
      {selectedPlatformNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <FaBuilding size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                      {selectedPlatformNotice.category || 'Platform Notice'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                      {selectedPlatformNotice.priority || 'Normal'} Priority
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Broadcasted: {new Date(selectedPlatformNotice.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlatformNotice(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                {selectedPlatformNotice.title}
              </h2>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-sans">
                {selectedPlatformNotice.message}
              </div>

              {selectedPlatformNotice.action_url && (
                <div className="pt-2 text-center">
                  <a
                    href={selectedPlatformNotice.action_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <span>{selectedPlatformNotice.action_label || 'View Details'}</span>
                    <FaExternalLinkAlt size={11} />
                  </a>
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <FaShieldAlt className="text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Lifetime Retention:</strong> This official announcement remains permanently archived in your school's VidyaBarta records.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button
                type="button"
                onClick={() => setSelectedPlatformNotice(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">Target Recipients Preview</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewData.totalCount} students match current criteria ({previewData.emailReadyCount} with email)
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {previewData.students.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaUsers className="text-gray-300 text-4xl mx-auto mb-2" />
                  <p className="font-bold">No matching students found</p>
                  <p className="text-xs">Try adjusting your class, section, or fee status filters.</p>
                </div>
              ) : (
                previewData.students.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-gray-500 text-[11px]">Roll/ID: {s.admission_id || 'N/A'} • Class: {s.grade} {s.section || ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.fee_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.fee_paid ? 'Fee Paid' : 'Fee Due'}
                      </span>
                      {s.has_email ? (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <FaEnvelope size={9} /> Email Ready
                        </span>
                      ) : (
                        <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-medium">
                          No Email
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAnnouncements;
