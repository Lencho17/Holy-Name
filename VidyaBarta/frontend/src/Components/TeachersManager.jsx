import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  FaChalkboardTeacher, 
  FaPlus, 
  FaFileUpload, 
  FaDownload, 
  FaSearch, 
  FaTrash, 
  FaEdit, 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaUserTie, 
  FaEnvelope, 
  FaPhone, 
  FaKey,
  FaCopy,
  FaFileExcel,
  FaChevronDown,
  FaChevronUp,
  FaUsers
} from 'react-icons/fa';
import BulkUpload from './BulkUpload';

const TeachersManager = ({ apiUrl, token }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Selection & Bulk Actions State
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const selectAllRef = useRef(null);

  // Manual Add Form State
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', phone: '', role: 'Teacher' });
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [manualAddError, setManualAddError] = useState('');

  // Edit Form State
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'Teacher', job_profile: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch all teachers/staff from backend
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/staff/admin/teachers-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      // Fallback to all-staff if teachers-list is not reachable
      try {
        const fallbackRes = await axios.get(`${apiUrl}/staff/admin/all-staff`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeachers(fallbackRes.data || []);
      } catch (fbErr) {
        console.error('Fallback all-staff failed:', fbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [apiUrl, token]);

  // Copy helper
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add staff manually
  const handleAddStaffManual = async (e) => {
    e.preventDefault();
    setIsAddingStaff(true);
    setNewStaffPassword('');
    setManualAddError('');

    try {
      const res = await axios.post(`${apiUrl}/auth/add-staff-manual`, newStaffForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.temporaryPassword) {
        setNewStaffPassword(res.data.temporaryPassword);
      } else {
        setNewStaffPassword('Staff@123');
      }
      setNewStaffForm({ name: '', email: '', phone: '', role: 'Teacher' });
      fetchTeachers();
    } catch (err) {
      setManualAddError(err.response?.data?.message || err.message || 'Failed to add staff');
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setEditForm({
      name: t.name || '',
      email: t.email || '',
      phone: t.phone || '',
      role: t.role || 'Teacher',
      job_profile: t.job_profile || ''
    });
    setEditError('');
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setIsUpdating(true);
    setEditError('');

    try {
      await axios.patch(`${apiUrl}/staff/admin/teachers/${editingTeacher.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingTeacher(null);
      fetchTeachers();
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Failed to update teacher');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the teachers and staff database?`)) return;

    try {
      await axios.delete(`${apiUrl}/staff/admin/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(prev => prev.filter(t => t.id !== id));
      setSelectedTeacherIds(prev => prev.filter(i => i !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete teacher');
    }
  };

  // Bulk Delete Selected Teachers
  const handleBulkDelete = async () => {
    if (selectedTeacherIds.length === 0) return;
    const count = selectedTeacherIds.length;
    if (!window.confirm(`Are you sure you want to permanently delete the selected ${count} teacher(s)/staff member(s)?`)) return;

    try {
      setIsBulkDeleting(true);
      await axios.post(`${apiUrl}/staff/admin/teachers/bulk-delete`, {
        ids: selectedTeacherIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(prev => prev.filter(t => !selectedTeacherIds.includes(t.id)));
      setSelectedTeacherIds([]);
    } catch (err) {
      console.error('Failed to bulk delete:', err);
      alert(err.response?.data?.message || 'Failed to delete selected teachers');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Export visible or selected teachers to Excel (.xlsx)
  const handleExportExcel = (onlySelected = false) => {
    const listToExport = onlySelected
      ? filteredTeachers.filter(t => selectedTeacherIds.includes(t.id))
      : filteredTeachers;

    if (listToExport.length === 0) {
      alert('No teachers to export');
      return;
    }

    const exportRows = listToExport.map((t, idx) => ({
      'Sl No': idx + 1,
      'Full Name': t.name || '',
      'Email Address': t.email || '',
      'Phone Number': t.phone || '',
      'Designation / Subject': t.job_profile || t.role || '',
      'Role': t.role || 'Teacher',
      'Status': t.is_approved ? 'Active' : 'Pending',
      'Joining Date': t.created_at ? new Date(t.created_at).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers & Staff');
    const filename = onlySelected
      ? `Selected_Teachers_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `Teachers_List_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.phone && t.phone.toLowerCase().includes(q)) ||
        (t.job_profile && t.job_profile.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || 
        (t.role && t.role.toLowerCase() === roleFilter.toLowerCase());

      return matchSearch && matchRole;
    });
  }, [teachers, searchQuery, roleFilter]);

  // Selection state helpers
  const filteredTeacherIds = useMemo(() => filteredTeachers.map(t => t.id), [filteredTeachers]);
  const isAllSelected = filteredTeacherIds.length > 0 && filteredTeacherIds.every(id => selectedTeacherIds.includes(id));
  const isSomeSelected = filteredTeacherIds.some(id => selectedTeacherIds.includes(id)) && !isAllSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const toggleSelectTeacher = (id) => {
    setSelectedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTeacherIds(prev => prev.filter(id => !filteredTeacherIds.includes(id)));
    } else {
      setSelectedTeacherIds(prev => Array.from(new Set([...prev, ...filteredTeacherIds])));
    }
  };

  const deselectAll = () => {
    setSelectedTeacherIds([]);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.is_approved !== false).length;
    const teachersCount = teachers.filter(t => (t.role || '').toLowerCase() === 'teacher').length;
    const otherCount = total - teachersCount;
    return { total, active, teachersCount, otherCount };
  }, [teachers]);

  // Avatar background colors generator
  const getAvatarColor = (name = '') => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-emerald-600',
      'bg-teal-600',
      'bg-rose-600',
      'bg-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FaChalkboardTeacher className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800">Teachers & Staff Database</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                Manage all school teaching and non-teaching personnel, credentials, and bulk upload spreadsheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Toggle Bulk Upload Panel */}
          <button 
            onClick={() => setShowBulkPanel(!showBulkPanel)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
              showBulkPanel 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FaFileUpload />
            <span>{showBulkPanel ? 'Hide Bulk Upload' : 'Bulk Upload Teachers'}</span>
            {showBulkPanel ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
          </button>

          {/* Add Staff Manually */}
          <button 
            onClick={() => { setShowAddModal(true); setNewStaffPassword(''); setManualAddError(''); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center gap-2 transition-colors shadow-sm"
          >
            <FaPlus className="text-blue-600" />
            <span>Add Single Staff</span>
          </button>

          {/* Export to Excel */}
          <button 
            onClick={handleExportExcel}
            disabled={teachers.length === 0}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            title="Export filtered teachers list to Excel"
          >
            <FaFileExcel className="text-emerald-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FaUsers className="text-lg" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-xl font-black text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FaChalkboardTeacher className="text-lg" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teachers</p>
            <p className="text-xl font-black text-gray-800">{stats.teachersCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FaUserTie className="text-lg" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Non-Teaching</p>
            <p className="text-xl font-black text-gray-800">{stats.otherCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FaCheckCircle className="text-lg" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Status</p>
            <p className="text-xl font-black text-gray-800">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Collapsible Bulk Upload Section */}
      {showBulkPanel && (
        <div className="animate-fadeIn">
          <BulkUpload 
            apiUrl={apiUrl} 
            endpoint="teachers" 
            token={token} 
            entityName="Teachers" 
            onUploadSuccess={() => {
              fetchTeachers();
            }}
          />
        </div>
      )}

      {/* Directory Table and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input 
              type="text"
              placeholder="Search by name, email, phone, or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 hidden sm:inline">Role:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              >
                <option value="all">All Roles</option>
                <option value="teacher">Teacher</option>
                <option value="principal">Principal</option>
                <option value="vice principal">Vice Principal</option>
                <option value="clerk">Clerk</option>
                <option value="librarian">Librarian</option>
                <option value="lab assistant">Lab Assistant</option>
                <option value="accountant">Accountant</option>
                <option value="support staff">Support Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {filteredTeachers.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 shadow-2xs cursor-pointer ${
                  isAllSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                title={isAllSelected ? "Deselect all visible teachers" : "Select all visible teachers"}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={isAllSelected}
                  ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                  className="w-3.5 h-3.5 rounded text-blue-600 pointer-events-none accent-blue-600"
                />
                <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}

            <span className="text-xs text-gray-400 font-semibold">
              Showing {filteredTeachers.length} of {teachers.length}
            </span>
          </div>
        </div>

        {/* Bulk Selection Actions Bar */}
        {selectedTeacherIds.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm border-b border-blue-700">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center shrink-0">
                {selectedTeacherIds.length}
              </span>
              <span className="text-xs sm:text-sm font-bold">
                {selectedTeacherIds.length} {selectedTeacherIds.length === 1 ? 'teacher / staff selected' : 'teachers / staff selected'}
              </span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs text-blue-100 hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleExportExcel(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export selected teachers to Excel"
              >
                <FaFileExcel className="text-emerald-300" />
                <span>Export Selected ({selectedTeacherIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                title="Delete selected teachers"
              >
                {isBulkDeleting ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                <span>Delete Selected ({selectedTeacherIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Teachers Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
              <p className="text-xs font-semibold">Loading teachers directory...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="py-16 text-center px-4 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-2xl mb-3">
                <FaChalkboardTeacher />
              </div>
              <h4 className="font-bold text-gray-700 text-base mb-1">No Teachers or Staff Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                {searchQuery || roleFilter !== 'all' 
                  ? 'No personnel matched your active filters. Try clearing your search query.' 
                  : 'Start by uploading your teachers list in bulk using a CSV/Excel file or adding a teacher manually.'}
              </p>
              {!showBulkPanel && (
                <button
                  onClick={() => setShowBulkPanel(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <FaFileUpload /> Bulk Upload Teachers
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-600 uppercase tracking-wider text-[11px] font-bold select-none">
                  {/* Select All Checkbox */}
                  <th className="py-3.5 px-3 w-10 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        ref={selectAllRef}
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        title={isAllSelected ? "Deselect all visible" : "Select all visible"}
                        aria-label="Select all teachers"
                        className="w-4 h-4 rounded text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer transition-colors accent-blue-600"
                      />
                    </div>
                  </th>
                  {/* Serial Number */}
                  <th className="py-3.5 px-2 w-14 text-center font-bold text-gray-500 tracking-wider">
                    #
                  </th>
                  <th className="py-3.5 px-4">Teacher / Staff</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Role & Designation</th>
                  <th className="py-3.5 px-4">Status & Access</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTeachers.map((t, index) => {
                  const isSelected = selectedTeacherIds.includes(t.id);
                  const initials = (t.name || 'T')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr 
                      key={t.id} 
                      className={`transition-colors group ${
                        isSelected 
                          ? 'bg-blue-50/80 hover:bg-blue-100/70' 
                          : 'hover:bg-blue-50/30'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTeacher(t.id)}
                            aria-label={`Select ${t.name}`}
                            className="w-4 h-4 rounded text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer transition-colors accent-blue-600"
                          />
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="py-3.5 px-2 text-center font-mono text-xs font-bold text-gray-400 group-hover:text-blue-600">
                        {index + 1}
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 ${getAvatarColor(t.name)}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-sm truncate">{t.name}</p>
                            <p className="text-gray-500 text-[11px] truncate">
                              {t.job_profile || t.role || 'Faculty'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-gray-600 font-mono text-[11px]">
                            <FaEnvelope className="text-gray-400 shrink-0" size={10} />
                            <span className="truncate">{t.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(t.email, `email-${t.id}`)}
                              className="text-gray-400 hover:text-blue-600 ml-1 transition-colors"
                              title="Copy Email"
                            >
                              {copiedId === `email-${t.id}` ? <FaCheckCircle className="text-emerald-500" size={10} /> : <FaCopy size={10} />}
                            </button>
                          </div>
                          {t.phone ? (
                            <div className="flex items-center gap-1.5 text-gray-600 font-mono text-[11px]">
                              <FaPhone className="text-gray-400 shrink-0" size={10} />
                              <span>{t.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(t.phone, `phone-${t.id}`)}
                                className="text-gray-400 hover:text-blue-600 ml-1 transition-colors"
                                title="Copy Phone"
                              >
                                {copiedId === `phone-${t.id}` ? <FaCheckCircle className="text-emerald-500" size={10} /> : <FaCopy size={10} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[11px] italic">No phone set</span>
                          )}
                        </div>
                      </td>

                      {/* Role & Designation */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            (t.role || '').toLowerCase() === 'teacher' 
                              ? 'bg-blue-100 text-blue-700' 
                              : (t.role || '').toLowerCase() === 'principal' 
                                ? 'bg-purple-100 text-purple-700'
                                : (t.role || '').toLowerCase() === 'admin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                          }`}>
                            {t.role || 'Teacher'}
                          </span>
                          {t.job_profile && (
                            <span className="text-[11px] text-gray-500 truncate max-w-[180px]">
                              {t.job_profile}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & Default Login */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                            <FaKey size={8} className="text-amber-500" />
                            Default: {t.phone ? 'Phone / Staff@123' : 'Staff@123'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit details"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete teacher"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            Showing {filteredTeachers.length} of {teachers.length} teachers and staff members
            {selectedTeacherIds.length > 0 && ` (${selectedTeacherIds.length} selected)`}.
          </span>
          <span className="text-gray-400">
            Bulk upload supports .csv, .xlsx, .xls spreadsheets with auto-upsert.
          </span>
        </div>
      </div>

      {/* Add Staff Manually Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <FaChalkboardTeacher className="text-blue-600" />
                Add Staff Manually
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            {newStaffPassword ? (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl mb-4 text-center">
                <FaCheckCircle className="text-emerald-500 text-3xl mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-900 mb-1">Staff Member Added Successfully!</h4>
                <p className="text-xs text-emerald-700 mb-3">
                  Please share this temporary password with the teacher for their initial login:
                </p>
                <div className="bg-white p-3 rounded-lg border border-emerald-200 font-mono text-base font-bold text-gray-800 select-all mb-4 flex items-center justify-center gap-2">
                  <span>{newStaffPassword}</span>
                  <button
                    onClick={() => handleCopy(newStaffPassword, 'new-pwd')}
                    className="text-gray-400 hover:text-blue-600 ml-2"
                    title="Copy password"
                  >
                    {copiedId === 'new-pwd' ? <FaCheckCircle className="text-emerald-500" /> : <FaCopy />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setNewStaffPassword(''); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddStaffManual} className="space-y-4">
                {manualAddError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                    <FaExclamationTriangle className="shrink-0" />
                    <span>{manualAddError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newStaffForm.name} 
                    onChange={e => setNewStaffForm({...newStaffForm, name: e.target.value})} 
                    placeholder="e.g. Dr. Anita Sharma" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newStaffForm.email} 
                    onChange={e => setNewStaffForm({...newStaffForm, email: e.target.value})} 
                    placeholder="teacher@school.edu" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newStaffForm.phone} 
                    onChange={e => setNewStaffForm({...newStaffForm, phone: e.target.value})} 
                    placeholder="10-digit mobile number" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role / Department *</label>
                  <select 
                    required 
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newStaffForm.role} 
                    onChange={e => setNewStaffForm({...newStaffForm, role: e.target.value})}
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Principal">Principal</option>
                    <option value="Vice Principal">Vice Principal</option>
                    <option value="Clerk">Clerk</option>
                    <option value="Librarian">Librarian</option>
                    <option value="Lab Assistant">Lab Assistant</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Support Staff">Support Staff</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 font-bold text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isAddingStaff}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAddingStaff ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                    {isAddingStaff ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <FaEdit className="text-blue-600" />
                Edit Staff Member
              </h3>
              <button 
                onClick={() => setEditingTeacher(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <FaExclamationTriangle className="shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={editForm.phone} 
                  onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Designation / Subject</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={editForm.job_profile} 
                  onChange={e => setEditForm({...editForm, job_profile: e.target.value})} 
                  placeholder="e.g. Senior Math Teacher"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={editForm.role} 
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Principal">Principal</option>
                  <option value="Vice Principal">Vice Principal</option>
                  <option value="Clerk">Clerk</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Lab Assistant">Lab Assistant</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Support Staff">Support Staff</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 font-bold text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdating ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersManager;
