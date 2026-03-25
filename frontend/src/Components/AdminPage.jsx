import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaClipboardList, FaCheckCircle, FaChartLine, FaSignOutAlt, FaSearch, FaImage, FaVideo, FaStar, FaChalkboardTeacher, FaPlus, FaTrash, FaCalendarAlt, FaBars, FaTimes, FaCog, FaEnvelope } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { gallery, setGallery, videos, setVideos, highlights, setHighlights, events, setEvents, faculty, setFaculty, principal, setPrincipal, notices, setNotices, notificationEmail, setNotificationEmail, uploadImage, API_URL } = useContext(SiteDataContext);

  // --- Auth & Role ---
  const [adminUser, setAdminUser] = useState(null);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    const restoreSession = () => {
      try {
        const data = localStorage.getItem('adminData');
        const token = localStorage.getItem('adminToken');

        // Defensive check: Ensure both pieces of data exist and aren't literal error strings
        if (data && token && data !== "undefined" && data !== "null" && token !== "undefined") {
          const parsed = JSON.parse(data);
          
          // Verify it's a valid object
          if (parsed && typeof parsed === 'object') {
            setAdminUser(parsed);
            
            // Re-verify token validity with backend in the background
            fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => {
                if (!res.ok) {
                  console.warn("Session expired on server");
                  handleLogout();
                }
              })
              .catch(err => console.warn('Auth check skipped (offline/server down):', err.message));
          } else {
            throw new Error("Invalid session data structure");
          }
        }
      } catch (err) {
        console.error("Critical session restoration failure:", err.message);
        handleLogout();
      }
    };

    restoreSession();
  }, [API_URL]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdminUser(null);
    window.location.href = '/adminLogin';
  };

  // --- Fetch real admission applications ---
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null); // For "View" modal

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admissions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setApplications(await res.json());
    } catch (e) { console.warn('Could not fetch applications'); }
  };

  const fetchAdmins = async () => {
    if (adminUser?.role !== 'superadmin') return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/auth/admins`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAdmins(await res.json());
    } catch (e) { console.warn('Could not fetch admins'); }
  };

  useEffect(() => {
    fetchApps();
    if (adminUser?.role === 'superadmin') fetchAdmins();
    // Live changes: poll every 30 seconds
    const interval = setInterval(() => {
        fetchApps();
        if (adminUser?.role === 'superadmin') fetchAdmins();
    }, 30000);
    return () => clearInterval(interval);
  }, [API_URL, adminUser?.role]);

  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [isAdminFormLoading, setIsAdminFormLoading] = useState(false);
  
  // OTP and Admin Edit State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpString, setOtpString] = useState('');
  const [newAdminOtpString, setNewAdminOtpString] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editAdminData, setEditAdminData] = useState({});

  const requestOtp = async (actionType, adminData) => {
    setIsAdminFormLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const body = { actionType };
      if (adminData?.email) {
        body.targetEmail = adminData.email;
      }
      
      const res = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setPendingAdminAction({ type: actionType, data: adminData });
        setOtpModalVisible(true);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to request OTP');
      }
    } catch (e) {
      alert('Error requesting OTP');
    }
    setIsAdminFormLoading(false);
  };

  const verifyOtpAndComplete = async (e) => {
    e?.preventDefault();
    if (!otpString || !newAdminOtpString) return;
    setIsOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = pendingAdminAction.type === 'create' 
        ? `${API_URL}/auth/register` 
        : `${API_URL}/auth/admins/${pendingAdminAction.data._id}`;
      
      let method = 'POST';
      if (pendingAdminAction.type === 'edit') method = 'PUT';
      if (pendingAdminAction.type === 'delete') method = 'DELETE';

      const payload = { ...pendingAdminAction.data, otp: otpString, newAdminOtp: newAdminOtpString };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setOtpModalVisible(false);
        setOtpString('');
        setNewAdminOtpString('');
        setPendingAdminAction(null);
        setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
        setEditingAdminId(null);
        setEditingAdminId(null);
        fetchAdmins();
        let actionWord = 'created';
        if (pendingAdminAction.type === 'edit') actionWord = 'updated';
        if (pendingAdminAction.type === 'delete') actionWord = 'deleted';
        alert(`Admin successfully ${actionWord}!`);
      } else {
        const err = await res.json();
        alert(err.message || 'Verification failed');
      }
    } catch (e) {
      alert('Error during verification');
    }
    setIsOtpLoading(false);
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm('Are you sure you want to delete this admin? Dual-OTP verification will be required.')) return;
    await requestOtp('delete', admin);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admissions/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setApplications(apps => apps.map(app => app._id === id ? { ...app, status: newStatus } : app));
        // Update selectedApp if it's the one being modified
        if (selectedApp?._id === id) {
          setSelectedApp(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      console.warn('Could not update status', e);
      alert('Error updating status');
    }
  };

  const totalApps = applications.length;
  const approvedApps = applications.filter(a => a.status === 'accepted').length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;

  const stats = [
    { label: 'Total Applications', value: totalApps.toString(), icon: <FaClipboardList className="text-primary" />, bg: 'bg-primary/10' },
    { label: 'Approved', value: approvedApps.toString(), icon: <FaCheckCircle className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Pending Review', value: pendingApps.toString(), icon: <FaChartLine className="text-tertiary" />, bg: 'bg-tertiary/10' },
    { label: 'Total Students', value: approvedApps.toString(), icon: <FaUsers className="text-purple-500" />, bg: 'bg-purple-50' }
  ];

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map(app => ({
      id: app._id.slice(-6).toUpperCase(),
      name: app.studentName,
      grade: app.gradeApplied,
      date: new Date(app.createdAt).toLocaleDateString(),
      status: app.status === 'accepted' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Pending',
      originalApp: app
    }));

  // Helper for image upload via API (falls back to Base64 if no backend)
  const handleImageUpload = async (e, setter, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (uploadImage) {
      const url = await uploadImage(file);
      if (url) {
        setter(prev => ({ ...prev, [fieldName]: url }));
        return;
      }
    }
    // Fallback to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(prev => ({ ...prev, [fieldName]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // --- Gallery Tab ---
  const [newGalleryItem, setNewGalleryItem] = useState({ title: '', category: 'Campus Life', src: '', description: '', featured: false });
  const handleAddGallery = () => {
    if (!newGalleryItem.title || !newGalleryItem.src) return;
    setGallery([{ ...newGalleryItem, id: Date.now() }, ...gallery]);
    setNewGalleryItem({ title: '', category: 'Campus Life', src: '', description: '', featured: false });
  };
  const handleDeleteGallery = (id) => {
    setGallery(gallery.filter(item => item.id !== id));
  };
  const renderGalleryTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Gallery</h3>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch md:items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={newGalleryItem.title} onChange={e => setNewGalleryItem({...newGalleryItem, title: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Image Title" />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setNewGalleryItem, 'src')} className="w-full p-[5px] border rounded-lg bg-white text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={newGalleryItem.category} onChange={e => setNewGalleryItem({...newGalleryItem, category: e.target.value})} className="p-2 border rounded-lg">
            <option>Campus Life</option><option>Academic Events</option><option>Sports</option><option>Cultural Programs</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Small Description</label>
          <input type="text" value={newGalleryItem.description} onChange={e => setNewGalleryItem({...newGalleryItem, description: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Short description..." />
        </div>
        <button onClick={handleAddGallery} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 flex items-center h-[42px]"><FaPlus className="mr-2"/> Add</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gallery.map(item => (
          <div key={item.id} className="relative group rounded-xl overflow-hidden border">
            <img src={item.src} alt={item.title} className="w-full h-32 object-cover" />
            <div className="p-2 bg-white text-sm">
                <p className="font-bold truncate">{item.title}</p>
                <p className="text-gray-500 text-xs">{item.category}</p>
            </div>
            <button onClick={() => handleDeleteGallery(item.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Highlights Tab ---
  const [newHighlight, setNewHighlight] = useState({ title: '', date: '', category: 'Academic', image: '', description: '' });
  const handleAddHighlight = () => {
    if (!newHighlight.title || !newHighlight.description) return;
    setHighlights([{ ...newHighlight, id: Date.now() }, ...highlights]);
    setNewHighlight({ title: '', date: '', category: 'Academic', image: '', description: '' });
  };
  const handleDeleteHighlight = (id) => {
    setHighlights(highlights.filter(item => item.id !== id));
  };
  const renderHighlightsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Highlights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input type="text" placeholder="Title" value={newHighlight.title} onChange={e => setNewHighlight({...newHighlight, title: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Date (e.g. March 15, 2026)" value={newHighlight.date} onChange={e => setNewHighlight({...newHighlight, date: e.target.value})} className="p-2 border rounded-lg" />
        <div className="p-2 border rounded-lg bg-white flex items-center">
          <span className="text-gray-400 text-sm mr-2 whitespace-nowrap">Image:</span>
          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setNewHighlight, 'image')} className="w-full text-sm" />
        </div>
        <select value={newHighlight.category} onChange={e => setNewHighlight({...newHighlight, category: e.target.value})} className="p-2 border rounded-lg">
          <option>Academic</option><option>Sports</option><option>Cultural</option>
        </select>
        <textarea placeholder="Description" value={newHighlight.description} onChange={e => setNewHighlight({...newHighlight, description: e.target.value})} className="p-2 border rounded-lg md:col-span-2" rows="2"></textarea>
        <button onClick={handleAddHighlight} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-2"><FaPlus className="inline mr-2"/> Add Highlight</button>
      </div>
      <div className="space-y-4">
        {highlights.map(item => (
          <div key={item.id} className="flex justify-between items-center p-4 border rounded-xl">
            <div className="flex gap-4 items-center">
              <img src={item.image} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="" />
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-gray-500">{item.date} • {item.category}</p>
              </div>
            </div>
            <button onClick={() => handleDeleteHighlight(item.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Events Tab ---
  const [newEvent, setNewEvent] = useState({ title: '', date: '', image: '', description: '' });
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.description) return;
    setEvents([{ ...newEvent, id: Date.now() }, ...events]);
    setNewEvent({ title: '', date: '', image: '', description: '' });
  };
  const handleDeleteEvent = (id) => {
    setEvents(events.filter(item => item.id !== id));
  };
  const renderEventsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage School Events</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Date (e.g. Sept 5, 2025)" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="p-2 border rounded-lg" />
        <div className="p-2 border rounded-lg bg-white flex items-center md:col-span-2">
          <span className="text-gray-400 text-sm mr-2 whitespace-nowrap">Event Image:</span>
          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setNewEvent, 'image')} className="w-full text-sm" />
        </div>
        <textarea placeholder="Event Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="p-2 border rounded-lg md:col-span-2" rows="3"></textarea>
        <button onClick={handleAddEvent} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-2"><FaPlus className="inline mr-2"/> Add Event</button>
      </div>
      <div className="space-y-4">
        {events.map(item => (
          <div key={item.id} className="flex justify-between items-center p-4 border rounded-xl">
            <div className="flex gap-4 items-center">
              <img src={item.image} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="" />
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-gray-500">{item.date}</p>
              </div>
            </div>
            <button onClick={() => handleDeleteEvent(item.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Videos Tab ---
  const [newVideo, setNewVideo] = useState({ title: '', src: '' });
  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.src) return;
    setVideos([{ ...newVideo, id: Date.now() }, ...videos]);
    setNewVideo({ title: '', src: '' });
  };
  const handleDeleteVideo = (src, index) => {
    setVideos(videos.filter((_, i) => i !== index));
  };
  const renderVideosTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Video Blog</h3>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 items-center">
        <input type="text" placeholder="Video Title" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="flex-1 p-2 border rounded-lg" />
        <input type="text" placeholder="Video Source URL" value={newVideo.src} onChange={e => setNewVideo({...newVideo, src: e.target.value})} className="flex-1 p-2 border rounded-lg" />
        <button onClick={handleAddVideo} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 h-[42px]"><FaPlus className="inline mr-2"/> Add Video</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((vid, idx) => (
          <div key={idx} className="border rounded-xl p-4 flex flex-col items-center">
            <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Video Placeholder</span>
            </div>
            <p className="font-bold flex-1">{vid.title}</p>
            <p className="text-xs text-gray-400 truncate w-full text-center mt-1 mb-4">{vid.src}</p>
            <button onClick={() => handleDeleteVideo(vid.src, idx)} className="text-red-500 text-sm hover:underline"><FaTrash className="inline mr-1" /> Remove</button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Notices Tab ---
  const [newNotice, setNewNotice] = useState({ title: '', date: '', size: '', pdfLink: '' });
  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.pdfLink) return;
    setNotices([{ ...newNotice, id: Date.now() }, ...notices]);
    setNewNotice({ title: '', date: '', size: '', pdfLink: '' });
  };
  const handleDeleteNotice = (id) => {
    setNotices(notices.filter(item => item.id !== id));
  };
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_URL}/content/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setNewNotice({
          ...newNotice,
          pdfLink: data.url,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    } catch (err) { console.error('PDF upload failed'); }
  };

  const renderNoticesTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage PDF Notices</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notice Title</label>
          <input type="text" placeholder="e.g. Summer Vacation 2026" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF</label>
          <input type="file" accept=".pdf" onChange={handlePdfUpload} className="w-full p-[5px] border bg-white rounded-lg text-sm" />
        </div>
        <button onClick={handleAddNotice} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-2 h-[42px]"><FaPlus className="inline mr-2"/> Publish Notice</button>
      </div>
      <div className="space-y-3">
        {notices.map(item => (
          <div key={item.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">PDF</div>
              <div>
                <p className="font-bold text-sm text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.date} • {item.size}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={item.pdfLink} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs font-bold">View</a>
              <button onClick={() => handleDeleteNotice(item.id)} className="text-red-400 hover:text-red-600 p-2"><FaTrash size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Faculty Tab ---
  const [newFaculty, setNewFaculty] = useState({ name: '', title: '', EduQua: '', Subject: '', photo: '', department: 'Science' });
  const handleAddFaculty = () => {
    if (!newFaculty.name || !newFaculty.Subject) return;
    const dept = newFaculty.department;
    setFaculty({
      ...faculty,
      [dept]: [{ ...newFaculty, id: Date.now() }, ...faculty[dept]]
    });
    setNewFaculty({ name: '', title: '', EduQua: '', Subject: '', photo: '', department: dept });
  };
  const handleDeleteFaculty = (dept, idToRemove, indexToRemove) => {
    setFaculty({
      ...faculty,
      [dept]: faculty[dept].filter((f, i) => f.id ? f.id !== idToRemove : i !== indexToRemove)
    });
  };
  const renderFacultyTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Faculty</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input type="text" placeholder="Name" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Subject" value={newFaculty.Subject} onChange={e => setNewFaculty({...newFaculty, Subject: e.target.value})} className="p-2 border rounded-lg" />
        <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} className="p-2 border rounded-lg">
          <option value="Science">Science</option><option value="Arts">Arts</option><option value="Guest">Guest</option>
        </select>
        <input type="text" placeholder="Qualifications (e.g. MSc, PhD)" value={newFaculty.EduQua} onChange={e => setNewFaculty({...newFaculty, EduQua: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Experience (e.g. 5+ yrs exp)" value={newFaculty.title} onChange={e => setNewFaculty({...newFaculty, title: e.target.value})} className="p-2 border rounded-lg" />
        <div className="p-2 border rounded-lg bg-white flex items-center">
          <span className="text-gray-400 text-sm mr-2 whitespace-nowrap">Photo:</span>
          <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setNewFaculty, 'photo')} className="w-full text-sm" />
        </div>
        <button onClick={handleAddFaculty} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-3"><FaPlus className="inline mr-2"/> Add Faculty Member</button>
      </div>

      {Object.keys(faculty).map(dept => (
        <div key={dept} className="mb-8 border-t pt-4">
          <h4 className="font-bold text-lg mb-3 text-primary">{dept} Department</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty[dept].map((f, idx) => (
              <div key={f.id || idx} className="flex gap-4 p-3 border rounded-xl items-center bg-gray-50">
                <img src={f.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"} className="w-12 h-12 rounded-full object-cover bg-gray-200" alt="" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.Subject}</p>
                </div>
                <button onClick={() => handleDeleteFaculty(dept, f.id, idx)} className="text-red-500 hover:text-red-700 p-2"><FaTrash size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // --- Principal Tab ---
  const [isEditingPrincipal, setIsEditingPrincipal] = useState(false);
  const [editPrincipal, setEditPrincipal] = useState({});

  const startEditingPrincipal = () => {
    setEditPrincipal(principal);
    setIsEditingPrincipal(true);
  };

  const handlePrincipalChange = (field, value) => {
    setEditPrincipal({ ...editPrincipal, [field]: value });
  };
  
  const handlePrincipalImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size is too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPrincipal(prev => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const savePrincipal = () => {
    setPrincipal(editPrincipal);
    setIsEditingPrincipal(false);
  };

  const cancelPrincipal = () => {
    setIsEditingPrincipal(false);
  };

  const renderPrincipalTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between flex-wrap items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Manage Principal's Desk</h3>
        {!isEditingPrincipal ? (
          <button onClick={startEditingPrincipal} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-colors">Edit Info</button>
        ) : (
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button onClick={cancelPrincipal} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={savePrincipal} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">Save Changes</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.name : principal.name} onChange={e => handlePrincipalChange('name', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.title : principal.title} onChange={e => handlePrincipalChange('title', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Introductory Quote</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.introQuote : principal.introQuote} onChange={e => handlePrincipalChange('introQuote', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Message (Use Enter for new paragraphs)</label>
          <textarea disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.message : principal.message} onChange={e => handlePrincipalChange('message', e.target.value)} className="w-full p-2 border rounded-lg font-sans text-sm disabled:bg-gray-200 disabled:text-gray-500" rows="10"></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Quote (Optional)</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.closingQuote : principal.closingQuote} onChange={e => handlePrincipalChange('closingQuote', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal Photo</label>
          <div className="flex items-center gap-4">
            <img src={isEditingPrincipal ? editPrincipal.photo : principal.photo} alt="Current" className="w-16 h-16 object-cover rounded-lg shadow-sm border border-gray-200" />
            {isEditingPrincipal && (
              <input type="file" accept="image/*" onChange={e => handlePrincipalImageUpload(e, 'photo')} className="w-full p-[5px] border bg-white rounded-lg text-sm" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signature Image</label>
          <div className="flex items-center gap-4">
            <img src={isEditingPrincipal ? editPrincipal.signature : principal.signature} alt="Signature" className="w-16 h-16 p-1 object-contain bg-white rounded-lg shadow-sm border border-gray-200" />
            {isEditingPrincipal && (
              <input type="file" accept="image/*" onChange={e => handlePrincipalImageUpload(e, 'signature')} className="w-full p-[5px] border bg-white rounded-lg text-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Admins Tab (Super Admin Only) ---
  const onAddAdmin = async (e) => {
    e.preventDefault();
    await requestOtp('create', newAdmin);
  };

  const startEditAdmin = (admin) => {
    setEditingAdminId(admin._id);
    setEditAdminData({ _id: admin._id, name: admin.name || '', email: admin.email, role: admin.role, password: '' });
  };

  const saveEditAdmin = async () => {
    await requestOtp('edit', editAdminData);
  };

  const renderAdminsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-6 font-serif">Administrative Staff Management</h3>
      
      {/* Create New Admin Form */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
        <h4 className="font-bold text-gray-700 mb-4 flex items-center">
          <FaPlus className="mr-2 text-tertiary" /> Register New Administrator
        </h4>
        <form onSubmit={onAddAdmin} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input 
              required
              type="text" 
              value={newAdmin.name} 
              onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-primary/20" 
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email / Username</label>
            <input 
              required
              type="email" 
              value={newAdmin.email} 
              onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-primary/20" 
              placeholder="admin@school.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
            <input 
              required
              type="password" 
              value={newAdmin.password} 
              onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-primary/20" 
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
            <div className="flex gap-2">
              <select 
                value={newAdmin.role} 
                onChange={e => setNewAdmin({...newAdmin, role: e.target.value})} 
                className="flex-1 p-2.5 border rounded-lg bg-white"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <button 
                type="submit" 
                disabled={isAdminFormLoading}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isAdminFormLoading ? '...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Admin List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="py-4 font-black">Name</th>
              <th className="py-4 font-black">Email</th>
              <th className="py-4 font-black">Role</th>
              <th className="py-4 font-black text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {admins.map(admin => (
              <React.Fragment key={admin._id}>
                {editingAdminId === admin._id ? (
                  <tr className="bg-blue-50/50">
                    <td colSpan="4" className="py-4 px-6 border-b border-blue-100">
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Name</label>
                          <input type="text" value={editAdminData.name} onChange={e => setEditAdminData({...editAdminData, name: e.target.value})} className="w-full p-2 border rounded bg-white text-sm focus:ring-1 focus:ring-primary" placeholder="Full Name" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email</label>
                          <input type="email" value={editAdminData.email} onChange={e => setEditAdminData({...editAdminData, email: e.target.value})} className="w-full p-2 border rounded bg-white text-sm focus:ring-1 focus:ring-primary" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pass (blank to keep)</label>
                          <input type="password" value={editAdminData.password} onChange={e => setEditAdminData({...editAdminData, password: e.target.value})} className="w-full p-2 border rounded bg-white text-sm focus:ring-1 focus:ring-primary" placeholder="••••••••" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Role</label>
                          <select value={editAdminData.role} onChange={e => setEditAdminData({...editAdminData, role: e.target.value})} className="w-full p-2 border rounded bg-white text-sm">
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEditAdmin} disabled={isAdminFormLoading} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow hover:bg-green-700 disabled:opacity-50">Save</button>
                          <button onClick={() => setEditingAdminId(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold text-sm hover:bg-gray-300">Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {admin.name ? admin.name.charAt(0) : admin.email?.charAt(0) || 'A'}
                        </div>
                        <span className="font-bold text-gray-700">{admin.name || 'Unnamed Admin'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-500 text-sm">{admin.email}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2 pr-6">
                        <button onClick={() => startEditAdmin(admin)} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase transition-colors mr-2">Edit</button>
                        {admin._id !== adminUser?.id && (
                          <button 
                            onClick={() => handleDeleteAdmin(admin)} 
                            className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider p-1 transition-colors flex items-center"
                            title="Delete Admin"
                          >
                            <FaTrash className="mr-1" size={10} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Settings Tab ---
  const [tempEmail, setTempEmail] = useState(notificationEmail);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (notificationEmail) {
      setTempEmail(notificationEmail);
    }
  }, [notificationEmail]);

  const renderSettingsTab = () => {
    const handleSaveEmail = async () => {
      setIsSaving(true);
      await setNotificationEmail(tempEmail);
      setIsSaving(false);
      alert('Notification email updated successfully!');
    };

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6 font-serif flex items-center gap-2">
          <FaCog className="text-primary" /> System Settings
        </h3>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <FaEnvelope />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Admission Notifications</h4>
              <p className="text-xs text-gray-500">This email will receive all new admission alerts.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Receiver Email Address</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={tempEmail} 
                  onChange={e => setTempEmail(e.target.value)} 
                  className="flex-1 p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="office@school.com"
                />
                <button 
                  onClick={handleSaveEmail}
                  disabled={isSaving || tempEmail === notificationEmail}
                  className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:bg-gray-300"
                >
                  {isSaving ? 'Saving...' : 'Update'}
                </button>
              </div>
              <p className="text-[10px] text-amber-600 mt-2 font-medium">
                * Ensure this email is valid to avoid missing important student applications.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <h4 className="text-blue-800 font-bold text-sm mb-1">System Information</h4>
          <p className="text-blue-600 text-xs">
            Role: <span className="font-bold uppercase">{adminUser?.role}</span><br />
            API Endpoint: <span className="font-mono text-[10px]">{API_URL}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-bold text-gray-800">Recent Applications</h3>
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search applications..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">App ID</th>
                <th className="px-6 py-4 font-medium">Student Name</th>
                <th className="px-6 py-4 font-medium">Grade Applied</th>
                <th className="px-6 py-4 font-medium">Date Sent</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentApps.map((app, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 text-sm">{app.id}</td>
                  <td className="px-6 py-4 text-gray-700 text-sm">{app.name}</td>
                  <td className="px-6 py-4 text-gray-700 text-sm">{app.grade}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs md:text-sm">{app.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                      app.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedApp(app.originalApp)} className="text-primary hover:underline font-medium text-sm mr-3">View</button>
                    {app.status === 'Pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(app.originalApp._id, 'accepted')} className="text-green-600 hover:underline font-medium text-sm mr-3">Approve</button>
                        <button onClick={() => handleStatusUpdate(app.originalApp._id, 'rejected')} className="text-red-600 hover:underline font-medium text-sm">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface flex font-sans relative overflow-x-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-50 lg:z-auto
        w-64 h-[100dvh] bg-primary text-white flex flex-col shadow-2xl
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-headline font-bold text-tertiary tracking-wider">
            Holy Name
            <span className="text-white text-[10px] md:text-sm block tracking-normal mt-1 opacity-80 text-center">Admin Panel</span>
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white hover:text-tertiary transition-colors">
            <FaTimes size={20} />
          </button>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white font-bold border-l-4 border-tertiary' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
          >
            <FaChartLine className="mr-3 text-lg" /> Dashboard
          </button>
          
          <div className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-6 mb-2 px-4">Content Management</div>
          
          {[
            { id: 'gallery', label: 'Gallery', icon: <FaImage /> },
            { id: 'videos', label: 'Video Blog', icon: <FaVideo /> },
            { id: 'highlights', label: 'Highlights', icon: <FaStar /> },
            { id: 'events', label: 'Events', icon: <FaCalendarAlt /> },
            { id: 'notices', label: 'Notices', icon: <FaClipboardList /> },
            { id: 'faculty', label: 'Faculty', icon: <FaChalkboardTeacher /> },
            { id: 'principal', label: 'Principal Desk', icon: <FaClipboardList /> }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-white/10 text-white font-bold border-l-4 border-tertiary' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}

          <div className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-6 mb-2 px-4">School Data</div>
          <button 
            onClick={() => { setActiveTab('applications'); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'applications' ? 'bg-white/10 text-white font-bold border-l-4 border-tertiary' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
          >
            <FaClipboardList className="mr-3 text-lg" /> Applications
          </button>
          <button 
            onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-white/10 text-white font-bold border-l-4 border-tertiary' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
          >
            <FaUsers className="mr-3 text-lg" /> Students
          </button>

          {adminUser?.role === 'superadmin' && (
            <>
              <div className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-6 mb-2 px-4">System Control</div>
              <button 
                onClick={() => { setActiveTab('admins'); setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'admins' ? 'bg-white/10 text-white font-bold border-l-4 border-tertiary' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
              >
                <FaUsers className="mr-3 text-lg text-tertiary" /> Manage Admins
              </button>
              <button 
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white font-bold border-l-4 border-tertiary' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
              >
                <FaCog className="mr-3 text-lg text-tertiary" /> Settings
              </button>
            </>
          )}
        </div>
        <div className="p-4 border-t border-white/10 space-y-2">
          <NavLink to="/" className="flex items-center w-full px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white text-sm">
            <FaSignOutAlt className="mr-3 text-lg" /> Return to Website
          </NavLink>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm font-bold"
          >
            <FaSignOutAlt className="mr-3 text-lg" /> Logout Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-100 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <FaBars size={20} />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-gray-800 capitalize tracking-tight">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-800">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">{adminUser?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md border-2 border-primary-fixed">
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'gallery' && renderGalleryTab()}
          {activeTab === 'videos' && renderVideosTab()}
          {activeTab === 'highlights' && renderHighlightsTab()}
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'notices' && renderNoticesTab()}
          {activeTab === 'faculty' && renderFacultyTab()}
          {activeTab === 'principal' && renderPrincipalTab()}
          {activeTab === 'admins' && adminUser?.role === 'superadmin' && renderAdminsTab()}
          {activeTab === 'settings' && adminUser?.role === 'superadmin' && renderSettingsTab()}
          {activeTab === 'applications' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Admission Applications</h3>
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No applications received yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-500">
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Grade</th>
                        <th className="pb-3 font-semibold">Contact</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 font-medium">{app.studentName}</td>
                          <td className="py-3 text-gray-600">{app.gradeApplied}</td>
                          <td className="py-3 text-gray-600">{app.contactNumber}</td>
                          <td className="py-3 text-gray-500 text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-tertiary/10 text-tertiary'
                            }`}>{app.status}</span>
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => setSelectedApp(app)} className="text-primary hover:underline font-medium text-sm mr-3">View</button>
                            {app.status === 'pending' && (
                              <>
                                <button onClick={() => handleStatusUpdate(app._id, 'accepted')} className="text-green-600 hover:text-green-800 font-medium text-sm mr-3">Approve</button>
                                <button onClick={() => handleStatusUpdate(app._id, 'rejected')} className="text-red-600 hover:text-red-800 font-medium text-sm">Reject</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'students' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Student Directory</h3>
              <p className="text-gray-500">Admitted students database will be displayed here.</p>
            </div>
          )}
        </main>

        {/* --- Application View Modal --- */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Student Application Details</h2>
                  <p className="text-sm text-gray-500">App ID: {selectedApp._id.slice(-6).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <FaPlus className="rotate-45 text-2xl" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                  <div className="col-span-1 border-r border-gray-100 pr-4">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-widest">Personal Information</h4>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Name:</span> <span className="text-gray-900 font-medium block text-lg">{selectedApp.studentName}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Grade Applied:</span> <span className="font-medium uppercase text-sm bg-primary/10 text-primary px-2 py-1 rounded inline-block mt-1">{selectedApp.gradeApplied}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">DOB:</span> <span className="text-gray-900 block">{selectedApp.dateOfBirth}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Gender:</span> <span className="text-gray-900 block">{selectedApp.gender}</span></p>
                  </div>
                  <div className="col-span-1 border-r border-gray-100 pr-4">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-widest">Parent/Guardian</h4>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Guardian:</span> <span className="text-gray-900 block">{selectedApp.guardianName} ({selectedApp.relationship})</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Father:</span> <span className="text-gray-900 block">{selectedApp.fatherName}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Mother:</span> <span className="text-gray-900 block">{selectedApp.motherName}</span></p>
                  </div>
                  <div className="col-span-1">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-widest">Contact Info</h4>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Phone:</span> <span className="text-gray-900 block font-bold text-lg">{selectedApp.contactNumber}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Email:</span> <span className="text-gray-900 block break-words">{selectedApp.email}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Address:</span> <span className="text-gray-900 block text-xs leading-relaxed">{selectedApp.address}</span></p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-10">
                  <h4 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-widest">Academic Background</h4>
                  <p><span className="font-semibold text-gray-600">Previous School:</span> <span className="text-gray-900">{selectedApp.previousSchool || 'N/A'}</span></p>
                </div>

                <div>
                  <h4 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-widest">Documents Provided</h4>
                  <div className="flex flex-wrap gap-4">
                    {selectedApp.transferCertificate ? (
                      <a href={selectedApp.transferCertificate} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <FaClipboardList />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Transfer Certificate</p>
                          <p className="text-xs text-gray-500">Click to view file</p>
                        </div>
                      </a>
                    ) : <p className="text-sm text-gray-400 italic">No TC provided</p>}
                    
                    {selectedApp.marksheet ? (
                      <a href={selectedApp.marksheet} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <FaClipboardList />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Marksheet / Report Card</p>
                          <p className="text-xs text-gray-500">Click to view file</p>
                        </div>
                      </a>
                    ) : <p className="text-sm text-gray-400 italic">No Marksheet provided</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 uppercase font-bold">Status:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-black ${
                    selectedApp.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    selectedApp.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedApp.status.toUpperCase()}
                  </span>
                </div>
                
                {selectedApp.status === 'pending' && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleStatusUpdate(selectedApp._id, 'accepted')}
                      className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                    >
                      Approve Application
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedApp._id, 'rejected')}
                      className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- OTP Verification Modal --- */}
        {otpModalVisible && pendingAdminAction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Security Verification</h2>
              <p className="text-sm text-gray-500 mb-6">
                A dual-OTP verification is required. OTPs have been sent to your Super Admin email and the target admin email.
              </p>
              
              <form onSubmit={verifyOtpAndComplete} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Super Admin OTP
                  </label>
                  <input
                    type="text"
                    required
                    value={otpString}
                    onChange={(e) => setOtpString(e.target.value)}
                    className="w-full p-3 border rounded-xl font-mono text-center tracking-widest text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Enter 6 digit OTP"
                    maxLength={6}
                  />
                  {pendingAdminAction.type === 'create' && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">Sent to your active session email.</p>
                  )}
                </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 mt-4">
                      Target Admin OTP
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminOtpString}
                      onChange={(e) => setNewAdminOtpString(e.target.value)}
                      className="w-full p-3 border rounded-xl font-mono text-center tracking-widest text-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Enter 6 digit OTP"
                      maxLength={6}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">Sent to {pendingAdminAction.data.email}</p>
                  </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpModalVisible(false);
                      setOtpString('');
                      setNewAdminOtpString('');
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isOtpLoading || !otpString || !newAdminOtpString}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                  >
                    {isOtpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
