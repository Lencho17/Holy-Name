import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaClipboardList, FaCheckCircle, FaChartLine, FaSignOutAlt, FaSearch, FaImage, FaVideo, FaStar, FaChalkboardTeacher, FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaBars, FaTimes, FaCog, FaEnvelope, FaShareAlt, FaGraduationCap, FaSpinner, FaInfoCircle, FaCommentDots, FaEnvelopeOpenText, FaDownload, FaBriefcase, FaIdCard, FaLaptop, FaBuilding } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SiteDataContext } from '../context/SiteDataContext';

function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);
  const { loading, schoolProfile, setSchoolProfile, gallery, setGallery, videos, setVideos, highlights, setHighlights, events, setEvents, faculty, setFaculty, principal, setPrincipal, notices, setNotices, notificationEmail, setNotificationEmail, banner, setBanner, socialLinks, setSocialLinks, alumni, setAlumni, stats, setStats, visionStatement, setVisionStatement, aimsAndObjectives, setAimsAndObjectives, headMistress, setHeadMistress, updateSiteContent, uploadImage, uploadEventPhotos, API_URL: raw_API_URL } = useContext(SiteDataContext);
  
  // Defensive API_URL — ensure it points to the correct backend
  const API_URL = raw_API_URL 
    ? (raw_API_URL.startsWith('http') ? raw_API_URL : (raw_API_URL.startsWith('/') ? raw_API_URL : `/api`))
    : '/api';

  // --- Auth & Role ---
  const [adminUser, setAdminUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [mapExtracted, setMapExtracted] = useState(false);

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

  // --- Auto Logout on Inactivity (30 mins) ---
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Automatically logout due to inactivity
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/adminLogin';
      }, 30 * 60 * 1000); 
    };

    resetTimer();

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer, { passive: true }));
    };
  }, []);

  // --- Fetch real admission applications && Inquiries ---
  const [applications, setApplications] = useState([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appStats, setAppStats] = useState({ total: 0, accepted: 0, pending: 0 });
  const [inquiries, setInquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); // For "View" modal
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [currentJob, setCurrentJob] = useState({
    title: '',
    department: 'Science',
    type: 'Full-Time',
    experience: '',
    qualifications: '',
    deadline: 'Open until filled'
  });
  const [jobApplications, setJobApplications] = useState([]);
  const [jobApplicationsLoading, setJobApplicationsLoading] = useState(false);
  const [selectedJobApp, setSelectedJobApp] = useState(null);

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isExportingStudents, setIsExportingStudents] = useState(false);

  const handleExportStudents = async () => {
    setIsExportingStudents(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/students/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 401) return handleLogout();
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export students.");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("An error occurred during export.");
    } finally {
      setIsExportingStudents(false);
    }
  };

  const fetchApps = async (page = appPage, search = searchQuery) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${API_URL}/admissions?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.status === 401) return handleLogout();
      if (res.ok) {
        const data = await res.json();
        setApplications(data.data || data || []);
        if (data.pagination) setAppTotalPages(data.pagination.pages);
        if (data.stats) setAppStats(data.stats);
      }
    } catch (e) { 
      console.warn('Could not fetch applications'); 
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (activeTab === 'dashboard' || activeTab === 'applications') {
        fetchApps(appPage, searchQuery);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, appPage]);

  const fetchJobApplications = async () => {
    try {
      setJobApplicationsLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/job-applications`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.status === 401) return handleLogout();
      if (res.ok) setJobApplications(await res.json());
    } catch (e) { 
      console.warn('Could not fetch job applications'); 
    } finally {
      setJobApplicationsLoading(false);
    }
  };

  const handleDownloadPDF = async (app) => {
    setIsDownloadingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const primaryColor = [37, 99, 235]; // Midblue (Blue 600) theme

      // Helper to load image as Base64 for jsPDF
      const loadImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      // --- Header ---
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');
      
      // Fetch images in parallel
      const [logoImg, photoImg] = await Promise.all([
        schoolProfile.logo ? loadImage(schoolProfile.logo) : Promise.resolve(null),
        app.studentPhoto ? loadImage(app.studentPhoto) : Promise.resolve(null)
      ]);

      // Add School Logo
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 15, 8, 32, 32);
      }

      // Add Student Photo (Top Right)
      if (photoImg) {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.rect(pageWidth - 45, 8, 32, 32, 'D');
        doc.addImage(photoImg, 'JPEG', pageWidth - 45, 8, 32, 32);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(schoolProfile.name?.toUpperCase() || "HOLY NAME HIGH SCHOOL", 105, 14, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(schoolProfile.punchLine || "", 105, 19, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ADMISSION APPLICATION FORM", 105, 26, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`REFERENCE NO: ${app.referenceNumber || "N/A"}`, 105, 31, { align: "center" });

      let yPos = 42;

      // --- Sections ---
      const addSection = (title, data) => {
        autoTable(doc, {
          startY: yPos,
          head: [[title, '']],
          body: data,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8.5, cellPadding: 1.5 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
          margin: { left: 15, right: 15 },
        });
        yPos = doc.lastAutoTable.finalY + 6;
      };

      // 1. Personal Info
      addSection("Personal Information", [
        ["Student Name", app.studentName],
        ["Date of Birth", app.dateOfBirth],
        ["Place of Birth", app.placeOfBirth || "N/A"],
        ["Gender", app.gender],
        ["Blood Group", app.bloodGroup || "N/A"],
        ["Religion", app.religion || "N/A"],
        ["Caste", app.caste || "N/A"],
        ["Grade Applied", app.gradeApplied],
        ["NCC Interest", app.nccInterest ? "YES (11th Assam Battalion)" : "NO"]
      ]);

      // Check if we need a new page
      if (yPos > 265) { doc.addPage(); yPos = 20; }

      // 2. Parent Info
      addSection("Parent / Guardian Details", [
        ["Father's Name", app.fatherName || "N/A"],
        ["Father's Occupation", app.fatherOccupation || "N/A"],
        ["Mother's Name", app.motherName || "N/A"],
        ["Mother's Occupation", app.motherOccupation || "N/A"],
        ["Guardian Name", app.guardianName || "N/A"],
        ["Relationship", app.relationship || "N/A"]
      ]);

      if (yPos > 265) { doc.addPage(); yPos = 20; }

      // 3. Contact & Address
      addSection("Contact & Address Details", [
        ["Phone Number", app.contactNumber],
        ["Email Address", app.email],
        ["Current Address", app.address],
        ["Post Office", app.po || "N/A"],
        ["Police Station", app.ps || "N/A"],
        ["Pincode", app.pincode || "N/A"]
      ]);

      if (yPos > 265) { doc.addPage(); yPos = 20; }

      // 4. Academic Background
      addSection("Academic Background", [
        ["Previous School", app.previousSchool || "N/A"],
        ["Stream", app.stream || "N/A"],
        ["Elective", app.elective || "N/A"],
        ["MIL", app.mil || "N/A"],
        ["Selected Subjects", app.selectedSubjects?.join(", ") || "None"]
      ]);

      if (yPos > 265) { doc.addPage(); yPos = 20; }

      // 5. Identity
      addSection("Identity Details", [
        ["Aadhar Number", app.aadharNumber || "N/A"],
        ["PEN Number", app.penNumber || "N/A"]
      ]);

      // --- Document Attachments (New Pages) ---
      const attachments = [
        { label: "Birth Certificate", url: app.birthCertificate },
        { label: "Transfer Certificate", url: app.transferCertificate },
        { label: "Marksheet", url: app.marksheet },
        { label: "Student Photo (Original)", url: app.studentPhoto },
        { label: "Aadhar VID/Receipt", url: app.aadharVidOrReceipt },
        { label: "Caste Certificate", url: app.casteCertificate }
      ];

      for (const docItem of attachments) {
        if (!docItem.url) continue;

        // Skip PDFs for embedding (only handle images)
        if (docItem.url.toLowerCase().endsWith('.pdf')) {
          doc.setFontSize(11);
          doc.setTextColor(...primaryColor);
          doc.setFont("helvetica", "bold");
          doc.text(`ATTACHMENT: ${docItem.label.toUpperCase()} (LINK ONLY)`, 15, yPos);
          yPos += 7;
          doc.setFontSize(9);
          doc.setTextColor(0, 50, 150);
          doc.text(`• Click here to view: ${docItem.label}`, 20, yPos);
          doc.link(20, yPos - 3, 60, 5, { url: docItem.url });
          yPos += 10;
          continue;
        }

        // Load and embed image
        const img = await loadImage(docItem.url);
        if (img) {
          doc.addPage();
          const margin = 15;
          const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);
          const maxHeight = doc.internal.pageSize.getHeight() - (margin * 3); // 3x margin for header
          
          let imgWidth = img.width;
          let imgHeight = img.height;
          const ratio = imgWidth / imgHeight;

          // Scale to fit page
          if (imgWidth > maxWidth) {
            imgWidth = maxWidth;
            imgHeight = imgWidth / ratio;
          }
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * ratio;
          }

          // Add Header on attachment page
          doc.setFillColor(...primaryColor);
          doc.rect(0, 0, 210, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`DOCUMENT: ${docItem.label.toUpperCase()}`, 105, 13, { align: "center" });

          // Add the image centered
          const xPos = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
          doc.addImage(img, 'JPEG', xPos, 25, imgWidth, imgHeight);

          // Reset text color for status/timestamp
          doc.setTextColor(150);
        }
      }

      // Final Status & Timestamp (centered at bottom of last page)
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Document generated on: ${new Date().toLocaleString()} | Application Status: ${app.status.toUpperCase()}`, 105, 285, { align: "center" });

      doc.save(`Application_${app.studentName.replace(/\s+/g, '_')}_${app.referenceNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadJobPDF = async (app) => {
    setIsDownloadingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const primaryColor = [37, 99, 235]; // Blue 600

      const loadImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      // --- Header ---
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');
      
      const [logoImg, photoImg] = await Promise.all([
        schoolProfile.logo ? loadImage(schoolProfile.logo) : Promise.resolve(null),
        app.photo ? loadImage(app.photo) : Promise.resolve(null)
      ]);

      if (logoImg) doc.addImage(logoImg, 'PNG', 15, 8, 32, 32);
      if (photoImg) {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.rect(pageWidth - 45, 8, 32, 32, 'D');
        doc.addImage(photoImg, 'JPEG', pageWidth - 45, 8, 32, 32);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(schoolProfile.name?.toUpperCase() || "HOLY NAME HIGH SCHOOL", 105, 14, { align: "center" });
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("JOB APPLICATION DOSSIER", 105, 24, { align: "center" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`CANDIDATE: ${app.fullName.toUpperCase()} | REF: ${app.referenceNumber}`, 105, 30, { align: "center" });

      let yPos = 45;

      const addSection = (title, data) => {
        autoTable(doc, {
          startY: yPos,
          head: [[title, '']],
          body: data,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8.5, cellPadding: 1.5 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
          margin: { left: 15, right: 15 },
        });
        yPos = doc.lastAutoTable.finalY + 8;
      };

      addSection("Personal Information", [
        ["Full Name", app.fullName],
        ["Email Address", app.email],
        ["Phone Number", app.phone],
        ["Date of Birth / Age", `${app.dob} (${app.age} Years)`],
        ["Gender", app.gender],
        ["Caste / Religion", `${app.caste} / ${app.religion}`]
      ]);

      if (yPos > 250) { doc.addPage(); yPos = 20; }

      addSection("Qualifications & Occupational Status", [
        ["Highest Qualification", app.qualification],
        ["Experience Status", app.isExperienced ? "Experienced Professional" : "Fresher / Entry Level"],
        ["Total Experience", app.totalExperience || "N/A"],
        ["Last/Current School", app.schoolName || "N/A"],
        ["UDISE Code", app.udiseCode || "N/A"]
      ]);

      if (yPos > 250) { doc.addPage(); yPos = 20; }

      addSection("Identity & Contact Details", [
        ["Aadhar Number", app.aadhar || "N/A"],
        ["PAN Number", app.pan || "N/A"],
        ["Full Address", `${app.address}, ${app.postOffice}, ${app.policeStation}, ${app.pincode}`]
      ]);

      const attachments = [
        { label: "Candidate Photo", url: app.photo },
        { label: "Digital Signature", url: app.signature },
        { label: "Resume / CV", url: app.resume },
        { label: "Class 10 Marksheet", url: app.marksheet10 },
        { label: "Class 10 Certificate", url: app.cert10 },
        { label: "Class 12 Marksheet", url: app.marksheet12 },
        { label: "Class 12 Certificate", url: app.cert12 },
        { label: "UG Marksheet", url: app.marksheetUG },
        { label: "UG Certificate", url: app.certUG },
        { label: "PG Marksheet", url: app.marksheetPG },
        { label: "PG Certificate", url: app.certPG },
        { label: "B.Ed Marksheet", url: app.marksheetBEd },
        { label: "B.Ed Certificate", url: app.certBEd },
        { label: "D.Led Marksheet", url: app.marksheetDLed },
        { label: "D.Led Certificate", url: app.certDLed },
        { label: "Experience Certificate", url: app.expCertificate },
        { label: "Caste Certificate", url: app.casteCertificate }
      ];

      for (const docItem of attachments) {
        if (!docItem.url) continue;

        if (docItem.url.toLowerCase().endsWith('.pdf')) {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          doc.setFontSize(10);
          doc.setTextColor(...primaryColor);
          doc.setFont("helvetica", "bold");
          doc.text(`ATTACHMENT: ${docItem.label.toUpperCase()} (LINK)`, 15, yPos);
          yPos += 7;
          doc.setFontSize(8);
          doc.setTextColor(0, 50, 150);
          doc.text(`• Click to view: ${docItem.url}`, 20, yPos);
          doc.link(20, yPos - 3, 150, 5, { url: docItem.url });
          yPos += 12;
          continue;
        }

        const img = await loadImage(docItem.url);
        if (img) {
          doc.addPage();
          doc.setFillColor(...primaryColor);
          doc.rect(0, 0, 210, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`DOCUMENT: ${docItem.label.toUpperCase()}`, 105, 13, { align: "center" });

          const margin = 15;
          const maxWidth = 180;
          const maxHeight = 240;
          let w = img.width;
          let h = img.height;
          const r = w / h;
          if (w > maxWidth) { w = maxWidth; h = w / r; }
          if (h > maxHeight) { h = maxHeight; w = h * r; }
          doc.addImage(img, 'JPEG', (210 - w) / 2, 30, w, h);
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Candidate: ${app.fullName}`, 105, 288, { align: "center" });
      doc.save(`JobApp_${app.fullName.replace(/\s+/g, '_')}_${app.referenceNumber}.pdf`);
    } catch (err) {
      console.error("Job PDF generation error:", err);
      alert("Failed to generate PDF dossier.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const fetchAdmins = async () => {
    if (adminUser?.role !== 'superadmin') return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/auth/admins`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return handleLogout();
      if (res.ok) setAdmins(await res.json());
    } catch (e) { console.warn('Could not fetch admins'); }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/students`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return handleLogout();
      if (res.ok) setStudents(await res.json());
    } catch (e) { console.warn('Could not fetch students'); }
  };

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/inquiries`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return handleLogout();
      if (res.ok) setInquiries(await res.json());
    } catch (e) { console.warn('Could not fetch inquiries'); }
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs`);
      if (res.ok) setJobs(await res.json());
    } catch (e) { console.warn('Could not fetch jobs'); }
    setJobsLoading(false);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const method = editingJobId ? 'PUT' : 'POST';
    const url = editingJobId ? `${API_URL}/jobs/${editingJobId}` : `${API_URL}/jobs`;

    const payload = {
      ...currentJob,
      qualifications: typeof currentJob.qualifications === 'string' 
        ? currentJob.qualifications.split(',').map(q => q.trim()).filter(q => q) 
        : currentJob.qualifications
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingJobId ? 'Job updated successfully!' : 'Job posted successfully!');
        setIsAddingJob(false);
        setEditingJobId(null);
        setCurrentJob({ title: '', department: 'Science', type: 'Full-Time', experience: '', qualifications: '', deadline: 'Open until filled' });
        fetchJobs();
      } else {
        const data = await res.json();
        alert(data.message || 'Error processing job');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job opening?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j._id !== id));
        alert('Job deleted');
      } else {
        alert('Failed to delete job');
      }
    } catch (err) {
      alert('Error deleting job');
    }
  };

  const handleInquiryReadToggle = async (inquiryId, currentStatus) => {
    // Optimistic Update
    const prevInquiries = [...inquiries];
    setInquiries(inquiries.map(i => i._id === inquiryId ? { ...i, isRead: !currentStatus } : i));

    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(`${API_URL}/inquiries/${inquiryId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update with final state from server
      if (res.data.inquiry) {
        setInquiries(inquiries.map(i => i._id === inquiryId ? { ...i, isRead: res.data.inquiry.isRead } : i));
      }
    } catch (err) {
      console.error("Failed to toggle read status:", err.message);
      // Revert on failure
      setInquiries(prevInquiries);
      alert("Failed to update status. Please try again.");
    }
  };

  useEffect(() => {
    // Initial fetch and fetch on tab change
    if (activeTab === 'dashboard') {
      fetchApps();
      fetchStudents();
      fetchInquiries();
      fetchJobApplications();
    } else if (activeTab === 'applications') {
      fetchApps();
    } else if (activeTab === 'inquiries') {
      fetchInquiries();
    } else if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'admins') {
      fetchAdmins();
    } else if (activeTab === 'careerAds') {
      fetchJobs();
    } else if (activeTab === 'jobApplications') {
      fetchJobApplications();
    }

    if (adminUser?.role === 'superadmin') fetchAdmins();

    // Live changes: poll for new data every 60 seconds (reduced frequency to save resources)
    const interval = setInterval(() => {
      // Only poll summary data if on dashboard or relevant list
      if (activeTab === 'dashboard' || activeTab === 'applications') fetchApps();
      if (activeTab === 'dashboard' || activeTab === 'students') fetchStudents();
      if (activeTab === 'dashboard' || activeTab === 'inquiries') fetchInquiries();
      if (activeTab === 'dashboard' || activeTab === 'jobApplications') fetchJobApplications();
      if (adminUser?.role === 'superadmin') fetchAdmins();
    }, 60000);

    return () => clearInterval(interval);
  }, [API_URL, adminUser?.role, activeTab]);

  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', phone: '', role: 'admin' });
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
        setNewAdmin({ name: '', email: '', phone: '', role: 'admin' });
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
      const res = await fetch(`${API_URL}/admissions/${id}/status`, {
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
        // If accepted, refresh the student directory
        if (newStatus === 'accepted') {
          fetchStudents();
        }
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      console.warn('Could not update status', e);
      alert('Error updating status');
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this application? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(apps => apps.filter(app => app._id !== id));
        if (selectedApp?._id === id) setSelectedApp(null);
        alert('Application deleted successfully');
      } else {
        alert('Failed to delete application');
      }
    } catch (e) {
      alert('Error deleting application');
    }
  };

  const filteredApps = applications;

  const totalApps = appStats.total;
  const approvedApps = appStats.accepted;
  const pendingApps = appStats.pending;

  const dashboardStats = [
    { label: 'Total Applications', value: totalApps.toString(), icon: <FaClipboardList className="text-primary" />, bg: 'bg-primary/10' },
    { label: 'Approved', value: approvedApps.toString(), icon: <FaCheckCircle className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Pending Review', value: pendingApps.toString(), icon: <FaChartLine className="text-tertiary" />, bg: 'bg-tertiary/10' },
    { label: 'Total Students', value: students.length.toString(), icon: <FaUsers className="text-purple-500" />, bg: 'bg-purple-50' }
  ];

  const recentApps = [...filteredApps]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map(app => ({
      id: app.referenceNumber || app._id.slice(-6).toUpperCase(),
      name: app.studentName,
      grade: app.gradeApplied,
      date: new Date(app.createdAt).toLocaleDateString(),
      status: app.status === 'accepted' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Pending',
      originalApp: app
    }));

  // Helper for image upload/URL processing
  const handleImageUrlInput = async (e, setter, fieldName) => {
    const value = e.target.value;
    if (!value) return;
    
    // If it's a Google Drive link, convert it
    const finalUrl = value;
    setter(prev => ({ ...prev, [fieldName]: finalUrl }));
  };

  const handleImageUpload = async (e, setter, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // We still have the option for local file upload (base64) 
    // but the plan favors Google Drive URLs.
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(prev => ({ ...prev, [fieldName]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // --- Gallery Tab ---
  const [newGalleryItem, setNewGalleryItem] = useState({ title: '', category: 'Campus Life', src: '', description: '' });
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);

  const handleAddGallery = async () => {
    if (!newGalleryItem.title || (!galleryFiles.length && !newGalleryItem.src)) {
      alert("Please provide a title and at least one image.");
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsGalleryUploading(true);
    try {
      const filesToUpload = galleryFiles.slice(0, 10);
      const newItems = [];

      for (const file of filesToUpload) {
        const url = await uploadImage(file);
        newItems.push({
          ...newGalleryItem,
          id: Date.now() + Math.random(),
          src: url,
          _id: `temp-${Date.now()}-${Math.random()}`
        });
      }

      // Use atomic update to prevent race conditions with polling
      updateSiteContent({
        gallery: [...newItems, ...gallery]
      });

      alert(`Successfully added ${newItems.length} items to gallery.`);

      // Reset form
      setNewGalleryItem({ title: '', category: 'Campus Life', src: '', description: '' });
      setGalleryFiles([]);
    } catch (err) {
      alert("Failed to upload images: " + err.message);
    }
    setIsGalleryUploading(false);
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    
    const updatedGallery = gallery.filter(item => (item._id || item.id) !== id);
    const deletedItem = gallery.find(item => (item._id || item.id) === id);
    let updatedEvents = events;

    // Also remove from local events galleryImages if it was linked
    if (deletedItem && deletedItem.eventId) {
      updatedEvents = events.map(ev => 
        (String(ev._id) === String(deletedItem.eventId) || String(ev.id) === String(deletedItem.eventId))
          ? { ...ev, galleryImages: (ev.galleryImages || []).filter(img => img !== deletedItem.src) }
          : ev
      );
    }

    // Use atomic update to prevent race conditions
    updateSiteContent({
      gallery: updatedGallery,
      events: updatedEvents
    });
    
    alert("Gallery item deleted successfully.");
  };
  const renderGalleryTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Gallery</h3>
      <div className="flex flex-col gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={newGalleryItem.title} onChange={e => setNewGalleryItem({...newGalleryItem, title: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="e.g. Science Fair 2025" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={newGalleryItem.category} onChange={e => setNewGalleryItem({...newGalleryItem, category: e.target.value})} className="w-full p-2 border rounded-lg">
              <option>Campus Life</option><option>Academic Events</option><option>Sports</option><option>Cultural Programs</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photos</label>
            <input 
              type="file" 
              multiple 
              onChange={e => {
                const files = Array.from(e.target.files);
                setGalleryFiles(files);
              }}
              className="w-full p-2 border rounded-lg text-sm bg-white" 
              accept="image/*"
            />
            {galleryFiles.length > 0 && <p className="text-xs text-gray-500 mt-1">{galleryFiles.length} files selected</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={newGalleryItem.description} onChange={e => setNewGalleryItem({...newGalleryItem, description: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Short description..." />
          </div>
        </div>

        <div className="flex items-center justify-end mt-2">
          <button 
            onClick={handleAddGallery} 
            disabled={isGalleryUploading}
            className="bg-tertiary text-white px-8 py-2 rounded-lg font-bold hover:opacity-90 flex items-center shadow-lg disabled:opacity-50"
          >
            {isGalleryUploading ? 'Uploading...' : <><FaPlus className="mr-2"/> Add to Gallery</>}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gallery.filter(item => 
          !item.eventId || 
          item.eventId === null || 
          !events.find(e => String(e.id) === String(item.eventId) || String(e._id) === String(item.eventId))
        ).map(item => (
          <div key={item._id} className="relative group rounded-xl overflow-hidden border">
            <img src={item.src} alt={item.title} className="w-full h-32 object-cover" />
            <div className="p-2 bg-white text-sm">
                <p className="font-bold truncate">{item.title}</p>
                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-xs">{item.category}</p>
                  {item.eventId && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">Orphaned Event Photo</span>
                  )}
                </div>
            </div>
            <button onClick={() => handleDeleteGallery(item._id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Highlights Tab ---
  const [newHighlight, setNewHighlight] = useState({ title: '', date: '', category: 'Academic', image: '', description: '', galleryImages: [] });
  const [highlightFiles, setHighlightFiles] = useState([]);
  const [isHighlightUploading, setIsHighlightUploading] = useState(false);

  const handleAddHighlight = async () => {
    if (!newHighlight.title || (highlightFiles.length === 0 && !newHighlight.image)) return;
    
    setIsHighlightUploading(true);
    try {
      const filesToUpload = highlightFiles.slice(0, 10);
      const coverFile = filesToUpload.length > 0 ? filesToUpload[0] : null;
      const galleryFilesToUpload = filesToUpload.length > 1 ? filesToUpload.slice(1) : [];
      
      // Upload photos
      const response = await uploadEventPhotos(coverFile, galleryFilesToUpload, newHighlight.title);
      
      let coverUrl = newHighlight.image;
      const galleryPhotoUrls = [];
      
      if (response) {
        if (response.cover?.url) coverUrl = response.cover.url;
        if (response.gallery) {
          response.gallery.forEach(img => galleryPhotoUrls.push(img.url));
        }
        // Include cover in gallery list too for carousel
        if (coverUrl && filesToUpload.length > 0) {
          galleryPhotoUrls.unshift(coverUrl);
        }
      }
      
      const itemToAdd = { 
        ...newHighlight, 
        image: coverUrl,
        galleryImages: galleryPhotoUrls,
        _id: `temp-${Date.now()}` 
      };
      setHighlights([itemToAdd, ...highlights]);
      setNewHighlight({ title: '', date: '', category: 'Academic', image: '', description: '', galleryImages: [] });
      setHighlightFiles([]);
    } catch (err) {
      alert("Failed to upload highlight images: " + err.message);
    }
    setIsHighlightUploading(false);
  };
  const handleDeleteHighlight = (id) => {
    setHighlights(highlights.filter(item => item._id !== id));
  };
  const renderHighlightsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Highlights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input type="text" placeholder="Title" value={newHighlight.title} onChange={e => setNewHighlight({...newHighlight, title: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Date (e.g. March 15, 2026)" value={newHighlight.date} onChange={e => setNewHighlight({...newHighlight, date: e.target.value})} className="p-2 border rounded-lg" />
        <div className="p-2 border rounded-lg bg-white flex flex-col md:col-span-2">
          <label className="text-gray-400 text-sm mb-1">Highlight Images (Max 10, First is Cover):</label>
          <input 
            type="file" 
            multiple
            accept="image/*"
            onChange={e => {
              const files = Array.from(e.target.files);
              if (files.length > 10) {
                alert("Maximum 10 photos allowed. Only the first 10 will be selected.");
                setHighlightFiles(files.slice(0, 10));
              } else {
                setHighlightFiles(files);
              }
            }} 
            className="w-full text-sm p-1 border rounded cursor-pointer" 
          />
          {highlightFiles.length > 0 && (
            <p className="text-blue-600 text-xs mt-1 font-medium">{highlightFiles.length} file(s) selected. The first image will be used as the cover.</p>
          )}
          {isHighlightUploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
        </div>
        <select value={newHighlight.category} onChange={e => setNewHighlight({...newHighlight, category: e.target.value})} className="p-2 border rounded-lg">
          <option>Academic</option><option>Sports</option><option>Cultural</option>
        </select>
        <textarea placeholder="Description" value={newHighlight.description} onChange={e => setNewHighlight({...newHighlight, description: e.target.value})} className="p-2 border rounded-lg md:col-span-2" rows="2"></textarea>
        <button 
          onClick={handleAddHighlight} 
          disabled={isHighlightUploading}
          className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-2 disabled:bg-gray-400"
        >
          <FaPlus className="inline mr-2"/> {isHighlightUploading ? 'Adding...' : 'Add Highlight'}
        </button>
      </div>
      <div className="space-y-4">
        {highlights.map(item => (
          <div key={item._id} className="flex justify-between items-center p-4 border rounded-xl">
            <div className="flex gap-4 items-center">
              <img src={item.image} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="" />
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-gray-500">{item.date} • {item.category} • {(item.galleryImages?.length || 1)} photo(s)</p>
              </div>
            </div>
            <button onClick={() => handleDeleteHighlight(item._id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Events Tab ---
  const [newEvent, setNewEvent] = useState({ title: '', date: '', image: '', description: '', galleryImages: [] });
  const [eventGalleryFiles, setEventGalleryFiles] = useState([]);
  const [isEventUploading, setIsEventUploading] = useState(false);
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.description) {
      alert("Please fill in title, date, and description.");
      return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert("Error: You are not authenticated.");
      handleLogout();
      return;
    }

    setIsEventUploading(true);
    try {
      const filesToUpload = eventGalleryFiles.slice(0, 10);
      const coverFile = filesToUpload.length > 0 ? filesToUpload[0] : null;
      const galleryFilesToUpload = filesToUpload.length > 1 ? filesToUpload.slice(1) : [];
      
      // 1. Upload photos first
      const response = await uploadEventPhotos(coverFile, galleryFilesToUpload, newEvent.title);
      
      if (response) {
        const coverUrl = response.cover?.url || newEvent.image;
        const galleryPhotoUrls = response.gallery ? response.gallery.map(img => img.url) : [];
        if (coverUrl && filesToUpload.length > 0) {
          galleryPhotoUrls.unshift(coverUrl);
        }
        const eventIdForLinking = Date.now();
        
        // 2. Create the event object
        const createdEvent = {
          ...newEvent,
          id: eventIdForLinking,
          _id: `temp-ev-${Date.now()}`,
          image: coverUrl,
          galleryImages: galleryPhotoUrls
        };
        
        // 3. Create associated gallery items for unified management
        const newGalleryItems = galleryPhotoUrls.map(url => ({
          id: Date.now() + Math.random(),
          title: newEvent.title,
          category: "Events",
          src: url,
          eventId: eventIdForLinking,
          _id: `temp-g-${Date.now()}-${Math.random()}`
        }));

        // 4. Update events and gallery state ATOMICALLY to prevent race conditions
        updateSiteContent({
          events: [createdEvent, ...events],
          gallery: [...newGalleryItems, ...gallery]
        });

        alert(`Event "${createdEvent.title}" created successfully!`);
        
        // Reset form
        setNewEvent({ title: '', date: '', image: '', description: '', galleryImages: [] });
        setEventGalleryFiles([]);
      }
    } catch (err) {
      alert("Failed to create event: " + err.message);
    }
    setIsEventUploading(false);
  };
  
  const handleUpdateEventPhotos = async (eventId, files) => {
    if (!files || files.length === 0) return;
    
    setIsAddingPhotos(true);
    try {
      // Use the uploadEventPhotos helper to get URLs
      // The helper currently calls content/upload-event which only uploads files and returns URLs
      const response = await uploadEventPhotos(null, Array.from(files), "Event Update");
      
      if (response && response.gallery) {
        const newPhotoUrls = response.gallery.map(img => img.url);
        
        // Add individual items to the global gallery state for management
        const newGalleryItems = newPhotoUrls.map(url => ({
          id: Date.now() + Math.random(),
          title: "Event Photo",
          category: "Events",
          src: url,
          eventId: eventId,
          _id: `temp-g-${Date.now()}-${Math.random()}`
        }));

        // 1. Update the events and gallery state ATOMICALLY
        updateSiteContent({
          events: events.map(ev => 
            (ev._id || ev.id) === eventId 
              ? { ...ev, galleryImages: [...(ev.galleryImages || []), ...newPhotoUrls] }
              : ev
          ),
          gallery: [...newGalleryItems, ...gallery]
        });

        alert("Photos added to event and gallery successfully!");
      }
    } catch (err) {
      alert("Photo upload failed: " + err.message);
    }
    setIsAddingPhotos(false);
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event and all its photos?")) return;
    
    const eventToDelete = events.find(item => (item._id || item.id) === id);
    const eventIdNum = eventToDelete ? eventToDelete.id : null;

    // Logic: Filter out the event and its linked gallery items
    const updatedEvents = events.filter(item => (item._id || item.id) !== id);
    const updatedGallery = gallery.filter(item => {
      if (!item.eventId) return true;
      return String(item.eventId) !== String(id) && (eventIdNum ? String(item.eventId) !== String(eventIdNum) : true);
    });

    // Update ATOMICALLY
    updateSiteContent({
      events: updatedEvents,
      gallery: updatedGallery
    });
    
    alert("Event deleted successfully.");
  };

  const renderEventsTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage School Events</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Date (e.g. Sept 5, 2025)" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="p-2 border rounded-lg" />        <div className="p-2 border rounded-lg bg-white flex flex-col md:col-span-2">
          <label className="text-gray-400 text-sm mb-1">Event Images (Max 10, First is Cover):</label>
          <input 
            type="file" 
            multiple
            accept="image/*"
            onChange={e => {
              const files = Array.from(e.target.files);
              if (files.length > 10) {
                alert("Maximum 10 photos allowed per event. Only the first 10 will be selected.");
                setEventGalleryFiles(files.slice(0, 10));
              } else {
                setEventGalleryFiles(files);
              }
            }}
            className="w-full text-sm p-1 border rounded cursor-pointer" 
          />
          {eventGalleryFiles.length > 0 && (
            <p className="text-blue-600 text-xs mt-1 font-medium">{eventGalleryFiles.length} file(s) selected. The first image will be used as the cover.</p>
          )}
          {eventGalleryFiles.length > 10 && (
            <p className="text-red-500 text-xs mt-1">Warning: Only the first 10 photos will be uploaded.</p>
          )}
        </div>
        <textarea placeholder="Event Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="p-2 border rounded-lg md:col-span-2" rows="3"></textarea>
        <button 
          onClick={handleAddEvent} 
          disabled={isEventUploading}
          className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-2 disabled:bg-gray-400"
        >
          <FaPlus className="inline mr-2"/> {isEventUploading ? 'Adding...' : 'Add Event'}
        </button>
      </div>
      <div className="space-y-4">
        {events.map(item => (
          <div key={item._id} className="border rounded-xl">
            <div className="flex justify-between items-center p-4">
              <div className="flex gap-4 items-center">
                <img src={item.image} className="w-16 h-16 object-cover rounded-lg bg-gray-200" alt="" />
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setExpandedEventId(expandedEventId === item._id ? null : item._id)}
                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-100"
                >
                  <FaImage className="inline mr-1" /> {expandedEventId === item._id ? 'Hide Photos' : 'Manage Photos'}
                </button>
                <button onClick={() => handleDeleteEvent(item._id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
              </div>
            </div>
            
            {expandedEventId === item._id && (
              <div className="p-4 bg-gray-50 border-t rounded-b-xl">
                <h4 className="text-sm font-bold text-gray-700 mb-3 underline">Event Gallery Photos:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {gallery.filter(g => g.eventId === item._id).map(photo => (
                    <div key={photo._id} className="relative group aspect-square rounded-lg overflow-hidden border bg-white">
                      <img src={photo.src} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => handleDeleteGallery(photo._id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                  {gallery.filter(g => g.eventId === item._id).length === 0 && (
                    <p className="text-xs text-gray-400 col-span-full italic">No additional photos in gallery for this event.</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <p className="text-[10px] text-gray-400">Manage individual photos. Deleting here will also remove them from the event gallery.</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        multiple 
                        id={`event-upload-${item._id}`}
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleUpdateEventPhotos(item._id, e.target.files)}
                      />
                      <button 
                        onClick={() => document.getElementById(`event-upload-${item._id}`).click()}
                        disabled={isAddingPhotos}
                        className="text-xs bg-tertiary text-white px-3 py-1 rounded-lg font-bold hover:opacity-90 disabled:bg-gray-400"
                      >
                        {isAddingPhotos ? 'Uploading...' : '⊕ Add More Photos'}
                      </button>
                    </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // --- Videos Tab ---
  const [newVideo, setNewVideo] = useState({ title: '', src: '' });
  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.src) return;
    setVideos([{ ...newVideo, _id: `temp-${Date.now()}` }, ...videos]);
    setNewVideo({ title: '', src: '' });
  };
  const handleDeleteVideo = (id) => {
    setVideos(videos.filter(vid => vid._id !== id));
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
          <div key={vid._id || idx} className="border rounded-xl p-4 flex flex-col items-center">
            <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-400">Video Placeholder</span>
            </div>
            <p className="font-bold flex-1">{vid.title}</p>
            <p className="text-xs text-gray-400 truncate w-full text-center mt-1 mb-4">{vid.src}</p>
            <button onClick={() => handleDeleteVideo(vid._id)} className="text-red-500 text-sm hover:underline"><FaTrash className="inline mr-1" /> Remove</button>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Notices Tab ---
  const [newNotice, setNewNotice] = useState({ title: '', date: '', size: '', pdfLink: '' });
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.pdfLink) return;
    setNotices([{ ...newNotice, _id: `temp-${Date.now()}` }, ...notices]);
    setNewNotice({ title: '', date: '', size: '', pdfLink: '' });
  };
  const handleDeleteNotice = (id) => {
    setNotices(notices.filter(n => (n._id || n.id) !== id));
  };
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsPdfUploading(true);
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch(`${API_URL}/content/upload-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        let errorMessage = 'Server error';
        try {
          const errData = await res.json();
          // Include backend exception details if provided for better visibility
          errorMessage = errData.error 
            ? `${errData.message} - ${errData.error}` 
            : (errData.message || errorMessage);
        } catch (parseErr) {
          // Response wasn't JSON
          errorMessage = `HTTP Error ${res.status}`;
        }
        console.error('PDF upload failed:', errorMessage);
        alert(`Failed to upload PDF: ${errorMessage}`);
        return;
      }
      
      const data = await res.json();
      setNewNotice({
        ...newNotice,
        pdfLink: data.url, // raw GitHub URL
        size: `${(file.size / 1024).toFixed(0)} KB`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      alert('PDF uploaded successfully! Click Publish Notice to save.');
    } catch (err) {
      console.error('PDF upload failed:', err);
      alert(`Network error or upload failed: ${err.message}`);
    } finally {
      setIsPdfUploading(false);
    }
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
          <input type="file" accept=".pdf" onChange={handlePdfUpload} disabled={isPdfUploading} className="w-full p-[5px] border bg-white rounded-lg text-sm disabled:bg-gray-100" />
        </div>
        <button 
          onClick={handleAddNotice} 
          disabled={isPdfUploading || !newNotice.title || !newNotice.pdfLink}
          className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-2 h-[42px] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300"
        >
          {isPdfUploading ? (
            <><FaSpinner className="mr-2 animate-spin"/> Uploading...</>
          ) : (
            <><FaPlus className="mr-2"/> Publish Notice</>
          )}
        </button>
      </div>
      <div className="space-y-3">
        {notices.map(item => (
          <div key={item._id || item.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50:bg-[#0F172A]:bg-[#0F172A] transition-colors">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">PDF</div>
              <div>
                <p className="font-bold text-sm text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.date} • {item.size}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={item.pdfLink} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs font-bold">View</a>
              <button onClick={() => handleDeleteNotice(item._id || item.id)} className="text-red-400 hover:text-red-600 p-2"><FaTrash size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Faculty Tab ---
  const [newFaculty, setNewFaculty] = useState({ name: '', title: '', EduQua: '', Subject: '', photo: '', facebook: '', instagram: '', classes: '', department: 'Science' });
  const [facultyFile, setFacultyFile] = useState(null);
  const [isFacultyUploading, setIsFacultyUploading] = useState(false);

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.Subject) return;
    
    setIsFacultyUploading(true);
    try {
      let photoUrl = newFaculty.photo;
      if (facultyFile) { photoUrl = await uploadImage(facultyFile); }
      
      const dept = newFaculty.department;
      setFaculty({
        ...faculty,
        [dept]: [{ ...newFaculty, photo: photoUrl, _id: `temp-${Date.now()}` }, ...(faculty[dept] || [])]
      });
      setNewFaculty({ name: '', title: '', EduQua: '', Subject: '', photo: '', facebook: '', instagram: '', classes: '', department: dept });
      setFacultyFile(null);
    } catch (err) {
      alert("Faculty upload failed: " + err.message);
    }
    setIsFacultyUploading(false);
  };
  const handleDeleteFaculty = (dept, idToRemove, indexToRemove) => {
    setFaculty({
      ...faculty,
      [dept]: (faculty[dept] || []).filter((f, i) => (f._id || f.id) ? (f._id || f.id) !== idToRemove : i !== indexToRemove)
    });
  };
  const renderFacultyTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Faculty</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <input type="text" placeholder="Name" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Subject" value={newFaculty.Subject} onChange={e => setNewFaculty({...newFaculty, Subject: e.target.value})} className="p-2 border rounded-lg" />
        <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})} className="p-2 border rounded-lg">
          <option value="Science">Science</option>
          <option value="Arts">Arts</option>
          <option value="Commerce">Commerce</option>
          <option value="High School">High School</option>
          <option value="Nursery">Nursery</option>
        </select>
        <input type="text" placeholder="Qualifications (e.g. MSc, PhD)" value={newFaculty.EduQua} onChange={e => setNewFaculty({...newFaculty, EduQua: e.target.value})} className="p-2 border rounded-lg" />
        <input type="text" placeholder="Total Experience (e.g. 5+ yrs exp)" value={newFaculty.title} onChange={e => setNewFaculty({...newFaculty, title: e.target.value})} className="p-2 border rounded-lg" />
        <input type="url" placeholder="Facebook Profile Link" value={newFaculty.facebook || ''} onChange={e => setNewFaculty({...newFaculty, facebook: e.target.value})} className="p-2 border rounded-lg" />
        <input type="url" placeholder="Instagram Profile Link" value={newFaculty.instagram || ''} onChange={e => setNewFaculty({...newFaculty, instagram: e.target.value})} className="p-2 border rounded-lg" />
        <textarea placeholder="Classes Taught (e.g. IX, X, XI)" value={newFaculty.classes || ''} onChange={e => setNewFaculty({...newFaculty, classes: e.target.value})} className="p-2 border rounded-lg md:col-span-2" rows={2} />
        <div className="p-2 border rounded-lg bg-white flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Teacher Photo:</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e => setFacultyFile(e.target.files[0])} 
            className="w-full text-sm p-1 border rounded" 
          />
        </div>
        <button 
          onClick={handleAddFaculty} 
          disabled={isFacultyUploading}
          className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 md:col-span-3 disabled:bg-gray-400"
        >
          <FaPlus className="inline mr-2"/> {isFacultyUploading ? 'Adding...' : 'Add Faculty Member'}
        </button>
      </div>

      {Object.keys(faculty).filter(dept => dept !== 'Guest').map(dept => (
        <div key={dept} className="mb-8 border-t pt-4">
          <h4 className="font-bold text-lg mb-3 text-primary">{dept} Department</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty[dept].map((f, idx) => (
              <div key={f._id || f.id || idx} className="flex gap-4 p-3 border rounded-xl items-center bg-gray-50">
                <img src={f.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"} className="w-12 h-12 rounded-full object-cover bg-gray-200" alt="" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.Subject}</p>
                </div>
                <button onClick={() => handleDeleteFaculty(dept, f._id || f.id, idx)} className="text-red-500 hover:text-red-700 p-2"><FaTrash size={14}/></button>
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

  const [isPrincipalUploading, setIsPrincipalUploading] = useState(false);

  const startEditingPrincipal = () => {
    setEditPrincipal(principal);
    setIsEditingPrincipal(true);
  };

  const handlePrincipalChange = (field, value) => {
    setEditPrincipal({ ...editPrincipal, [field]: value });
  };
  
  const handlePrincipalImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsPrincipalUploading(true);
    try {
      const url = await uploadImage(file);
      setEditPrincipal(prev => ({ ...prev, [fieldName]: url }));
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setIsPrincipalUploading(false);
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
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.name : principal.name} onChange={e => handlePrincipalChange('name', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.title : principal.title} onChange={e => handlePrincipalChange('title', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Introductory Quote</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.introQuote : principal.introQuote} onChange={e => handlePrincipalChange('introQuote', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Message (Use Enter for new paragraphs)</label>
          <textarea disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.message : principal.message} onChange={e => handlePrincipalChange('message', e.target.value)} className="w-full p-2 border rounded-lg font-sans text-sm disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" rows="10"></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Quote (Optional)</label>
          <input type="text" disabled={!isEditingPrincipal} value={isEditingPrincipal ? editPrincipal.closingQuote : principal.closingQuote} onChange={e => handlePrincipalChange('closingQuote', e.target.value)} className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal Photo</label>
          <div className="flex flex-col gap-2 flex-1">
            <img src={isEditingPrincipal ? editPrincipal.photo : principal.photo} alt="Current" className="w-16 h-16 object-cover rounded-lg shadow-sm border border-gray-200" />
            {isEditingPrincipal && (
              <input 
                type="file" 
                accept="image/*"
                onChange={e => handlePrincipalImageUpload(e, 'photo')} 
                className="w-full p-2 border bg-white rounded-lg text-sm" 
              />
            )}
            {isPrincipalUploading && <span className="text-xs text-blue-500">Uploading...</span>}
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

  // --- Banner Tab ---
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [editBanner, setEditBanner] = useState({ isActive: false, image: null, link: '' });

  const [isBannerUploading, setIsBannerUploading] = useState(false);

  const startEditingBanner = () => {
    setEditBanner(banner || { isActive: false, image: null, link: '' });
    setIsEditingBanner(true);
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsBannerUploading(true);
    try {
      const url = await uploadImage(file);
      setEditBanner(prev => ({ ...prev, image: url }));
    } catch (err) {
      alert("Banner upload failed: " + err.message);
    }
    setIsBannerUploading(false);
  };

  const handleBannerChange = (field, value) => {
    setEditBanner(prev => ({ ...prev, [field]: value }));
  };

  const saveBanner = () => {
    setBanner(editBanner);
    setIsEditingBanner(false);
  };

  const cancelBanner = () => {
    setIsEditingBanner(false);
  };

  const renderBannerTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between flex-wrap items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Manage Popup Banner</h3>
        {!isEditingBanner ? (
          <button onClick={startEditingBanner} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-colors">Edit Banner</button>
        ) : (
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button onClick={cancelBanner} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={saveBanner} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">Save Changes</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 md:col-span-2">
          <input 
            type="checkbox" 
            id="bannerActive" 
            disabled={!isEditingBanner} 
            checked={isEditingBanner ? editBanner.isActive : (banner?.isActive || false)} 
            onChange={e => handleBannerChange('isActive', e.target.checked)} 
            className="w-5 h-5 text-tertiary" 
          />
          <label htmlFor="bannerActive" className="text-sm font-bold text-gray-700">Enable Popup Banner</label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image (Required)</label>
          <div className="flex flex-col gap-4">
            {(isEditingBanner ? editBanner.image : banner?.image) ? (
              <img src={isEditingBanner ? editBanner.image : banner?.image} alt="Banner" className="w-full max-w-sm rounded-lg shadow-sm border border-gray-200 object-contain bg-white" />
            ) : (
              <div className="w-full max-w-sm h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">No Image Uploaded</div>
            )}
            {isEditingBanner && (
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleBannerImageUpload} 
                  className="w-full max-w-sm p-2 border bg-white rounded-lg text-sm" 
                />
                {isBannerUploading && <span className="text-xs text-blue-500">Uploading...</span>}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Link URL (Optional)</label>
          <input 
            type="url" 
            placeholder="https://example.com/admission"
            disabled={!isEditingBanner} 
            value={isEditingBanner ? (editBanner.link || '') : (banner?.link || '')} 
            onChange={e => handleBannerChange('link', e.target.value)} 
            className="w-full max-w-sm p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" 
          />
          <p className="text-xs text-gray-500 mt-2">If provided, clicking the banner will open this link.</p>
        </div>
      </div>
    </div>
  );

  // --- Alumni Tab ---
  const [alumniForm, setAlumniForm] = useState({ _id: null, name: '', passedYear: '', rank: '', percentage: '', level: 'HSLC', stream: 'Arts', subjects: [], photo: '' });
  const [isEditingAlumni, setIsEditingAlumni] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');

  const resetAlumniForm = () => {
    setAlumniForm({ _id: null, name: '', passedYear: '', rank: '', percentage: '', level: 'HSLC', stream: 'Arts', subjects: [], photo: '' });
    setIsEditingAlumni(false);
    setSubjectInput('');
  };

  const [alumniFile, setAlumniFile] = useState(null);
  const [isAlumniUploading, setIsAlumniUploading] = useState(false);

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    if (!alumniForm.name || !alumniForm.passedYear || (!alumniFile && !alumniForm.photo)) {
      alert("Name, Passed Year, and Photo are required.");
      return;
    }
    
    setIsAlumniUploading(true);
    try {
      let photoUrl = alumniForm.photo;
      if (alumniFile) {
        photoUrl = await uploadImage(alumniFile);
      }

      let finalSubjects = [...alumniForm.subjects];
      if (subjectInput.trim()) {
        finalSubjects = subjectInput.split(',').map(s => s.trim()).filter(s => s);
      } else {
          finalSubjects = [];
      }

      if (isEditingAlumni) {
        setAlumni(alumni.map(a => (a._id || a.id) === (alumniForm._id || alumniForm.id) ? { ...alumniForm, photo: photoUrl, subjects: finalSubjects } : a));
      } else {
        setAlumni([...(alumni || []), { ...alumniForm, _id: `temp-${Date.now()}`, photo: photoUrl, subjects: finalSubjects }]);
      }
      resetAlumniForm();
      setAlumniFile(null);
    } catch (err) {
      alert("Alumni upload failed: " + err.message);
    }
    setIsAlumniUploading(false);
  };

  const handleEditAlumni = (alumnus) => {
    setAlumniForm(alumnus);
    setSubjectInput(alumnus.subjects?.join(', ') || '');
    setIsEditingAlumni(true);
  };

  const handleDeleteAlumni = async (id) => {
    if(window.confirm('Delete this alumni record?')) {
      try {
        const token = localStorage.getItem('adminToken');
        // Since alumni are synced via SiteContent PUT for now (legacy), 
        // we update local state and let the effect sync it, 
        // OR if it's a separate model, we call the API.
        // Based on previous edits, SiteDataContext handles syncing SiteContent.
        setAlumni(alumni.filter(a => (a._id || a.id) !== id));
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const renderAlumniTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-5xl">
      <h3 className="text-xl font-bold text-gray-800 mb-6">{isEditingAlumni ? 'Edit Alumni Record' : 'Add New Alumni'}</h3>
      <form onSubmit={handleAlumniSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input required type="text" value={alumniForm.name} onChange={e => setAlumniForm({...alumniForm, name: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passed Year *</label>
          <input required type="text" value={alumniForm.passedYear} onChange={e => setAlumniForm({...alumniForm, passedYear: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white" placeholder="e.g. 2023" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rank / Position</label>
          <input type="text" value={alumniForm.rank} onChange={e => setAlumniForm({...alumniForm, rank: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white" placeholder="e.g. 1st State Rank" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Percentage / CGPA</label>
          <input type="text" value={alumniForm.percentage} onChange={e => setAlumniForm({...alumniForm, percentage: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white" placeholder="e.g. 98.5%" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
          <select value={alumniForm.level} onChange={e => setAlumniForm({...alumniForm, level: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white">
            <option value="HSLC">HSLC (10th)</option>
            <option value="HS">HS (12th)</option>
          </select>
        </div>
        
        {alumniForm.level === 'HS' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <select value={alumniForm.stream} onChange={e => setAlumniForm({...alumniForm, stream: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white">
                <option value="Arts">Arts</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjects (Comma separated)</label>
              <input type="text" value={subjectInput} onChange={e => setSubjectInput(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-white" placeholder="Physics, Chemistry, Maths..." />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Alumni Photo *</label>
          <div className="flex flex-col gap-2">
            {alumniForm.photo && <img src={alumniForm.photo} alt="Preview" className="w-16 h-16 object-cover rounded shadow border" />}
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setAlumniFile(e.target.files[0])} 
              className="w-full p-2 border bg-white rounded-lg text-sm" 
            />
            {isAlumniUploading && <span className="text-xs text-blue-500">Uploading...</span>}
          </div>
        </div>

        <div className="md:col-span-2 flex gap-2 pt-4">
          <button 
            type="submit" 
            disabled={isAlumniUploading}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:bg-gray-400"
          >
            {isAlumniUploading ? 'Processing...' : (isEditingAlumni ? 'Update Record' : 'Add Alumni')}
          </button>
          {isEditingAlumni && <button type="button" onClick={resetAlumniForm} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>}
        </div>
      </form>

      <h3 className="text-xl font-bold text-gray-800 mb-4">Existing Alumni Records</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
              <th className="p-3">Photo</th>
              <th className="p-3">Name</th>
              <th className="p-3">Year / Level</th>
              <th className="p-3">Rank / %</th>
              <th className="p-3">Stream</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alumni?.map(a => (
              <tr key={a._id || a.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3"><img src={a.photo} alt={a.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200 bg-white" /></td>
                <td className="p-3 font-medium text-gray-800">{a.name}</td>
                <td className="p-3 text-sm text-gray-600 font-bold">{a.passedYear} <span className="font-normal text-xs text-gray-500">({a.level})</span></td>
                <td className="p-3 text-sm text-gray-600">{a.rank || '-'} <span className="text-gray-300">|</span> {a.percentage || '-'}</td>
                <td className="p-3 text-sm text-gray-600">{a.level === 'HS' ? a.stream : '-'}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleEditAlumni(a)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase mr-4 transition-colors">Edit</button>
                  <button onClick={() => handleDeleteAlumni(a._id || a.id)} className="text-red-500 hover:text-red-700 p-1 flex items-center justify-end font-bold text-xs uppercase transition-colors max-w-min ml-auto"><FaTrash /></button>
                </td>
              </tr>
            ))}
            {(!alumni || alumni.length === 0) && (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">No alumni records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Social Media Tab ---
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [editSocial, setEditSocial] = useState({ facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '', whatsapp: '', whatsappChannel: '' });

  const startEditingSocial = () => {
    setEditSocial(socialLinks || { facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '', whatsapp: '', whatsappChannel: '' });
    setIsEditingSocial(true);
  };

  const handleSocialChange = (field, value) => {
    setEditSocial(prev => ({ ...prev, [field]: value }));
  };

  const saveSocial = () => {
    setSocialLinks(editSocial);
    setIsEditingSocial(false);
  };

  const cancelSocial = () => {
    setIsEditingSocial(false);
  };

  const renderSocialMediaTab = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between flex-wrap items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Manage Social Media Links</h3>
        {!isEditingSocial ? (
          <button onClick={startEditingSocial} className="bg-tertiary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-colors">Edit Links</button>
        ) : (
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button onClick={cancelSocial} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>
            <button onClick={saveSocial} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">Save Changes</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
        {[
          { id: 'facebook', label: 'Facebook' },
          { id: 'instagram', label: 'Instagram' },
          { id: 'twitter', label: 'Twitter' },
          { id: 'youtube', label: 'YouTube' },
          { id: 'linkedin', label: 'LinkedIn' },
          { id: 'whatsapp', label: 'WhatsApp' },
          { id: 'whatsappChannel', label: 'WhatsApp Channel' }
        ].map(platform => (
          <div key={platform.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{platform.label} URL</label>
            <input 
              type="url" 
              placeholder={`https://${platform.id}.com/yourpage`}
              disabled={!isEditingSocial} 
              value={isEditingSocial ? (editSocial[platform.id] || '') : (socialLinks?.[platform.id] || '')} 
              onChange={e => handleSocialChange(platform.id, e.target.value)} 
              className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-500:text-gray-400:text-gray-400" 
            />
          </div>
        ))}
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
    setEditAdminData({ _id: admin._id, name: admin.name || '', email: admin.email, role: admin.role });
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
            <input 
              required
              type="text" 
              value={newAdmin.phone} 
              onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} 
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-primary/20" 
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">&nbsp;</label>
              <button 
                type="submit" 
                disabled={isAdminFormLoading}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 w-full"
              >
                {isAdminFormLoading ? '...' : 'Create'}
              </button>
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
            {admins.filter(a => a.isApproved).map(admin => (
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
                        {admin._id !== adminUser?._id && (
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
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {dashboardStats.map((stat, idx) => {
          const gradients = [
            'from-blue-500 to-blue-600',
            'from-emerald-500 to-emerald-600', 
            'from-amber-500 to-amber-600',
            'from-violet-500 to-violet-600'
          ];
          const shadowColors = [
            'shadow-blue-200',
            'shadow-emerald-200',
            'shadow-amber-200',
            'shadow-violet-200'
          ];
          return (
            <div 
              key={idx} 
              className="group relative bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
            >
              {/* Subtle gradient accent at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[idx]} opacity-80`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{stat.label}</p>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[idx]} flex items-center justify-center text-white text-lg shadow-lg ${shadowColors[idx]} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon && React.cloneElement(stat.icon, { className: 'text-white' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Recent Applications</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest student admission requests</p>
          </div>
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm" />
            <input 
              type="text" 
              placeholder="Search by name or ref..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">App ID</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentApps.map((app, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-600">{app.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {app.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{app.grade}</span></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{app.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${
                      app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      app.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                      'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedApp(app.originalApp)} className="text-blue-500 hover:text-blue-700 font-medium text-xs mr-3 hover:underline transition-colors">View</button>
                    {app.status === 'Pending' ? (
                      <>
                        <button onClick={() => handleStatusUpdate(app.originalApp._id, 'accepted')} className="text-emerald-500 hover:text-emerald-700 font-medium text-xs mr-3 transition-colors">Approve</button>
                        <button onClick={() => handleStatusUpdate(app.originalApp._id, 'rejected')} className="text-red-400 hover:text-red-600 font-medium text-xs transition-colors">Reject</button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleDeleteApplication(app.originalApp._id)} 
                        className="text-red-400 hover:text-red-600 font-medium text-xs transition-colors"
                        title="Delete Application"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {recentApps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    <FaClipboardList className="mx-auto text-2xl text-gray-200 mb-2" />
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // --- Stats Tab ---
  const [newStat, setNewStat] = useState({ label: '', value: '', totalCandidates: '', passedCandidates: '' });
  const [editingStatId, setEditingStatId] = useState(null);

  const renderStatsTab = () => {

    const handleAddStat = async (e) => {
      e.preventDefault();
      try {
        let finalValue = newStat.value;
        if (newStat.label.trim().toLowerCase() === 'pass result') {
          const total = parseInt(newStat.totalCandidates);
          const passed = parseInt(newStat.passedCandidates);
          if (total > 0 && passed >= 0) {
            finalValue = Math.round((passed / total) * 100) + '%';
          }
        }
        
        const currentStats = stats || [];
        const newStatItem = { 
          id: editingStatId || Date.now().toString(), 
          label: newStat.label, 
          value: finalValue 
        };
        
        let updatedStats;
        if (editingStatId) {
          updatedStats = currentStats.map(stat => (stat.id || stat._id) === editingStatId ? newStatItem : stat);
        } else {
          updatedStats = [...currentStats, newStatItem];
        }
        
        await updateSiteContent({ stats: updatedStats });
        setNewStat({ label: '', value: '', totalCandidates: '', passedCandidates: '' });
        setEditingStatId(null);
      } catch (error) {
        console.error("Error saving stat:", error);
      }
    };

    const handleDeleteStat = async (idToDelete) => {
      try {
        const updatedStats = (stats || []).filter(s => (s.id || s._id) !== idToDelete);
        await updateSiteContent({ stats: updatedStats });
      } catch (error) {
        console.error("Error deleting stat:", error);
      }
    };

    const isPassResult = newStat.label.trim().toLowerCase() === 'pass result';

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg"><FaChartLine /></div>
          Manage Home Stats
        </h3>
        
        <form onSubmit={handleAddStat} className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-tertiary/50 group-focus-within:bg-tertiary transition-colors" />
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">{editingStatId ? 'Edit Stat' : 'Add New Stat'}</h4>
            {editingStatId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingStatId(null);
                  setNewStat({ label: '', value: '', totalCandidates: '', passedCandidates: '' });
                }}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Stat Label (e.g., 'Awards Won', 'Pass Result')" 
              value={newStat.label}
              onChange={(e) => setNewStat({...newStat, label: e.target.value})}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none transition-shadow bg-white"
              required
            />
            {isPassResult ? (
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  placeholder="Total Candidates" 
                  value={newStat.totalCandidates}
                  onChange={(e) => setNewStat({...newStat, totalCandidates: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tertiary outline-none bg-white"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Passed" 
                  value={newStat.passedCandidates}
                  onChange={(e) => setNewStat({...newStat, passedCandidates: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tertiary outline-none bg-white"
                  required
                />
              </div>
            ) : (
              <input 
                type="text" 
                placeholder="Stat Value (e.g., '15+', '2.5k+')" 
                value={newStat.value}
                onChange={(e) => setNewStat({...newStat, value: e.target.value})}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tertiary outline-none bg-white"
                required
              />
            )}
            <button 
              type="submit"
              className="md:col-span-2 bg-gradient-to-r from-primary to-primary-fixed hover:-translate-y-0.5 transition-transform text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center shadow-md hover:shadow-lg:shadow-none:shadow-none"
            >
              <FaPlus className="mr-2" /> {editingStatId ? 'Update Stat' : (isPassResult ? 'Calculate & Add Stat' : 'Add Stat')}
            </button>
          </div>
          {isPassResult && (
            <p className="md:col-span-2 text-xs text-tertiary font-medium mt-3 bg-tertiary/10 p-2 rounded block">
              💡 The Pass Result percentage will be automatically calculated based on these numbers.
            </p>
          )}
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(stats || []).map((stat, index) => (
             <div key={stat.id || index} className="group bg-white border border-gray-100 p-6 rounded-2xl hover:shadow-xl:shadow-none:shadow-none transition-all hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="font-bold text-3xl text-gray-800 mb-1">{stat.value}</div>
               <div className="text-gray-500 font-medium uppercase tracking-wider text-xs">{stat.label}</div>
               <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                 <button 
                  onClick={() => {
                    setEditingStatId(stat.id || stat._id);
                    // Special handling to parse values if it's "Pass Result"
                    let totalCands = '';
                    let passedCands = '';
                    if (stat.label.trim().toLowerCase() === 'pass result') {
                       // We can't perfectly recover total/passed from a % string, 
                       // but we set what we can, leaving them empty so admin re-enters or just edits the string 
                       // Actually, we'll just populate the label and value. If they change it to non-Pass Result, value is used.
                    }
                    setNewStat({ 
                      label: stat.label, 
                      value: stat.value, 
                      totalCandidates: totalCands, 
                      passedCandidates: passedCands 
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                  title="Edit Stat"
                 >
                   <FaEdit size={14} />
                 </button>
                 <button 
                  onClick={() => handleDeleteStat(stat.id || stat._id)}
                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                  title="Delete Stat"
                 >
                   <FaTrash size={14} />
                 </button>
               </div>
             </div>
          ))}
          {(!stats || stats.length === 0) && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium flex flex-col items-center">
              <FaChartLine className="text-4xl mb-3 text-gray-300" />
              <p>No stats added yet.</p>
              <p className="text-sm mt-1">Add your first stat to display on the home page.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- School Profile Tab ---
  const [localProfile, setLocalProfile] = useState(schoolProfile);
  const localProfileInitRef = useRef(false);

  // Sync from context → local ONLY on initial load (not on every context change)
  useEffect(() => {
    if (!localProfileInitRef.current && !loading && schoolProfile) {
      setLocalProfile(schoolProfile);
      localProfileInitRef.current = true;
    }
  }, [schoolProfile, loading]);

  const renderSchoolProfileTab = () => {
    const handleProfileChange = (field, value) => {
      setLocalProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileSave = async () => {
      await updateSiteContent({ schoolProfile: localProfile });
      alert('School Profile updated successfully!');
    };

    const handleLogoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        setLocalProfile(prev => ({ ...prev, logo: url }));
      } catch (err) {
        alert("Upload failed: " + err.message);
      }
    };

    const handleHeroImageUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      try {
        const urls = await Promise.all(files.map(file => uploadImage(file)));
        setLocalProfile(prev => ({ ...prev, heroImages: [...(prev.heroImages || []), ...urls.filter(Boolean)] }));
      } catch (err) {
        alert("Upload failed: " + err.message);
      }
    };

    const removeHeroImage = (index) => {
      setLocalProfile(prev => {
        const newImages = [...(prev.heroImages || [])];
        newImages.splice(index, 1);
        return { ...prev, heroImages: newImages };
      });
    };

    const handlePageHeroUpload = async (pageId, e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        setLocalProfile(prev => ({
          ...prev,
          pageHeroImages: {
            ...(prev.pageHeroImages || {}),
            [pageId]: url
          }
        }));
      } catch (err) {
        alert("Upload failed: " + err.message);
      }
    };

    const removePageHeroImage = (pageId) => {
      setLocalProfile(prev => ({
        ...prev,
        pageHeroImages: {
          ...(prev.pageHeroImages || {}),
          [pageId]: ""
        }
      }));
    };

    const PAGES_REQUIRING_HERO = [
      { id: 'about', label: 'About Us' },
      { id: 'admission', label: 'Admissions' },
      { id: 'career', label: 'Career' },
      { id: 'complaints', label: 'Complaints' },
      { id: 'contact', label: 'Contact' },
      { id: 'courses', label: 'Courses' },
      { id: 'faculty', label: 'Faculty' },
      { id: 'gallery', label: 'Gallery' },
      { id: 'notice', label: 'Notice Board' },
      { id: 'principal', label: "Principal's Desk" },
      { id: 'studentPortal', label: 'Student Portal' }
    ];

    return (
      <div className="space-y-8 animate-fadeIn">
        <header className="mb-4">
          <h2 className="text-3xl font-headline font-bold text-gray-800">School Profile</h2>
          <p className="text-gray-500 mt-2">Manage the core school information, branding, and contact details.</p>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800">Basic Branding</h3>
            <button
              onClick={handleProfileSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Save All Changes
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                value={localProfile.name || ''}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g. Holy Name School"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Punch Line / Tagline</label>
              <input
                type="text"
                value={localProfile.punchLine || ''}
                onChange={(e) => handleProfileChange('punchLine', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g. Let Your Light Shine"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">School Logo</label>
              <div className="flex items-center gap-4">
                {localProfile.logo && (
                  <img src={localProfile.logo} alt="Logo" className="w-16 h-16 rounded-lg object-contain border border-gray-200 bg-gray-50" />
                )}
                <div className="relative overflow-hidden">
                  <button className="px-6 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 font-medium transition-colors flex items-center gap-2">
                    <FaImage /> Upload Logo
                  </button>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={localProfile.phone || ''}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g. 6901055733"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={localProfile.email || ''}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g. holynameschool@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Office Hours</label>
              <input
                type="text"
                value={localProfile.officeHours || ''}
                onChange={(e) => handleProfileChange('officeHours', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="e.g. 9am - 1:30pm (Mon - Sat)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Office Address</label>
              <textarea
                value={localProfile.officeAddress || ''}
                onChange={(e) => handleProfileChange('officeAddress', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary h-20"
                placeholder="e.g. XMH8+GGW, Nazira Ali Rd, Hatimuria, Assam 785697"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Google Maps Embed Link (Src URL)</label>
              <textarea
                value={localProfile.mapLink || ''}
                onChange={(e) => {
                  let val = e.target.value;
                  let extracted = false;
                  // If user pasted an entire iframe, extract the src attribute
                  const srcMatch = val.match(/src=["'](.*?)["']/);
                  if (srcMatch && srcMatch[1]) {
                    val = srcMatch[1];
                    extracted = true;
                  }
                  // Clean up accidental wrapper quotes or spaces
                  val = val.replace(/^["']|["']$/g, '').trim();
                  
                  if (extracted) {
                    setMapExtracted(true);
                    setTimeout(() => setMapExtracted(false), 5000);
                  }
                  
                  handleProfileChange('mapLink', val);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary h-24 font-mono text-sm"
                placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450"...></iframe>'
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500">Paste the URL or the entire `&lt;iframe&gt;` code. We will extract the exact link.</p>
                {mapExtracted && (
                  <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                    <FaCheckCircle size={10} /> Link Extracted Successfully!
                  </span>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">School Affiliations (Website Footer)</label>
              <div className="space-y-2">
                {(localProfile.affiliation || []).map((aff, index) => (
                  <div key={index} className="flex gap-2 group animate-fadeIn">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={aff}
                        onChange={(e) => {
                          const newAffs = [...(localProfile.affiliation || [])];
                          newAffs[index] = e.target.value;
                          handleProfileChange('affiliation', newAffs);
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary text-sm h-10"
                        placeholder="e.g. SEBA & ASHEC"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newAffs = localProfile.affiliation.filter((_, i) => i !== index);
                        handleProfileChange('affiliation', newAffs);
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove Affiliation"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newAffs = [...(localProfile.affiliation || []), ""];
                    handleProfileChange('affiliation', newAffs);
                  }}
                  className="mt-1 flex items-center gap-2 text-primary font-bold text-xs hover:text-primary/80 transition-colors bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 border-dashed"
                >
                  <FaPlus size={10} /> Add Affiliation Row
                </button>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8 mt-4">
              {/* Online Instructions */}
              <div>
                <label className="block text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <FaLaptop className="text-blue-500" /> Online Admission Instructions
                </label>
                <div className="space-y-2">
                  {(localProfile.onlineAdmissionInstructions || []).map((inst, index) => (
                    <div key={index} className="flex gap-2 group animate-fadeIn">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={inst}
                          onChange={(e) => {
                            const newInst = [...(localProfile.onlineAdmissionInstructions || [])];
                            newInst[index] = e.target.value;
                            handleProfileChange('onlineAdmissionInstructions', newInst);
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm h-10"
                          placeholder="e.g. Fill up the form"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newInst = localProfile.onlineAdmissionInstructions.filter((_, i) => i !== index);
                          handleProfileChange('onlineAdmissionInstructions', newInst);
                        }}
                        className="p-2 text-red-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newInst = [...(localProfile.onlineAdmissionInstructions || []), ""];
                      handleProfileChange('onlineAdmissionInstructions', newInst);
                    }}
                    className="mt-1 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider hover:text-blue-700 transition-colors bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 border-dashed"
                  >
                    <FaPlus size={8} /> Add Step
                  </button>
                </div>
              </div>

              {/* Offline Instructions */}
              <div>
                <label className="block text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                  <FaBuilding className="text-amber-500" /> Offline Admission Instructions
                </label>
                <div className="space-y-2">
                  {(localProfile.offlineAdmissionInstructions || []).map((inst, index) => (
                    <div key={index} className="flex gap-2 group animate-fadeIn">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={inst}
                          onChange={(e) => {
                            const newInst = [...(localProfile.offlineAdmissionInstructions || [])];
                            newInst[index] = e.target.value;
                            handleProfileChange('offlineAdmissionInstructions', newInst);
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm h-10"
                          placeholder="e.g. Visit the school office"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newInst = localProfile.offlineAdmissionInstructions.filter((_, i) => i !== index);
                          handleProfileChange('offlineAdmissionInstructions', newInst);
                        }}
                        className="p-2 text-red-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newInst = [...(localProfile.offlineAdmissionInstructions || []), ""];
                      handleProfileChange('offlineAdmissionInstructions', newInst);
                    }}
                    className="mt-1 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-wider hover:text-amber-700 transition-colors bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 border-dashed"
                  >
                    <FaPlus size={8} /> Add Step
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800">Hero Carousel Images</h3>
            <div className="relative overflow-hidden">
              <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors flex items-center gap-2">
                <FaPlus /> Add Images
              </button>
              <input 
                type="file" 
                accept="image/*"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleHeroImageUpload}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">These images will be displayed in the sliding hero section on the top of the Home page.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(localProfile.heroImages || []).map((imgUrl, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video">
                <img src={imgUrl} alt={`Hero ${idx}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => removeHeroImage(idx)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform scale-0 group-hover:scale-100 transition-transform"
                    title="Remove Image"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
            {(!localProfile.heroImages || localProfile.heroImages.length === 0) && (
              <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                <FaImage className="text-3xl mx-auto mb-2 text-gray-300" />
                <p>No hero images uploaded yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Page-Specific Hero Images Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b pb-4 mb-6">
            <h3 className="text-xl font-bold text-gray-800">Page-Specific Hero Backgrounds</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload specifically tailored top-banner background images completely individually for each of your inner pages.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {PAGES_REQUIRING_HERO.map(page => {
              const currentImageUrl = localProfile.pageHeroImages?.[page.id];

              return (
                <div key={page.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col">
                  <div className="p-3 bg-white border-b border-gray-100 flex justify-between items-center z-10">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{page.label}</h4>
                  </div>
                  
                  <div className="relative aspect-video bg-gray-100 flex-1 flex flex-col items-center justify-center group overflow-hidden">
                    {currentImageUrl ? (
                      <>
                        <img 
                          src={currentImageUrl} 
                          alt={`${page.label} Hero`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                          <button 
                            onClick={() => removePageHeroImage(page.id)}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg flex items-center gap-1"
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center h-full w-full">
                        <FaImage className="text-3xl text-gray-300 mb-2" />
                        <span className="text-xs text-gray-400 font-medium mb-3">No custom image</span>
                        <div className="relative">
                          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 border border-blue-200">
                            <FaPlus /> Upload
                          </button>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handlePageHeroUpload(page.id, e)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderAboutTab = () => {
    return (
      <div className="space-y-8 animate-fadeIn">
        <header className="mb-8">
          <h2 className="text-3xl font-headline font-bold text-gray-800">About Page Management</h2>
          <p className="text-gray-500 mt-2">Manage the content displayed on the public About page.</p>
        </header>

        {/* Vision Statement Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">Vision Statement</h3>
          <textarea
            value={visionStatement}
            onChange={(e) => setVisionStatement(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent min-h-[150px]"
            placeholder="Enter the school's vision statement..."
          />
        </section>

        {/* Aims & Objectives Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800">Aims & Objectives</h3>
            <button
              onClick={() => setAimsAndObjectives([...(aimsAndObjectives || []), { title: 'New Aim', description: 'Description here' }])}
              className="flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold"
            >
              <FaPlus className="mr-2" /> Add Aim
            </button>
          </div>
          <div className="space-y-4">
            {(aimsAndObjectives || []).map((aim, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 items-start">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={aim.title}
                    onChange={(e) => {
                      const newAims = [...aimsAndObjectives];
                      newAims[index].title = e.target.value;
                      setAimsAndObjectives(newAims);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary font-bold"
                    placeholder="Aim Title"
                  />
                  <textarea
                    value={aim.description}
                    onChange={(e) => {
                      const newAims = [...aimsAndObjectives];
                      newAims[index].description = e.target.value;
                      setAimsAndObjectives(newAims);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary min-h-[80px]"
                    placeholder="Aim Description"
                  />
                </div>
                <button
                  onClick={() => {
                    const newAims = aimsAndObjectives.filter((_, i) => i !== index);
                    setAimsAndObjectives(newAims);
                  }}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  title="Remove Aim"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            {(!aimsAndObjectives || aimsAndObjectives.length === 0) && (
              <p className="text-center text-gray-500 py-4 italic">No aims and objectives added yet.</p>
            )}
          </div>
        </section>

        {/* Head Mistress Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">Head Mistress Message</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Greeting</label>
                <input
                  type="text"
                  value={headMistress?.greeting || ''}
                  onChange={(e) => setHeadMistress({...headMistress, greeting: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Message from the Head Mistress"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Signature (Name)</label>
                <input
                  type="text"
                  value={headMistress?.signature || ''}
                  onChange={(e) => setHeadMistress({...headMistress, signature: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Sr. Name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Photo</label>
                <div className="flex items-center gap-4">
                  {headMistress?.photo && (
                    <img src={headMistress.photo} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  )}
                  <div className="relative overflow-hidden">
                    <button className="px-6 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 font-medium transition-colors flex items-center gap-2">
                      <FaImage /> Upload New Photo
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Upload Photo"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const uploadedUrl = await uploadImage(file);
                        if (uploadedUrl) {
                          setHeadMistress({...headMistress, photo: uploadedUrl});
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
              <textarea
                value={headMistress?.message || ''}
                onChange={(e) => setHeadMistress({...headMistress, message: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary min-h-[250px]"
                placeholder="Enter the message paragraphs here..."
              />
              <p className="text-xs text-gray-500 mt-2">Line breaks will be converted to paragraphs on the public page.</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderCareersTab = () => {
    return (
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary">Career Openings</h2>
            <p className="text-gray-500">Manage job postings listed on the Careers page.</p>
          </div>
          <button 
            onClick={() => {
              setIsAddingJob(true);
              setEditingJobId(null);
              setCurrentJob({ title: '', department: 'Science', type: 'Full-Time', experience: '', qualifications: '', deadline: 'Open until filled' });
            }}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md transform hover:-translate-y-1"
          >
            <FaPlus /> Post Job Opening
          </button>
        </header>

        {isAddingJob && (
          <form onSubmit={handleJobSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{editingJobId ? 'Edit Vacancy' : 'New Job Opening'}</h3>
              <button type="button" onClick={() => setIsAddingJob(false)} className="text-gray-400 hover:text-red-500"><FaTimes size={24} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
                <input 
                  type="text" 
                  value={currentJob.title}
                  onChange={(e) => setCurrentJob({...currentJob, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Senior Secondary Teacher (Physics)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                <select 
                  value={currentJob.department}
                  onChange={(e) => setCurrentJob({...currentJob, department: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                >
                  <option>Science</option>
                  <option>Arts & Humanities</option>
                  <option>Commerce</option>
                  <option>High School</option>
                  <option>Nursery</option>
                  <option>Physical Education</option>
                  <option>Administration</option>
                  <option>Support Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Job Type</label>
                <select 
                  value={currentJob.type}
                  onChange={(e) => setCurrentJob({...currentJob, type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                >
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Temporary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Experience</label>
                <input 
                  type="text" 
                  value={currentJob.experience}
                  onChange={(e) => setCurrentJob({...currentJob, experience: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 3+ Years"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Required Qualifications (Comma separated)</label>
                <input 
                  type="text" 
                  value={currentJob.qualifications}
                  onChange={(e) => setCurrentJob({...currentJob, qualifications: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                  placeholder="Master's in Physics, B.Ed. preferred..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Application Deadline</label>
                <input 
                  type="text" 
                  value={currentJob.deadline}
                  onChange={(e) => setCurrentJob({...currentJob, deadline: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Oct 30, 2026 or Open until filled"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAddingJob(false)}
                className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 shadow-md"
              >
                {editingJobId ? 'Save Changes' : 'Post Vacancy'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {jobsLoading ? (
             <div className="col-span-full flex justify-center py-20">
               <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
             </div>
          ) : jobs.length === 0 ? (
            <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
              <FaBriefcase className="text-5xl mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No job vacancies posted yet.</p>
              <p className="text-sm">Active openings will show up on the public careers page.</p>
            </div>
          ) : jobs.map(job => (
            <div key={job._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] uppercase font-black">{job.department}</span>
                  <span className="text-gray-400 text-xs">{job.type}</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800 truncate">{job.title}</h4>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <FaChalkboardTeacher className="mr-2 text-primary/50" /> {job.experience}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FaCalendarAlt className="mr-2 text-amber-500/50" /> Until: {job.deadline}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {job.qualifications.map((q, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-600">{q}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button 
                  onClick={() => {
                    setEditingJobId(job._id);
                    setIsAddingJob(true);
                    setCurrentJob({
                      title: job.title,
                      department: job.department,
                      type: job.type,
                      experience: job.experience,
                      qualifications: job.qualifications.join(', '),
                      deadline: job.deadline
                    });
                  }}
                  className="p-3 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors" 
                  title="Edit Opening"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => handleDeleteJob(job._id)}
                  className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors" 
                  title="Remove Posting"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex font-sans relative overflow-x-hidden" style={{ backgroundColor: '#F1F5F9' }}>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 lg:relative z-50 lg:z-auto
        w-72 lg:h-[100dvh] text-white flex flex-col shadow-2xl overflow-y-auto
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
        {/* Brand Area */}
        <div className="p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center border border-slate-600/30">
              <FaGraduationCap className="text-blue-300 text-lg" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 leading-tight tracking-wide">
                {schoolProfile?.name || "School"}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Admin Console</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 flex flex-col gap-0.5 px-3 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {/* Dashboard - Primary Action */}
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`group flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600/20 text-white font-semibold shadow-sm shadow-blue-500/10' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${activeTab === 'dashboard' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/40' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'}`}>
              <FaChartLine className="text-sm" />
            </div>
            <span className="text-sm">Dashboard</span>
            {activeTab === 'dashboard' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
          </button>
          
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-semibold mt-6 mb-2 px-4">Content Management</div>
          
          {[
            { id: 'schoolProfile', label: 'School Profile', icon: <FaInfoCircle /> },
            { id: 'gallery', label: 'Gallery', icon: <FaImage /> },
            { id: 'videos', label: 'Video Blog', icon: <FaVideo /> },
            { id: 'banner', label: 'Popup Banner', icon: <FaImage /> },
            { id: 'highlights', label: 'Highlights', icon: <FaStar /> },
            { id: 'events', label: 'Events', icon: <FaCalendarAlt /> },
            { id: 'notices', label: 'Notices', icon: <FaClipboardList /> },
            { id: 'faculty', label: 'Faculty', icon: <FaChalkboardTeacher /> },
            { id: 'principal', label: 'Principal Desk', icon: <FaClipboardList /> },
            { id: 'alumni', label: 'Alumni', icon: <FaGraduationCap /> },
            { id: 'careerAds', label: 'Career Ads', icon: <FaBriefcase /> },
            { id: 'socialMedia', label: 'Social Media', icon: <FaShareAlt /> },
            { id: 'stats', label: 'Home Stats', icon: <FaChartLine /> },
            { id: 'about', label: 'About Page', icon: <FaInfoCircle /> }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`group flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600/20 text-white font-semibold' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors text-sm ${activeTab === item.id ? 'bg-blue-500 text-white shadow-md shadow-blue-500/40' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'}`}>
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>
          ))}

          <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-semibold mt-6 mb-2 px-4">School Data</div>
          {[
            { id: 'applications', label: 'Applications', icon: <FaClipboardList /> },
            { id: 'students', label: 'Students', icon: <FaUsers /> },
            { id: 'inquiries', label: 'Inquiries', icon: <FaCommentDots />, badge: inquiries.filter(i => !i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST') && !i.isRead).length },
            { id: 'jobApplications', label: 'Recruitment', icon: <FaBriefcase /> }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`group flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600/20 text-white font-semibold' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors text-sm ${activeTab === item.id ? 'bg-blue-500 text-white shadow-md shadow-blue-500/40' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'}`}>
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm shadow-red-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
              {activeTab === item.id && !item.badge && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>
          ))}

          {adminUser?.role === 'superadmin' && (
            <>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-semibold mt-6 mb-2 px-4">System Control</div>
              {[
                { id: 'adminRequests', label: 'Admin Requests', icon: <FaIdCard />, badge: inquiries.filter(i => i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST') && !i.isRead).length },
                { id: 'admins', label: 'Manage Admins', icon: <FaUsers /> },
                { id: 'settings', label: 'Settings', icon: <FaCog /> }
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`group flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors text-sm ${activeTab === item.id ? 'bg-amber-500 text-white shadow-md shadow-amber-500/40' : 'bg-slate-700/50 text-amber-400/70 group-hover:bg-slate-700 group-hover:text-amber-300'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.label}</span>
                  {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pb-6 border-t border-slate-700/50 space-y-1.5 shrink-0">
          <NavLink to="/" className="flex items-center w-full px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-slate-500 hover:text-white text-sm gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-sm">
              <FaSignOutAlt />
            </div>
            Return to Website
          </NavLink>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-sm font-medium gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-sm group-hover:bg-red-500/30 transition-colors">
              <FaSignOutAlt />
            </div>
            Logout Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-xl px-4 md:px-8 py-3.5 flex justify-between items-center border-b border-gray-200/60 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
            >
              <FaBars size={18} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 capitalize tracking-tight">
                {activeTab === 'dashboard' ? `Welcome back, ${adminUser?.name?.split(' ')[0] || 'Admin'}` : activeTab.replace(/([A-Z])/g, ' $1').trim()}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {activeTab === 'dashboard' 
                  ? `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` 
                  : 'Manage your content and settings'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[10px] text-gray-400 font-medium">{adminUser?.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}</p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200">
                {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8" style={{ backgroundColor: '#F8FAFC' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'gallery' && renderGalleryTab()}
          {activeTab === 'videos' && renderVideosTab()}
          {activeTab === 'banner' && renderBannerTab()}
          {activeTab === 'highlights' && renderHighlightsTab()}
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'notices' && renderNoticesTab()}
          {activeTab === 'faculty' && renderFacultyTab()}
          { activeTab === 'principal' && renderPrincipalTab() }
          { activeTab === 'alumni' && renderAlumniTab() }
          { activeTab === 'socialMedia' && renderSocialMediaTab() }
          { activeTab === 'stats' && renderStatsTab() }
          {activeTab === 'schoolProfile' && renderSchoolProfileTab()}
          {activeTab === 'about' && renderAboutTab()}
          {activeTab === 'careerAds' && renderCareersTab()}
          {activeTab === 'admins' && adminUser?.role === 'superadmin' && renderAdminsTab()}
          {activeTab === 'settings' && adminUser?.role === 'superadmin' && renderSettingsTab()}
          {activeTab === 'applications' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Admission Applications</h3>
                <div className="relative w-full sm:w-64">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name or reference..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {filteredApps.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No applications found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-500">
                        <th className="pb-3 font-semibold">Ref No.</th>
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Grade</th>
                        <th className="pb-3 font-semibold">Contact</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map(app => (
                        <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50:bg-[#0F172A]:bg-[#0F172A]">
                          <td className="py-3 font-medium text-sm text-gray-900">{app.referenceNumber || app._id.slice(-6).toUpperCase()}</td>
                          <td className="py-3 font-medium">{app.studentName}</td>
                          <td className="py-3 text-gray-600">{app.gradeApplied}</td>
                          <td className="py-3 text-gray-600">{app.contactNumber}</td>
                          <td className="py-3 text-gray-500 text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              app.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                              app.status === 'entrance-exam' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              app.status === 'interview' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>{app.status?.replace('-', ' ')}</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setSelectedApp(app)} className="text-primary hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="View Details">
                                <FaSearch size={14} />
                              </button>
                              
                              {app.status !== 'accepted' && app.status !== 'rejected' && (
                                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                  <select 
                                    className="text-[10px] font-bold border-none bg-transparent focus:ring-0 cursor-pointer"
                                    value={app.nextStatus || app.status}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setApplications(prev => prev.map(a => a._id === app._id ? { ...a, nextStatus: val } : a));
                                    }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="entrance-exam">Exam</option>
                                    <option value="interview">Interview</option>
                                    <option value="accepted">Accept</option>
                                    <option value="rejected">Reject</option>
                                  </select>
                                  <button 
                                    onClick={() => handleStatusUpdate(app._id, app.nextStatus || app.status)}
                                    className="bg-primary text-white p-1.5 rounded-md hover:bg-blue-700 transition-all shadow-sm"
                                    title="Save Status Update"
                                  >
                                    <FaCheckCircle size={10} />
                                  </button>
                                </div>
                              )}

                              <button 
                                onClick={() => handleDeleteApplication(app._id)} 
                                className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete Application"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-800">Student Directory</h3>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="text-xs text-gray-500 font-bold uppercase bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    Total Admitted: {students.length}
                  </div>
                  <button 
                    onClick={handleExportStudents}
                    disabled={isExportingStudents || students.length === 0}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingStudents ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                    {isExportingStudents ? 'Exporting...' : 'Export to Excel'}
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FaUsers className="mx-auto text-gray-300 text-4xl mb-3" />
                  <p className="text-gray-500">No admitted students found in the database.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-400 font-black uppercase tracking-widest">
                        <th className="pb-3 px-2">Name</th>
                        <th className="pb-3">Class</th>
                        <th className="pb-3">Gender</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Admission Date</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.map(student => (
                        <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-2">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                                 {student.studentName?.charAt(0)}
                               </div>
                               <span className="font-bold text-gray-800">{student.studentName}</span>
                             </div>
                          </td>
                          <td className="py-4"><span className="text-xs font-black bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-tighter">{student.grade}</span></td>
                          <td className="py-4 text-sm text-gray-600 capitalize">{student.gender}</td>
                          <td className="py-4 font-mono text-gray-500 text-xs">{student.contactNumber}</td>
                          <td className="py-4 text-xs text-gray-400">{new Date(student.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-right">
                             <button 
                               onClick={async () => {
                                 if(window.confirm(`Remove ${student.studentName} from student directory?`)) {
                                   try {
                                      const token = localStorage.getItem('adminToken');
                                      const res = await axios.delete(`${API_URL}/students/${student._id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      if(res.data.message) {
                                        setStudents(students.filter(s => s._id !== student._id));
                                        alert("Student removed successfully.");
                                      }
                                   } catch(err) {
                                     alert("Failed to delete student: " + err.message);
                                   }
                                 }
                               }} 
                               className="text-red-400 hover:text-red-600 transition-colors inline-flex items-center"
                             >
                               <FaTrash size={12} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {appTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setAppPage(p => Math.max(1, p - 1))}
                    disabled={appPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-500">
                    Page <span className="text-gray-900">{appPage}</span> of <span className="text-gray-900">{appTotalPages}</span>
                  </span>
                  <button 
                    onClick={() => setAppPage(p => Math.min(appTotalPages, p + 1))}
                    disabled={appPage === appTotalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inquiries' && (() => {
            const filteredInqs = inquiries.filter(i => !i.subject?.toUpperCase().includes('ADMIN ACCESS REQUEST'));
            return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-800">Inquiries & Feedback</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input 
                      type="text" 
                      placeholder="Search Tracking No..." 
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                     <div className="text-xs text-amber-700 bg-amber-50 font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1">
                       <FaEnvelopeOpenText /> Unread: {filteredInqs.filter(i => !i.isRead).length}
                     </div>
                     <div className="text-xs text-gray-500 font-bold uppercase bg-gray-100 px-3 py-1 rounded-full">
                       Total: {filteredInqs.length}
                     </div>
                  </div>
                </div>
              </div>

              {filteredInqs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FaCommentDots className="mx-auto text-gray-300 text-4xl mb-3" />
                  <p className="text-gray-500">No inquiries found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-400 font-black uppercase tracking-widest">
                        <th className="pb-3 px-2">Type</th>
                        <th className="pb-3">Sender</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Subject / Message</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredInqs
                        .filter(i => {
                          if (!inquirySearch) return true;
                          const q = inquirySearch.toLowerCase();
                          return (
                            (i.trackingNumber && i.trackingNumber.toLowerCase().includes(q)) ||
                            (i.name && i.name.toLowerCase().includes(q)) ||
                            (i.subject && i.subject.toLowerCase().includes(q))
                          );
                        })
                        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(inquiry => (
                        <tr key={inquiry._id} className={`hover:bg-gray-50/50 transition-colors ${!inquiry.isRead ? 'bg-blue-50/30' : ''}`}>
                          <td className="py-4 px-2 align-top">
                             <span className={`text-xs font-black px-2 py-1 rounded uppercase tracking-tighter ${
                               inquiry.type === 'Complaint' ? 'bg-red-100 text-red-700' :
                               inquiry.type === 'Suggestion' ? 'bg-green-100 text-green-700' :
                               'bg-blue-100 text-blue-700'
                             }`}>
                               {inquiry.type}
                             </span>
                          </td>
                          <td className="py-4 font-medium text-gray-800 align-top">
                            <div className="flex items-center">
                              {inquiry.name}
                              {!inquiry.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-2 animate-pulse"></span>}
                            </div>
                            {inquiry.userType && (
                               <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
                                  <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-bold">{inquiry.userType}</span>
                                  {inquiry.userType === 'Student' && inquiry.className && (
                                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                      Class {inquiry.className} {inquiry.section ? `(${inquiry.section})` : ''}
                                    </span>
                                  )}
                               </div>
                            )}
                          </td>
                          <td className="py-4 text-xs font-mono text-gray-500 align-top">
                             <div>{inquiry.phone || '-'}</div>
                             <div className="text-gray-400 break-all">{inquiry.email || '-'}</div>
                          </td>
                          <td className="py-4 text-xs text-gray-400 align-top">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-sm text-gray-600 max-w-xs align-top">
                             <div className="truncate font-bold text-gray-800 mb-1">{inquiry.subject || 'No Subject'}</div>
                             <div className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">{inquiry.message}</div>
                          </td>
                          <td className="py-4 text-right align-top whitespace-nowrap">
                             <button 
                               onClick={() => handleInquiryReadToggle(inquiry._id, inquiry.isRead)} 
                               className={`${inquiry.isRead ? 'text-gray-400' : 'text-primary' } hover:underline font-medium text-xs mr-3 transition-colors`}
                             >
                               {inquiry.isRead ? 'Mark Unread' : 'Mark Read'}
                             </button>
                             <button 
                               onClick={async () => {
                                 if(window.confirm(`Delete inquiry from ${inquiry.name}?`)) {
                                   try {
                                      const token = localStorage.getItem('adminToken');
                                      await axios.delete(`${API_URL}/inquiries/${inquiry._id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      setInquiries(inquiries.filter(i => i._id !== inquiry._id));
                                   } catch(err) {
                                     alert("Failed to delete inquiry: " + err.message);
                                   }
                                 }
                               }} 
                               className="text-red-400 hover:text-red-600 transition-colors inline-flex items-center"
                             >
                               <FaTrash size={12} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            );
          })()}

          {activeTab === 'adminRequests' && adminUser?.role === 'superadmin' && (() => {
            const adminReqs = admins.filter(a => !a.isApproved);
            return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-800">Admin Access Requests</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input 
                      type="text" 
                      placeholder="Search Name/Email..." 
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                     <div className="text-xs text-gray-500 font-bold uppercase bg-gray-100 px-3 py-1 rounded-full">
                       Total: {adminReqs.length}
                     </div>
                  </div>
                </div>
              </div>

              {adminReqs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FaIdCard className="mx-auto text-gray-300 text-4xl mb-3" />
                  <p className="text-gray-500">No new admin account requests found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-400 font-black uppercase tracking-widest">
                        <th className="pb-3 px-2">Type</th>
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {adminReqs
                        .filter(i => {
                          if (!inquirySearch) return true;
                          const q = inquirySearch.toLowerCase();
                          return (
                            (i.name && i.name.toLowerCase().includes(q)) ||
                            (i.email && i.email.toLowerCase().includes(q))
                          );
                        })
                        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(req => (
                        <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-2 align-top">
                             <span className="text-xs font-black px-2 py-1 rounded uppercase tracking-tighter bg-amber-100 text-amber-700">
                               Pending Admin
                             </span>
                          </td>
                          <td className="py-4 font-medium text-gray-800 align-top">
                            {req.name}
                          </td>
                          <td className="py-4 text-xs font-mono text-gray-500 align-top">
                             <div>{req.phone || '-'}</div>
                             <div className="text-gray-400 break-all">{req.email || '-'}</div>
                          </td>
                          <td className="py-4 text-xs text-gray-400 align-top">{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-right align-top whitespace-nowrap">
                             <button 
                               onClick={async () => {
                                 if(window.confirm(`Approve admin request for ${req.name}?`)) {
                                   try {
                                      const token = localStorage.getItem('adminToken');
                                      await axios.post(`${API_URL}/auth/approve-admin`, { adminId: req._id }, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      fetchAdmins();
                                      alert("Admin approved successfully!");
                                   } catch(err) {
                                     alert("Failed to approve request: " + (err.response?.data?.message || err.message));
                                   }
                                 }
                               }} 
                               className="text-green-600 hover:text-green-800 font-bold text-xs mr-3 transition-colors uppercase tracking-wider"
                             >
                               Approve
                             </button>
                             <button 
                               onClick={async () => {
                                 if(window.confirm(`Are you sure you want to permanently delete the request for ${req.name}?`)) {
                                   try {
                                      const token = localStorage.getItem('adminToken');
                                      await axios.delete(`${API_URL}/auth/admins/${req._id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      fetchAdmins();
                                   } catch(err) {
                                     alert("Failed to delete request: " + (err.response?.data?.message || err.message));
                                   }
                                 }
                               }} 
                               className="text-red-400 hover:text-red-600 transition-colors inline-flex items-center text-xs font-bold uppercase tracking-wider"
                             >
                               <FaTrash size={12} className="mr-1" /> Delete
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            );
          })()}

          {activeTab === 'jobApplications' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-800">Job Applications</h3>
                <div className="flex gap-2 text-xs font-black uppercase text-gray-400">
                   Total Received: {jobApplications.length}
                </div>
              </div>

              {jobApplicationsLoading ? (
                <div className="text-center py-20">
                  <FaSpinner className="animate-spin text-primary text-4xl mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
                </div>
              ) : jobApplications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FaBriefcase className="mx-auto text-gray-300 text-4xl mb-3" />
                  <p className="text-gray-500">No applications received yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs text-gray-400 font-black uppercase tracking-widest">
                        <th className="pb-3 px-2">Ref No.</th>
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">Qualification</th>
                        <th className="pb-3">Experience</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {jobApplications.map(app => (
                        <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-2 font-mono text-xs font-bold text-blue-600">{app.referenceNumber}</td>
                          <td className="py-4 font-bold text-gray-800">{app.fullName}</td>
                          <td className="py-4 text-sm text-gray-600">{app.qualification}</td>
                          <td className="py-4 text-sm text-gray-600">{app.totalExperience}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${
                              app.status === 'shortlisted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              app.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{app.status}</span>
                          </td>
                          <td className="py-4 text-right">
                             <button onClick={() => setSelectedJobApp(app)} className="text-primary hover:underline font-bold text-sm mr-4">View Detail</button>
                             <button 
                               onClick={async () => {
                                 if(window.confirm(`Delete application from ${app.fullName}?`)) {
                                   try {
                                      const token = localStorage.getItem('adminToken');
                                      await axios.delete(`${API_URL}/job-applications/${app._id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      setJobApplications(jobApplications.filter(a => a._id !== app._id));
                                   } catch(err) {
                                     alert("Failed to delete: " + err.message);
                                   }
                                 }
                               }} 
                               className="text-red-400 hover:text-red-600 transition-colors"
                             >
                                <FaTrash size={12} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        {/* --- Application View Modal --- */}
        {/* --- Job Application View Modal --- */}
        {selectedJobApp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Job Candidate Details</h2>
                  <p className="text-sm text-gray-500">Ref: <span className="font-mono font-bold text-blue-600">{selectedJobApp.referenceNumber}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDownloadJobPDF(selectedJobApp)}
                    disabled={isDownloadingPDF}
                    className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download Application PDF"
                  >
                    {isDownloadingPDF ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </span>
                    ) : (
                      <>
                        <FaDownload />
                        <span className="hidden sm:inline">Download PDF</span>
                      </>
                    )}
                  </button>
                  <button onClick={() => setSelectedJobApp(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <FaPlus className="rotate-45 text-2xl" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row gap-8 mb-10 pb-8 border-b border-gray-100">
                  {selectedJobApp.photo && (
                    <img src={selectedJobApp.photo} alt="Candidate" className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedJobApp.fullName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <p><span className="text-gray-400 font-bold uppercase text-[10px] block">Email</span> <span className="font-medium">{selectedJobApp.email}</span></p>
                      <p><span className="text-gray-400 font-bold uppercase text-[10px] block">Phone</span> <span className="font-medium">{selectedJobApp.phone}</span></p>
                      <p><span className="text-gray-400 font-bold uppercase text-[10px] block">DOB / Age</span> <span className="font-medium">{selectedJobApp.dob} ({selectedJobApp.age} Years)</span></p>
                      <p><span className="text-gray-400 font-bold uppercase text-[10px] block">Gender</span> <span className="font-medium capitalize">{selectedJobApp.gender}</span></p>
                      <p><span className="text-gray-400 font-bold uppercase text-[10px] block">Caste / Religion</span> <span className="font-medium uppercase">{selectedJobApp.caste} / {selectedJobApp.religion}</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Column: Details */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Qualifications & Experience</h4>
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        <p><span className="text-xs text-gray-400 block font-bold">Highest Qualification</span> <span className="font-bold text-gray-800">{selectedJobApp.qualification}</span></p>
                        <p><span className="text-xs text-gray-400 block font-bold">Status</span> <span className="font-bold text-gray-800">{selectedJobApp.isExperienced ? 'Experienced Professional' : 'Fresher / Entry Level'}</span></p>
                        {selectedJobApp.isExperienced && (
                          <>
                            <p><span className="text-xs text-gray-400 block font-bold">Previous School</span> <span className="font-bold text-gray-800">{selectedJobApp.schoolName}</span></p>
                            <p><span className="text-xs text-gray-400 block font-bold">Exp Years</span> <span className="font-bold text-gray-800">{selectedJobApp.totalExperience}</span></p>
                            <p><span className="text-xs text-gray-400 block font-bold">UDISE Code</span> <span className="font-bold text-gray-800 font-mono">{selectedJobApp.udiseCode}</span></p>
                          </>
                        )}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Identity & Address</h4>
                      <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        <p><span className="text-xs text-gray-400 block font-bold">Aadhar Number</span> <span className="font-mono font-medium">{selectedJobApp.aadhar}</span></p>
                        <p><span className="text-xs text-gray-400 block font-bold">PAN Number</span> <span className="font-mono font-medium">{selectedJobApp.pan}</span></p>
                        <p><span className="text-xs text-gray-400 block font-bold">Full Address</span> <span className="text-sm leading-relaxed">{selectedJobApp.address}, {selectedJobApp.postOffice}, {selectedJobApp.policeStation}, {selectedJobApp.pincode}</span></p>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Files */}
                  <div>
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Submitted Documents</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'Resume / CV', key: 'resume', icon: <FaClipboardList className="text-blue-500" /> },
                        { label: 'Signature', key: 'signature', icon: <FaEdit className="text-gray-500" /> },
                        { label: 'Class 10 Marksheet', key: 'marksheet10', icon: <FaClipboardList /> },
                        { label: 'Class 10 Pass Cert', key: 'cert10', icon: <FaCheckCircle /> },
                        { label: 'Class 12 Marksheet', key: 'marksheet12', icon: <FaClipboardList /> },
                        { label: 'Class 12 Pass Cert', key: 'cert12', icon: <FaCheckCircle /> },
                        { label: 'UG Marksheet', key: 'marksheetUG', icon: <FaClipboardList /> },
                        { label: 'UG Pass Cert', key: 'certUG', icon: <FaCheckCircle /> },
                        { label: 'PG Marksheet', key: 'marksheetPG', icon: <FaClipboardList /> },
                        { label: 'PG Pass Cert', key: 'certPG', icon: <FaCheckCircle /> },
                        { label: 'B.Ed Marksheet', key: 'marksheetBEd', icon: <FaClipboardList /> },
                        { label: 'B.Ed Pass Cert', key: 'certBEd', icon: <FaCheckCircle /> },
                        { label: 'D.Led Marksheet', key: 'marksheetDLed', icon: <FaClipboardList /> },
                        { label: 'D.Led Pass Cert', key: 'certDLed', icon: <FaCheckCircle /> },
                        { label: 'Experience Cert', key: 'expCertificate', icon: <FaBriefcase /> },
                        { label: 'Caste Cert', key: 'casteCertificate', icon: <FaIdCard /> },
                      ].map(doc => (
                        selectedJobApp[doc.key] ? (
                          <a 
                            key={doc.key} 
                            href={selectedJobApp[doc.key]} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                              {doc.icon}
                            </div>
                            <span className="text-xs font-bold text-gray-700">{doc.label}</span>
                            <FaDownload className="ml-auto text-gray-300 group-hover:text-primary transition-colors" size={12} />
                          </a>
                        ) : null
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Update Status:</span>
                  <select 
                    value={selectedJobApp.status}
                    onChange={async (e) => {
                      try {
                         const newStatus = e.target.value;
                         const token = localStorage.getItem('adminToken');
                         await axios.patch(`${API_URL}/job-applications/${selectedJobApp._id}/status`, 
                           { status: newStatus },
                           { headers: { Authorization: `Bearer ${token}` }}
                         );
                         setSelectedJobApp({ ...selectedJobApp, status: newStatus });
                         setJobApplications(jobApplications.map(a => a._id === selectedJobApp._id ? { ...a, status: newStatus } : a));
                         alert("Status updated successfully.");
                      } catch(err) {
                        alert("Update failed: " + err.message);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      selectedJobApp.status === 'shortlisted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      selectedJobApp.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <button
                  onClick={() => setSelectedJobApp(null)}
                  className="bg-gray-800 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedApp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Student Application Details</h2>
                  <p className="text-sm text-gray-500">App ID: {selectedApp.referenceNumber || selectedApp._id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDownloadPDF(selectedApp)}
                    disabled={isDownloadingPDF}
                    className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download Application PDF"
                  >
                    {isDownloadingPDF ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </span>
                    ) : (
                      <>
                        <FaDownload />
                        <span className="hidden sm:inline">Download PDF</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleDeleteApplication(selectedApp._id)}
                    className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                    title="Delete Application"
                  >
                    <FaTrash size={16} />
                  </button>
                  <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                    <FaPlus className="rotate-45 text-2xl" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                {/* Student Photo */}
                {selectedApp.studentPhoto && (
                  <div className="flex justify-center mb-8">
                    <img src={selectedApp.studentPhoto} alt="Student" className="w-28 h-28 rounded-2xl object-cover border-4 border-primary/20 shadow-lg" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                  <div className="col-span-1 border-r border-gray-100 pr-4">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-widest">Personal Information</h4>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Name:</span> <span className="text-gray-900 font-medium block text-lg">{selectedApp.studentName}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Grade Applied:</span> <span className="font-medium uppercase text-sm bg-primary/10 text-primary px-2 py-1 rounded inline-block mt-1">{selectedApp.gradeApplied}</span></p>
                    {selectedApp.nccInterest && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">NCC Interest:</span> <span className="font-medium text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded inline-block mt-1">YES (11th Assam Bn)</span></p>}
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">DOB:</span> <span className="text-gray-900 block">{selectedApp.dateOfBirth}</span></p>
                    {selectedApp.placeOfBirth && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Place of Birth:</span> <span className="text-gray-900 block">{selectedApp.placeOfBirth}</span></p>}
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Gender:</span> <span className="text-gray-900 block">{selectedApp.gender}</span></p>
                    {selectedApp.bloodGroup && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Blood Group:</span> <span className="text-gray-900 block">{selectedApp.bloodGroup}</span></p>}
                    {selectedApp.religion && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Religion:</span> <span className="text-gray-900 block">{selectedApp.religion}</span></p>}
                    {selectedApp.caste && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Caste:</span> <span className="text-gray-900 block">{selectedApp.caste}</span></p>}
                  </div>
                  <div className="col-span-1 border-r border-gray-100 pr-4">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-widest">Parent/Guardian</h4>
                    {selectedApp.guardianName && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Guardian:</span> <span className="text-gray-900 block">{selectedApp.guardianName} {selectedApp.relationship ? `(${selectedApp.relationship})` : ''}</span></p>}
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Father:</span> <span className="text-gray-900 block">{selectedApp.fatherName || 'N/A'}</span></p>
                    {selectedApp.fatherOccupation && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Father's Occupation:</span> <span className="text-gray-900 block">{selectedApp.fatherOccupation}</span></p>}
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Mother:</span> <span className="text-gray-900 block">{selectedApp.motherName || 'N/A'}</span></p>
                    {selectedApp.motherOccupation && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Mother's Occupation:</span> <span className="text-gray-900 block">{selectedApp.motherOccupation}</span></p>}
                  </div>
                  <div className="col-span-1">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 tracking-widest">Contact Info</h4>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Phone:</span> <span className="text-gray-900 block font-bold text-lg">{selectedApp.contactNumber}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Email:</span> <span className="text-gray-900 block break-words">{selectedApp.email}</span></p>
                    <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Address:</span> <span className="text-gray-900 block text-xs leading-relaxed">{selectedApp.address}</span></p>
                    {selectedApp.po && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Post Office:</span> <span className="text-gray-900 block">{selectedApp.po}</span></p>}
                    {selectedApp.ps && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Police Station:</span> <span className="text-gray-900 block">{selectedApp.ps}</span></p>}
                    {selectedApp.pincode && <p className="mb-2"><span className="font-semibold text-gray-600 text-sm">Pincode:</span> <span className="text-gray-900 block">{selectedApp.pincode}</span></p>}
                  </div>
                </div>

                {/* Identity & ID Numbers */}
                {(selectedApp.aadharNumber || selectedApp.penNumber) && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-10">
                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-widest">Identity Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedApp.aadharNumber && <p><span className="font-semibold text-gray-600 text-sm">Aadhar Number:</span> <span className="text-gray-900 block font-mono">{selectedApp.aadharNumber}</span></p>}
                      {selectedApp.penNumber && <p><span className="font-semibold text-gray-600 text-sm">PEN (Permanent Education No.):</span> <span className="text-gray-900 block font-mono">{selectedApp.penNumber}</span></p>}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-10">
                  <h4 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-widest">Academic Background</h4>
                  <p className="mb-2"><span className="font-semibold text-gray-600">Previous School:</span> <span className="text-gray-900">{selectedApp.previousSchool || 'N/A'}</span></p>
                  {selectedApp.stream && <p className="mb-2"><span className="font-semibold text-gray-600">Stream:</span> <span className="text-gray-900">{selectedApp.stream}</span></p>}
                  {selectedApp.elective && <p className="mb-2"><span className="font-semibold text-gray-600">Elective:</span> <span className="text-gray-900">{selectedApp.elective}</span></p>}
                  {selectedApp.mil && <p className="mb-2"><span className="font-semibold text-gray-600">MIL (Modern Indian Language):</span> <span className="text-gray-900">{selectedApp.mil}</span></p>}
                  {selectedApp.selectedSubjects && selectedApp.selectedSubjects.length > 0 && (
                    <div className="mt-2">
                      <span className="font-semibold text-gray-600 text-sm">Selected Subjects:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedApp.selectedSubjects.map((subj, idx) => (
                          <span key={idx} className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-lg">{subj}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs uppercase font-bold text-gray-400 mb-4 tracking-widest">Documents Provided</h4>
                  <div className="flex flex-wrap gap-4">
                    {selectedApp.studentPhoto ? (
                      <a href={selectedApp.studentPhoto} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          <FaClipboardList />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Student Photo</p>
                          <p className="text-xs text-gray-500">Click to view file</p>
                        </div>
                      </a>
                    ) : null}

                    {selectedApp.birthCertificate ? (
                      <a href={selectedApp.birthCertificate} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                          <FaClipboardList />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Birth Certificate</p>
                          <p className="text-xs text-gray-500">Click to view file</p>
                        </div>
                      </a>
                    ) : null}

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
                    ) : null}
                    
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
                    ) : null}

                    {selectedApp.aadharVidOrReceipt ? (
                      <a href={selectedApp.aadharVidOrReceipt} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <FaClipboardList />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Aadhar VID / Receipt</p>
                          <p className="text-xs text-gray-500">Click to view file</p>
                        </div>
                      </a>
                    ) : null}

                    {!selectedApp.studentPhoto && !selectedApp.birthCertificate && !selectedApp.transferCertificate && !selectedApp.marksheet && !selectedApp.aadharVidOrReceipt && (
                      <p className="text-sm text-gray-400 italic">No documents provided</p>
                    )}
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
                    className="w-full p-3 border rounded-xl font-mono text-center tracking-widest text-lg bg-gray-50 focus:bg-white:bg-[#1E293B]:bg-[#1E293B] focus:ring-2 focus:ring-primary/20 transition-all"
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
                      className="w-full p-3 border rounded-xl font-mono text-center tracking-widest text-lg bg-gray-50 focus:bg-white:bg-[#1E293B]:bg-[#1E293B] focus:ring-2 focus:ring-primary/20 transition-all"
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
