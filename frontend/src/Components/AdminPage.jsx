import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaClipboardList, FaCheckCircle, FaChartLine, FaSignOutAlt, FaSearch, FaImage, FaVideo, FaStar, FaChalkboardTeacher, FaPlus, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { gallery, setGallery, videos, setVideos, highlights, setHighlights, events, setEvents, faculty, setFaculty, principal, setPrincipal, uploadImage, API_URL } = useContext(SiteDataContext);

  // --- Fetch real admission applications ---
  const [applications, setApplications] = useState([]);
  useEffect(() => {
    const fetchApps = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/admissions`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setApplications(await res.json());
      } catch (e) { console.warn('Could not fetch applications'); }
    };
    fetchApps();
  }, [API_URL]);

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
    { label: 'Total Applications', value: totalApps.toString(), icon: <FaClipboardList className="text-blue-500" />, bg: 'bg-blue-50' },
    { label: 'Approved', value: approvedApps.toString(), icon: <FaCheckCircle className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Pending Review', value: pendingApps.toString(), icon: <FaChartLine className="text-amber-500" />, bg: 'bg-amber-50' },
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
      <div className="flex gap-4 mb-6 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
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
        <button onClick={handleAddGallery} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 flex items-center h-[42px]"><FaPlus className="mr-2"/> Add</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <button onClick={handleAddHighlight} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 md:col-span-2"><FaPlus className="inline mr-2"/> Add Highlight</button>
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
        <button onClick={handleAddEvent} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 md:col-span-2"><FaPlus className="inline mr-2"/> Add Event</button>
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
      <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 items-center">
        <input type="text" placeholder="Video Title" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="flex-1 p-2 border rounded-lg" />
        <input type="text" placeholder="Video Source URL" value={newVideo.src} onChange={e => setNewVideo({...newVideo, src: e.target.value})} className="flex-1 p-2 border rounded-lg" />
        <button onClick={handleAddVideo} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 h-[42px]"><FaPlus className="inline mr-2"/> Add Video</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <button onClick={handleAddFaculty} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 md:col-span-3"><FaPlus className="inline mr-2"/> Add Faculty Member</button>
      </div>

      {Object.keys(faculty).map(dept => (
        <div key={dept} className="mb-8 border-t pt-4">
          <h4 className="font-bold text-lg mb-3 text-[#4C1A57]">{dept} Department</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <button onClick={startEditingPrincipal} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 transition-colors">Edit Info</button>
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

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Recent Applications</h3>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search applications..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
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
                  <td className="px-6 py-4 font-medium text-gray-900">{app.id}</td>
                  <td className="px-6 py-4 text-gray-700">{app.name}</td>
                  <td className="px-6 py-4 text-gray-700">{app.grade}</td>
                  <td className="px-6 py-4 text-gray-500">{app.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3">View</button>
                    {app.status === 'Pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(app.originalApp._id, 'accepted')} className="text-green-600 hover:text-green-800 font-medium text-sm mr-3">Approve</button>
                        <button onClick={() => handleStatusUpdate(app.originalApp._id, 'rejected')} className="text-red-600 hover:text-red-800 font-medium text-sm">Reject</button>
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
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#4C1A57] text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-center">
          <h2 className="text-2xl font-serif font-bold text-amber-400 tracking-wider">Holy Name<span className="text-white text-sm block tracking-normal text-center mt-1">Admin Panel</span></h2>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-2 px-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaChartLine className="mr-3 text-lg" /> Dashboard
          </button>
          
          <div className="text-xs text-white/50 uppercase tracking-wider font-bold mt-4 mb-1 px-2">Content</div>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'gallery' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaImage className="mr-3 text-lg" /> Gallery
          </button>
          <button 
            onClick={() => setActiveTab('videos')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'videos' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaVideo className="mr-3 text-lg" /> Video Blog
          </button>
          <button 
            onClick={() => setActiveTab('highlights')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'highlights' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaStar className="mr-3 text-lg" /> Highlights
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'events' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaCalendarAlt className="mr-3 text-lg" /> Events
          </button>
          <button 
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'faculty' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaChalkboardTeacher className="mr-3 text-lg" /> Faculty
          </button>
          <button 
            onClick={() => setActiveTab('principal')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'principal' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaClipboardList className="mr-3 text-lg" /> Principal Desk
          </button>

          <div className="text-xs text-white/50 uppercase tracking-wider font-bold mt-4 mb-1 px-2">Data</div>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'applications' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaClipboardList className="mr-3 text-lg" /> Applications
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-amber-500 text-[#4C1A57] font-bold shadow-md' : 'hover:bg-white/10'}`}
          >
            <FaUsers className="mr-3 text-lg" /> Students
          </button>
        </div>
        <div className="p-4 border-t border-white/10">
          <NavLink to="/" className="flex items-center w-full px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white">
            <FaSignOutAlt className="mr-3 text-lg" /> Return to Site
          </NavLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
              AD
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'gallery' && renderGalleryTab()}
          {activeTab === 'videos' && renderVideosTab()}
          {activeTab === 'highlights' && renderHighlightsTab()}
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'faculty' && renderFacultyTab()}
          {activeTab === 'principal' && renderPrincipalTab()}
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
                              'bg-amber-100 text-amber-700'
                            }`}>{app.status}</span>
                          </td>
                          <td className="py-3 text-right">
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
      </div>
    </div>
  );
}

export default AdminPage;
