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
const defaultFaculty = { Commerce: [], Science: [], Arts: [], "High School": [], Nursery: [], Administration: [], "Support Staff": [], Others: [] };
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

const defaultFaqs = [
  {
    question: "What are the school's operating hours?",
    answer: "Our office hours are from 8:00 AM to 4:00 PM, Monday through Friday. We are closed on weekends and public holidays."
  },
  {
    question: "How can I apply for admission?",
    answer: "You can apply for admission by navigating to the Admissions section on our website, where you can find detailed instructions and the application form."
  },
  {
    question: "Do you offer transportation facilities?",
    answer: "Yes, we offer safe and reliable bus transportation for our students across various routes. Please contact the main office for specific route details."
  },
  {
    question: "How can I track my child's progress?",
    answer: "Parents can track their child's academic progress, attendance, and behavioral reports through our secure parent portal."
  },
  {
    question: "Are there extracurricular activities available?",
    answer: "Absolutely! We believe in holistic development and offer a wide range of extracurricular activities including sports, arts, music, and various student clubs."
  }
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
  name: "",
  logo: "",
  punchLine: "",
  phone: "",
  email: "",
  officeHours: "",
  officeAddress: "",
  mapLink: "",
  heroImages: [],
  pageHeroImages: {},
  affiliation: [],
  theme: 'academic',
  facultyVisibility: { graduate: true, higher_secondary: true, upper_primary: true, primary: true, play_school: true, administration: true, support_staff: true }
};

const defaultAmenities = [
  { title: "Clean / holistic", details: "Clean & holistic environment", icon: "FaLeaf", image: "" },
  { title: "Co-ciricul", details: "Supplementary co-curricular activities", icon: "FaBook", image: "" },
  { title: "Dedicated teacher", details: "Supportive teachers and staff", icon: "FaChalkboardTeacher", image: "" },
  { title: "NCC/scouts & guides", details: "Residential camp for NCC and Scouts & Guide", icon: "FaUserFriends", image: "" },
  { title: "Drinking water", details: "RO drinking water facility", icon: "FaFaucet", image: "" },
  { title: "Auditorium", details: "Personal Amphitheatre", icon: "FaTheaterMasks", image: "" },
  { title: "Parking", details: "Parking space for HS Students", icon: "FaParking", image: "" },
  { title: "Canteen", details: "Hygienic school canteen", icon: "FaUtensils", image: "" },
  { title: "Hostel", details: "Hostel facility for girls", icon: "FaBed", image: "" },
  { title: "Smart classes", details: "Digital classrooms", icon: "FaLaptop", image: "" },
  { title: "Science labs", details: "Dedicated science labs", icon: "FaFlask", image: "" },
  { title: "Comp labs", details: "Two upgraded computer labs", icon: "FaDesktop", image: "" }
];

const defaultCoursesPage = {
  higherEducation: { text: "Details about Graduate, Diploma, and PG courses will be updated soon." },
  higherSecondary: { text: "Details about XI & XII courses will be updated soon." },
  upperPrimary: { text: "Details about IX & X courses will be updated soon." },
  lowerPrimary: { text: "Details about I to VIII courses will be updated soon." },
  prePrimary: { text: "Details about Play School & Nursery courses will be updated soon." },
  streams: {
    Science: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science"],
    Commerce: ["Accountancy", "Business Studies", "Economics", "Mathematics", "Informatics Practices"],
    Arts: ["History", "Geography", "Political Science", "Sociology", "Psychology"]
  },
  levels: [
    { title: "Play School", desc: "A nurturing environment where early learning meets structured play, setting the foundational stones for lifelong curiosity.", iconType: "FaChild" },
    { title: "Nursery", desc: "Fostering social skills, early literacy, and numeracy through engaging and interactive activities.", iconType: "FaChild" },
    { title: "Lower Primary", desc: "Building core academic competencies in a supportive setting, encouraging independent thought and collaborative learning.", iconType: "FaBookOpen" },
    { title: "Upper Primary", desc: "Expanding knowledge horizons with a diverse curriculum designed to challenge and inspire growing minds.", iconType: "FaBookOpen" },
    { title: "Secondary School", desc: "Preparing students for rigorous academic challenges and holistic personal development ahead of crucial board examinations.", iconType: "FaGraduationCap" },
    { title: "HS Science", desc: "Specialized focus on Physics, Chemistry, Biology, and Mathematics to prepare students for engineering, medical, and research careers.", iconType: "FaAtom" },
    { title: "HS Commerce", desc: "In-depth study of Accountancy, Business Studies, and Economics, building a strong foundation for future business and financial leaders.", iconType: "FaBalanceScale" },
    { title: "HS Arts", desc: "Comprehensive exploration of Humanities, History, and Political Science, fostering critical thinking and social awareness.", iconType: "FaLandmark" },
    { title: "NCC 11th Assam Battalion", desc: "Elite membership program focused on discipline, leadership, and national service, building character through rigorous training.", iconType: "FaShieldAlt" }
  ],
  rules: [
    { heading: "Attendance Policy", description: "Students must maintain 80% attendance throughout the academic year." },
    { heading: "Uniform Policy", description: "Strict adherence to the school uniform policy is mandatory at all times." },
    { heading: "Electronic Devices", description: "Mobile phones and electronic gadgets are strictly prohibited on campus." },
    { heading: "Respectful Conduct", description: "Respectful code of conduct towards peers, faculty, and administrative staff." },
    { heading: "Extracurricular Activities", description: "Participation in at least one extracurricular activity is highly encouraged." },
    { heading: "Assignment Submission", description: "Timely submission of assignments and project work is essential." }
  ]
};

