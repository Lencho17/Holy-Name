import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiImage, FiUpload, FiMoreVertical, FiEdit2, FiTrash2, FiUser, FiPower, FiSettings } from 'react-icons/fi';

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

export const ManageSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangeAdminModalOpen, setIsChangeAdminModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Specific Form States for Edit & Change Admin
  const [editFormData, setEditFormData] = useState({});
  const [adminFormData, setAdminFormData] = useState({});
  const [servicesFormData, setServicesFormData] = useState({
    admission: true, career: true, tenders: true, appointment: true, gallery: true, studentPortal: true, faculty: true, alumestron: true, excellence: true, complaints: true
  });

  // Close dropdown when clicking outside
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    package: '',
    phone: '',
    email: '',
    tagline: '',
    address: '',
    subdomain: '',
    custom_domain: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_contact: '',
    admin_email: '',
    admin_image_url: ''
  });

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get('/api/superadmin/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchools(res.data || []);
    } catch (err) {
      console.error('Failed to fetch schools', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleStatusToggle = async (school) => {
    const newStatus = school.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`/api/superadmin/schools/${school.id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchools();
      setOpenDropdownId(null);
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  const handleDeleteSchool = async () => {
    try {
      setModalLoading(true);
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/superadmin/schools/${selectedSchool.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchools();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete school', err);
      alert('Failed to delete school');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchServicesVisibility = async (schoolId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`/api/superadmin/schools/${schoolId}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.services_visibility) {
        setServicesFormData(res.data.services_visibility);
      } else {
        // default if not set
        setServicesFormData({
          admission: true, career: true, tenders: true, appointment: true, gallery: true, studentPortal: true, faculty: true, alumestron: true, excellence: true, complaints: true
        });
      }
    } catch (err) {
      console.error('Failed to fetch services visibility', err);
    }
  };

  const handleServicesSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/superadmin/schools/${selectedSchool.id}/settings`, {
        services_visibility: servicesFormData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsServicesModalOpen(false);
    } catch (err) {
      console.error('Failed to update services', err);
      alert('Failed to update services');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/superadmin/schools/${selectedSchool.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchools();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to edit school', err);
      alert('Failed to edit school');
    } finally {
      setModalLoading(false);
    }
  };

  const handleChangeAdminSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      const token = localStorage.getItem('adminToken');
      const adminId = selectedSchool.admins && selectedSchool.admins.length > 0 ? selectedSchool.admins[0].id : null;
      if (!adminId) {
        alert('No admin found for this school');
        return;
      }
      await axios.patch(`/api/superadmin/schools/${selectedSchool.id}/admin`, { ...adminFormData, admin_id: adminId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchools();
      setIsChangeAdminModalOpen(false);
    } catch (err) {
      console.error('Failed to change admin', err);
      alert('Failed to change admin');
    } finally {
      setModalLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadImage = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);
      
      // using the existing upload endpoint
      const res = await axios.post('/api/content/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData(prev => ({ ...prev, [fieldName]: res.data.url }));
    } catch (err) {
      console.error('Upload failed', err);
      setError('Image upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      
      // Append .vidyabarta.in to subdomain if not already present
      const submissionData = { ...formData };
      if (submissionData.subdomain && !submissionData.subdomain.endsWith('.vidyabarta.in')) {
        submissionData.subdomain = `${submissionData.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}.vidyabarta.in`;
      }
      
      await axios.post('/api/superadmin/schools', submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('School created successfully!');
      fetchSchools();
      // Reset form
      setFormData({
        name: '', logo_url: '', package: '', phone: '', email: '', tagline: '', address: '',
        subdomain: '', custom_domain: '', admin_first_name: '', admin_last_name: '',
        admin_contact: '', admin_email: '', admin_image_url: ''
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageWrapper title="Schools">
      <form id="createSchoolForm" onSubmit={handleSubmit} className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Add School Section */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <h2 className="text-title-lg font-bold text-neutral mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
              School Details
            </h2>
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-start gap-2"><span className="font-bold">Error:</span> {error}</div>}
            {success && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-6 text-sm border border-emerald-100 flex items-start gap-2"><span className="font-bold">Success:</span> {success}</div>}

            <div className="space-y-5">
              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">School Name <span className="text-red-500">*</span></label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="e.g. Holy Name High School" />
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">School Logo</label>
                <div className="flex items-center gap-4 p-4 border border-dashed border-outline-variant rounded-xl bg-surface/50">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-outline-variant shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-surface-variant flex items-center justify-center text-outline">
                      <FiImage size={24} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border border-outline-variant hover:bg-surface-variant/50 px-5 py-2.5 rounded-xl text-label-md font-medium transition-all shadow-sm flex items-center gap-2">
                    <FiUpload /> Choose Logo
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, 'logo_url')} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">Subscription Package <span className="text-red-500">*</span></label>
                <select required name="package" value={formData.package} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md appearance-none">
                  <option value="">Select a package</option>
                  <option value="Basic">Basic Package</option>
                  <option value="Standard">Standard Package</option>
                  <option value="Premium">Premium Package</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-label-md font-medium text-neutral mb-1.5">Contact Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-label-md font-medium text-neutral mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="school@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">Tagline / Motto</label>
                <input type="text" name="tagline" value={formData.tagline} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="e.g. Excellence in Education" />
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">Full Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md resize-none" placeholder="123 School Lane, City, State, ZIP"></textarea>
              </div>

              <div className="p-5 bg-surface-variant/30 rounded-xl border border-outline-variant">
                <h3 className="text-label-lg font-bold text-neutral mb-3">Domain Configuration</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-label-md font-medium text-neutral mb-1.5">System Subdomain <span className="text-red-500">*</span></label>
                    <div className="flex">
                      <input required type="text" name="subdomain" value={formData.subdomain} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant border-r-0 rounded-l-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md outline-none" placeholder="school-name" />
                      <span className="px-4 py-3 bg-surface-variant border border-outline-variant rounded-r-xl text-neutral font-medium text-body-md whitespace-nowrap">.vidyabarta.in</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-md font-medium text-neutral mb-1.5">Custom Domain</label>
                    <input type="text" name="custom_domain" value={formData.custom_domain} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="www.school.com (Optional)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Admin Section */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-sm h-fit relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary"></div>
            <h2 className="text-title-lg font-bold text-neutral mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm">2</span>
              Admin Account
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-label-md font-medium text-neutral mb-1.5">First Name <span className="text-red-500">*</span></label>
                  <input required type="text" name="admin_first_name" value={formData.admin_first_name} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="John" />
                </div>
                <div>
                  <label className="block text-label-md font-medium text-neutral mb-1.5">Last Name</label>
                  <input type="text" name="admin_last_name" value={formData.admin_last_name} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">Admin Profile Picture</label>
                <div className="flex items-center gap-4 p-4 border border-dashed border-outline-variant rounded-xl bg-surface/50">
                  {formData.admin_image_url ? (
                    <img src={formData.admin_image_url} alt="Admin" className="w-16 h-16 rounded-full object-cover border border-outline-variant shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-outline">
                      <FiUpload size={20} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border border-outline-variant hover:bg-surface-variant/50 px-5 py-2.5 rounded-xl text-label-md font-medium transition-all shadow-sm flex items-center gap-2">
                    <FiUpload /> Choose Photo
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, 'admin_image_url')} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">Personal Contact Number</label>
                <input type="text" name="admin_contact" value={formData.admin_contact} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="+91 9876543210" />
              </div>

              <div>
                <label className="block text-label-md font-medium text-neutral mb-1.5">Admin Email (Login ID) <span className="text-red-500">*</span></label>
                <input required type="email" name="admin_email" value={formData.admin_email} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl transition-all text-body-md" placeholder="admin@school.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Submit Action */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={creating}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-xl shadow-button hover:shadow-button-hover transition-all flex items-center gap-3 text-label-lg"
          >
            {creating ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Creating Workspace...</>
            ) : (
              'Create School & Provision Admin'
            )}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface/50">
          <h2 className="text-title-lg font-bold text-neutral">Registered Schools</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage and monitor all active school tenants.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-on-surface-variant text-label-sm uppercase tracking-wider border-b border-outline-variant">
                <th className="p-5 font-bold">No.</th>
                <th className="p-5 font-bold">School Identity</th>
                <th className="p-5 font-bold">Primary Admin</th>
                <th className="p-5 font-bold">Package</th>
                <th className="p-5 font-bold">Domains</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-on-surface-variant">Loading schools...</td>
                </tr>
              ) : schools.length > 0 ? (
                schools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((school, index) => (
                  <tr key={school.id} className="border-b border-outline-variant/50 hover:bg-surface-variant/20 transition-colors group">
                    <td className="p-5 text-on-surface-variant">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-outline-variant shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {school.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-neutral block">{school.name}</span>
                          <span className="text-body-sm text-on-surface-variant">{school.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      {school.admins && school.admins.length > 0 ? (
                        <div className="flex items-center gap-3">
                          {school.admins[0].image_url ? (
                            <img src={school.admins[0].image_url} alt="Admin" className="w-8 h-8 rounded-full object-cover border border-outline-variant" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                              {(school.admins[0].first_name || school.admins[0].name || 'A').charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-neutral">
                            {`${school.admins[0].first_name || ''} ${school.admins[0].last_name || ''}`.trim() || school.admins[0].name || school.admins[0].email}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                        school.package === 'Premium' ? 'bg-purple-100 text-purple-800' :
                        school.package === 'Standard' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {school.package || 'None'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <a 
                          href={window.location.hostname === 'localhost' ? `http://localhost:5173/?test_domain=${school.subdomain}` : `http://${school.subdomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-medium text-sm hover:underline"
                        >
                          {school.subdomain}
                        </a>
                        {school.custom_domain && (
                          <a 
                            href={school.custom_domain.startsWith('http') ? school.custom_domain : `http://${school.custom_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-on-surface-variant bg-surface px-2 py-0.5 rounded border border-outline-variant w-fit hover:bg-surface-variant transition-colors"
                          >
                            {school.custom_domain}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                        school.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {school.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-5 text-right relative">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === school.id ? null : school.id)}
                        className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-label-md font-bold transition-all shadow-sm"
                      >
                        Manage
                      </button>
                      
                      {openDropdownId === school.id && (
                        <div ref={dropdownRef} className="absolute right-5 top-12 mt-1 w-48 bg-white rounded-xl shadow-lg border border-outline-variant py-2 z-10 text-left animate-fadeIn">
                          <button 
                            onClick={() => {
                              setSelectedSchool(school);
                              fetchServicesVisibility(school.id);
                              setIsServicesModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-body-md text-neutral hover:bg-surface-variant transition-colors flex items-center gap-2"
                          >
                            <FiSettings className="text-primary" /> Manage Services
                          </button>
                          
                          <button 
                            onClick={() => {
                              setSelectedSchool(school);
                              setAdminFormData({
                                first_name: school.admins?.[0]?.first_name || '',
                                last_name: school.admins?.[0]?.last_name || '',
                                email: school.admins?.[0]?.email || '',
                                phone: school.admins?.[0]?.phone || '',
                                password: ''
                              });
                              setIsChangeAdminModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-body-md text-neutral hover:bg-surface-variant transition-colors flex items-center gap-2"
                          >
                            <FiUser className="text-secondary" /> Change Admin
                          </button>
                          
                          <button 
                            onClick={() => handleStatusToggle(school)}
                            className="w-full text-left px-4 py-2 text-body-md text-neutral hover:bg-surface-variant transition-colors flex items-center gap-2"
                          >
                            <FiPower className={school.status === 'Active' ? 'text-error' : 'text-emerald-500'} /> 
                            {school.status === 'Active' ? 'Deactivate School' : 'Activate School'}
                          </button>
                          
                          <button 
                            onClick={() => {
                              setSelectedSchool(school);
                              setEditFormData({
                                name: school.name,
                                subdomain: school.subdomain,
                                custom_domain: school.custom_domain || '',
                                package: school.package || '',
                                phone: school.phone || '',
                                email: school.email || '',
                                tagline: school.tagline || '',
                                address: school.address || ''
                              });
                              setIsEditModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-body-md text-neutral hover:bg-surface-variant transition-colors flex items-center gap-2"
                          >
                            <FiEdit2 className="text-primary" /> Edit
                          </button>
                          
                          <button 
                            onClick={() => {
                              setSelectedSchool(school);
                              setIsDeleteModalOpen(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-body-md text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                          >
                            <FiTrash2 className="text-error" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-on-surface-variant">
                    No schools registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {schools.length > itemsPerPage && (
          <div className="p-4 border-t border-outline-variant bg-surface/50 flex justify-between items-center">
            <span className="text-body-sm text-on-surface-variant">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, schools.length)} of {schools.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-outline-variant text-label-sm font-medium hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(schools.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-label-sm font-bold flex items-center justify-center transition-colors ${
                    currentPage === page ? 'bg-primary text-white' : 'hover:bg-surface-variant text-neutral'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(schools.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(schools.length / itemsPerPage)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant text-label-sm font-medium hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit School Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface/50">
              <h2 className="text-title-lg font-bold text-neutral">Edit School</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-neutral hover:bg-surface-variant p-2 rounded-full transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="editSchoolForm" onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="block text-label-md font-medium text-neutral mb-1.5">School Name</label>
                  <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl" required />
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-label-md font-medium text-neutral mb-1.5">System Subdomain</label>
                    <input type="text" value={editFormData.subdomain} onChange={(e) => setEditFormData({...editFormData, subdomain: e.target.value})} className="w-full px-4 py-3 bg-surface-variant border border-outline-variant rounded-xl text-on-surface-variant" readOnly />
                  </div>
                  <div>
                    <label className="block text-label-md font-medium text-neutral mb-1.5">Custom Domain</label>
                    <input type="text" value={editFormData.custom_domain} onChange={(e) => setEditFormData({...editFormData, custom_domain: e.target.value})} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-label-md font-medium text-neutral mb-1.5">Subscription Package</label>
                  <select value={editFormData.package} onChange={(e) => setEditFormData({...editFormData, package: e.target.value})} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary rounded-xl">
                    <option value="Basic">Basic Package</option>
                    <option value="Standard">Standard Package</option>
                    <option value="Premium">Premium Package</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-label-md font-medium text-neutral mb-1.5">Email Address</label>
                    <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-label-md font-medium text-neutral mb-1.5">Phone Number</label>
                    <input type="text" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-4 py-3 bg-white border border-outline-variant focus:border-primary rounded-xl" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface/50">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl text-label-md font-bold text-neutral hover:bg-surface-variant transition-colors border border-outline-variant">Cancel</button>
              <button type="submit" form="editSchoolForm" disabled={modalLoading} className="px-6 py-2.5 rounded-xl text-label-md font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                {modalLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Admin Modal */}
      {isChangeAdminModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface/50">
              <h2 className="text-title-lg font-bold text-neutral">Change Primary Admin</h2>
              <button onClick={() => setIsChangeAdminModalOpen(false)} className="text-neutral hover:bg-surface-variant p-2 rounded-full transition-colors">✕</button>
            </div>
            <div className="p-6">
              <form id="changeAdminForm" onSubmit={handleChangeAdminSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm font-medium text-neutral mb-1">First Name</label>
                    <input type="text" value={adminFormData.first_name} onChange={(e) => setAdminFormData({...adminFormData, first_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant focus:border-primary rounded-xl" required />
                  </div>
                  <div>
                    <label className="block text-label-sm font-medium text-neutral mb-1">Last Name</label>
                    <input type="text" value={adminFormData.last_name} onChange={(e) => setAdminFormData({...adminFormData, last_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant focus:border-primary rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-label-sm font-medium text-neutral mb-1">Email (Login ID)</label>
                  <input type="email" value={adminFormData.email} onChange={(e) => setAdminFormData({...adminFormData, email: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant focus:border-primary rounded-xl" required />
                </div>
                <div>
                  <label className="block text-label-sm font-medium text-neutral mb-1">Phone</label>
                  <input type="text" value={adminFormData.phone} onChange={(e) => setAdminFormData({...adminFormData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant focus:border-primary rounded-xl" />
                </div>
                <div>
                  <label className="block text-label-sm font-medium text-neutral mb-1">New Password (Optional)</label>
                  <input type="password" value={adminFormData.password} onChange={(e) => setAdminFormData({...adminFormData, password: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant focus:border-primary rounded-xl" placeholder="Leave blank to keep current password" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface/50">
              <button type="button" onClick={() => setIsChangeAdminModalOpen(false)} className="px-6 py-2.5 rounded-xl text-label-md font-bold text-neutral hover:bg-surface-variant transition-colors border border-outline-variant">Cancel</button>
              <button type="submit" form="changeAdminForm" disabled={modalLoading} className="px-6 py-2.5 rounded-xl text-label-md font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                {modalLoading ? 'Saving...' : 'Update Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 size={32} />
              </div>
              <h2 className="text-title-lg font-bold text-neutral mb-2">Delete School?</h2>
              <p className="text-body-md text-on-surface-variant">Are you sure you want to permanently delete <span className="font-bold text-neutral">{selectedSchool?.name}</span>? This action cannot be undone.</p>
            </div>
            <div className="p-6 flex gap-3 bg-surface/50">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl text-label-md font-bold text-neutral hover:bg-surface-variant transition-colors border border-outline-variant">Cancel</button>
              <button onClick={handleDeleteSchool} disabled={modalLoading} className="flex-1 py-3 rounded-xl text-label-md font-bold text-white bg-error hover:bg-error/90 transition-colors shadow-sm disabled:opacity-50">
                {modalLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Toggle Modal */}
      {isServicesModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface/50">
              <h2 className="text-title-lg font-bold text-neutral">Manage Services</h2>
              <button onClick={() => setIsServicesModalOpen(false)} className="text-neutral hover:bg-surface-variant p-2 rounded-full transition-colors">✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <form id="servicesForm" onSubmit={handleServicesSubmit} className="space-y-4">
                <p className="text-body-sm text-on-surface-variant mb-4">Toggle services to show or hide them on the school's public website.</p>
                
                {Object.keys(servicesFormData).map((serviceKey) => (
                  <div key={serviceKey} className="flex items-center justify-between p-3 border border-outline-variant rounded-xl hover:bg-surface-variant/30 transition-colors">
                    <span className="text-label-md font-medium text-neutral capitalize">{serviceKey.replace(/([A-Z])/g, ' $1')}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={servicesFormData[serviceKey]} 
                        onChange={(e) => setServicesFormData({...servicesFormData, [serviceKey]: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </form>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface/50">
              <button type="button" onClick={() => setIsServicesModalOpen(false)} className="px-6 py-2.5 rounded-xl text-label-md font-bold text-neutral hover:bg-surface-variant transition-colors border border-outline-variant">Cancel</button>
              <button type="submit" form="servicesForm" disabled={modalLoading} className="px-6 py-2.5 rounded-xl text-label-md font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                {modalLoading ? 'Saving...' : 'Save Services'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};
