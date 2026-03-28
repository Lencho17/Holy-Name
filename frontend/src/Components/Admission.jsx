import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { FaLaptop, FaBuilding, FaClipboardList, FaGraduationCap, FaPhoneAlt, FaEnvelope, FaCheckCircle, FaSearch, FaExclamationCircle, FaIdBadge, FaCalendarAlt, FaUserGraduate, FaFileAlt, FaUserCheck, FaClipboardCheck, FaPrint } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Admission() {
  const { schoolProfile, API_URL: ctxApiUrl } = useContext(SiteDataContext);
  const apiBase = ctxApiUrl || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
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
    { key: "reviewed", label: "Reviewed", icon: FaClipboardCheck },
    { key: "accepted", label: "Accepted", icon: FaUserCheck },
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
      case 'reviewed': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-500/20', label: 'Under Review', icon: '📋', desc: 'Your application has been reviewed. An interview date will be allotted shortly.' };
      default: return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20', label: 'Pending', icon: '⏳', desc: 'Your application is being processed. Please check back later.' };
    }
  };

  const getActiveStep = (status) => {
    if (status === 'rejected') return -1;
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  // Form field states for conditional logic
  const [gradeApplied, setGradeApplied] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [contactNumber, setContactNumber] = useState("");

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length <= 10) {
      setContactNumber(value);
    }
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const form = e.target;
    const formData = new FormData();
    formData.append('studentName', form.querySelector('[name="studentName"]')?.value || '');
    formData.append('dateOfBirth', form.querySelector('[name="dateOfBirth"]')?.value || '');
    formData.append('placeOfBirth', form.querySelector('[name="placeOfBirth"]')?.value || '');
    formData.append('gender', form.querySelector('[name="gender"]')?.value || '');
    formData.append('religion', form.querySelector('[name="religion"]')?.value || '');
    formData.append('caste', form.querySelector('[name="caste"]')?.value || '');
    formData.append('bloodGroup', form.querySelector('[name="bloodGroup"]')?.value || '');
    formData.append('aadharNumber', form.querySelector('[name="aadharNumber"]')?.value || '');
    formData.append('penNumber', form.querySelector('[name="penNumber"]')?.value || '');
    formData.append('previousSchool', form.querySelector('[name="previousSchool"]')?.value || '');
    formData.append('gradeApplied', form.querySelector('[name="gradeApplied"]')?.value || '');
    formData.append('stream', form.querySelector('[name="stream"]')?.value || '');
    
    formData.append('fatherName', form.querySelector('[name="fatherName"]')?.value || '');
    formData.append('fatherOccupation', form.querySelector('[name="fatherOccupation"]')?.value || '');
    formData.append('motherName', form.querySelector('[name="motherName"]')?.value || '');
    formData.append('motherOccupation', form.querySelector('[name="motherOccupation"]')?.value || '');
    formData.append('guardianName', form.querySelector('[name="guardianName"]')?.value || '');
    formData.append('relationship', form.querySelector('[name="relationship"]')?.value || '');
    formData.append('contactNumber', form.querySelector('[name="contactNumber"]')?.value || '');
    formData.append('email', form.querySelector('[name="email"]')?.value || '');
    formData.append('address', form.querySelector('[name="address"]')?.value || '');
    formData.append('po', form.querySelector('[name="po"]')?.value || '');
    formData.append('ps', form.querySelector('[name="ps"]')?.value || '');
    formData.append('pincode', form.querySelector('[name="pincode"]')?.value || '');
    formData.append('elective', form.querySelector('[name="elective"]')?.value || '');
    formData.append('mil', form.querySelector('[name="mil"]')?.value || '');

    // Class 11-12 specialized subjects
    if (gradeApplied === "class11" || gradeApplied === "class12") {
      selectedSubjects.forEach(subject => formData.append('selectedSubjects[]', subject));
    }

    // At least one parent/guardian check
    if (!formData.get('fatherName') && !formData.get('motherName') && !formData.get('guardianName')) {
      setSubmitError('Please provide at least one Parent or Guardian name.');
      setSubmitting(false);
      return;
    }

    // Relationship is required if Guardian is provided
    if (formData.get('guardianName') && !formData.get('relationship')) {
      setSubmitError('Please specify your relationship to the student.');
      setSubmitting(false);
      return;
    }

    // File uploads
    const tcFile = form.querySelector('[name="transferCertificate"]')?.files[0];
    const msFile = form.querySelector('[name="marksheet"]')?.files[0];
    const aadharFile = form.querySelector('[name="aadharVidOrReceipt"]')?.files[0];
    const photoFile = form.querySelector('[name="studentPhoto"]')?.files[0];
    const birthFile = form.querySelector('[name="birthCertificate"]')?.files[0];

    if (tcFile) formData.append('transferCertificate', tcFile);
    if (msFile) formData.append('marksheet', msFile);
    if (aadharFile) formData.append('aadharVidOrReceipt', aadharFile);
    if (photoFile) formData.append('studentPhoto', photoFile);
    if (birthFile) formData.append('birthCertificate', birthFile);

    try {
      const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
      const res = await axios.post(`${apiBase}/admissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmittedData({
        referenceNumber: res.data.referenceNumber,
        studentName: formData.get('studentName'),
        gradeApplied: formData.get('gradeApplied'),
        penNumber: formData.get('penNumber') || '',
        email: formData.get('email'),
        contactNumber: formData.get('contactNumber'),
        stream: formData.get('stream') || '',
        mil: formData.get('mil') || '',
        elective: formData.get('elective') || '',
        selectedSubjects: [...selectedSubjects],
        dateOfApplication: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      });
      window.scrollTo({ top: document.getElementById('apply').offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[280px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Admissions</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
            Join a community dedicated to educational excellence and holistic growth.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Admission Process</h2>
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
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Fill up the form
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Upload all documents marked compulsory
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Pay the Fee
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Download & Print Acknowledgement Receipt
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Submit the receipt during interview date allotted
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                You can check the status of your application by reference number or email verification
              </li>
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
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Visit the school administrative block during working hours (9 AM - 3 PM).
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Collect the admission application packet from the front desk.
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Fill out the form manually in CAPITAL letters.
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Attach photocopies of necessary documents.
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Submit the completed docket and pay the fee at the cash counter.
              </li>
            </ul>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100" id="apply">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Apply Now</h2>
            <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600">Fill out the form below to initiate the admission process.</p>
          </div>

          {!submittedData ? (
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Student Name (As per Aadhar) *</label>
                <input name="studentName" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter full name" required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Date of Birth *</label>
                <input name="dateOfBirth" type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Aadhar Number</label>
                <input 
                  name="aadharNumber" 
                  type="text" 
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" 
                  placeholder="12-digit Aadhar number" 
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Place of Birth</label>
                <input name="placeOfBirth" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter place of birth" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Gender *</label>
                <select name="gender" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Blood Group</label>
                <select name="bloodGroup" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors">
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Religion</label>
                <input name="religion" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter religion" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Caste</label>
                <input name="caste" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter caste" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Grade/Class Applied For *</label>
                <select 
                  name="gradeApplied"
                  value={gradeApplied}
                  onChange={(e) => setGradeApplied(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" 
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="nursery">Nursery</option>
                  <option value="lkg">LKG</option>
                  <option value="ukg">UKG</option>
                  <option value="class1">Class I</option>
                  <option value="class2">Class II</option>
                  <option value="class3">Class III</option>
                  <option value="class4">Class IV</option>
                  <option value="class5">Class V</option>
                  <option value="class6">Class VI</option>
                  <option value="class7">Class VII</option>
                  <option value="class8">Class VIII</option>
                  <option value="class9">Class IX</option>
                  <option value="class10">Class X</option>
                  <option value="class11">Class XI</option>
                  <option value="class12">Class XII</option>
                </select>
              </div>
              
              {/* Conditional PEN Number for Class 2+ */}
              {gradeApplied && !["nursery", "lkg", "ukg", "class1"].includes(gradeApplied) && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">PEN (Permanent Education Number) *</label>
                  <input name="penNumber" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter PEN number" required />
                </div>
              )}

              {/* Conditional MIL & Elective for Class 9-10 */}
              {(gradeApplied === "class9" || gradeApplied === "class10") && (
                <>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">MIL (Modern Indian Language) *</label>
                    <select name="mil" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" required>
                      <option value="">Select MIL</option>
                      <option value="assamese">Assamese</option>
                      <option value="bengali">Bengali</option>
                      <option value="hindi">Hindi</option>
                      <option value="bodo">Bodo</option>
                      <option value="urdu">Urdu</option>
                      <option value="manipuri">Manipuri</option>
                      <option value="nepali">Nepali</option>
                      <option value="khasi">Khasi</option>
                      <option value="garo">Garo</option>
                      <option value="mizo">Mizo</option>
                      <option value="hmar">Hmar</option>
                      <option value="karbi">Karbi</option>
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

              {/* Conditional Stream Selection for 11-12 */}
              {(gradeApplied === "class11" || gradeApplied === "class12") && (
                <>
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-2">
                    <p className="text-sm font-bold text-primary flex items-center mb-2">
                       💼 Compulsory Subjects
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-primary">English</span>
                      <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-primary">Environmental Education</span>
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
                        setSelectedSubjects([]); // Reset subjects on stream change
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" 
                      required
                    >
                      <option value="">Choose Stream</option>
                      <option value="science">Science</option>
                      <option value="commerce">Commerce</option>
                      <option value="arts">Arts / Humanities</option>
                    </select>
                  </div>

                  {/* Dynamic Elective Checkboxes for 11-12 */}
                  {selectedStream && (
                    <div className="md:col-span-2 mt-4">
                      <label className="block text-gray-700 font-bold mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100 italic">
                         Please select your elective subjects:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Science Subjects */}
                        {selectedStream === 'science' && [
                          'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Geology'
                        ].map(sub => (
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

                        {/* Arts Subjects */}
                        {selectedStream === 'arts' && [
                          'Political Science', 'History', 'Geography', 'Education', 'Economics', 
                          'Sociology', 'Logic & Philosophy', 'Anthropology', 'Mathematics', 'Home Science'
                        ].map(sub => (
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

                        {/* Commerce Subjects */}
                        {selectedStream === 'commerce' && [
                          'Accountancy', 'Business Studies', 'Economics', 
                          'Business Mathematics and Statistics', 'Mathematics',
                          'Sales Management and Advertising', 'Insurance', 'Finance', 
                          'Economic Geography', 'Computer Science and Application', 
                          'Entrepreneurship Development', 'Multimedia and Web Technology'
                        ].map(sub => (
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
                </>
              )}

              <div>
                <label className="block text-gray-700 font-medium mb-2">Previous School Attended (If any)</label>
                <input 
                  name="previousSchool" 
                  type="text" 
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" 
                  placeholder="School name" 
                />
              </div>
            </div>

            <h3 className="text-xl font-serif font-bold text-primary mt-8 mb-4 border-b pb-2">Parent / Guardian Information (At least one name is mandatory)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Father's Name</label>
                <input name="fatherName" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter father's name" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Father's Occupation</label>
                <input name="fatherOccupation" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter father's occupation" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Mother's Name</label>
                <input name="motherName" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter mother's name" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Mother's Occupation</label>
                <input name="motherOccupation" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter mother's occupation" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Guardian's Full Name</label>
                <input name="guardianName" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter guardian's name" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Relationship to Student</label>
                <input name="relationship" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="e.g. Father, Mother" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Number *</label>
                <input 
                  name="contactNumber" 
                  type="tel" 
                  value={contactNumber}
                  onChange={handlePhoneChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors ${contactNumber.length > 0 && contactNumber.length < 10 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} 
                  placeholder="10-digit phone number" 
                  required 
                />
                {contactNumber.length > 0 && contactNumber.length < 10 && (
                  <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit number</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email Address *</label>
                <input name="email" type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="Enter email address" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-3">
                <label className="block text-gray-700 font-medium mb-2">Residential Address *</label>
                <textarea name="address" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" rows="2" placeholder="House No, Street, Village/Town" required></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Post Office (PO) *</label>
                <input name="po" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="PO name" required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Police Station (PS) *</label>
                <input name="ps" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="PS name" required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Pincode *</label>
                <input name="pincode" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors" placeholder="6-digit pincode" required />
              </div>
            </div>

            <h3 className="text-xl font-serif font-bold text-primary mt-8 mb-4 border-b pb-2">Documents to Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Student Passport Photo *</label>
                <input name="studentPhoto" type="file" accept=".jpg,.jpeg,.png" className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                <p className="text-xs text-gray-500 mt-1">JPG or PNG (Max 2MB)</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Birth Certificate *</label>
                <input name="birthCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Transfer Certificate {previousSchool ? '*' : '(If applicable)'}</label>
                <input name="transferCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required={!!previousSchool} />
                <p className="text-xs text-gray-500 mt-1">Required if you attended a previous school</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Previous Class Marksheet *</label>
                <input name="marksheet" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required />
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Aadhar Card / VID Photo {aadharNumber ? '' : '*'}</label>
                <input name="aadharVidOrReceipt" type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full px-4 py-[9px] rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white" required={!aadharNumber} />
                {!aadharNumber && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start mt-2">
                    <div className="text-amber-500 mr-2 mt-0.5 text-sm">💡</div>
                    <p className="text-xs text-amber-800">
                      <strong>Aadhar Missing?</strong> Please upload <strong>Aadhar VID Scan</strong> or <strong>Application Receipt</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center pt-6">
              <button 
                type="submit" 
                disabled={submitting}
                className={`text-white font-bold px-10 py-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 text-lg flex items-center justify-center mx-auto ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 hover:shadow-lg'}`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Application...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
          ) : (
            <div className="max-w-3xl mx-auto py-10 animate-fade-in" id="receipt-area">
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #receipt-area, #receipt-area * { visibility: visible; }
                  #receipt-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
                  .no-print { display: none !important; }
                }
              `}</style>

              {/* Success Icon (hidden in print) */}
              <div className="text-center no-print">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                  <FaCheckCircle />
                </div>
                <h3 className="text-3xl font-serif font-bold text-primary mb-8">Application Submitted Successfully!</h3>
              </div>

              {/* Receipt Card */}
              <div className="bg-white p-8 md:p-10 rounded-2xl border-2 border-gray-200 text-left relative shadow-lg">
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-t-2xl"></div>

                {/* School Header */}
                <div className="flex flex-col items-center text-center border-b-2 border-gray-200 pb-6 mb-6 pt-2">
                  <img 
                    src={schoolProfile?.logo || "/Pictures/Logo.jpg"} 
                    alt="School Logo" 
                    className="w-20 h-20 object-contain mb-3"
                  />
                  <h2 className="text-2xl md:text-3xl font-serif font-black text-primary tracking-tight">
                    {schoolProfile?.name || "Holy Name School"}
                  </h2>
                  <p className="text-sm text-amber-600 font-semibold italic tracking-wider mt-1">
                    {schoolProfile?.punchLine || "Let Your Light Shine"}
                  </p>
                  <div className="h-0.5 w-16 bg-amber-400 mt-3"></div>
                  <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-widest">Admission Acknowledgement Receipt</p>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 text-[15px]">
                  {/* Reference & Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Reference ID</p>
                      <p className="font-mono font-black text-primary text-lg">{submittedData.referenceNumber}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Date of Application</p>
                      <p className="font-bold text-gray-800">{submittedData.dateOfApplication}</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 my-4"></div>

                  {/* Student Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">Student Name</span>
                      <span className="font-bold text-gray-900">{submittedData.studentName}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">Class Applied</span>
                      <span className="font-bold text-gray-900 uppercase">{submittedData.gradeApplied}</span>
                    </div>
                  </div>

                  {submittedData.penNumber && (
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">PEN Number</span>
                      <span className="font-mono font-bold text-gray-900">{submittedData.penNumber}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">Email</span>
                      <span className="font-bold text-gray-900 text-sm">{submittedData.email}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">Phone</span>
                      <span className="font-bold text-gray-900">{submittedData.contactNumber}</span>
                    </div>
                  </div>

                  {/* Stream & Subjects (for Class 11-12) */}
                  {submittedData.stream && (
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">Stream</span>
                      <span className="font-bold text-gray-900 uppercase">{submittedData.stream}</span>
                    </div>
                  )}

                  {submittedData.mil && (
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">MIL / Language</span>
                      <span className="font-bold text-gray-900 capitalize">{submittedData.mil}</span>
                    </div>
                  )}

                  {submittedData.elective && (
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <span className="text-gray-500 font-medium text-sm">Elective Subject</span>
                      <span className="font-bold text-gray-900 capitalize">{submittedData.elective.replace(/_/g, ' ')}</span>
                    </div>
                  )}

                  {submittedData.selectedSubjects?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-gray-500 font-medium text-sm mb-2">Selected Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {submittedData.selectedSubjects.map((sub, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-primary/20 rounded-full text-xs font-bold text-primary">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-dashed border-gray-200 mt-6 mb-5"></div>

                {/* Important Note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                  <p className="text-sm text-amber-900 text-center">
                    <strong>Important:</strong> Please save this reference number (<span className="font-mono font-black">{submittedData.referenceNumber}</span>) for tracking your application status and future communication.
                  </p>
                </div>

                {/* Help Desk Footer */}
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">School Help Desk</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                    <span className="flex items-center text-gray-700 font-medium">
                      <FaPhoneAlt className="text-primary mr-2 text-xs" />
                      {schoolProfile?.phone || "6901055733"}
                    </span>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="flex items-center text-gray-700 font-medium">
                      <FaEnvelope className="text-primary mr-2 text-xs" />
                      {schoolProfile?.email || "holynameschool@gmail.com"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{schoolProfile?.officeAddress || ""}</p>
                </div>
              </div>

              {/* Action Buttons (hidden in print) */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center no-print mt-8">
                <button 
                  onClick={() => window.print()}
                  className="bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-opacity-90 transition-all shadow-md flex items-center justify-center transform hover:-translate-y-1"
                >
                  <FaClipboardList className="mr-2" />
                  Print / Save as PDF
                </button>
                <button 
                  onClick={() => setSubmittedData(null)}
                  className="bg-gray-100 text-gray-700 font-bold px-8 py-4 rounded-full hover:bg-gray-200 transition-all shadow-sm flex items-center justify-center"
                >
                  Submit Another Application
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
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm ${
                                isCompleted
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
            <a href={`tel:${schoolProfile?.phone || '6901055733'}`} className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors">
              <FaPhoneAlt className="text-amber-500 mr-2" />
              {schoolProfile?.phone || '6901055733'}
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a href={`mailto:${schoolProfile?.email || 'holynameschool@gmail.com'}`} className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors">
              <FaEnvelope className="text-amber-500 mr-2" />
              {schoolProfile?.email || 'holynameschool@gmail.com'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admission;