const defaultAppointmentSettings = {
  isSchoolOpen: true,
  isPrincipalAvailable: true,
  schoolTiming: "08:30 AM - 03:00 PM"
};

const defaultAboutPage = {
  shortDescription: { text: "", image: "" },
  founder: { text: "", image: "" },
  history: { text: "", image: "" },
  principals: [],
  leadership: {
    showHeadMistress: true,
    headMistress: { name: "", text: "", image: "" },
    showVicePrincipal: false,
    vicePrincipal: { name: "", text: "", image: "" }
  }
};

const defaultAdmissionPage = {
  advertisements: [], // array of image URLs
  rules: "Please abide by all school rules and regulations.",
  offlineProcedure: "Visit the school office between 9 AM and 1 PM with required documents.",
  onlineProcedure: "Download the prospectus, fill the online form, upload documents, and track status.",
  vacantSeats: [
    { className: "Class I", vacant: "10" }
  ]
};

const defaultCareerPage = {
  eligibility: [
    "Prior teaching or school experience is highly preferred.",
    "A clean background and good moral conduct.",
    "Fluency in English and the relevant instruction languages."
  ],
  qualification: [
    "Bachelor's or Master's degree in the relevant subject area.",
    "Professional training certification (B.Ed or D.El.Ed) is preferred."
  ],
  documents: [
    "Bio-data / Resume",
    "Passport size Photograph",
    "Signature Image",
    "Matriculation (10th) Marksheet & Pass Certificate",
    "Aadhaar Card Document",
    "Employment Exchange Registration Certificate",
    "Highest Qualification Marksheet & Pass Certificate"
  ],
  offline_process: [
    "Fill in your name, email, phone number, address, role, and qualification.",
    "Complete the registration fee payment online (INR 250).",
    "Download and print the generated Job Application form containing your Serial Number.",
    "Submit the physical form along with self-attested documents to the school office."
  ],
  online_process: [
    "Choose your desired Job Opening from the vacant postings list.",
    "Fill out the online application form and upload all requested documents.",
    "Pay the registration fee of INR 250 via the UPI QR code (free of cost for subsequent submissions using the same email within the year).",
    "Submit the form and download the PDF Acknowledgement Receipt with your unique Reference ID."
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
  const [admissionPage, setAdmissionPage] = useState(defaultAdmissionPage);
  const [careerPage, setCareerPage] = useState(defaultCareerPage);
  const [notificationEmail, setNotificationEmail] = useState('office@lenchosolutions.com');
  const [banner, setBanner] = useState({ isActive: false, image: null, link: null });
  const [socialLinks, setSocialLinks] = useState(defaultSocialLinks);
  const [alumni, setAlumni] = useState(defaultAlumni);
  const [stats, setStats] = useState(defaultStats);
  const [faqs, setFaqs] = useState(defaultFaqs);
  const [visionStatement, setVisionStatement] = useState(defaultVisionStatement);
  const [aimsAndObjectives, setAimsAndObjectives] = useState(defaultAimsAndObjectives);
  const [headMistress, setHeadMistress] = useState(defaultHeadMistress);
  const [schoolProfile, setSchoolProfile] = useState(defaultSchoolProfile);
  const [emeritus, setEmeritus] = useState([]);
  const [centerOfExcellence, setCenterOfExcellence] = useState([]);
  const [coursesPage, setCoursesPage] = useState(defaultCoursesPage);
  const [admissionFields, setAdmissionFields] = useState([]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [amenities, setAmenities] = useState(defaultAmenities);
  const [aboutPage, setAboutPage] = useState(defaultAboutPage);
  const [appointmentSettings, setAppointmentSettings] = useState(defaultAppointmentSettings);
  const [loading, setLoading] = useState(true);



  const lastSaveRef = useRef(0);
  
  // Helper to map Supabase snake_case to legacy camelCase and provide _id fallback
  const mapSupabaseToLegacy = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(mapSupabaseToLegacy);
    
    const mapped = {};
    Object.keys(obj).forEach(key => {
      // Convert snake_case to camelCase (e.g. pdf_link -> pdfLink)
      const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
      mapped[camelKey] = mapSupabaseToLegacy(obj[key]);
    });
    
    // Fallback for MongoDB style IDs often used in legacy slice/map logic
    if (obj.id && !mapped._id) mapped._id = String(obj.id);
    
    return mapped;
  };

  // Fetch content from backend on mount and via polling
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;

    const fetchContent = async (isRetry = false) => {
      // Prevents polling from overwriting local state right after a manual save
      if (!isRetry && Date.now() - lastSaveRef.current < 10000) return;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const testDomain = urlParams.get('test_domain');
        if (testDomain) {
          localStorage.setItem('test_domain', testDomain);
        }
        
        const targetDomain = (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) && localStorage.getItem('test_domain') 
            ? localStorage.getItem('test_domain') 
            : window.location.hostname;
          
        if (targetDomain.startsWith('employee.') || window.location.search.includes('site=employee')) {
          setLoading(false);
          return;
        }
          
        const adminToken = localStorage.getItem('adminToken');
        const staffToken = localStorage.getItem('staffToken');
        const studentToken = localStorage.getItem('studentToken');
        const token = adminToken || staffToken || studentToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await axios.get(`${API_URL}/content?domain=${targetDomain}`, { headers });
        const legacyData = mapSupabaseToLegacy(data);
        if (Array.isArray(legacyData.gallery)) setGallery(legacyData.gallery);
        if (Array.isArray(legacyData.events)) setEvents(legacyData.events);
        if (Array.isArray(legacyData.highlights)) setHighlights(legacyData.highlights);
        if (Array.isArray(legacyData.videos)) setVideos(legacyData.videos);
        if (Array.isArray(legacyData.notices)) setNotices(legacyData.notices);
        if (legacyData.faculty && typeof legacyData.faculty === 'object') setFaculty(legacyData.faculty);
        if (legacyData.principal && typeof legacyData.principal === 'object') setPrincipal({ ...defaultPrincipal, ...legacyData.principal });
        if (legacyData.notificationEmail !== undefined) setNotificationEmail(legacyData.notificationEmail);
        if (legacyData.banners !== undefined && Array.isArray(legacyData.banners)) {
          setBanner(legacyData.banners[0] || { isActive: false, image: null, link: null });
        } else if (legacyData.banner !== undefined) {
          setBanner(legacyData.banner);
        }
        if (legacyData.socialLinks && typeof legacyData.socialLinks === 'object') setSocialLinks(legacyData.socialLinks);
        if (Array.isArray(legacyData.alumni)) setAlumni(legacyData.alumni);
        if (Array.isArray(legacyData.stats)) setStats(legacyData.stats);
        if (Array.isArray(legacyData.faqs)) setFaqs(legacyData.faqs);
        if (legacyData.visionStatement !== undefined) setVisionStatement(legacyData.visionStatement);
        if (legacyData.aimsAndObjectives) setAimsAndObjectives(legacyData.aimsAndObjectives);
        if (legacyData.headMistress && typeof legacyData.headMistress === 'object') setHeadMistress({ ...defaultHeadMistress, ...legacyData.headMistress });
        if (legacyData.schoolProfile && typeof legacyData.schoolProfile === 'object') {
          const previewTheme = urlParams.get('preview_theme');
          const mergedProfile = { ...defaultSchoolProfile, ...legacyData.schoolProfile };
          if (previewTheme) {
            mergedProfile.theme = previewTheme;
          }
          setSchoolProfile(mergedProfile);
        }
        if (Array.isArray(legacyData.emeritus)) setEmeritus(legacyData.emeritus);
        if (Array.isArray(legacyData.centerOfExcellence)) setCenterOfExcellence(legacyData.centerOfExcellence);
        if (legacyData.coursesPage && typeof legacyData.coursesPage === 'object') setCoursesPage(legacyData.coursesPage);
        if (Array.isArray(legacyData.admissionFields)) setAdmissionFields(legacyData.admissionFields);
        if (legacyData.schoolProfile?.isMaintenanceMode !== undefined) setIsMaintenanceMode(legacyData.schoolProfile.isMaintenanceMode);
        if (Array.isArray(legacyData.amenities) && legacyData.amenities.length > 0) setAmenities(legacyData.amenities);
        if (legacyData.aboutPage && Object.keys(legacyData.aboutPage).length > 0) setAboutPage(legacyData.aboutPage);
        if (legacyData.appointmentSettings && typeof legacyData.appointmentSettings === 'object') setAppointmentSettings(legacyData.appointmentSettings);
        if (legacyData.careerPage && typeof legacyData.careerPage === 'object') setCareerPage(legacyData.careerPage);
        retryCount = 0; // Reset on success
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 404 && error.response?.data?.isNotFound) {
          setSchoolProfile({ isNotFound: true });
          setLoading(false);
          return;
        }
        
        console.warn('Backend fetch error:', error.message);
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(2000 * Math.pow(2, retryCount - 1), 32000);
          console.log(`Backend cold start detected. Retry ${retryCount}/${maxRetries} in ${delay / 1000}s...`);
          setTimeout(() => fetchContent(true), delay);
        } else {
          // Give up retrying and show whatever defaults we have
          console.warn('Max retries reached. Showing default content.');
          setLoading(false);
        }
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

      // Sanitization: Strip internal keys but preserve real IDs
      const sanitize = (data) => {
        if (Array.isArray(data)) {
          return data.map(item => sanitize(item));
        } else if (data !== null && typeof data === 'object') {
          const newObj = {};
          for (const key in data) {
            // Skip internal version keys
            if (key === '__v') continue;
            
            // For Supabase, we want to keep 'id' and '_id' if they are valid UUIDs or ObjectIds
            // But we SHOULD strip them if they are 'temp-' IDs to let the DB generate new ones
            if (key === '_id' || key === 'id') {
              const val = data[key];
              if (typeof val === 'string' && val.startsWith('temp-')) continue;
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
      if (updatedData.banners && Array.isArray(updatedData.banners)) {
        setBanner(updatedData.banners[0] || { isActive: false, image: null, link: null });
      } else if (updatedData.banner) {
        setBanner(updatedData.banner);
      }
      if (updatedData.socialLinks) setSocialLinks(updatedData.socialLinks);
      if (updatedData.alumni) setAlumni(updatedData.alumni);
      if (updatedData.stats) setStats(updatedData.stats);
      if (updatedData.faqs) setFaqs(updatedData.faqs);
      if (updatedData.visionStatement !== undefined) setVisionStatement(updatedData.visionStatement);
      if (updatedData.aimsAndObjectives) setAimsAndObjectives(updatedData.aimsAndObjectives);
      if (updatedData.headMistress) setHeadMistress(updatedData.headMistress);
      if (updatedData.schoolProfile) setSchoolProfile(updatedData.schoolProfile);
      if (updatedData.emeritus) setEmeritus(updatedData.emeritus);
      if (updatedData.centerOfExcellence) setCenterOfExcellence(updatedData.centerOfExcellence);
      if (updatedData.coursesPage) setCoursesPage(updatedData.coursesPage);
      if (updatedData.admissionFields) setAdmissionFields(updatedData.admissionFields);
      if (updatedData.schoolProfile?.isMaintenanceMode !== undefined) setIsMaintenanceMode(updatedData.schoolProfile.isMaintenanceMode);
      if (updatedData.amenities) setAmenities(updatedData.amenities);
      if (updatedData.aboutPage) setAboutPage(updatedData.aboutPage);

      // console.log("Auto-save successful");
      return true;
    } catch (err) {
      console.error("Failed to auto-save to backend:", err);
      const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Failed to auto-save to backend: " + errorDetail);
      return false;
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
    if (updates.faqs !== undefined) setFaqs(updates.faqs);
    if (updates.visionStatement !== undefined) setVisionStatement(updates.visionStatement);
    if (updates.aimsAndObjectives !== undefined) setAimsAndObjectives(updates.aimsAndObjectives);
    if (updates.headMistress !== undefined) setHeadMistress(updates.headMistress);
    if (updates.schoolProfile !== undefined) setSchoolProfile(updates.schoolProfile);
    if (updates.emeritus !== undefined) setEmeritus(updates.emeritus);
    if (updates.centerOfExcellence !== undefined) setCenterOfExcellence(updates.centerOfExcellence);
    if (updates.coursesPage !== undefined) setCoursesPage(updates.coursesPage);
    if (updates.admissionFields !== undefined) setAdmissionFields(updates.admissionFields);
    if (updates.isMaintenanceMode !== undefined) setIsMaintenanceMode(updates.isMaintenanceMode);
    if (updates.amenities !== undefined) setAmenities(updates.amenities);
    if (updates.aboutPage !== undefined) setAboutPage(updates.aboutPage);
    if (updates.admissionPage !== undefined) setAdmissionPage(updates.admissionPage);
    if (updates.careerPage !== undefined) setCareerPage(updates.careerPage);

    // 2. Persist to backend in ONE request
    return saveToBackend(updates);
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
      formData.append('eventTitle', eventTitle);
      if (coverFile) formData.append('image', coverFile);
      if (galleryFiles?.length) {
        galleryFiles.forEach(file => formData.append('images', file));
      }

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
  const wrapSetFaqs = (val) => { setFaqs(val); saveToBackend({ faqs: val }); };
  const wrapSetVisionStatement = (val) => { setVisionStatement(val); saveToBackend({ visionStatement: val }); };
  const wrapSetAimsAndObjectives = (val) => { setAimsAndObjectives(val); saveToBackend({ aimsAndObjectives: val }); };
  const wrapSetHeadMistress = (val) => { setHeadMistress(val); saveToBackend({ headMistress: val }); };
  const wrapSetSchoolProfile = (val) => { setSchoolProfile(val); saveToBackend({ schoolProfile: val }); };
  const wrapSetEmeritus = (val) => { setEmeritus(val); saveToBackend({ emeritus: val }); };
  const wrapSetCenterOfExcellence = (val) => { setCenterOfExcellence(val); saveToBackend({ centerOfExcellence: val }); };
  const wrapSetCoursesPage = (val) => { setCoursesPage(val); saveToBackend({ coursesPage: val }); };
  const wrapSetAmenities = (val) => { setAmenities(val); saveToBackend({ amenities: val }); };
  const wrapSetAboutPage = (val) => { setAboutPage(val); saveToBackend({ aboutPage: val }); };
  const wrapSetAdmissionPage = (val) => { setAdmissionPage(val); saveToBackend({ admissionPage: val }); };
  const wrapSetAppointmentSettings = (val) => { setAppointmentSettings(val); saveToBackend({ appointmentSettings: val }); };

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
      faqs, setFaqs: wrapSetFaqs,
      visionStatement, setVisionStatement: wrapSetVisionStatement,
      aimsAndObjectives, setAimsAndObjectives: wrapSetAimsAndObjectives,
      headMistress, setHeadMistress: wrapSetHeadMistress,
      schoolProfile, setSchoolProfile: wrapSetSchoolProfile,
      emeritus, setEmeritus: wrapSetEmeritus,
      centerOfExcellence, setCenterOfExcellence: wrapSetCenterOfExcellence,
      coursesPage, setCoursesPage: wrapSetCoursesPage,
      admissionFields, setAdmissionFields: (val) => { setAdmissionFields(val); saveToBackend({ admissionFields: val }); },
      isMaintenanceMode, setIsMaintenanceMode: (val) => { setIsMaintenanceMode(val); saveToBackend({ isMaintenanceMode: val }); },
      amenities, setAmenities: wrapSetAmenities,
      aboutPage, setAboutPage: wrapSetAboutPage,
      admissionPage, setAdmissionPage: wrapSetAdmissionPage,
      appointmentSettings, setAppointmentSettings: wrapSetAppointmentSettings,
      careerPage, setCareerPage: (val) => { setCareerPage(val); saveToBackend({ careerPage: val }); },
      updateSiteContent,
      uploadImage,
      uploadEventPhotos,
      API_URL,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
};
