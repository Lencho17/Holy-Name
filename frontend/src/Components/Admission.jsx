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
    { title: "Admission Confirmation", desc: "Submit the required documents and complete the fee payment." },
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
      case 'accepted': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', ring: 'ring-green-500/20', label: 'Accepted', icon: '✅', desc: 'Congratulations! Your application has been accepted. Please visit the school office with original documents.' };
      case 'rejected': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-500/20', label: 'Rejected', icon: '❌', desc: 'We regret to inform you that your application was not accepted. Please contact the admissions office.' };
      case 'entrance-exam': return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', ring: 'ring-purple-500/20', label: 'Entrance Exam', icon: '📝', desc: 'Your application has been reviewed. You have been scheduled for an entrance examination. Please check your email for details.' };
      case 'interview': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-500/20', label: 'Interview Scheduled', icon: '🎤', desc: 'You have cleared the entrance exam. An interview has been scheduled. Please check your email for the date and time.' };
      default: return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20', label: 'Pending', icon: '⏳', desc: 'Your application is being processed. Please check back later.' };
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

  const renderDynamicField = (field) => {
    if (!field.isActive) return null;

    // Class XI-only fields — skip for all other grades
    const classXIOnlyFields = ['boardMarks', 'boardPercentage', 'boardDivision', 'darpanId'];
    if (classXIOnlyFields.includes(field.name) && gradeKey !== 'class11') return null;

    // Fields with dedicated hardcoded sections — skip dynamic rendering to avoid duplicates
    if (field.name === 'penNumber') return null;

    const commonProps = {
      name: field.name,
      required: field.required,
      placeholder: field.placeholder || `ENTER ${field.label.toUpperCase()}`,
      className: `w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors uppercase ${errorField === field.name ? 'border-red-400 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'}`,
    };

    // Special handling for Aadhaar with validation
    if (field.name === 'AadhaarNumber') {
      return (
        <div key={field.name}>
          <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
          <div className="relative">
            <input
              {...commonProps}
              type="text"
              value={AadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
              className={`${commonProps.className} pr-12 ${
                aadhaarStatus === 'valid' ? 'border-green-400 focus:ring-green-500 focus:border-green-500 bg-green-50/30' :
                aadhaarStatus === 'invalid' ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/30' :
                ''
              }`}
            />
            {aadhaarStatus === 'valid' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">✅</span>}
            {aadhaarStatus === 'invalid' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg">❌</span>}
          </div>
          {aadhaarStatus === 'invalid' && <p className="text-red-500 text-xs mt-1 font-semibold">⚠ Invalid Aadhaar — checksum does not match.</p>}
          {aadhaarStatus === 'valid' && <p className="text-green-600 text-xs mt-1 font-semibold">✓ Valid Aadhaar number format</p>}
          {aadhaarStatus === 'incomplete' && AadhaarNumber.length > 0 && <p className="text-gray-400 text-xs mt-1">{AadhaarNumber.length}/12 digits entered</p>}
        </div>
      );
    }

    // Special handling for Grade Applied to trigger conditional fields
    if (field.name === 'gradeApplied') {
      return (
        <div key={field.name}>
          <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
          <select 
            {...commonProps}
            value={gradeApplied}
            onChange={(e) => setGradeApplied(e.target.value)}
          >
            <option value="">SELECT GRADE</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {errorField === 'gradeApplied' && <p className="text-red-500 text-xs mt-1 font-semibold">⚠ Please select a valid grade</p>}
        </div>
      );
    }

    // Previous School — Yes/No toggle with conditional sub-fields
    if (field.name === 'previousSchool') {
      return (
        <div key={field.name} className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-3">Any Previous School Attended? *</label>
          <div className="flex gap-4 mb-4">
            <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
              hasPreviousSchool ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold shadow-sm' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input type="radio" name="hasPreviousSchool" value="yes" checked={hasPreviousSchool} onChange={() => setHasPreviousSchool(true)} className="sr-only" />
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                hasPreviousSchool ? 'border-amber-500' : 'border-gray-300'
              }`}>{hasPreviousSchool && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}</span>
              Yes
            </label>
            <label className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
              !hasPreviousSchool ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold shadow-sm' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input type="radio" name="hasPreviousSchool" value="no" checked={!hasPreviousSchool} onChange={() => { setHasPreviousSchool(false); setPreviousSchool(''); setPrevMarksObtained(''); setLastAttendedExam(''); setPrevPercentage(''); }} className="sr-only" />
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                !hasPreviousSchool ? 'border-amber-500' : 'border-gray-300'
              }`}>{!hasPreviousSchool && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}</span>
              No
            </label>
          </div>
          {hasPreviousSchool && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 animate-fade-in">
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Previous School Name *</label>
                <input
                  name="previousSchool"
                  type="text"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors uppercase"
                  placeholder="ENTER PREVIOUS SCHOOL NAME"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Marks Obtained *</label>
                <input
                  name="prevMarksObtained"
                  type="number"
                  value={prevMarksObtained}
                  onChange={(e) => setPrevMarksObtained(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  placeholder="ENTER MARKS OBTAINED"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Percentage *</label>
                <input
                  name="prevPercentage"
                  type="number"
                  step="0.01"
                  value={prevPercentage}
                  onChange={(e) => setPrevPercentage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  placeholder="ENTER PERCENTAGE"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Last Attended Exam *</label>
                <select
                  name="lastAttendedExam"
                  value={lastAttendedExam}
                  onChange={(e) => setLastAttendedExam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors uppercase"
                  required
                >
                  <option value="">SELECT LAST ATTENDED EXAM</option>
                  <option value="1ST UNIT">1ST UNIT</option>
                  <option value="HALF YEARLY">HALF YEARLY</option>
                  <option value="3RD UNIT">3RD UNIT</option>
                  <option value="ANNUAL EXAM">ANNUAL EXAM</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Track caste state to conditionally show caste certificate upload
    if (field.name === 'caste') {
      return (
        <div key={field.name}>
          <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
          <select
            {...commonProps}
            value={caste}
            onChange={(e) => setCaste(e.target.value)}
          >
            <option value="">SELECT {field.label.toUpperCase()}</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }

    // Track contactNumber state for phone validation
    if (field.name === 'contactNumber') {
      return (
        <div key={field.name}>
          <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
          <input
            {...commonProps}
            type="tel"
            value={contactNumber}
            onChange={handlePhoneChange}
            maxLength={10}
          />
          {contactNumber.length > 0 && contactNumber.length < 10 && (
            <p className="text-gray-400 text-xs mt-1">{contactNumber.length}/10 digits entered</p>
          )}
        </div>
      );
    }

    // Track pincode state for validation
    if (field.name === 'pincode') {
      return (
        <div key={field.name}>
          <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
          <input
            {...commonProps}
            type="text"
            value={pincode}
            onChange={handlePincodeChange}
            maxLength={6}
          />
          {pincode.length > 0 && pincode.length < 6 && (
            <p className="text-gray-400 text-xs mt-1">{pincode.length}/6 digits entered</p>
          )}
        </div>
      );
    }

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name}>
            <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
            <select {...commonProps}>
              <option value="">SELECT {field.label.toUpperCase()}</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      case 'textarea':
        return (
          <div key={field.name} className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
            <textarea {...commonProps} rows="3"></textarea>
          </div>
        );
      case 'date':
        return (
          <div key={field.name}>
            <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
            <input {...commonProps} type="date" />
          </div>
        );
      case 'number':
        return (
          <div key={field.name}>
            <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
            <input {...commonProps} type="number" />
          </div>
        );
      case 'file':
        return null; // Handle files separately in the documents section
      default:
        return (
          <div key={field.name}>
            <label className="block text-gray-700 font-medium mb-2">{field.label} {field.required && '*'}</label>
            <input {...commonProps} type={field.type} />
          </div>
        );
    }
  };
  const penStatus = penNumber.length === 0 ? 'empty' : /^[A-Z0-9]{8,20}$/.test(penNumber) ? 'valid' : 'invalid';
  const darpanStatus = darpanId.length === 0 ? 'empty' : darpanId.length >= 4 ? 'valid' : 'invalid';
  const [errorField, setErrorField] = useState(null); // which field has a backend error
  const [filePreviews, setFilePreviews] = useState({}); // { fieldName: { name, size, type, url } }
  
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const admissionFee = schoolProfile?.admissionFee || 250;
  const paymentEnabled = schoolProfile?.admissionPaymentEnabled !== false; // default true

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

  useEffect(() => {
    let intervalId;
    if (paymentSession && paymentStatus === 'pending') {
      intervalId = setInterval(async () => {
        try {
          const res = await axios.post(`${apiBase}/payment/check-status`, { admissionId: paymentSession.admissionId });
          if (res.data.verified) {
            setPaymentStatus('success');
            setTimeout(() => {
                setPaymentSession(null);
                setSubmittedData(paymentSession);
                window.scrollTo({ top: document.getElementById('apply')?.offsetTop - 100, behavior: 'smooth' });
            }, 2000);
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(intervalId);
  }, [paymentSession, paymentStatus, apiBase]);


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
      <FaCheckCircle className="text-green-500 text-xs" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">{label}</span>
        <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{filename}</span>
      </div>
    </div>
  );

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
    formData.append('previousSchool', previousSchool);
    if (hasPreviousSchool) {
      formData.append('prevMarksObtained', prevMarksObtained);
      formData.append('lastAttendedExam', lastAttendedExam);
      formData.append('prevPercentage', prevPercentage);
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

    // File uploads
    const tcFile = form.querySelector('[name="transferCertificate"]')?.files[0];
    const msFile = form.querySelector('[name="marksheet"]')?.files[0];
    const AadhaarFile = form.querySelector('[name="AadhaarVidOrReceipt"]')?.files[0];
    const photoFile = form.querySelector('[name="studentPhoto"]')?.files[0];
    const birthFile = form.querySelector('[name="birthCertificate"]')?.files[0];
    const casteFile = form.querySelector('[name="casteCertificate"]')?.files[0];

    if (tcFile) formData.append('transferCertificate', tcFile);
    if (msFile) formData.append('marksheet', msFile);
    if (AadhaarFile) formData.append('AadhaarVidOrReceipt', AadhaarFile);
    if (photoFile) formData.append('studentPhoto', photoFile);
    if (birthFile) formData.append('birthCertificate', birthFile);
    if (casteFile) formData.append('casteCertificate', casteFile);
    const paymentFile = form.querySelector('[name="paymentReceipt"]')?.files[0];
    if (paymentFile) formData.append('paymentReceipt', paymentFile);
    const upiTransactionId = form.querySelector('[name="upiTransactionId"]')?.value;
    if (upiTransactionId) formData.append('upiTransactionId', upiTransactionId);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await axios.post(`${apiBase}/admissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const fullDataForPayment = {};
      for (let [key, value] of formData.entries()) {
        fullDataForPayment[key] = value;
      }
      
      // If payment is enabled, process UPIGateway Payment
      if (paymentEnabled && admissionFee > 0) {
          try {
              const paymentRes = await axios.post(`${apiBase}/payment/create-order`, {
                  admissionId: res.data.id,
                  amount: admissionFee,
                  studentName: formData.get('studentName'),
                  email: formData.get('email'),
                  contactNumber: formData.get('contactNumber')
              });
              
              if (paymentRes.data.upi_intent) {
                  setPaymentSession({
                      ...paymentRes.data,
                      admissionId: res.data.id,
                      referenceNumber: res.data.referenceNumber,
                      ...fullDataForPayment,
                      selectedSubjects: [...selectedSubjects],
                      dateOfApplication: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  });
                  setPaymentStatus('pending');
                  return; // Halt and show modal
              } else if (paymentRes.data.payment_url) {
                  window.location.href = paymentRes.data.payment_url;
                  return; // Stop execution here and let the browser redirect
              }
          } catch (paymentErr) {
              console.error('Payment initiation failed:', paymentErr);
              setSubmitError('Application saved, but payment initiation failed. Please contact the school.');
              setSubmitting(false);
              setShowPreview(false);
              return;
          }
      }

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

  const handleDownloadReceipt = async () => {
    if (!submittedData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [40, 40, 40]; // Dark Gray
    const accentColor = [100, 100, 100]; // Medium Gray
    const lightColor = [245, 245, 245]; // Light Gray

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
    if (submittedData.dateOfBirth) {
      const birthDate = new Date(submittedData.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // --- 1. Clean Header Area ---
    // School Logo
    const logoImg = schoolProfile?.logo ? await loadImage(schoolProfile.logo) : null;
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 15, 8, 25, 25);
    }

    // Header Text (Dark)
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(schoolProfile?.name?.toUpperCase() || "HOLY NAME HIGH SCHOOL", 115, 16, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(schoolProfile?.officeAddress || "", 115, 22, { align: "center" });
    
    const contactInfo = [schoolProfile?.email, schoolProfile?.phone].filter(Boolean).join(" | ");
    doc.text(contactInfo, 115, 27, { align: "center" });
    
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Official Receipt Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 115, 32, { align: "center" });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 36, 195, 36);

    // --- 2. Title Section ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ADMISSION APPLICATION SUCCESSFUL", 105, 44, { align: "center" });
    
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(60, 47, 150, 47);

    // --- 3. Reference & Photo Row ---
    doc.setFillColor(...lightColor);
    doc.roundedRect(15, 51, 140, 22, 2, 2, 'F');
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 51, 140, 22, 2, 2, 'D');
    
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(`REFERENCE NO: ${submittedData.referenceNumber}`, 20, 59);
    
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text(`Applicant: ${submittedData.studentName}  |  Contact: ${submittedData.contactNumber || 'N/A'}`, 20, 66);

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(165, 51, 28, 28, 2, 2, 'D');
    
    let studentPhotoUrl = null;
    if (typeof submittedData?.studentPhoto === 'string') {
      studentPhotoUrl = submittedData.studentPhoto;
    } else if (filePreviews?.studentPhoto?.url) {
      studentPhotoUrl = filePreviews.studentPhoto.url;
    } else if (submittedData?.studentPhoto instanceof File) {
      studentPhotoUrl = URL.createObjectURL(submittedData.studentPhoto);
    }

    const studentImg = studentPhotoUrl ? await loadImage(studentPhotoUrl) : null;
    if (studentImg) {
      doc.addImage(studentImg, 'JPEG', 166, 52, 26, 26);
    } else {
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("PHOTO", 179, 65, { align: "center" });
    }

    // --- 4. Watermark (Brackets Removed) ---
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(45);
    doc.setFont("helvetica", "bold");
    doc.text("VidyaBarta Lencho Solutions", 40, 220, { angle: 45 });

    // --- 5. Dynamic Fields Section ---
    let leftColX = 15;
    let rightColX = 110;
    let startY = 88;
    let yInc = 7;
    let currY = startY;

    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("APPLICATION DETAILS", 15, currY - 4);
    doc.setDrawColor(...accentColor);
    doc.line(15, currY - 2, 55, currY - 2);

    // Helper to format values
    const formatValue = (val) => {
      if (val === undefined || val === null || val === '') return 'N/A';
      if (Array.isArray(val)) return val.join(", ").toUpperCase();
      if (typeof val === 'boolean') return val ? 'YES' : 'NO';
      return val.toString().toUpperCase();
    };

    // Filter fields to display (excluding Documents section)
    const displayFields = admissionFields
      .filter(f => f.section !== 'Documents')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Split into two columns
    const half = Math.ceil(displayFields.length / 2);
    const leftFields = displayFields.slice(0, half);
    const rightFields = displayFields.slice(half);

    for (let i = 0; i < Math.max(leftFields.length, rightFields.length); i++) {
      const leftField = leftFields[i];
      const rightField = rightFields[i];

      const leftVal = leftField ? submittedData[leftField.name] : null;
      const rightVal = rightField ? submittedData[rightField.name] : null;

      const leftLabelSplit = leftField ? doc.splitTextToSize(`${leftField.label.toUpperCase()}:`, 52) : [];
      const rightLabelSplit = rightField ? doc.splitTextToSize(`${rightField.label.toUpperCase()}:`, 52) : [];

      const leftSplit = leftField ? doc.splitTextToSize(formatValue(leftVal), 38) : [];
      const rightSplit = rightField ? doc.splitTextToSize(formatValue(rightVal), 34) : [];
      
      const maxLines = Math.max(leftSplit.length || 1, rightSplit.length || 1, leftLabelSplit.length || 1, rightLabelSplit.length || 1);

      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currY - 4, 186, yInc + ((maxLines - 1) * 3.5) + 1, 'F');
      }

      if (leftField) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(leftLabelSplit, leftColX, currY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(leftSplit, leftColX + 54, currY);
      }

      if (rightField) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(rightLabelSplit, rightColX, currY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(rightSplit, rightColX + 54, currY);
      }
      
      currY += yInc + ((maxLines - 1) * 3.5);

      // Add a new page if we're near the bottom
      if (currY > 265) {
        doc.addPage();
        currY = 20;
      }
    }

    // Special handling for Age, Board Marks, and Elective Subjects (if not in admissionFields)
    currY += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("ADDITIONAL INFORMATION", 15, currY);
    currY += 4;

    const renderAdditional = (label, val, x, y) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${label}:`, x, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(formatValue(val), x + 48, y);
    };

    renderAdditional("AGE", age.toString(), leftColX, currY);
    if (submittedData.boardMarks) {
      renderAdditional("BOARD PERCENTAGE", `${submittedData.boardPercentage}%`, rightColX, currY);
      currY += yInc;
      renderAdditional("DARPAN ID", submittedData.darpanId, leftColX, currY);
    }
    
    if (submittedData.selectedSubjects && submittedData.selectedSubjects.length > 0) {
      currY += yInc;
      const subjects = submittedData.selectedSubjects.join(", ");
      const splitSubjects = doc.splitTextToSize(subjects.toUpperCase(), 130);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("ELECTIVE SUBJECTS:", leftColX, currY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(splitSubjects, leftColX + 48, currY);
      currY += (splitSubjects.length * 4);
    }

    // --- 6. Notice Block ---
    currY += 5;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, currY, 180, 18, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(15, currY, 180, 18, 2, 2, 'D');
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT:", 20, currY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Please bring this original receipt along with all required original documents (Aadhaar, Birth Certificate, etc.)", 20, currY + 11);
    doc.text("for the scheduled interview. Admission selection depends on the verification of these submitted details.", 20, currY + 15);

    // --- 7. Footer ---
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 280, 195, 280);
    
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text(`${schoolProfile?.name || "Holy Name High School"} | Contact: ${schoolProfile?.phone || "N/A"}`, 105, 285, { align: "center" });
    
    doc.setTextColor(148, 163, 184);
    doc.text("Securely Powered by VidyaBarta Management Software - A Product of Lencho Solutions", 105, 289, { align: "center" });

    doc.save(`Admission_Receipt_${submittedData.referenceNumber}.pdf`);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">

      {/* Payment Overlay Modal */}
      {paymentSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center animate-fade-in">
             <h3 className="text-2xl font-black text-gray-800 mb-2">Complete Payment</h3>
             <p className="text-gray-500 mb-6">Scan the QR code or tap a button below to pay ₹{admissionFee}</p>
             
             {paymentStatus === 'success' ? (
                <div className="text-green-500 flex flex-col items-center py-10">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                     <FaCheckCircle className="text-5xl" />
                   </div>
                   <h4 className="text-xl font-bold">Payment Successful!</h4>
                   <p className="text-gray-500 text-sm mt-2">Redirecting to your receipt...</p>
                </div>
             ) : (
                <>
                 <div className="bg-gray-50 p-6 rounded-2xl flex justify-center mb-6 border border-gray-100 shadow-inner">
                   <QRCodeSVG value={paymentSession.upi_intent?.bhim_link || paymentSession.payment_url} size={220} level="H" includeMargin={true} />
                 </div>
                 
                 {paymentSession.upi_intent && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <a href={paymentSession.upi_intent.gpay_link} className="bg-white border border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center text-sm hover:bg-gray-50 transition-colors shadow-sm">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="GPay" className="w-6 h-6 mb-1" /> GPay
                      </a>
                      <a href={paymentSession.upi_intent.phonepe_link} className="bg-white border border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center text-sm hover:bg-gray-50 transition-colors shadow-sm">
                        <span className="text-purple-600 text-lg mb-1 font-black">P</span> PhonePe
                      </a>
                      <a href={paymentSession.upi_intent.paytm_link} className="bg-white border border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center text-sm hover:bg-gray-50 transition-colors shadow-sm">
                         <span className="text-blue-500 font-black mb-1">Paytm</span> Paytm
                      </a>
                      <a href={paymentSession.upi_intent.bhim_link} className="bg-white border border-gray-200 py-3 rounded-xl font-bold flex flex-col items-center justify-center text-sm hover:bg-gray-50 transition-colors shadow-sm">
                         <span className="text-orange-500 font-black mb-1">BHIM</span> BHIM UPI
                      </a>
                    </div>
                 )}
                 
                 <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-50 py-3 rounded-lg border border-gray-100 mb-4">
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="font-medium">Waiting for payment confirmation...</span>
                 </div>
                 
                 <button onClick={() => { setPaymentSession(null); setPaymentStatus('pending'); }} className="text-gray-400 text-sm font-medium hover:text-gray-700 underline underline-offset-2">
                    Cancel & Edit Form
                 </button>
                </>
             )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.admission || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"}
            alt="Admissions"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              assignment_ind
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Admissions Open
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Join Our <span className="text-amber-400 italic drop-shadow-md">Community</span>
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
              Admission <span className="text-amber-600 italic">Process</span>
            </h2>
            <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600">A simple, transparent, and seamless five-step journey.</p>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {index !== steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-[2px] bg-gray-200">
                    <div className="h-full bg-amber-500 w-0 group-hover:w-full transition-all duration-500"></div>
                  </div>
                )}
                <div className="w-16 h-16 mx-auto bg-amber-50 relative z-10 rounded-full flex items-center justify-center border-4 border-white shadow-md text-amber-500 text-xl font-bold mb-4 transition-transform group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white">
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
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100 hover:border-blue-200 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                <FaLaptop />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary">Online Mode</h2>
            </div>
            <ul className="space-y-4 text-gray-600">
              {(schoolProfile.onlineAdmissionInstructions?.length > 0
                ? schoolProfile.onlineAdmissionInstructions
                : [
                  "Fill up the form with accurate details",
                  "Review your application in the preview screen",
                  "Upload all documents marked compulsory",
                  "Pay the Application Fee",
                  "Download & Print Acknowledgement Receipt",
                  "Submit the receipt during interview date allotted"
                ]
              ).map((inst, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {/* Offline Application */}
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100 hover:border-amber-200 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                <FaBuilding />
              </div>
              <h2 className="text-2xl font-serif font-bold text-primary">Offline Mode</h2>
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
                  <span className="text-amber-500 mr-2">✓</span>
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
              Apply <span className="text-amber-600 italic">Now</span>
            </h2>
            <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600">Fill out the form below to initiate the admission process.</p>
          </div>

          {!submittedData ? (
            <form key={formKey} id="admission-form" onSubmit={handleSubmit} noValidate className="max-w-5xl mx-auto space-y-6">
              
              {/* --- PREVIEW SECTION (Always in DOM, visible when showPreview is true) --- */}
              <div className={`${showPreview && previewData ? 'block' : 'hidden'} animate-fade-in`}>
                {previewData && (
                  <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-primary/10 overflow-hidden">
                    <div className="p-8 md:p-14 bg-gradient-to-br from-blue-50/50 to-white text-left">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-slate-100 pb-8">
                        <div>
                          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Review Your Application</h2>
                          <p className="text-slate-500 font-medium text-lg">Please confirm all details are correct before finalizing your submission.</p>
                        </div>
                        <div className="bg-amber-100 text-amber-700 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-amber-200 shadow-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                          Verification Step
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Left Column */}
                        <div className="space-y-12">
                          <section>
                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center bg-primary/5 p-2 rounded-lg w-fit pr-6">
                              <FaUserGraduate className="mr-3 text-lg" /> Student Information
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Full Name" value={previewData.studentName} />
                              <DetailRow label="Date of Birth" value={previewData.dateOfBirth} />
                              <DetailRow label="Gender" value={previewData.gender} />
                              <DetailRow label="Grade Applied" value={previewData.gradeApplied} />
                              <DetailRow label="Aadhaar Number" value={previewData.AadhaarNumber} />
                              <DetailRow label="Blood Group" value={previewData.bloodGroup} />
                            </div>
                          </section>

                          <section>
                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center bg-primary/5 p-2 rounded-lg w-fit pr-6">
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
                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center bg-primary/5 p-2 rounded-lg w-fit pr-6">
                              <FaGraduationCap className="mr-3 text-lg" /> Academic Background
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Previous School" value={previewData.previousSchool || 'None'} />
                              {previewData.previousSchool && (
                                <>
                                  <DetailRow label="Marks Obtained" value={previewData.prevMarksObtained} />
                                  <DetailRow label="Percentage" value={previewData.prevPercentage ? `${previewData.prevPercentage}%` : 'N/A'} />
                                  <DetailRow label="Last Attended Exam" value={previewData.lastAttendedExam} />
                                </>
                              )}
                              <DetailRow label="Stream" value={previewData.stream} />
                              <DetailRow label="Elective Subjects" value={previewData.selectedSubjects?.join(", ")} />
                              <DetailRow label="MIL Choice" value={previewData.mil} />
                            </div>
                          </section>

                          <section>
                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center bg-primary/5 p-2 rounded-lg w-fit pr-6">
                              <FaPhoneAlt className="mr-3 text-lg" /> Contact & Address
                            </h4>
                            <div className="space-y-3 pl-2">
                              <DetailRow label="Phone" value={previewData.contactNumber} />
                              <DetailRow label="Email Address" value={previewData.email} />
                              <DetailRow label="Full Address" value={previewData.address} />
                              <DetailRow label="Pincode" value={previewData.pincode} />
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* Documents Section */}
                      <section className="mt-16 pt-12 border-t border-slate-100">
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center bg-primary/5 p-2 rounded-lg w-fit pr-6">
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
                        className="w-full md:w-auto min-w-[280px] px-12 py-5 bg-primary text-white font-black rounded-[1.5rem] shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                      >
                        {submitting ? 'Processing...' : 'Confirm & Final Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* --- EDITABLE FORM SECTION (Always in DOM, hidden when showPreview is true) --- */}
              <div className={`${showPreview ? 'hidden' : 'block'}`}>
                  {/* Submission Error Display (Visible on all steps) */}
                  {submitError && (
                    <div id="form-error-banner" className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl flex items-start animate-fade-in mb-8 shadow-lg shadow-red-100/50">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mr-4 flex-shrink-0">
                        <FaExclamationCircle />
                      </div>
                      <div>
                        <h3 className="text-red-800 font-bold text-lg mb-1">Submission Error</h3>
                    <p className="text-red-600 font-medium">{submitError}</p>
                    {errorField && (
                      <p className="text-red-500 text-xs mt-2 font-bold">⚠ Please check the highlighted field and correct your input.</p>
                    )}
                    <p className="text-red-500/70 text-xs mt-2 uppercase tracking-widest font-black">Please review your details and try again</p>
                  </div>
                </div>
              )}

              <div className="space-y-12 animate-fade-in">
                {([...new Set(admissionFields.map(f => f.section))]).map(sectionName => {
                  if (sectionName === "Academic Background" && gradeKey && ["pre-nursery", "kg1", "kg2"].includes(gradeKey)) {
                    return null;
                  }
                  return (
                  <div key={sectionName} className="space-y-6">
                    <h3 className="text-xl font-serif font-bold text-primary mt-8 mb-4 border-b-2 border-primary/10 pb-2 flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                      {sectionName}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {admissionFields
                        .filter(f => f.section === sectionName)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(field => renderDynamicField(field))
                      }
                    </div>

                    {/* --- Section Specific Conditional Logic --- */}
                    
                    {/* Student Information Conditionals */}
                    {sectionName === "Student Information" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-2">
                        {/* PEN Number logic */}
                        {gradeKey && !["pre-nursery", "kg1", "kg2", "class1", "class2"].includes(gradeKey) && (
                          <div className="md:col-span-2">
                            <label className="block text-gray-700 font-medium mb-2">PEN (Permanent Education Number) *</label>
                            <div className="relative">
                              <input
                                name="penNumber"
                                type="text"
                                value={penNumber}
                                onChange={(e) => setPenNumber(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20))}
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-colors uppercase pr-12 ${
                                  penStatus === 'valid' ? 'border-green-400 focus:ring-green-500 focus:border-green-500 bg-green-50/30' :
                                  penStatus === 'invalid' ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/30' :
                                  'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                                }`}
                                placeholder="ENTER PEN NUMBER"
                                required
                              />
                              {penStatus === 'valid' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">✅</span>}
                              {penStatus === 'invalid' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg">❌</span>}
                            </div>
                            {penStatus === 'invalid' && <p className="text-red-500 text-xs mt-1 font-semibold">⚠ PEN must be 8–20 alphanumeric characters</p>}
                          </div>
                        )}

                        {/* MIL & Elective for Class 9-10 */}
                        {(gradeKey === "class9" || gradeKey === "class10") && (
                          <>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">MIL (Modern Indian Language) *</label>
                              <select name="mil" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors uppercase" required>
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
                              <select name="elective" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" required>
                                <option value="">Select Elective</option>
                                <option value="advanced_math">Advanced Mathematics (E)</option>
                                <option value="geography">Geography (E)</option>
                                <option value="history">History (E)</option>
                                <option value="sanskrit">Sanskrit (E)</option>
                                <option value="arabic">Arabic (E)</option>
                                <option value="persian">Persian (E)</option>
                                <option value="santhali">Santhali (E)</option>
                                <option value="computer_science">Computer Science (E)</option>
                                <option value="fine_art">Fine Art (E)</option>
                                <option value="music">Music (E)</option>
                                <option value="dance">Dance (E)</option>
                                <option value="home_science">Home Science (E)</option>
                                <option value="woodcraft">Woodcraft (E)</option>
                                <option value="garment_designing">Garment Designing (E)</option>
                                <option value="weaving_textile">Weaving and Textile Design (E)</option>
                                <option value="assamese_e">Assamese (E)</option>
                                <option value="hindi_e">Hindi (E)</option>
                                <option value="manipuri_e">Manipuri (E)</option>
                                <option value="commerce_e">Commerce (E)</option>
                                <option value="yoga_pe">Yoga and Physical Education (E)</option>
                                <option value="it_ites">IT/ITeS NSQF (E)</option>
                                <option value="retail_trade">Retail Trade NSQF (E)</option>
                                <option value="agriculture_horticulture">Agriculture & Horticulture</option>
                                <option value="animal_health">Animal Health Worker NSQF (E)</option>
                                <option value="tourism_hospitality">Tourism & Hospitality NSQF (E)</option>
                                <option value="health_care">Health Care NSQF (E)</option>
                                <option value="private_security">Private Security NSQF (E)</option>
                                <option value="beauty_wellness">Beauty and Wellness NSQF (E)</option>
                                <option value="automotive">Automotive NSQF (E)</option>
                                <option value="electronics_hardware">Electronics and Hardware NSQF (E)</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* Stream Selection for Class 11-12 */}
                        {gradeKey && (gradeKey === 'class11' || gradeKey === 'class12') && (
                          <>
                            <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-2">
                              <p className="text-sm font-bold text-primary flex items-center mb-2">💼 Compulsory Subjects</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-primary">English</span>
                                <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-primary">Environmental Education</span>
                                {selectedStream === 'science' && (
                                  <>
                                    <span className="px-3 py-1 bg-indigo-100 border border-indigo-300 rounded-full text-xs font-bold text-indigo-700">Physics</span>
                                    <span className="px-3 py-1 bg-indigo-100 border border-indigo-300 rounded-full text-xs font-bold text-indigo-700">Chemistry</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">MIL / Alternative English *</label>
                              <select name="mil" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" required>
                                <option value="">Select Language</option>
                                <option value="assamese">Assamese</option>
                                <option value="bodo">Bodo</option>
                                <option value="hindi">Hindi</option>
                                <option value="bengali">Bengali</option>
                                <option value="nepali">Nepali</option>
                                <option value="urdu">Urdu</option>
                                <option value="khasi">Khasi</option>
                                <option value="garo">Garo</option>
                                <option value="mizo">Mizo</option>
                                <option value="manipuri">Manipuri</option>
                                <option value="hmar">Hmar</option>
                                <option value="karbi">Karbi</option>
                                <option value="alt_english">Alternative English</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-2">Select Stream *</label>
                              <select
                                name="stream"
                                value={selectedStream}
                                onChange={(e) => {
                                  setSelectedStream(e.target.value);
                                  setSelectedSubjects([]);
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                                required
                              >
                                <option value="">Choose Stream</option>
                                <option value="science">Science</option>
                                <option value="arts">Arts</option>
                                <option value="commerce">Commerce</option>
                              </select>
                            </div>
                            
                            {/* Stream-specific subject selection */}
                            {selectedStream && (
                              <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                                  <span>Select Elective Subjects (Select {selectedStream === 'science' ? 2 : 4}) *</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedSubjects.length === (selectedStream === 'science' ? 2 : 4) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {selectedSubjects.length} / {selectedStream === 'science' ? 2 : 4} Selected
                                  </span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {(selectedStream === 'science' ? ['Mathematics', 'Biology', 'Computer Science and Application', 'Economic Geography'] :
                                    selectedStream === 'arts' ? ['Political Science', 'Economics', 'History', 'Education', 'Geography', 'Logic & Philosophy', 'Mathematics', 'Computer Science and Application', 'Sanskrit', 'Advanced Assamese', 'Advanced Hindi'] :
                                    ['Accountancy', 'Business Studies', 'Economics', 'Business Mathematics and Statistics', 'Mathematics', 'Sales Management and Advertising', 'Insurance', 'Finance', 'Economic Geography', 'Computer Science and Application', 'Entrepreneurship Development', 'Multimedia and Web Technology']
                                  ).map(sub => (
                                    <label key={sub} className="flex items-center p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                                      <input
                                        type="checkbox"
                                        checked={selectedSubjects.includes(sub)}
                                        onChange={() => handleSubjectChange(sub)}
                                        className="w-5 h-5 accent-amber-500 mr-3"
                                      />
                                      <span className="text-sm text-gray-700">{sub}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Class X Board Marks for Class XI */}
                            {gradeKey === 'class11' && (
                              <div className="md:col-span-2 mt-4 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                                <h3 className="text-lg font-bold text-indigo-900 mb-1 flex items-center">
                                  <FaGraduationCap className="mr-2 text-indigo-500" />
                                  Class X Board Examination Results
                                </h3>
                                <p className="text-xs text-indigo-600/70 mb-6">Enter total marks obtained (out of 600).</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-2 text-sm">Total Marks *</label>
                                    <input
                                      name="boardMarks"
                                      type="number"
                                      value={boardMarks}
                                      onChange={(e) => setBoardMarks(e.target.value)}
                                      className="w-full px-4 py-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-center"
                                      placeholder="e.g. 450"
                                      required
                                    />
                                  </div>
                                  {boardMarks > 0 && (
                                    <>
                                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm text-center">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Percentage</p>
                                        <p className="text-2xl font-black text-indigo-700">{((boardMarks / 600) * 100).toFixed(2)}%</p>
                                      </div>
                                      <div>
                                        <label className="block text-gray-700 font-medium mb-2 text-sm">Division *</label>
                                        <select name="boardDivision" value={boardDivision} onChange={(e) => setBoardDivision(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase text-sm" required>
                                          <option value="">SELECT DIVISION</option>
                                          <option value="Rank">🏆 Rank (95%+)</option>
                                          <option value="Distinction">⭐ Distinction (85–94%)</option>
                                          <option value="Star">✨ Star (75–84%)</option>
                                          <option value="1st Division">1st Division (60–74%)</option>
                                          <option value="2nd Division">2nd Division (50–59%)</option>
                                          <option value="3rd Division">3rd Division (30–49%)</option>
                                        </select>
                                      </div>
                                    </>
                                  )}
                                  <div className="md:col-span-3">
                                    <label className="block text-gray-700 font-medium mb-2 text-sm flex items-center justify-between">
                                       <span>DARPAN ID (AHSEC Registration) *</span>
                                       <a href="https://darpan.ahseconline.in/" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 underline">Don't have one?</a>
                                    </label>
                                    <input name="darpanId" type="text" value={darpanId} onChange={(e) => setDarpanId(e.target.value.toUpperCase())} className="w-full px-4 py-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-semibold" placeholder="ENTER DARPAN ID" required />
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Academic Background Conditionals */}
                    {sectionName === "Academic Background" && (
                      <div className="space-y-6">
                        {/* Sports Interest */}
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                          <label className="flex items-center cursor-pointer group">
                            <div className="relative">
                              <input type="checkbox" className="sr-only" checked={sportsActive} onChange={() => setSportsActive(!sportsActive)} />
                              <div className={`w-12 h-6 rounded-full transition-colors ${sportsActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                              <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${sportsActive ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-lg font-bold text-primary">🏅 Active in Sports?</h4>
                              <p className="text-sm text-gray-600">Tell us about your sports participation.</p>
                            </div>
                          </label>
                          {sportsActive && (
                            <div className="mt-4 ml-16">
                              <input name="sportsType" type="text" value={sportsType} onChange={(e) => setSportsType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none uppercase" placeholder="E.G. FOOTBALL, CRICKET" required />
                            </div>
                          )}
                        </div>

                        {/* NCC Interest */}
                        {["class8", "class9", "class10", "class11", "class12"].includes(gradeKey) && (
                          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                            <label className="flex items-center cursor-pointer group">
                              <div className="relative">
                                <input type="checkbox" className="sr-only" checked={nccInterest} onChange={() => setNccInterest(!nccInterest)} />
                                <div className={`w-12 h-6 rounded-full transition-colors ${nccInterest ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${nccInterest ? 'translate-x-6' : ''}`}></div>
                              </div>
                              <div className="ml-4">
                                <h4 className="text-lg font-bold text-primary flex items-center"><FaShieldAlt className="mr-2 text-amber-600" /> Interested in joining NCC?</h4>
                                <p className="text-sm text-gray-600">Join the 11th Assam Battalion leadership program.</p>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              <h3 className="text-xl font-serif font-bold text-primary mt-8 mb-4 border-b pb-2">Documents to Upload</h3>
              {errorField === 'documents' && (
                <div id="documents-error" className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-start mb-6 animate-pulse shadow-md shadow-red-100/50">
                  <div className="w-9 h-9 bg-red-100 text-red-500 rounded-xl flex items-center justify-center text-lg mr-3 flex-shrink-0">
                    <FaExclamationCircle />
                  </div>
                  <div>
                    <h4 className="text-red-800 font-bold text-sm mb-0.5">Document Upload Failed</h4>
                    <p className="text-red-600 text-xs font-medium">{submitError}</p>
                    <p className="text-red-400 text-[10px] mt-1 font-semibold">Please ensure files are JPG, PNG, or PDF and under 5MB each. Try re-selecting your files.</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Student Passport Photo *</label>
                  <input name="studentPhoto" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFilePreview(e, 'studentPhoto')} className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                  <p className="text-xs text-gray-500 mt-1">JPG or PNG (Max 2MB)</p>
                  {filePreviews.studentPhoto && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                      {filePreviews.studentPhoto.url ? (
                        <img src={filePreviews.studentPhoto.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 text-lg"><FaFileAlt /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{filePreviews.studentPhoto.name}</p>
                        <p className="text-[10px] text-gray-400">{(filePreviews.studentPhoto.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Birth Certificate *</label>
                  <input name="birthCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFilePreview(e, 'birthCertificate')} className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                  {filePreviews.birthCertificate && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                      {filePreviews.birthCertificate.url ? (
                        <img src={filePreviews.birthCertificate.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-red-50 rounded-lg flex items-center justify-center text-red-400 text-lg"><FaFileAlt /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{filePreviews.birthCertificate.name}</p>
                        <p className="text-[10px] text-gray-400">{(filePreviews.birthCertificate.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Transfer Certificate — Only if attended a previous school */}
                {hasPreviousSchool && !["pre-nursery", "kg1"].includes(gradeKey) && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Transfer Certificate *</label>
                  <input name="transferCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFilePreview(e, 'transferCertificate')} className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                  {filePreviews.transferCertificate && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                      {filePreviews.transferCertificate.url ? (
                        <img src={filePreviews.transferCertificate.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center text-green-400 text-lg"><FaFileAlt /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{filePreviews.transferCertificate.name}</p>
                        <p className="text-[10px] text-gray-400">{(filePreviews.transferCertificate.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
                )}
                {/* Marksheet — Not applicable for Pre-Nursery and KG I */}
                {!["pre-nursery", "kg1"].includes(gradeKey) && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Previous Class Marksheet *</label>
                  <input name="marksheet" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFilePreview(e, 'marksheet')} className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
                  {filePreviews.marksheet && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                      {filePreviews.marksheet.url ? (
                        <img src={filePreviews.marksheet.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-purple-50 rounded-lg flex items-center justify-center text-purple-400 text-lg"><FaFileAlt /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{filePreviews.marksheet.name}</p>
                        <p className="text-[10px] text-gray-400">{(filePreviews.marksheet.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
                )}
                {caste && caste.toLowerCase() !== 'general' && (
                  <div className="md:col-span-2 p-6 bg-amber-50 rounded-2xl border border-amber-200 animate-fadeIn transition-all">
                    <h3 className="font-bold text-amber-800 mb-4 flex items-center">
                      <FaIdBadge className="mr-2" /> Caste Certificate *
                    </h3>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-amber-600 uppercase tracking-widest">Upload Certificate ({caste})</label>
                      <input required={caste.toLowerCase() !== 'general'} type="file" name="casteCertificate" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFilePreview(e, 'casteCertificate')} className="w-full px-4 py-[9px] rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" />
                      <p className="text-xs text-amber-700/70 mt-1">Required for {caste} category. (Max 5MB)</p>
                      {filePreviews.casteCertificate && (
                        <div className="mt-2 p-2 bg-white rounded-xl border border-amber-200 flex items-center gap-3">
                          {filePreviews.casteCertificate.url ? (
                            <img src={filePreviews.casteCertificate.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-amber-200 shadow-sm" />
                          ) : (
                            <div className="w-14 h-14 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 text-lg"><FaFileAlt /></div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{filePreviews.casteCertificate.name}</p>
                            <p className="text-[10px] text-gray-400">{(filePreviews.casteCertificate.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Aadhaar Card / VID Photo {AadhaarNumber ? '' : '*'}</label>
                  <input name="AadhaarVidOrReceipt" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFilePreview(e, 'AadhaarVidOrReceipt')} className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required={!AadhaarNumber} />
                  {!AadhaarNumber && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start mt-2">
                      <div className="text-amber-500 mr-2 mt-0.5 text-sm">💡</div>
                      <p className="text-xs text-amber-800">
                        <strong>Aadhaar Missing?</strong> Please upload <strong>Aadhaar VID Scan</strong> or <strong>Application Receipt</strong>.
                      </p>
                    </div>
                  )}
                  {filePreviews.AadhaarVidOrReceipt && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                      {filePreviews.AadhaarVidOrReceipt.url ? (
                        <img src={filePreviews.AadhaarVidOrReceipt.url} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-400 text-lg"><FaFileAlt /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{filePreviews.AadhaarVidOrReceipt.name}</p>
                        <p className="text-[10px] text-gray-400">{(filePreviews.AadhaarVidOrReceipt.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-6">
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={submitting}
                  className={`text-white font-bold px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 text-lg flex items-center justify-center mx-auto shadow-lg ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90'}`}
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
            </form>
          ) : (
            <div className="max-w-3xl mx-auto py-10 animate-fade-in">
              {/* Success Icon */}
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm">
                  <FaCheckCircle />
                </div>
                <h3 className="text-3xl md:text-4xl font-serif font-black text-primary mb-2">Success!</h3>
                <p className="text-gray-500 text-lg">Your application has been submitted successfully.</p>
              </div>

              {/* Receipt Preview */}
              <div className="bg-white p-8 md:p-10 rounded-3xl border-2 border-gray-200 text-left relative shadow-xl overflow-hidden mb-10 transition-all">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-900"></div>

                {/* School Header */}
                <div className="flex flex-col items-center text-center border-b border-gray-100 pb-8 mb-8 pt-4">
                  {schoolProfile?.logo && (
                    <img
                      src={schoolProfile.logo}
                      alt="School Logo"
                      className="w-24 h-24 object-contain mb-4 transform hover:scale-105 transition-transform"
                    />
                  )}
                  <h2 className="text-3xl md:text-4xl font-serif font-black text-primary tracking-tighter leading-none mb-2">
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
                <div className="bg-white rounded-2xl p-8 mb-8 text-center border-2 border-gray-900 shadow-sm group transition-colors">
                  <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-3">Application Reference Number</p>
                  <p className="font-mono text-4xl md:text-5xl font-black text-gray-900 tracking-tighter select-all">
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
                        <span key={i} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-full text-xs shadow-sm">{sub}</span>
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
                  onClick={handleDownloadReceipt}
                  className="group flex-1 max-w-sm bg-primary text-white font-black px-10 py-5 rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center transform hover:-translate-y-2 active:scale-95"
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
                  className="flex-1 max-w-sm bg-white text-primary font-black px-10 py-5 rounded-3xl hover:bg-gray-50 transition-all border-2 border-primary/10 flex items-center justify-center shadow-xl transform hover:-translate-y-1 active:scale-95"
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
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-3">Check Application Status</h2>
            <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full mb-4"></div>
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg shadow-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={statusLoading}
                className={`bg-primary text-white font-bold px-10 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-md transform hover:-translate-y-1 text-lg flex items-center justify-center whitespace-nowrap ${statusLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            <div className="flex items-start bg-red-50 border border-red-100 text-red-700 p-5 rounded-2xl animate-fade-in">
              <FaExclamationCircle className="text-xl mr-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Application Not Found</p>
                <p className="text-sm text-red-600">{statusError}</p>
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
                  <h3 className="text-xl font-serif font-bold text-primary mb-6 flex items-center">
                    <FaClipboardCheck className="mr-3 text-amber-500" />
                    Application Status
                  </h3>

                  {/* Progress Timeline */}
                  {statusData.status !== 'rejected' && (
                    <div className="mb-10">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full z-0">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full transition-all duration-700"
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
                                  ? 'bg-amber-500 text-white scale-110 ring-4 ring-amber-200'
                                  : 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                                }`}>
                                {isCompleted && !isCurrent ? <FaCheckCircle /> : <StepIcon />}
                              </div>
                              <p className={`text-xs font-bold mt-2 uppercase tracking-wider ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
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
                      <p className="text-gray-600 text-sm font-medium leading-relaxed">{info.desc}</p>
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
            <a href={`tel:${schoolProfile?.phone || ''}`} className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors">
              <FaPhoneAlt className="text-amber-500 mr-2" />
              {schoolProfile?.phone}
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a href={`mailto:${schoolProfile?.email || ''}`} className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors">
              <FaEnvelope className="text-amber-500 mr-2" />
              {schoolProfile?.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admission;
