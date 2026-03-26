import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const SiteDataContext = createContext();

// Use VITE_API_URL env var if available, otherwise default to '/api'
// The Vite proxy configuration ensures this works in development
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Fallback defaults (used while API loads or if offline)
// Removed default videos to hide VideoBlog when empty
const defaultEvents = [];
const defaultHighlights = [];
const defaultGallery = [];
const defaultFaculty = { Guest: [], Science: [], Arts: [] };
const defaultPrincipal = {
  name: "Fr. Hemanta Pegu",
  title: "Principal",
  introQuote: "Flowers leave part of their fragrance in the hand that bestows them",
  message: "Holy Name HS School, Cherekapar Sivasagar...",
  closingQuote: "Aristotle once said, \"Educating the mind without educating the heart is no education at all.\"",
  photo: "",
  signature: "https://via.placeholder.com/150x50",
};

const defaultNotices = [];

const defaultSocialLinks = {
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
  linkedin: "",
  whatsapp: "",
  whatsappChannel: ""
};

const defaultAlumni = [];

const defaultStats = [
  { label: "Students Enrolled", value: "2.5k+" },
  { label: "Expert Faculty", value: "150+" },
  { label: "Laboratories", value: "40+" },
  { label: "Pass Result", value: "100%" }
];

export const SiteDataProvider = ({ children }) => {
  const [videos, setVideos] = useState([]);
  const [highlights, setHighlights] = useState(defaultHighlights);
  const [gallery, setGallery] = useState(defaultGallery);
  const [events, setEvents] = useState(defaultEvents);
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [faculty, setFaculty] = useState(defaultFaculty);
  const [notices, setNotices] = useState(defaultNotices);
  const [notificationEmail, setNotificationEmail] = useState('office@lenchosolutions.com');
  const [banner, setBanner] = useState({ isActive: false, image: null, link: null });
  const [socialLinks, setSocialLinks] = useState(defaultSocialLinks);
  const [alumni, setAlumni] = useState(defaultAlumni);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  const lastSaveRef = useRef(0);

  // Fetch content from backend on mount and via polling
  useEffect(() => {
    const fetchContent = async () => {
      // Prevents polling from overwriting local state right after a manual save
      if (Date.now() - lastSaveRef.current < 10000) return;

      try {
        const { data } = await axios.get(`${API_URL}/content`);
        if (Array.isArray(data.gallery)) setGallery(data.gallery);
        if (Array.isArray(data.events)) setEvents(data.events);
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
        if (Array.isArray(data.videos)) setVideos(data.videos);
        if (Array.isArray(data.notices)) setNotices(data.notices);
        if (data.faculty && typeof data.faculty === 'object') setFaculty(data.faculty);
        if (data.principal && typeof data.principal === 'object') setPrincipal(data.principal);
        if (data.notificationEmail !== undefined) setNotificationEmail(data.notificationEmail);
        if (data.banner !== undefined) setBanner(data.banner);
        if (data.socialLinks && typeof data.socialLinks === 'object') setSocialLinks(data.socialLinks);
        if (Array.isArray(data.alumni)) setAlumni(data.alumni);
        if (Array.isArray(data.stats) && data.stats.length > 0) setStats(data.stats);
      } catch (error) {
        console.warn('Backend polling error or using local defaults:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
    const interval = setInterval(fetchContent, 60000); // Poll every 60 seconds (less frequent)
    return () => clearInterval(interval);
  }, []);

  // Save content to backend (called from admin panel)
  const saveToBackend = async (payload) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      // Sanitization: Strip _id fields that start with 'temp-' to prevent Mongoose cast errors
      const sanitize = (data) => {
        if (Array.isArray(data)) {
          return data.map(item => sanitize(item));
        } else if (data !== null && typeof data === 'object') {
          const newObj = {};
          for (const key in data) {
            // Skip Mongoose internal version key
            if (key === '__v') continue;
            
            if (key === '_id') {
              const val = data[key];
              const isObjectId = typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
              if (!isObjectId) continue; // Strip numeric IDs, temp IDs, etc.
            }
            newObj[key] = sanitize(data[key]);
          }
          return newObj;
        }
        return data;
      };

      const sanitizedPayload = sanitize(payload);

      lastSaveRef.current = Date.now();
      const { data: updatedData } = await axios.put(
        `${API_URL}/content`,
        sanitizedPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state with authoritative data from DB (includes real _ids)
      if (updatedData.gallery) setGallery(updatedData.gallery);
      if (updatedData.events) setEvents(updatedData.events);
      if (updatedData.highlights) setHighlights(updatedData.highlights);
      if (updatedData.videos) setVideos(updatedData.videos);
      if (updatedData.faculty) setFaculty(updatedData.faculty);
      if (updatedData.principal) setPrincipal(updatedData.principal);
      if (updatedData.notices) setNotices(updatedData.notices);
      if (updatedData.notificationEmail) setNotificationEmail(updatedData.notificationEmail);
      if (updatedData.banner) setBanner(updatedData.banner);
      if (updatedData.socialLinks) setSocialLinks(updatedData.socialLinks);
      if (updatedData.alumni) setAlumni(updatedData.alumni);

      // console.log("Auto-save successful");
    } catch (err) {
      console.error("Failed to auto-save to backend:", err);
      const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Failed to auto-save to backend: " + errorDetail);
    }
  };

  // Atomic update function for multiple fields
  const updateSiteContent = (updates) => {
    // 1. Update local state
    if (updates.gallery !== undefined) setGallery(updates.gallery);
    if (updates.events !== undefined) setEvents(updates.events);
    if (updates.highlights !== undefined) setHighlights(updates.highlights);
    if (updates.videos !== undefined) setVideos(updates.videos);
    if (updates.faculty !== undefined) setFaculty(updates.faculty);
    if (updates.principal !== undefined) setPrincipal(updates.principal);
    if (updates.notices !== undefined) setNotices(updates.notices);
    if (updates.notificationEmail !== undefined) setNotificationEmail(updates.notificationEmail);
    if (updates.banner !== undefined) setBanner(updates.banner);
    if (updates.socialLinks !== undefined) setSocialLinks(updates.socialLinks);
    if (updates.alumni !== undefined) setAlumni(updates.alumni);

    // 2. Persist to backend in ONE request
    saveToBackend(updates);
  };

  // --- Image Handling Helpers ---

  // Upload an image to Cloudinary (via our backend proxy)
  const uploadImage = async (file) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('image', file);

      const { data } = await axios.post(`${API_URL}/content/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!data || !data.url) throw new Error('Invalid response from upload server');
      return data.url; 
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // Specialized upload for Events: Sends cover + up to 30 gallery images in one request
  const uploadEventPhotos = async (coverFile, galleryFiles, eventTitle) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      if (coverFile) formData.append('image', coverFile);
      if (galleryFiles?.length) {
        galleryFiles.forEach(file => formData.append('images', file));
      }
      formData.append('eventTitle', eventTitle);

      const { data } = await axios.post(`${API_URL}/content/upload-event`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      return data; // { cover: {url, public_id}, gallery: [{url, public_id}] }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // Individual wrapper setters (retained for backward compatibility but now use saveToBackend)
  const wrapSetGallery = (val) => { setGallery(val); saveToBackend({ gallery: val }); };
  const wrapSetEvents = (val) => { setEvents(val); saveToBackend({ events: val }); };
  const wrapSetHighlights = (val) => { setHighlights(val); saveToBackend({ highlights: val }); };
  const wrapSetVideos = (val) => { setVideos(val); saveToBackend({ videos: val }); };
  const wrapSetFaculty = (val) => { setFaculty(val); saveToBackend({ faculty: val }); };
  const wrapSetPrincipal = (val) => { setPrincipal(val); saveToBackend({ principal: val }); };
  const wrapSetNotices = (val) => { setNotices(val); saveToBackend({ notices: val }); };
  const wrapSetNotificationEmail = (val) => { setNotificationEmail(val); saveToBackend({ notificationEmail: val }); };
  const wrapSetBanner = (val) => { setBanner(val); saveToBackend({ banner: val }); };
  const wrapSetSocialLinks = (val) => { setSocialLinks(val); saveToBackend({ socialLinks: val }); };
  const wrapSetAlumni = (val) => { setAlumni(val); saveToBackend({ alumni: val }); };

  return (
    <SiteDataContext.Provider value={{
      loading,
      videos, setVideos: wrapSetVideos,
      highlights, setHighlights: wrapSetHighlights,
      gallery, setGallery: wrapSetGallery,
      events, setEvents: wrapSetEvents,
      faculty, setFaculty: wrapSetFaculty,
      principal, setPrincipal: wrapSetPrincipal,
      notices, setNotices: wrapSetNotices,
      notificationEmail, setNotificationEmail: wrapSetNotificationEmail,
      banner, setBanner: wrapSetBanner,
      socialLinks, setSocialLinks: wrapSetSocialLinks,
      alumni, setAlumni: wrapSetAlumni,
      updateSiteContent,
      uploadImage,
      uploadEventPhotos,
      API_URL,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
};
