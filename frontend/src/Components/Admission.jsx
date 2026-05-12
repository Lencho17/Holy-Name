import React, { useState, useEffect, useContext } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { QRCodeSVG } from 'qrcode.react';
import { FaLaptop, FaBuilding, FaClipboardList, FaGraduationCap, FaPhoneAlt, FaEnvelope, FaCheckCircle, FaSearch, FaExclamationCircle, FaIdBadge, FaCalendarAlt, FaUserGraduate, FaFileAlt, FaUserCheck, FaClipboardCheck, FaPrint, FaShieldAlt, FaBriefcase } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Admission() {
  const { schoolProfile, admissionFields, API_URL: ctxApiUrl } = useContext(SiteDataContext);
  const apiBase = ctxApiUrl || import.meta.env.VITE_API_URL || '/api';
  const steps = [
    { title: "Registration", desc: "Start by registering your ward's details online or at the school office." },
    { title: "Entrance Exam", desc: "A brief assessment to understand the student's current academic level." },
    { title: "Interview", desc: "A personal interaction with the student and parents." },
    { title: "Final Results", desc: "Selection is based on the assessment and interview performance." },
    { title: "Admission Confirmation", desc: "Submit the required documents and finalize your application." },
  ];

  const [submittedData, setSubmittedData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // --- Status Check State ---
  const [statusQuery, setStatusQuery] = useState("");
  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const STATUS_STEPS = [
    { key: "pending", label: "Submitted", icon: FaFileAlt },
    { key: "entrance-exam", label: "Entrance Exam", icon: FaClipboardCheck },
    { key: "interview", label: "Interview", icon: FaUserCheck },
    { key: "accepted", label: "Accepted", icon: FaCheckCircle },
  ];

  const handleStatusSearch = async (e) => {
    e.preventDefault();
    const trimmed = statusQuery.trim();
    if (!trimmed) return;
    setStatusLoading(true);
    setStatusError(null);
    setStatusData(null);
    try {
      const res = await axios.get(`${apiBase}/admissions/status?q=${encodeURIComponent(trimmed)}`);
      setStatusData(res.data);
    } catch (err) {
      setStatusError(
        err.response?.status === 404
          ? "No application found. Please double-check your Reference Number or Email."
          : err.response?.data?.message || "Something went wrong. Please try again later."
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'accepted': return { color: 'text-black', bg: 'bg-gray-100', border: 'border-gray-400', ring: 'ring-black', label: 'Accepted', icon: '✅', desc: 'Congratulations! Your application has been accepted. Please visit the school office with original documents.' };
      case 'rejected': return { color: 'text-black', bg: 'bg-gray-100', border: 'border-gray-400', ring: 'ring-black', label: 'Rejected', icon: '❌', desc: 'We regret to inform you that your application was not accepted. Please contact the admissions office.' };
      case 'entrance-exam': return { color: 'text-black', bg: 'bg-gray-100', border: 'border-gray-400', ring: 'ring-black', label: 'Entrance Exam', icon: '📝', desc: 'Your application has been reviewed. You have been scheduled for an entrance examination. Please check your email for details.' };
      case 'interview': return { color: 'text-black', bg: 'bg-gray-100', border: 'border-gray-400', ring: 'ring-black', label: 'Interview Scheduled', icon: '🎤', desc: 'You have cleared the entrance exam. An interview has been scheduled. Please check your email for the date and time.' };
      default: return { color: 'text-black', bg: 'bg-gray-100', border: 'border-gray-400', ring: 'ring-black', label: 'Pending', icon: '⏳', desc: 'Your application is being processed. Please check back later.' };
    }
  };

  const getActiveStep = (status) => {
    if (status === 'rejected') return -1;
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  // Form field states for conditional logic
  const [formKey, setFormKey] = useState(0);
  const [gradeApplied, setGradeApplied] = useState("");
  const [AadhaarNumber, setAadhaarNumber] = useState("");
  const [hasPreviousSchool, setHasPreviousSchool] = useState(false);
  const [previousSchool, setPreviousSchool] = useState("");
  const [prevMarksObtained, setPrevMarksObtained] = useState("");
  const [lastAttendedExam, setLastAttendedExam] = useState("");
  const [prevPercentage, setPrevPercentage] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [nccInterest, setNccInterest] = useState(false);
  const [sportsActive, setSportsActive] = useState(false);
  const [sportsType, setSportsType] = useState("");
  const [boardMarks, setBoardMarks] = useState("");
  const [boardDivision, setBoardDivision] = useState("");
  const [darpanId, setDarpanId] = useState("");
  const [penNumber, setPenNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [caste, setCaste] = useState("General");

  // Normalize grade display values (e.g. "PRE-NURSERY", "KG I (LKG)", "CLASS XI") to clean keys
  const normalizeGrade = (val) => {
    if (!val) return '';
    const v = val.trim().toUpperCase();
    if (v === 'PRE-NURSERY') return 'pre-nursery';
    if (v.startsWith('KG I') || v === 'LKG') return 'kg1';
    if (v.startsWith('KG II') || v === 'UKG') return 'kg2';
    // Match "CLASS I" through "CLASS XII" — extract the Roman/Arabic numeral
    const classMatch = v.match(/^CLASS\s+(.+)$/);
    if (classMatch) {
      const num = classMatch[1].trim();
      const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
      const n = romanMap[num] || parseInt(num);
      if (n) return `class${n}`;
    }
    return v.toLowerCase().replace(/\s+/g, '');
  };
  const gradeKey = normalizeGrade(gradeApplied);

  // Verhoeff checksum for Aadhaar validation
  const verhoeffD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  const verhoeffP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  const isValidAadhaar = (num) => {
    if (!num || num.length !== 12 || /^[01]/.test(num)) return false;
    const digits = num.split('').reverse().map(Number);
    let c = 0;
    for (let i = 0; i < digits.length; i++) c = verhoeffD[c][verhoeffP[i % 8][digits[i]]];
    return c === 0;
  };

  const [aadhaarStatus, setAadhaarStatus] = useState('none'); // none, incomplete, valid, invalid
  useEffect(() => {
    if (AadhaarNumber.length === 12) {
      setAadhaarStatus(isValidAadhaar(AadhaarNumber) ? 'valid' : 'invalid');
    } else if (AadhaarNumber.length > 0) {
      setAadhaarStatus('incomplete');
    } else {
      setAadhaarStatus('none');
    }
  }, [AadhaarNumber]);

  // Auto-calculate Board Division based on Percentage (Specific Criteria)
  useEffect(() => {
    if (boardMarks && gradeKey === 'class11') {
      const percentage = (parseFloat(boardMarks) / 600) * 100;
      if (percentage >= 95) setBoardDivision("RANK");
      else if (percentage >= 85) setBoardDivision("DISTINCTION");
      else if (percentage >= 75) setBoardDivision("STAR");
      else if (percentage >= 60) setBoardDivision("1ST DIVISION");
      else if (percentage >= 50) setBoardDivision("2ND DIVISION");
      else if (percentage >= 30) setBoardDivision("3RD DIVISION");
      else setBoardDivision("");
    }
  }, [boardMarks, gradeKey]);

  const penStatus = penNumber.length === 0 ? 'empty' : /^[A-Z0-9]{8,20}$/.test(penNumber) ? 'valid' : 'invalid';
  const darpanStatus = darpanId.length === 0 ? 'empty' : darpanId.length >= 4 ? 'valid' : 'invalid';
  const [errorField, setErrorField] = useState(null); // which field has a backend error
  const [filePreviews, setFilePreviews] = useState({}); // { fieldName: { name, size, type, url } }
  
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const admissionFee = 0;
  const paymentEnabled = false;

  useEffect(() => {
    // Check if returning from UPIGateway
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const ref = urlParams.get('ref');
    
    if (verified === 'true' && ref) {
      axios.get(`${apiBase}/admissions/status?q=${ref}`)
        .then(res => {
          setSubmittedData(res.data);
          setTimeout(() => {
            window.scrollTo({ top: document.getElementById('apply')?.offsetTop - 100, behavior: 'smooth' });
          }, 500);
        })
        .catch(err => console.error(err));
    }
  }, [apiBase]);

  // (Removed payment polling logic)


  const handleFilePreview = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) {
      setFilePreviews(prev => { const n = { ...prev }; delete n[fieldName]; return n; });
      return;
    }
    const info = { name: file.name, size: file.size, type: file.type };
    if (file.type.startsWith('image/')) {
      info.url = URL.createObjectURL(file);
    }
    setFilePreviews(prev => ({ ...prev, [fieldName]: info }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setContactNumber(value);
  };

  const [pincode, setPincode] = useState("");
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);
  };

  const handleSubjectChange = (subject) => {
    const maxSubjects = selectedStream === 'science' ? 2 : 4;
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      }
      if (prev.length < maxSubjects) {
        return [...prev, subject];
      }
      return prev;
    });
  };

  // Division calculator for Class XI board marks
  const getBoardDivision = (pct) => {
    const p = parseFloat(pct);
    if (p >= 95) return 'Rank';
    if (p >= 85) return 'Distinction';
    if (p >= 75) return 'Star';
    if (p >= 60) return '1st Division';
    if (p >= 50) return '2nd Division';
    if (p >= 30) return '3rd Division';
    return 'Below Pass';
  };

  const handleReview = (e) => {
    e.preventDefault();
    const form = e.target.closest('form');
    
    // Field-level validations
    if (contactNumber.length < 10) {
      setSubmitError('Please enter a valid 10-digit contact number.');
      return;
    }
    if (pincode.length < 6) {
      setSubmitError('Please enter a valid 6-digit pincode.');
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Process subjects validation
    if (gradeKey && (gradeKey === 'class11' || gradeKey === 'class12')) {
      const requiredCount = selectedStream === 'science' ? 2 : 4;
      if (selectedSubjects.length !== requiredCount) {
        setSubmitError(`Please select exactly ${requiredCount} elective subjects.`);
        return;
      }
    }

    // At least one parent/guardian check
    const fatherName = form.querySelector('[name="fatherName"]')?.value;
    const motherName = form.querySelector('[name="motherName"]')?.value;
    const guardianName = form.querySelector('[name="guardianName"]')?.value;
    if (!fatherName && !motherName && !guardianName) {
      setSubmitError('Please provide at least one Parent or Guardian name.');
      return;
    }

    const fd = new FormData(form);
    const data = {};
    fd.forEach((value, key) => {
      if (value instanceof File) {
        data[key] = value.name ? value.name : 'Not provided';
      } else {
        data[key] = value;
      }
    });

    // Merge state-based fields
    data.selectedSubjects = selectedSubjects;
    data.nccInterest = nccInterest;
    data.sportsActive = sportsActive;
    data.sportsType = sportsType;
    data.gradeApplied = gradeApplied;

    setPreviewData(data);
    setShowPreview(true);
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pt-1">{label}</span>
      <span className="text-gray-900 font-black text-right uppercase">{value || 'N/A'}</span>
    </div>
  );

  const DocBadge = ({ label, filename }) => (
    <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
      <FaCheckCircle className="text-black text-xs" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">{label}</span>
        <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{filename}</span>
      </div>
    </div>
  );

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf' || file.size < 500 * 1024) {
        resolve(file); // Don't compress PDFs or small images
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setErrorField(null);

    const form = e.target;
    const formData = new FormData();

    // Helper to get uppercase value
    const getUVal = (name) => (form.querySelector(`[name="${name}"]`)?.value || '').trim().toUpperCase();

    formData.append('studentName', getUVal('studentName'));
    formData.append('dateOfBirth', form.querySelector('[name="dateOfBirth"]')?.value || '');
    formData.append('placeOfBirth', getUVal('placeOfBirth'));
    formData.append('gender', getUVal('gender'));
    formData.append('religion', getUVal('religion'));
    formData.append('caste', getUVal('caste'));
    formData.append('bloodGroup', getUVal('bloodGroup'));
    formData.append('AadhaarNumber', AadhaarNumber);
    formData.append('pincode', pincode);
    formData.append('penNumber', getUVal('penNumber'));
    if (!["class10", "class12"].includes(gradeKey)) {
      formData.append('previousSchool', previousSchool);
      if (hasPreviousSchool) {
        formData.append('prevMarksObtained', prevMarksObtained);
        formData.append('lastAttendedExam', lastAttendedExam);
        formData.append('prevPercentage', prevPercentage);
      }
    }
    formData.append('gradeApplied', gradeApplied);
    formData.append('stream', getUVal('stream'));
    formData.append('nccInterest', nccInterest);
    formData.append('sportsActive', sportsActive);
    if (sportsActive && sportsType) formData.append('sportsType', sportsType.toUpperCase());
    if (gradeKey === 'class11' && boardMarks) {
      formData.append('boardMarks', boardMarks);
      const pct = ((parseFloat(boardMarks) / 600) * 100).toFixed(2);
      formData.append('boardPercentage', pct);
      formData.append('boardDivision', boardDivision);
      formData.append('darpanId', darpanId);
    }

    formData.append('fatherName', getUVal('fatherName'));
    formData.append('fatherOccupation', getUVal('fatherOccupation'));
    formData.append('motherName', getUVal('motherName'));
    formData.append('motherOccupation', getUVal('motherOccupation'));
    formData.append('guardianName', getUVal('guardianName'));
    formData.append('relationship', getUVal('relationship'));
    formData.append('contactNumber', contactNumber);
    formData.append('email', (form.querySelector('[name="email"]')?.value || '').trim().toLowerCase());
    formData.append('address', getUVal('address'));
    formData.append('po', getUVal('po'));
    formData.append('ps', getUVal('ps'));
    formData.append('elective', getUVal('elective'));
    formData.append('mil', getUVal('mil'));

    // Class 11-12 specialized subjects
    if (gradeKey && (gradeKey === 'class11' || gradeKey === 'class12')) {
      const requiredCount = selectedStream === 'science' ? 2 : 4;
      if (selectedSubjects.length !== requiredCount) {
        setSubmitError(`Please select exactly ${requiredCount} elective subjects.`);
        setSubmitting(false);
        return;
      }
      // For Science, auto-append compulsory Physics & Chemistry
      if (selectedStream === 'science') {
        formData.append('selectedSubjects[]', 'PHYSICS');
        formData.append('selectedSubjects[]', 'CHEMISTRY');
      }
      selectedSubjects.forEach(subject => formData.append('selectedSubjects[]', subject.toUpperCase()));
    }

    // Validate Aadhaar if provided
    if (AadhaarNumber && AadhaarNumber.length > 0 && !isValidAadhaar(AadhaarNumber)) {
      setSubmitError('The Aadhaar number entered is invalid. Please verify the 12-digit number.');
      setErrorField('AadhaarNumber');
      setSubmitting(false);
      setShowPreview(false);
      return;
    }

    // At least one parent/guardian check
    if (!formData.get('fatherName') && !formData.get('motherName') && !formData.get('guardianName')) {
      setSubmitError('Please provide at least one Parent or Guardian name.');
      setSubmitting(false);
      setShowPreview(false);
      return;
    }

    // Relationship is required if Guardian is provided
    if (formData.get('guardianName') && !formData.get('relationship')) {
      setSubmitError('Please specify your relationship to the student.');
      setSubmitting(false);
      setShowPreview(false);
      return;
    }

    // File uploads with compression
    const tcFile = form.querySelector('[name="transferCertificate"]')?.files[0];
    const msFile = form.querySelector('[name="marksheet"]')?.files[0];
    const AadhaarFile = form.querySelector('[name="AadhaarVidOrReceipt"]')?.files[0];
    const photoFile = form.querySelector('[name="studentPhoto"]')?.files[0];
    const birthFile = form.querySelector('[name="birthCertificate"]')?.files[0];
    const casteFile = form.querySelector('[name="casteCertificate"]')?.files[0];
    const admitCardFile = form.querySelector('[name="admitCard"]')?.files[0];
    const regCardFile = form.querySelector('[name="registrationCard"]')?.files[0];

    if (tcFile) formData.append('transferCertificate', await compressImage(tcFile));
    if (msFile) formData.append('marksheet', await compressImage(msFile));
    if (AadhaarFile) formData.append('AadhaarVidOrReceipt', await compressImage(AadhaarFile));
    if (photoFile) formData.append('studentPhoto', await compressImage(photoFile));
    if (birthFile) formData.append('birthCertificate', await compressImage(birthFile));
    if (casteFile) formData.append('casteCertificate', await compressImage(casteFile));
    if (admitCardFile) formData.append('admitCard', await compressImage(admitCardFile));
    if (regCardFile) formData.append('registrationCard', await compressImage(regCardFile));
    // (Removed payment file and transaction ID logic)

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await axios.post(`${apiBase}/admissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const fullDataForPayment = {};
      for (let [key, value] of formData.entries()) {
        fullDataForPayment[key] = value;
      }
      
      // (Removed payment initiation logic)

      const fullData = {};
      for (let [key, value] of formData.entries()) {
        fullData[key] = value;
      }
      fullData.referenceNumber = res.data.referenceNumber;
      fullData.selectedSubjects = [...selectedSubjects];
      fullData.dateOfApplication = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      setSubmittedData(fullData);
      window.scrollTo({ top: document.getElementById('apply').offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Submission failed. Please try again.';
      setSubmitError(msg);
      setShowPreview(false);
      
      // Detect file upload errors and mark the documents section
      const isUploadError = msg.toLowerCase().includes('upload') || msg.toLowerCase().includes('file') || msg.toLowerCase().includes('resource');
      setErrorField(isUploadError ? 'documents' : (data?.field || (data?.fields?.[0]) || null));
      
      // Scroll to the relevant section
      setTimeout(() => {
        if (isUploadError) {
          const docErr = document.getElementById('documents-error');
          if (docErr) { docErr.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        }
        const errEl = document.getElementById('form-error-banner');
        if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (appData = null) => {
    // If appData is an event object (e.g. from onClick={handleDownloadReceipt}), ignore it
    const isEvent = appData && (appData.nativeEvent || appData.target);
    const rawData = (!isEvent && appData) ? appData : submittedData;
    
    if (!rawData) {
      console.error("No data available for PDF generation");
      return;
    }
    
    const app = rawData?.data || rawData || {};
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [15, 23, 42]; // Dark slate
    const secondaryColor = [100, 116, 139]; // Gray

    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    // Calculate age
    let age = '';
    if (app.dateOfBirth) {
      const birthDate = new Date(app.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // --- 1. Clean Letterhead Header ---
    const logoImg = schoolProfile?.logo ? await loadImage(schoolProfile.logo) : null;
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, 8, 25, 25);
    }

    // Header Text (Centered)
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(schoolProfile?.name?.toUpperCase() || "", 105, 16, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(schoolProfile?.officeAddress || "", 105, 22, { align: "center" });
    
    const contactLine = [schoolProfile?.email, schoolProfile?.phone].filter(Boolean).join(" | ");
    if (contactLine) {
        doc.text(contactLine, 105, 27, { align: "center" });
    }
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Official Receipt Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 105, 32, { align: "center" });

    // Subtle Separator
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(15, 36, 195, 36);

    // --- 1.5 Authentic Watermark ---
    doc.saveGraphicsState();
    doc.setTextColor(245, 245, 245); // Super subtle
    doc.setFontSize(38);
    doc.setFont("helvetica", "bold");
    doc.text("VidyaBarta School Management Software", 20, 280, { angle: 50 });
    doc.restoreGraphicsState();

    // --- 2. Title & Status ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ADMISSION APPLICATION SUCCESSFUL", 105, 44, { align: "center" });
    
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.5);
    doc.line(60, 47, 150, 47);

    // --- 3. Reference & Candidate Photo ---
    // Ref Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, 52, 140, 22, 2, 2, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 52, 140, 22, 2, 2, 'D');
    
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(`REFERENCE NO: ${app.referenceNumber || 'N/A'}`, 20, 60);
    
    doc.setFontSize(9);
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "normal");
    doc.text(`Applicant: ${app.studentName || app.fullName || 'N/A'}  |  Contact: ${app.contactNumber || app.phone || 'N/A'}`, 20, 67);

    // Student Photo (Right side)
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(165, 52, 28, 28, 2, 2, 'D');
    
    let studentPhotoUrl = app.studentPhoto || (filePreviews?.studentPhoto?.url);
    if (app.studentPhoto instanceof File) studentPhotoUrl = URL.createObjectURL(app.studentPhoto);
    
    const studentImg = studentPhotoUrl ? await loadImage(studentPhotoUrl) : null;
    if (studentImg) {
      doc.addImage(studentImg, 'JPEG', 166, 53, 26, 26);
    } else {
      doc.setFontSize(7);
      doc.setTextColor(180);
      doc.text("CANDIDATE", 179, 64, { align: "center" });
      doc.text("PHOTO", 179, 68, { align: "center" });
    }

    // --- 5. Data Fields Grid ---
    let currY = 88;
    let yInc = 7;
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("APPLICATION DETAILS", 15, currY - 4);

    // Dynamic Fields Logic
    const getFieldVal = (fieldName) => {
      if (!fieldName) return 'N/A';
      const val = app[fieldName];
      if (val === undefined || val === null || val === '') return 'N/A';
      if (Array.isArray(val)) return val.join(", ").toUpperCase();
      if (typeof val === 'boolean') return val ? 'YES' : 'NO';
      return val.toString().toUpperCase();
    };

    const displayFields = admissionFields.length > 0 
      ? admissionFields
          .filter(f => f.section !== 'Documents' && f.type !== 'file')
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      : [
          { name: "studentName", label: "Student Name (As per Aadhaar)" },
          { name: "dateOfBirth", label: "Date of Birth" },
          { name: "AadhaarNumber", label: "Aadhaar Number" },
          { name: "placeOfBirth", label: "Place of Birth" },
          { name: "gender", label: "Gender" },
          { name: "bloodGroup", label: "Blood Group" },
          { name: "religion", label: "Religion" },
          { name: "caste", label: "Caste" },
          { name: "gradeApplied", label: "Grade/Class Applied For" },
          { name: "fatherName", label: "Father's Name" },
          { name: "fatherOccupation", label: "Father's Occupation" },
          { name: "motherName", label: "Mother's Name" },
          { name: "motherOccupation", label: "Mother's Occupation" },
          { name: "guardianName", label: "Guardian's Full Name" },
          { name: "relationship", label: "Relationship to Student" },
          { name: "contactNumber", label: "Contact Number" },
          { name: "email", label: "Email Address" },
          { name: "address", label: "Residential Address" },
          { name: "po", label: "Post Office (PO)" },
          { name: "ps", label: "Police Station (PS)" },
          { name: "pincode", label: "Pincode" },
          { name: "previousSchool", label: "Previous School Attended" },
          { name: "penNumber", label: "PEN (Permanent Education Number)" },
          { name: "boardMarks", label: "Total Marks Obtained (Class X)" },
          { name: "darpanId", label: "DARPAN ID" }
        ];

    const half = Math.ceil(displayFields.length / 2);
    const leftColX = 15;
    const rightColX = 110;

    for (let i = 0; i < Math.max(half, displayFields.length - half); i++) {
      const leftField = displayFields[i];
      const rightField = displayFields[i + half];

      const leftVal = getFieldVal(leftField?.name);
      const rightVal = getFieldVal(rightField?.name);

      const leftLabelSplit = leftField ? doc.splitTextToSize(`${leftField.label.toUpperCase()}:`, 52) : [];
      const rightLabelSplit = rightField ? doc.splitTextToSize(`${rightField.label.toUpperCase()}:`, 52) : [];

      const leftSplit = leftField ? doc.splitTextToSize(leftVal, 38) : [];
      const rightSplit = rightField ? doc.splitTextToSize(rightVal, 38) : [];
      
      const maxLines = Math.max(leftSplit.length || 1, rightSplit.length || 1, leftLabelSplit.length || 1, rightLabelSplit.length || 1);

      // Zebra Striping
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currY - 4, 186, yInc + ((maxLines - 1) * 3.5) + 1, 'F');
      }

      // Left Column
      if (leftField) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.text(leftLabelSplit, leftColX, currY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...primaryColor);
        doc.text(leftSplit, leftColX + 54, currY);
      }

      // Right Column
      if (rightField) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.text(rightLabelSplit, rightColX, currY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...primaryColor);
        doc.text(rightSplit, rightColX + 54, currY);
      }

      currY += yInc + ((maxLines - 1) * 3.5);

      if (currY > 265) {
        doc.addPage();
        currY = 20;
      }
    }

    // --- 6. Additional Info Section ---
    currY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text("ADDITIONAL INFORMATION", 15, currY);
    currY += 4;

    const renderAdditional = (label, val, x, y) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text(`${label}:`, x, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.text(val, x + 54, y);
    };

    renderAdditional("AGE", age ? age.toString() : 'N/A', leftColX, currY);
    
    if (selectedSubjects && selectedSubjects.length > 0) {
      currY += yInc;
      const subjects = selectedSubjects.join(", ");
      const splitSubjects = doc.splitTextToSize(subjects.toUpperCase(), 130);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text("ELECTIVE SUBJECTS:", leftColX, currY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.text(splitSubjects, leftColX + 54, currY);
      currY += (splitSubjects.length * 4);
    }

    // --- 7. Important Footer Block ---
    if (currY > 240) { doc.addPage(); currY = 20; }
    currY += 5;
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, currY, 180, 20, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currY, 180, 20, 2, 2, 'D');

    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT:", 20, currY + 7);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryColor);
    doc.text("Please bring this original receipt along with all required original documents (Aadhaar, Birth Certificate, etc.)", 20, currY + 13);
    doc.text("for the scheduled interview. Admission selection depends on the verification of these submitted details.", 20, currY + 17);

    // --- 8. Page Footer ---
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 280, 195, 280);
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text(`${schoolProfile?.name || ""} | Contact: ${schoolProfile?.phone || ""}`, 105, 285, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text("Securely Powered by VidyaBarta School Management Software - A Product of Lencho Solutions", 105, 290, { align: "center" });

    doc.save(`Admission_Receipt_${app.referenceNumber || 'Success'}.pdf`);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* (Payment Overlay Modal Removed) */}

      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-gray-400 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.admission || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"}
            alt="Admissions"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              assignment_ind
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Admissions Open
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Join Our <span className="text-tertiary italic drop-shadow-md">Community</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Start your journey towards academic excellence and holistic growth at Holy Name HS School.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 leading-tight">
              Admission <span className="text-primary italic">Process</span>
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600">A simple, transparent, and seamless five-step journey.</p>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {index !== steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-[2px] bg-gray-200">
                    <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-500"></div>
                  </div>
                )}
                <div className="w-16 h-16 mx-auto bg-slate-50 relative z-10 rounded-full flex items-center justify-center border-4 border-white shadow-md text-primary text-xl font-bold mb-4 transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-serif font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Online Application */}
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100 hover:border-primary/20 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center text-2xl mr-4">
                <FaLaptop />
              </div>
              <h2 className="text-2xl font-serif font-bold text-blue-900">Online Mode</h2>
            </div>
            <ul className="space-y-4 text-gray-600">
              {(schoolProfile.onlineAdmissionInstructions?.length > 0
                ? schoolProfile.onlineAdmissionInstructions
                : [
                  "Fill up the form with accurate details",
                  "Review your application in the preview screen",
                  "Upload all documents marked compulsory",
                  "Submit Application Form",
                  "Download & Print Acknowledgement Receipt",
                  "Submit the receipt during interview date allotted"
                ]
              ).map((inst, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {/* Offline Application */}
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100 hover:border-tertiary/20 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-50 text-tertiary rounded-xl flex items-center justify-center text-2xl mr-4">
                <FaBuilding />
              </div>
              <h2 className="text-2xl font-serif font-bold text-amber-900">Offline Mode</h2>
            </div>
            <ul className="space-y-4 text-gray-600">
              {(schoolProfile.offlineAdmissionInstructions?.length > 0
                ? schoolProfile.offlineAdmissionInstructions
                : [
                  "Visit the school administrative block during working hours (9 AM - 3 PM).",
                  "Collect the admission application packet from the front desk.",
                  "Fill out the form manually in CAPITAL letters.",
                  "Attach photocopies of necessary documents.",
                  "Submit the completed docket and pay the fee at the cash counter."
                ]
              ).map((inst, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-tertiary mr-2">✓</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100" id="apply">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 leading-tight">
              Apply <span className="text-primary italic">Now</span>
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600">Fill out the form below to initiate the admission process.</p>
          </div>

          {!submittedData ? (
            <form key={formKey} id="admission-form" onSubmit={handleSubmit} noValidate className="max-w-5xl mx-auto space-y-6">
              
              {/* --- PREVIEW SECTION (Always in DOM, visible when showPreview is true) --- */}
              <div className={`${showPreview && previewData ? 'block' : 'hidden'} animate-fade-in`}>
                {previewData && (
                  <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-gray-300 overflow-hidden">
                    <div className="p-8 md:p-14 bg-gradient-to-br from-gray-50 to-white text-left">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-slate-100 pb-8">
                        <div>
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Review Your Application</h2>
                          <p className="text-slate-500 font-medium text-lg">Please confirm all details are correct before finalizing your submission.</p>
                        </div>
                        <div className="bg-gray-200 text-black px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-gray-300 shadow-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                          Verification Step
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Left Column */}
                        <div className="space-y-12">
                          <section>
                            <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                              <FaUserGraduate className="mr-3 text-lg" /> Student Information
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Full Name" value={previewData.studentName} />
                              <DetailRow label="Date of Birth" value={previewData.dateOfBirth} />
                              <DetailRow label="Place of Birth" value={previewData.placeOfBirth} />
                              <DetailRow label="Gender" value={previewData.gender} />
                              <DetailRow label="Grade Applied" value={previewData.gradeApplied} />
                              <DetailRow label="Aadhaar Number" value={previewData.AadhaarNumber} />
                              <DetailRow label="Blood Group" value={previewData.bloodGroup} />
                              <DetailRow label="Religion" value={previewData.religion} />
                              <DetailRow label="Caste" value={previewData.caste} />
                            </div>
                          </section>

                          <section>
                            <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                              <FaUserCheck className="mr-3 text-lg" /> Parent/Guardian Info
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Father's Name" value={previewData.fatherName} />
                              <DetailRow label="Mother's Name" value={previewData.motherName} />
                              <DetailRow label="Guardian" value={previewData.guardianName} />
                              <DetailRow label="Relationship" value={previewData.relationship} />
                            </div>
                          </section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-12">
                          <section>
                            <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                              <FaGraduationCap className="mr-3 text-lg" /> Academic Background
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Previous School" value={previewData.previousSchool || 'None'} />
                              {previewData.previousSchool && previewData.previousSchool !== 'None' && (
                                <>
                                  <DetailRow label="Marks Obtained" value={previewData.prevMarksObtained} />
                                  <DetailRow label="Percentage" value={previewData.prevPercentage ? `${previewData.prevPercentage}%` : 'N/A'} />
                                  <DetailRow label="Last Attended Exam" value={previewData.lastAttendedExam} />
                                </>
                              )}
                              <DetailRow label="PEN Number" value={previewData.penNumber} />
                              {previewData.darpanId && <DetailRow label="DARPAN ID" value={previewData.darpanId} />}
                              {previewData.stream && <DetailRow label="Stream" value={previewData.stream} />}
                              {previewData.selectedSubjects && <DetailRow label="Elective Subjects" value={previewData.selectedSubjects?.join(", ")} />}
                            </div>
                          </section>

                          <section>
                            <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                              <FaPhoneAlt className="mr-3 text-lg" /> Contact & Address
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Phone" value={previewData.contactNumber} />
                              <DetailRow label="Email Address" value={previewData.email} />
                              <DetailRow label="Full Address" value={previewData.address} />
                              <DetailRow label="PO / PS" value={`${previewData.po || 'N/A'} / ${previewData.ps || 'N/A'}`} />
                              <DetailRow label="Pincode" value={previewData.pincode} />
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* Documents Section */}
                      <section className="mt-16 pt-12 border-t border-slate-100">
                        <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-8 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                          <FaFileAlt className="mr-3 text-lg" /> Verified Documents
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <DocBadge label="Student Photo" filename={previewData.studentPhoto} />
                          <DocBadge label="Birth Cert" filename={previewData.birthCertificate} />
                          <DocBadge label="Marksheet" filename={previewData.marksheet} />
                          {previewData.transferCertificate && previewData.transferCertificate !== 'Not provided' && <DocBadge label="TC" filename={previewData.transferCertificate} />}
                        </div>
                      </section>
                    </div>

                    {/* ACTIONS */}
                    <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-center gap-6">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowPreview(false);
                          window.scrollTo({ top: document.getElementById('apply').offsetTop - 100, behavior: 'smooth' });
                        }}
                        className="w-full md:w-auto min-w-[240px] px-10 py-5 bg-white text-slate-700 font-bold rounded-[1.5rem] border-2 border-slate-200 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 shadow-sm"
                      >
                        <FaBriefcase /> Edit Information
                      </button>
                      <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-auto min-w-[280px] px-12 py-5 bg-primary text-white font-black rounded-[1.5rem] shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                      >
                        {submitting ? 'Processing...' : 'Confirm & Final Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* --- EDITABLE FORM SECTION (Always in DOM, hidden when showPreview is true) --- */}
              <div className={`${showPreview ? 'hidden' : 'block'}`}>
                  {/* Submission Error Display */}
                  {submitError && (
                    <div id="form-error-banner" className="bg-gray-100 border-2 border-gray-300 p-6 rounded-2xl flex items-start animate-fade-in mb-8 shadow-lg shadow-sm">
                      <div className="w-10 h-10 bg-gray-200 text-black rounded-xl flex items-center justify-center text-xl mr-4 flex-shrink-0">
                        <FaExclamationCircle />
                      </div>
                      <div>
                        <h3 className="text-black font-bold text-lg mb-1">Submission Error</h3>
                        <p className="text-black font-medium">{submitError}</p>
                        {errorField && (
                          <p className="text-black text-xs mt-2 font-bold">⚠ Please check the highlighted field and correct your input.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-8 animate-fade-in">
                    {/* --- 1. Student Information --- */}
                    <div className="bg-white border border-gray-300 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
                      <h3 className="text-xl font-bold text-black mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-black rounded-full"></span>
                        Student Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Student Name (As per Aadhaar) *</label>
                          <input type="text" name="studentName" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="SANTANU KONWAR" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Date of Birth *</label>
                          <input type="date" name="dateOfBirth" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Place of Birth *</label>
                          <input type="text" name="placeOfBirth" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="CITY / TOWN" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Aadhaar Number *</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              name="AadhaarNumber" 
                              value={AadhaarNumber} 
                              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                                aadhaarStatus === 'valid' ? 'border-gray-400 bg-gray-50' :
                                aadhaarStatus === 'invalid' ? 'border-gray-400 bg-gray-100/30' : 'border-gray-300'
                              }`} 
                              placeholder="12-DIGIT AADHAAR NUMBER" 
                            />
                            {aadhaarStatus === 'valid' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black">✅</span>}
                            {aadhaarStatus === 'invalid' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black">❌</span>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Gender *</label>
                          <select name="gender" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase">
                            <option value="">SELECT GENDER</option>
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Blood Group *</label>
                          <select name="bloodGroup" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase">
                            <option value="">SELECT BLOOD GROUP</option>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="O+">O+</option><option value="O-">O-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Religion *</label>
                          <select name="religion" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase">
                            <option value="">SELECT RELIGION</option>
                            <option value="HINDUISM">HINDUISM</option>
                            <option value="ISLAM">ISLAM</option>
                            <option value="CHRISTIANITY">CHRISTIANITY</option>
                            <option value="SIKHISM">SIKHISM</option>
                            <option value="BUDDHISM">BUDDHISM</option>
                            <option value="JAINISM">JAINISM</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Caste *</label>
                          <select name="caste" required value={caste} onChange={(e) => setCaste(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase">
                            <option value="">SELECT CASTE</option>
                            <option value="GENERAL">GENERAL</option>
                            <option value="OBC">OBC</option>
                            <option value="MOBC">MOBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Class Applied For *</label>
                          <select name="gradeApplied" required value={gradeApplied} onChange={(e) => setGradeApplied(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase">
                            <option value="">SELECT GRADE</option>
                            <option value="PRE-NURSERY">PRE-NURSERY</option>
                            <option value="KG I (LKG)">KG I (LKG)</option>
                            <option value="KG II (UKG)">KG II (UKG)</option>
                            <option value="CLASS I">CLASS I</option>
                            <option value="CLASS II">CLASS II</option>
                            <option value="CLASS III">CLASS III</option>
                            <option value="CLASS IV">CLASS IV</option>
                            <option value="CLASS V">CLASS V</option>
                            <option value="CLASS VI">CLASS VI</option>
                            <option value="CLASS VII">CLASS VII</option>
                            <option value="CLASS VIII">CLASS VIII</option>
                            <option value="CLASS IX">CLASS IX</option>
                            <option value="CLASS X">CLASS X</option>
                            <option value="CLASS XI">CLASS XI</option>
                            <option value="CLASS XII">CLASS XII</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* --- 2. Parent/Guardian Info --- */}
                    <div className="bg-white border border-gray-300 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
                      <h3 className="text-xl font-bold text-black mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-black rounded-full"></span>
                        Parent/Guardian Info
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Father's Name *</label>
                          <input type="text" name="fatherName" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="NAME AS PER AADHAAR RECORDS" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Father's Occupation</label>
                          <input type="text" name="fatherOccupation" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER FATHER'S OCCUPATION" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Mother's Name *</label>
                          <input type="text" name="motherName" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="NAME AS PER AADHAAR RECORDS" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Mother's Occupation</label>
                          <input type="text" name="motherOccupation" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER MOTHER'S OCCUPATION" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Guardian's Full Name</label>
                          <input type="text" name="guardianName" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER GUARDIAN'S FULL NAME" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Relationship to Student</label>
                          <input type="text" name="relationship" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER RELATIONSHIP TO STUDENT" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Contact Number *</label>
                          <input type="tel" name="contactNumber" required value={contactNumber} onChange={handlePhoneChange} maxLength={10} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" placeholder="10-DIGIT PHONE NUMBER" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Email Address *</label>
                          <input type="email" name="email" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" placeholder="ENTER EMAIL ADDRESS" />
                        </div>
                      </div>
                    </div>

                    {/* --- 3. Address Details --- */}
                    <div className="bg-white border border-gray-300 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
                      <h3 className="text-xl font-bold text-black mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-black rounded-full"></span>
                        Address Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 font-medium mb-2">Residential Address *</label>
                          <textarea name="address" required rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER RESIDENTIAL ADDRESS"></textarea>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Post Office (PO) *</label>
                          <input type="text" name="po" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER POST OFFICE (PO)" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Police Station (PS) *</label>
                          <input type="text" name="ps" required className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER POLICE STATION (PS)" />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Pincode *</label>
                          <input type="text" name="pincode" required value={pincode} onChange={handlePincodeChange} maxLength={6} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" placeholder="ENTER PINCODE" />
                        </div>
                      </div>
                    </div>

                    {/* --- 4. Academic Background --- */}
                    {gradeKey && !["pre-nursery", "kg1", "kg2"].includes(gradeKey) && (
                    <div className="bg-white border border-gray-300 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
                      <h3 className="text-xl font-bold text-black mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-black rounded-full"></span>
                        Academic Background
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {!["class10", "class11", "class12"].includes(gradeKey) && (
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-3">Any Previous School Attended? *</label>
                            <div className="flex gap-4 mb-4">
                              <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${hasPreviousSchool ? 'border-gray-400 bg-gray-100 text-black font-bold' : 'border-gray-200'}`}>
                                <input type="radio" checked={hasPreviousSchool} onChange={() => setHasPreviousSchool(true)} className="sr-only" /> Yes
                              </label>
                              <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${!hasPreviousSchool ? 'border-gray-400 bg-gray-100 text-black font-bold' : 'border-gray-200'}`}>
                                <input type="radio" checked={!hasPreviousSchool} onChange={() => setHasPreviousSchool(false)} className="sr-only" /> No
                              </label>
                            </div>
                            {hasPreviousSchool && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 animate-fade-in">
                                <div className="md:col-span-2">
                                  <label className="block text-gray-700 font-medium mb-2">Previous School Name *</label>
                                  <input type="text" value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="ENTER PREVIOUS SCHOOL NAME" />
                                </div>
                                <div>
                                  <label className="block text-gray-700 font-medium mb-2">Marks Obtained *</label>
                                  <input type="number" value={prevMarksObtained} onChange={(e) => setPrevMarksObtained(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" placeholder="TOTAL MARKS" />
                                </div>
                                <div>
                                  <label className="block text-gray-700 font-medium mb-2">Percentage *</label>
                                  <input type="number" value={prevPercentage} onChange={(e) => setPrevPercentage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" placeholder="%" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-gray-700 font-medium mb-2">Last Attended Exam *</label>
                                  <select value={lastAttendedExam} onChange={(e) => setLastAttendedExam(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase">
                                    <option value="">SELECT EXAM</option>
                                    <option value="ANNUAL EXAM">ANNUAL EXAM</option>
                                    <option value="HALF YEARLY">HALF YEARLY</option>
                                    <option value="OTHER">OTHER</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Class 9-10 Subjects */}
                        {(gradeKey === "class9" || gradeKey === "class10") && (
                          <>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">MIL (Modern Indian Language) *</label>
                              <select name="mil" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" required>
                                <option value="">SELECT MIL</option>
                                <option value="assamese">ASSAMESE</option>
                                <option value="bengali">BENGALI</option>
                                <option value="hindi">HINDI</option>
                                <option value="bodo">BODO</option>
                                <option value="urdu">URDU</option>
                                <option value="manipuri">MANIPURI</option>
                                <option value="nepali">NEPALI</option>
                                <option value="khasi">KHASI</option>
                                <option value="garo">GARO</option>
                                <option value="mizo">MIZO</option>
                                <option value="hmar">HMAR</option>
                                <option value="karbi">KARBI</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">Elective Subject *</label>
                              <select name="elective" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" required>
                                <option value="">SELECT ELECTIVE</option>
                                <option value="advanced_math">ADVANCED MATHEMATICS (E)</option>
                                <option value="geography">GEOGRAPHY (E)</option>
                                <option value="history">HISTORY (E)</option>
                                <option value="sanskrit">SANSKRIT (E)</option>
                                <option value="computer_science">COMPUTER SCIENCE (E)</option>
                                <option value="fine_art">FINE ART (E)</option>
                                <option value="music">MUSIC (E)</option>
                                <option value="it_ites">IT/ITES NSQF (E)</option>
                                <option value="retail_trade">RETAIL TRADE NSQF (E)</option>
                                <option value="health_care">HEALTH CARE NSQF (E)</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* Class 11-12 Subjects */}
                        {(gradeKey === 'class11' || gradeKey === 'class12') && (
                          <div className="md:col-span-2 space-y-6">
                            <div className="bg-gray-100 p-5 rounded-2xl border border-gray-300">
                              <p className="text-xs font-bold text-black uppercase tracking-widest mb-3 flex items-center">
                                <FaShieldAlt className="mr-2" /> Compulsory Subjects
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-bold text-black">ENGLISH</span>
                                <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-bold text-black">ENVIRONMENTAL EDUCATION</span>
                                {selectedStream === 'science' && (
                                  <>
                                    <span className="px-3 py-1 bg-gray-100 border border-gray-400 rounded-full text-xs font-bold text-black">PHYSICS</span>
                                    <span className="px-3 py-1 bg-gray-100 border border-gray-400 rounded-full text-xs font-bold text-black">CHEMISTRY</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-gray-700 font-medium mb-2">MIL / Alt. English *</label>
                                <select name="mil" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none" required>
                                  <option value="">SELECT LANGUAGE</option>
                                  <option value="assamese">ASSAMESE</option>
                                  <option value="hindi">HINDI</option>
                                  <option value="bengali">BENGALI</option>
                                  <option value="alt_english">ALTERNATIVE ENGLISH</option>
                                  <option value="bodo">BODO</option>
                                  <option value="manipuri">MANIPURI</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-gray-700 font-medium mb-2">Stream *</label>
                                <select name="stream" value={selectedStream} onChange={(e) => { setSelectedStream(e.target.value); setSelectedSubjects([]); }} className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold" required>
                                  <option value="">CHOOSE STREAM</option>
                                  <option value="science">SCIENCE</option>
                                  <option value="arts">ARTS</option>
                                  <option value="commerce">COMMERCE</option>
                                </select>
                              </div>
                            </div>

                            {selectedStream && (
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                                  <span>Select Elective Subjects (Select {selectedStream === 'science' ? 2 : 4}) *</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedSubjects.length === (selectedStream === 'science' ? 2 : 4) ? 'bg-gray-100 text-black' : 'bg-gray-200 text-black'}`}>
                                    {selectedSubjects.length} / {selectedStream === 'science' ? 2 : 4} Selected
                                  </span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {(selectedStream === 'science' ? ['MATHEMATICS', 'BIOLOGY', 'COMPUTER SCIENCE', 'ECONOMICS'] :
                                    selectedStream === 'arts' ? ['POLITICAL SCIENCE', 'ECONOMICS', 'HISTORY', 'EDUCATION', 'GEOGRAPHY', 'LOGIC & PHILOSOPHY', 'MATHEMATICS', 'SANSKRIT', 'ADVANCED ASSAMESE'] :
                                    ['ACCOUNTANCY', 'BUSINESS STUDIES', 'ECONOMICS', 'COMMERCIAL MATHEMATICS', 'FINANCE', 'INSURANCE']
                                  ).map(sub => (
                                    <label key={sub} className="flex items-center p-3 rounded-xl border border-gray-200 hover:bg-white cursor-pointer transition-all bg-gray-50/50">
                                      <input type="checkbox" checked={selectedSubjects.includes(sub)} onChange={() => handleSubjectChange(sub)} className="w-5 h-5 accent-black mr-3" />
                                      <span className="text-xs font-bold text-gray-700">{sub}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Common Academic IDs */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">PEN (Permanent Education Number)</label>
                            <input type="text" name="penNumber" className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase" placeholder="OPTIONAL FOR JUNIORS" />
                          </div>
                          {gradeKey === 'class11' && (
                            <div>
                              <label className="block text-gray-700 font-medium mb-2 text-black font-bold">DARPAN ID (For Class XI) *</label>
                              <input type="text" value={darpanId} onChange={(e) => setDarpanId(e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-xl border-2 border-black/20 focus:border-black focus:ring-0 outline-none uppercase font-black bg-white" placeholder="ENTER DARPAN ID" required />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Class XI Board Marks */}
                      {gradeKey === 'class11' && (
                        <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-100 rounded-2xl border border-gray-400">
                          <h4 className="text-lg font-bold text-black mb-4 flex items-center"><FaGraduationCap className="mr-2" /> Class X Board Results</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                              <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Total Marks (Out of 600) *</label>
                              <input type="number" value={boardMarks} onChange={(e) => setBoardMarks(e.target.value)} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-center text-xl bg-white transition-all shadow-sm" placeholder="600" required />
                            </div>
                            <div>
                               <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Percentage</label>
                               <div className="w-full h-16 px-6 rounded-2xl border border-gray-400 bg-gray-50/50 shadow-inner flex items-center justify-center">
                                  <p className="text-2xl font-black text-black tracking-tight">
                                    {boardMarks ? ((boardMarks / 600) * 100).toFixed(2) : '0.00'}%
                                  </p>
                               </div>
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Division *</label>
                              <div className="relative">
                                <select name="boardDivision" value={boardDivision} onChange={(e) => setBoardDivision(e.target.value)} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-base uppercase bg-white transition-all appearance-none cursor-pointer" required>
                                  <option value="">SELECT</option>
                                  <option value="RANK">RANK (95%+)</option>
                                  <option value="DISTINCTION">DISTINCTION (85%+)</option>
                                  <option value="STAR">STAR (75%+)</option>
                                  <option value="1ST DIVISION">1ST DIVISION (60%+)</option>
                                  <option value="2ND DIVISION">2ND DIVISION (50%+)</option>
                                  <option value="3RD DIVISION">3RD DIVISION (30%+)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Secondary Interests */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-100/50 rounded-2xl border border-gray-300">
                          <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative">
                                <input type="checkbox" checked={sportsActive} onChange={(e) => setSportsActive(e.target.checked)} className="sr-only" />
                                <div className={`w-12 h-6 rounded-full transition-colors ${sportsActive ? 'bg-black' : 'bg-gray-300'}`}></div>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sportsActive ? 'translate-x-6' : ''}`}></div>
                             </div>
                             <span className="text-black font-bold flex flex-col">
                               <span>🏅 Active in Sports?</span>
                               <span className="text-[10px] font-medium text-black/70">Tell us about your sports participation.</span>
                             </span>
                          </label>
                          {sportsActive && (
                            <input type="text" value={sportsType} onChange={(e) => setSportsType(e.target.value.toUpperCase())} className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-400 focus:ring-2 focus:ring-black outline-none uppercase animate-fade-in" placeholder="WHICH SPORTS DO YOU PLAY?" />
                          )}
                        </div>

                        {["class8", "class9", "class10", "class11", "class12"].includes(gradeKey) && (
                          <div className="p-4 bg-gray-100/50 rounded-2xl border border-gray-400">
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <div className="relative">
                                  <input type="checkbox" checked={nccInterest} onChange={(e) => setNccInterest(e.target.checked)} className="sr-only" />
                                  <div className={`w-12 h-6 rounded-full transition-colors ${nccInterest ? 'bg-black' : 'bg-gray-300'}`}></div>
                                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${nccInterest ? 'translate-x-6' : ''}`}></div>
                               </div>
                               <span className="text-black font-bold flex flex-col">
                                 <span>🛡️ Interested in NCC?</span>
                                 <span className="text-[10px] font-medium text-black/70">Join the 11th Assam Battalion program.</span>
                               </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    )}

                    {/* --- 5. Documents --- */}
                    <div className="bg-white border border-gray-300 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
                      <h3 className="text-xl font-bold text-black mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-black rounded-full"></span>
                        Documents
                      </h3>
                      <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 mb-6 flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">
                          Large photos will be <span className="text-black underline">automatically optimized</span> for faster upload. 
                          Please ensure documents are clear and under <span className="text-black">5MB each</span>.
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mb-6 font-medium">Please upload clear copies (JPG, PNG or PDF) of the following documents.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Student Passport Photo *</label>
                          <input type="file" name="studentPhoto" required accept="image/*" onChange={(e) => handleFilePreview(e, 'studentPhoto')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">JPG / PNG (MAX 5MB)</p>
                          {filePreviews.studentPhoto && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                              {filePreviews.studentPhoto.url ? (
                                <img src={filePreviews.studentPhoto.url} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black"><FaFileAlt /></div>
                              )}
                              <div className="min-w-0"><p className="text-[10px] font-bold truncate">{filePreviews.studentPhoto.name}</p></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Birth Certificate *</label>
                          <input type="file" name="birthCertificate" required accept="image/*,application/pdf" onChange={(e) => handleFilePreview(e, 'birthCertificate')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">JPG / PNG / PDF (MAX 5MB)</p>
                          {filePreviews.birthCertificate && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-black"><FaFileAlt /></div>
                              <div className="min-w-0"><p className="text-[10px] font-bold truncate">{filePreviews.birthCertificate.name}</p></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Previous Class Marksheet *</label>
                          <input type="file" name="marksheet" required accept="image/*,application/pdf" onChange={(e) => handleFilePreview(e, 'marksheet')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">JPG / PNG / PDF (MAX 5MB)</p>
                          {filePreviews.marksheet && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black"><FaFileAlt /></div>
                              <div className="min-w-0"><p className="text-[10px] font-bold truncate">{filePreviews.marksheet.name}</p></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Aadhaar Card / VID Photo *</label>
                          <input type="file" name="AadhaarVidOrReceipt" required accept="image/*,application/pdf" onChange={(e) => handleFilePreview(e, 'AadhaarVidOrReceipt')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">JPG / PNG / PDF (MAX 5MB)</p>
                          {filePreviews.AadhaarVidOrReceipt && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black"><FaFileAlt /></div>
                              <div className="min-w-0"><p className="text-[10px] font-bold truncate">{filePreviews.AadhaarVidOrReceipt.name}</p></div>
                            </div>
                          )}
                        </div>
                        {caste && caste.toUpperCase() !== 'GENERAL' && (
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2">Caste Certificate ({caste}) *</label>
                            <input type="file" name="casteCertificate" required accept="image/*,application/pdf" onChange={(e) => handleFilePreview(e, 'casteCertificate')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                          </div>
                        )}
                        {gradeKey === 'class11' && (
                          <>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">Class X Admit Card *</label>
                              <input type="file" name="admitCard" required accept="image/*,application/pdf" onChange={(e) => handleFilePreview(e, 'admitCard')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">JPG / PNG / PDF (MAX 5MB)</p>
                              {filePreviews.admitCard && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black"><FaFileAlt /></div>
                                  <div className="min-w-0"><p className="text-[10px] font-bold truncate">{filePreviews.admitCard.name}</p></div>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">Class X Registration Card *</label>
                              <input type="file" name="registrationCard" required accept="image/*,application/pdf" onChange={(e) => handleFilePreview(e, 'registrationCard')} className="w-full px-4 py-2 rounded-xl border border-gray-400" />
                              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">JPG / PNG / PDF (MAX 5MB)</p>
                              {filePreviews.registrationCard && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-black"><FaFileAlt /></div>
                                  <div className="min-w-0"><p className="text-[10px] font-bold truncate">{filePreviews.registrationCard.name}</p></div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-center pt-10">
                      <button
                        type="button"
                        onClick={handleReview}
                        disabled={submitting}
                        className={`text-white font-bold px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 text-lg flex items-center justify-center mx-auto shadow-lg ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'}`}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {paymentEnabled && admissionFee > 0 ? 'Redirecting to Payment...' : 'Submitting Application...'}
                          </>
                        ) : (
                          'Review Application Details'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              ) : (
                <div className="max-w-3xl mx-auto py-10 animate-fade-in">
                  {/* Success Icon */}
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm">
                  <FaCheckCircle />
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-black text-green-800 mb-2">Success!</h3>
                <p className="text-gray-500 text-lg">Your application has been submitted successfully.</p>
              </div>

              {/* Receipt Preview */}
              <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-gray-200 text-left relative shadow-xl overflow-hidden mb-10 transition-all">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

                {/* School Header */}
                <div className="flex flex-col items-center text-center border-b border-gray-100 pb-8 mb-8 pt-4">
                  {schoolProfile?.logo && (
                    <img
                      src={schoolProfile.logo}
                      alt="School Logo"
                      className="w-24 h-24 object-contain mb-4 transform hover:scale-105 transition-transform"
                    />
                  )}
                  <h2 className="text-3xl md:text-4xl font-serif font-black text-black tracking-tighter leading-none mb-2">
                    {schoolProfile?.name || "HOLY NAME HS SCHOOL"}
                  </h2>
                  <p className="text-sm text-gray-600 font-bold italic tracking-widest opacity-80 uppercase">
                    {schoolProfile?.punchLine}
                  </p>
                  {schoolProfile?.officeAddress && (
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-2 max-w-xs md:max-w-md mx-auto leading-relaxed">
                      {schoolProfile.officeAddress}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-4">
                    <span className="h-[1px] w-8 bg-gray-200"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Acknowledgement Receipt</span>
                    <span className="h-[1px] w-8 bg-gray-200"></span>
                  </div>
                </div>

                {/* Reference ID Highlight */}
                <div className="bg-white rounded-2xl p-8 mb-8 text-center border-2 border-primary shadow-sm group transition-colors">
                  <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-3">Application Reference Number</p>
                  <p className="font-mono text-4xl md:text-5xl font-black text-primary tracking-tighter select-all">
                    {submittedData.referenceNumber}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group transition-colors">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Student Name</span>
                      <span className="font-black text-gray-800">{submittedData.studentName}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group transition-colors">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Class Applied</span>
                      <span className="font-black text-gray-800 uppercase">{submittedData.gradeApplied}</span>
                    </div>
                    {submittedData.stream && (
                      <div className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group transition-colors">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Stream</span>
                        <span className="font-black text-gray-800 uppercase">{submittedData.stream}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group transition-colors">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Applied Date</span>
                      <span className="font-black text-gray-800">{submittedData.dateOfApplication}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group transition-colors">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Contact No</span>
                      <span className="font-black text-gray-800">{submittedData.contactNumber}</span>
                    </div>
                    {submittedData.penNumber && (
                      <div className="flex justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group transition-colors">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">PEN Number</span>
                        <span className="font-mono font-black text-gray-800">{submittedData.penNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subjects Tag Cloud - for Class 11-12 */}
                {(submittedData.selectedSubjects?.length > 0 || submittedData.mil || submittedData.elective) && (
                  <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Academic Selection</p>
                    <div className="flex flex-wrap gap-2">
                      {submittedData.mil && <span className="px-4 py-2 bg-white text-slate-700 font-bold rounded-full text-xs border border-slate-200 shadow-sm capitalize">Language: {submittedData.mil}</span>}
                      {submittedData.elective && <span className="px-4 py-2 bg-white text-slate-700 font-bold rounded-full text-xs border border-slate-200 shadow-sm capitalize">Elective: {submittedData.elective.replace(/_/g, ' ')}</span>}
                      {submittedData.selectedSubjects?.map((sub, i) => (
                        <span key={i} className="px-4 py-2 bg-primary text-white font-bold rounded-full text-xs shadow-sm">{sub}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning / Footer */}
                <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-800 mb-2">
                    <FaExclamationCircle className="text-sm" />
                    <p className="text-xs font-bold uppercase tracking-wider">Next Step Instruction</p>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    Please download the official PDF receipt and keep the reference number safe for your upcoming interview and document verification.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 mb-20 px-4">
                <button
                  onClick={() => handleDownloadReceipt()}
                  className="group flex-1 max-w-sm bg-primary text-white font-black px-10 py-5 rounded-3xl hover:bg-blue-700 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center transform hover:-translate-y-2 active:scale-95"
                >
                  <FaPrint className="mr-3 text-xl group-hover:animate-bounce" />
                  Download PDF Receipt
                </button>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setGradeApplied("");
                    setAadhaarNumber("");
                    setHasPreviousSchool(false);
                    setPreviousSchool("");
                    setPrevMarksObtained("");
                    setLastAttendedExam("");
                    setPrevPercentage("");
                    setSelectedStream("");
                    setSelectedSubjects([]);
                    setNccInterest(false);
                    setSportsActive(false);
                    setSportsType("");
                    setBoardMarks("");
                    setBoardDivision("");
                    setDarpanId("");
                    setPenNumber("");
                    setContactNumber("");
                    setCaste("General");
                    setPincode("");
                    setFilePreviews({});
                    setFormKey(prev => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 max-w-sm bg-white text-black font-black px-10 py-5 rounded-3xl hover:bg-gray-50 transition-all border-2 border-gray-300 flex items-center justify-center shadow-xl transform hover:-translate-y-1 active:scale-95"
                >
                  Submit Another Form
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Check Application Status Section */}
        <div id="check-status" className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-3">Check Application Status</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-4"></div>
            <p className="text-gray-500 max-w-xl mx-auto">Already applied? Enter your Reference Number or registered Email to track your application in real-time.</p>
          </div>

          <form onSubmit={handleStatusSearch} className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="e.g. HNS-2026-ABCDE or student@email.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-black outline-none transition-all text-lg shadow-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={statusLoading}
                className={`bg-primary text-white font-bold px-10 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-md transform hover:-translate-y-1 text-lg flex items-center justify-center whitespace-nowrap ${statusLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {statusLoading ? (
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Check Status'}
              </button>
            </div>
          </form>

          {/* Status Error */}
          {statusError && (
            <div className="flex items-start bg-gray-100 border border-gray-400 text-black p-5 rounded-2xl animate-fade-in">
              <FaExclamationCircle className="text-xl mr-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Application Not Found</p>
                <p className="text-sm text-black">{statusError}</p>
              </div>
            </div>
          )}

          {/* Status Results */}
          {statusData && (() => {
            const info = getStatusInfo(statusData.status);
            const activeIdx = getActiveStep(statusData.status);
            return (
              <div className="mt-6 animate-fade-in">
                <div className="border-t border-gray-100 pt-8">
                  <h3 className="text-xl font-serif font-bold text-black mb-6 flex items-center">
                    <FaClipboardCheck className="mr-3 text-black" />
                    Application Status
                  </h3>

                  {/* Progress Timeline */}
                  {statusData.status !== 'rejected' && (
                    <div className="mb-10">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full z-0">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700"
                            style={{ width: activeIdx === 0 ? '0%' : activeIdx === 1 ? '50%' : '100%' }}
                          ></div>
                        </div>
                        {STATUS_STEPS.map((step, idx) => {
                          const isCompleted = idx <= activeIdx;
                          const isCurrent = idx === activeIdx;
                          const StepIcon = step.icon;
                          return (
                            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm ${isCompleted
                                ? isCurrent
                                  ? 'bg-primary text-white scale-110 ring-4 ring-blue-100'
                                  : 'bg-primary text-white'
                                : 'bg-gray-200 text-gray-400'
                                }`}>
                                {isCompleted && !isCurrent ? <FaCheckCircle /> : <StepIcon />}
                              </div>
                              <p className={`text-xs font-bold mt-2 uppercase tracking-wider ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>{step.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Details Column */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0"><FaUserGraduate /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Student Name</p>
                          <p className="text-lg font-bold text-gray-800 truncate">{statusData.studentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0"><FaGraduationCap /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Grade Applied</p>
                          <p className="text-lg font-bold text-gray-800 uppercase">{statusData.gradeApplied}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0"><FaIdBadge /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Reference Code</p>
                          <p className="text-lg font-mono font-bold text-gray-800">{statusData.referenceNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0"><FaCalendarAlt /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Submitted On</p>
                          <p className="text-lg font-bold text-gray-800">{new Date(statusData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Card */}
                    <div className={`lg:col-span-2 p-8 rounded-3xl border-2 shadow-sm flex flex-col items-center justify-center text-center ring-4 ${info.bg} ${info.border} ${info.ring}`}>
                      <p className="text-4xl mb-3">{info.icon}</p>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Current Status</p>
                      <h3 className={`text-3xl font-serif font-black uppercase mb-4 tracking-tight ${info.color}`}>{info.label}</h3>
                      <div className="h-0.5 w-12 bg-gray-300/50 mb-4"></div>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed mb-6">{info.desc}</p>
                      
                      <button 
                        onClick={() => handleDownloadReceipt(statusData)}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all text-sm group"
                      >
                        <FaPrint className="group-hover:scale-110 transition-transform" />
                        Download Application Receipt
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* Default empty state */}
          {!statusData && !statusError && !statusLoading && (
            <div className="text-center py-6 text-gray-400">
              <FaSearch className="text-3xl mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm">Enter your Reference Number or Email to check your application status.</p>
            </div>
          )}
        </div>

        {/* Help Desk Footer */}
        <div className="mt-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">Need Help? Contact Admissions Office</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <a href={`tel:${schoolProfile?.phone || ''}`} className="flex items-center text-gray-700 font-medium hover:text-black transition-colors">
              <FaPhoneAlt className="text-black mr-2" />
              {schoolProfile?.phone}
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a href={`mailto:${schoolProfile?.email || ''}`} className="flex items-center text-gray-700 font-medium hover:text-black transition-colors">
              <FaEnvelope className="text-black mr-2" />
              {schoolProfile?.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admission;
