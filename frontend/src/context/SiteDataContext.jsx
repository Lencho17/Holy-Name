import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const SiteDataContext = createContext();

// Use VITE_API_URL env var if available (useful for Vercel/Render cross-domain setup)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Fallback defaults (used while API loads or if offline)
const defaultVideos = [
  { id: 1, src: 'src/assets/video.mp4', title: 'Aerial View' },
  { id: 2, src: 'video2.mp4', title: 'School Overview' },
];
const defaultEvents = [
  { id: 1, title: "Teachers Day Celebration", date: "Sept 5, 2025", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600", description: "A day dedicated to honoring our mentors with heartfelt performances." },
  { id: 2, title: "Independence Day", date: "Aug 15, 2025", image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600", description: "The tricolor flies high as we celebrate our nation's freedom." },
];
const defaultHighlights = [
  { id: 1, title: "Annual Science Exhibition 2026", date: "March 15, 2026", category: "Academic", image: "/Pictures/1.JPG", description: "Students showcased groundbreaking projects in robotics and green energy." },
  { id: 2, title: "State Level Sports Championship", date: "February 28, 2026", category: "Sports", image: "/Pictures/2.JPG", description: "Our school team won the overall championship trophy." },
];
const defaultGallery = [
  { id: 1, category: "Academic Events", title: "Science Exhibition 2023", src: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&auto=format&fit=crop&q=60", featured: true, description: "Students demonstrating their innovative physics projects." },
];
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

export const SiteDataProvider = ({ children }) => {
  const [videos, setVideos] = useState(defaultVideos);
  const [highlights, setHighlights] = useState(defaultHighlights);
  const [gallery, setGallery] = useState(defaultGallery);
  const [events, setEvents] = useState(defaultEvents);
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [faculty, setFaculty] = useState(defaultFaculty);
  const [loading, setLoading] = useState(true);

  // Fetch content from backend on mount and via polling
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/content`);
        if (data.gallery?.length) setGallery(data.gallery);
        if (data.events?.length) setEvents(data.events);
        if (data.highlights?.length) setHighlights(data.highlights);
        if (data.videos?.length) setVideos(data.videos);
        if (data.faculty && Object.keys(data.faculty).length) setFaculty(data.faculty);
        if (data.principal?.name) setPrincipal(data.principal);
      } catch (error) {
        console.warn('Backend polling error or using local defaults:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
    const interval = setInterval(fetchContent, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Save content to backend (called from admin panel)
  const saveToBackend = async (field, value) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return; // only admins can save
      await axios.put(
        `${API_URL}/content`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to save to backend:', error.message);
    }
  };

  // Wrapper setters that also persist to backend
  const updateGallery = (val) => { setGallery(val); saveToBackend('gallery', val); };
  const updateEvents = (val) => { setEvents(val); saveToBackend('events', val); };
  const updateHighlights = (val) => { setHighlights(val); saveToBackend('highlights', val); };
  const updateVideos = (val) => { setVideos(val); saveToBackend('videos', val); };
  const updateFaculty = (val) => { setFaculty(val); saveToBackend('faculty', val); };
  const updatePrincipal = (val) => { setPrincipal(val); saveToBackend('principal', val); };

  // Upload image via API, returns the URL
  const uploadImage = async (file) => {
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axios.post(`${API_URL}/content/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // If VITE_API_URL is a full URL, use it; otherwise use origin in prod or local host in dev
      // Cloudinary returns the full absolute URL directly
      return data.url;
    } catch (error) {
      console.error('Image upload failed:', error.message);
      return null;
    }
  };

  return (
    <SiteDataContext.Provider value={{
      videos, setVideos: updateVideos,
      highlights, setHighlights: updateHighlights,
      gallery, setGallery: updateGallery,
      events, setEvents: updateEvents,
      faculty, setFaculty: updateFaculty,
      principal, setPrincipal: updatePrincipal,
      loading,
      uploadImage,
      API_URL,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
};
