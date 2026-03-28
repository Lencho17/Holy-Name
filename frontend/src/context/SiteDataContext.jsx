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
  message: "Holy Name HS School, Cherekapar Sivasagar, has always aimed at the all-round development of its students. Our goal is to nurture intellectual, physical, spiritual, and emotional growth, preparing students to be responsible global citizens.",
  closingQuote: "Aristotle once said, \"Educating the mind without educating the heart is no education at all.\"",
  photo: "",
  signature: "/Pictures/assets/principal_signature.png",
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

const defaultVisionStatement = "Holy Name High School, Sivasagar, envisions to be a center of excellence that imparts holistic education to its students. We strive to nurture the intellectual, physical, spiritual, and emotional growth of each child, preparing them to be responsible global citizens.";

const defaultAimsAndObjectives = [
  { title: "Academic Excellence", description: "To provide quality education that helps students attain academic excellence." },
  { title: "Character Formation", description: "To inculcate moral values, discipline, and a strong sense of responsibility." }
];

const defaultHeadMistress = {
  photo: "",
  greeting: "A warm welcome to Holy Name School",
  message: "On behalf of the Management and staff, I extend a loving welcome to you to the new academic year. Holy Name School has always aimed at the all-round development of its students.",
  signature: "/Pictures/assets/head_mistress_signature.png"
};

const defaultSchoolProfile = {
  name: "Holy Name School",
  logo: "/Pictures/Logo.jpg",
  punchLine: "Let Your Light Shine",
  phone: "6901055733",
  email: "holynameschool@gmail.com",
  officeHours: "9am - 1:30pm (Mon - Sat)",
  officeAddress: "XMH8+GGW, Nazira Ali Rd, Hatimuria, Assam 785697",
  mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3555.6218095340837!2d94.66374457624775!3d26.978873257242732!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374736eaad53cc3d%3A0x49d6b196c9334e5d!2sHoly%20Name%20School!5e0!3m2!1sen!2sin!4v1774612478828!5m2!1sen!2sin",
  heroImages: [
    "/Pictures/1.JPG",
    "/Pictures/2.JPG",
    "/Pictures/3.JPG",
    "/Pictures/4.JPG",
    "/Pictures/5.JPG",
    "/Pictures/6.JPG",
  ]
};

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
  const [visionStatement, setVisionStatement] = useState(defaultVisionStatement);
  const [aimsAndObjectives, setAimsAndObjectives] = useState(defaultAimsAndObjectives);
  const [headMistress, setHeadMistress] = useState(defaultHeadMistress);
  const [schoolProfile, setSchoolProfile] = useState(defaultSchoolProfile);
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
        if (Array.isArray(data.stats)) setStats(data.stats);
        if (data.visionStatement !== undefined) setVisionStatement(data.visionStatement);
        if (Array.isArray(data.aimsAndObjectives)) setAimsAndObjectives(data.aimsAndObjectives);
        if (data.headMistress && typeof data.headMistress === 'object') setHeadMistress(data.headMistress);
        if (data.schoolProfile && typeof data.schoolProfile === 'object') setSchoolProfile(data.schoolProfile);
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
      if (updatedData.stats) setStats(updatedData.stats);
      if (updatedData.visionStatement !== undefined) setVisionStatement(updatedData.visionStatement);
      if (updatedData.aimsAndObjectives) setAimsAndObjectives(updatedData.aimsAndObjectives);
      if (updatedData.headMistress) setHeadMistress(updatedData.headMistress);
      if (updatedData.schoolProfile) setSchoolProfile(updatedData.schoolProfile);

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
    if (updates.stats !== undefined) setStats(updates.stats);
    if (updates.visionStatement !== undefined) setVisionStatement(updates.visionStatement);
    if (updates.aimsAndObjectives !== undefined) setAimsAndObjectives(updates.aimsAndObjectives);
    if (updates.headMistress !== undefined) setHeadMistress(updates.headMistress);
    if (updates.schoolProfile !== undefined) setSchoolProfile(updates.schoolProfile);

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
  const wrapSetStats = (val) => { setStats(val); saveToBackend({ stats: val }); };
  const wrapSetVisionStatement = (val) => { setVisionStatement(val); saveToBackend({ visionStatement: val }); };
  const wrapSetAimsAndObjectives = (val) => { setAimsAndObjectives(val); saveToBackend({ aimsAndObjectives: val }); };
  const wrapSetHeadMistress = (val) => { setHeadMistress(val); saveToBackend({ headMistress: val }); };
  const wrapSetSchoolProfile = (val) => { setSchoolProfile(val); saveToBackend({ schoolProfile: val }); };

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
      stats, setStats: wrapSetStats,
      visionStatement, setVisionStatement: wrapSetVisionStatement,
      aimsAndObjectives, setAimsAndObjectives: wrapSetAimsAndObjectives,
      headMistress, setHeadMistress: wrapSetHeadMistress,
      schoolProfile, setSchoolProfile: wrapSetSchoolProfile,
      updateSiteContent,
      uploadImage,
      uploadEventPhotos,
      API_URL,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
};
