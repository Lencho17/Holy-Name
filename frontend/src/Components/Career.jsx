import React, { useState, useEffect, useContext } from "react";
import { 
  FaGraduationCap, FaChalkboardTeacher, FaBriefcase, FaEnvelopeOpenText, 
  FaSpinner, FaArrowRight, FaShareAlt, FaSearch, FaCheckCircle, 
  FaExclamationTriangle, FaDownload, FaQrcode, FaFileAlt, FaInfoCircle, FaMapMarkerAlt 
} from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import { SiteDataContext } from "../context/SiteDataContext";

function Career() {
  const { schoolProfile, API_URL, careerPage } = useContext(SiteDataContext);
  const apiBase = API_URL || import.meta.env.VITE_API_URL || '/api';
  const navigate = useNavigate();
  
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sharing vacancy helper
  const handleShare = async (e, job) => {
    e?.preventDefault();
    try {
      const res = await fetch(`${apiBase}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: job.title, 
          desc: `${job.department} — ${job.type}. Apply by ${job.deadline} at Holy Name School`, 
          image: schoolProfile?.pageHeroImages?.career || "", 
          page: '/career' 
        }),
      });
      const { url } = await res.json();
      const shareUrl = url || window.location.href;
      if (navigator.share) { 
        await navigator.share({ title: job.title, text: job.title, url: shareUrl }); 
      } else { 
        await navigator.clipboard.writeText(shareUrl); 
        alert('Link copied to clipboard!'); 
      }
    } catch (err) { if (err.name !== 'AbortError') console.warn('Share failed', err); }
  };

  // --- Tracking State ---
  const [trackingRef, setTrackingRef] = useState("");
  const [trackingEmail, setTrackingEmail] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingRef || !trackingEmail) return;
    
    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(`${apiBase}/job-applications/track/${trackingRef.trim()}?email=${trackingEmail.trim().toLowerCase()}`);
      const data = await res.json();
      
      if (res.ok) {
        setTrackResult(data);
      } else {
        setTrackError(data.message || "Failed to track application.");
      }
    } catch (err) {
      setTrackError("Network error. Please try again.");
    } finally {
      setIsTracking(false);
    }
  };

  // --- PDF Appointment Letter Generation ---
  const generateAppointmentPDF = async (record) => {
    const doc = new jsPDF();
    const primaryColor = [30, 41, 59];
    const accentColor = [220, 38, 38];
    const letter = record.preliminaryAppointmentLetter || {};

    const cx = 105;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text((schoolProfile?.name || "HOLY NAME HIGH SCHOOL").toUpperCase(), cx, 25, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(schoolProfile?.officeAddress || "Sivasagar, Assam", cx, 30, { align: "center" });
    doc.text(`Email: ${schoolProfile?.email || ""} | Phone: ${schoolProfile?.phone || ""}`, cx, 35, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 42, 195, 42);

    // Letter Content
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text("PRELIMINARY APPOINTMENT ACKNOWLEDGEMENT LETTER", cx, 52, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 15, 65);
    doc.text(`Ref Number: ${record.referenceNumber}`, 15, 70);

    doc.setFont("helvetica", "bold");
    doc.text(`To,`, 15, 82);
    doc.text(`${record.applicantName.toUpperCase()}`, 15, 87);
    doc.setFont("helvetica", "normal");
    doc.text(`Candidate Ref: ${record.referenceNumber}`, 15, 92);

    // Body
    let textY = 105;
    doc.text(`We are pleased to inform you that you have cleared the recruitment interview panel at Holy Name School. Based on your evaluation, you have been selected for the following preliminary terms:`, 15, textY);
    
    textY += 12;
    doc.setFont("helvetica", "bold");
    doc.text(`Recruitment Type:`, 15, textY);
    doc.setFont("helvetica", "normal");
    doc.text(`${letter.recruitmentType || 'TEMPORARY'}`, 60, textY);

    textY += 7;
    doc.setFont("helvetica", "bold");
    doc.text(`Offered Salary:`, 15, textY);
    doc.setFont("helvetica", "normal");
    doc.text(`${letter.salary || 'AS PER RULES'}`, 60, textY);

    textY += 7;
    doc.setFont("helvetica", "bold");
    doc.text(`Notice Period:`, 15, textY);
    doc.setFont("helvetica", "normal");
    doc.text(`${letter.noticePeriod || '30 DAYS'}`, 60, textY);

    if (letter.additionalNotes) {
      textY += 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Additional Notes:`, 15, textY);
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(letter.additionalNotes, 170);
      doc.text(notesLines, 15, textY + 5);
      textY += 5 + (notesLines.length * 5);
    }

    // Warning Card Box
    textY += 15;
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(15, textY, 180, 26, 2, 2, 'F');
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, textY, 180, 26, 2, 2, 'D');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...accentColor);
    doc.text("WARNING / MANDATORY NOTICE:", 20, textY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("This document is only a preliminary appointment acknowledgement receipt. The final authoritative", 20, textY + 13);
    doc.text("appointment letter must be collected physically from the institute administration office after completing the", 20, textY + 17);
    doc.text("prescribed onboarding formalities.", 20, textY + 21);

    // Signatures
    textY += 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryColor);
    doc.text("_______________________", 25, textY);
    doc.text("Authorised Signatory", 25, textY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Holy Name High School", 25, textY + 9);

    doc.text("_______________________", 135, textY);
    doc.setFont("helvetica", "bold");
    doc.text("Candidate Signature", 135, textY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Accepting Terms & Conditions", 135, textY + 9);

    doc.save(`AppointmentLetter_${record.referenceNumber}.pdf`);
  };

  // --- Offline Application Modal & Flow ---
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);
  const [offlineExempt, setOfflineExempt] = useState(false);
  const [checkingOfflineExempt, setCheckingOfflineExempt] = useState(false);

  const [offlineData, setOfflineData] = useState({
    fullName: "",
    email: "",
    phone: "",
    appliedFor: "",
    address: "",
    qualification: "",
    paymentTransactionId: "",
  });

  const checkOfflineExempt = async (emailVal) => {
    if (!emailVal || !emailVal.includes('@')) return;
    setCheckingOfflineExempt(true);
    try {
      const res = await axios.get(`${apiBase}/job-applications/has-paid?email=${emailVal.toLowerCase()}`);
      setOfflineExempt(res.data.hasPaid);
    } catch (err) {
      console.warn(err);
    } finally {
      setCheckingOfflineExempt(false);
    }
  };

  const handleOfflineInputChange = (e) => {
    const { name, value } = e.target;
    setOfflineData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      setTimeout(() => checkOfflineExempt(value), 500);
    }
  };

  // Download Offline printable form
  const downloadOfflineFormPDF = (refNum, data) => {
    const doc = new jsPDF();
    const primaryColor = [30, 41, 59];
    const leftColX = 15;
    const cx = 105;

    // Watermark
    doc.saveGraphicsState();
    doc.setTextColor(242, 242, 242);
    doc.setFontSize(44);
    doc.setFont("helvetica", "bold");
    doc.text("Holy Name School", 10, 200, { angle: 48 });
    doc.restoreGraphicsState();

    // Centered Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text((schoolProfile?.name || "HOLY NAME HIGH SCHOOL").toUpperCase(), cx, 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(schoolProfile?.officeAddress || "Sivasagar, Assam", cx, 30, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 36, 195, 36);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("OFFLINE JOB APPLICATION FORM", cx, 46, { align: "center" });

    // Serial/Reference Number
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 52, 180, 14, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 52, 180, 14, 2, 2, 'D');

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(29, 78, 216);
    doc.text(`SERIAL JOB APPLICATION NUMBER: ${refNum}`, 20, 61);

    // Details Grid
    let textY = 80;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text("CANDIDATE INFORMATION (PRE-FILLED)", 15, textY - 4);

    const infoFields = [
      { label: "FULL NAME", value: data.fullName },
      { label: "EMAIL ADDRESS", value: data.email },
      { label: "PHONE NUMBER", value: data.phone },
      { label: "JOB ROLE APPLIED", value: data.appliedFor },
      { label: "HIGHEST QUALIFICATION", value: data.qualification },
      { label: "FULL ADDRESS", value: data.address },
    ];

    infoFields.forEach((f, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, textY - 4, 186, 8, 'F');
      }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
      doc.text(`${f.label}:`, leftColX, textY);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primaryColor);
      doc.text(f.value.toUpperCase(), leftColX + 54, textY);
      textY += 8;
    });

    // Empty fields for manual filling
    textY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ADDITIONAL PHYSICAL FIELDS (TO BE FILLED BY HAND)", 15, textY - 4);

    const manualFields = [
      "DATE OF BIRTH (DD/MM/YYYY): _________________________",
      "GENDER: [  ] MALE    [  ] FEMALE    [  ] OTHER",
      "CASTE: ____________________  RELIGION: ____________________",
      "MOTHER TONGUE: ______________  PARENTS NAME: _________________",
      "EXPERIENCE RANGE: [  ] FRESHER  [  ] 0-3 YRS  [  ] 4-5 YRS  [  ] 6+ YRS",
      "PREVIOUS ORGANISATION (IF ANY): _________________________",
    ];

    manualFields.forEach(field => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...primaryColor);
      doc.text(field, leftColX, textY);
      textY += 9;
    });

    // Checklist of attachments
    textY += 6;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(15, textY, 180, 42, 2, 2, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, textY, 180, 42, 2, 2, 'D');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text("MANDATORY SUPPORTING DOCUMENTS TO ATTACH (SELF-ATTESTED):", 20, textY + 7);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("[  ] Class 10th Marksheet & Pass Certificate", 22, textY + 13);
    doc.text("[  ] Highest Qualification Marksheet & Certificate", 22, textY + 17);
    doc.text("[  ] Aadhaar Card Copy", 22, textY + 21);
    doc.text("[  ] Employment Exchange Registration Certificate", 22, textY + 25);
    doc.text("[  ] Previous Experience Certificate (if applicable)", 22, textY + 29);
    doc.text("[  ] Updated Bio-data / CV", 22, textY + 33);
    doc.text("[  ] Passport size photograph (affix at top right)", 22, textY + 37);

    // Signatures
    textY += 60;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("_______________________", 25, textY);
    doc.text("Candidate Signature", 25, textY + 5);

    doc.text("_______________________", 135, textY);
    doc.text("Office Receiver Seal/Sign", 135, textY + 5);

    doc.save(`Offline_Job_Form_${refNum}.pdf`);
  };

  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    setOfflineSubmitting(true);
    try {
      const payload = {
        fullName: offlineData.fullName.trim().toUpperCase(),
        email: offlineData.email.trim().toLowerCase(),
        phone: offlineData.phone.trim(),
        qualification: offlineData.qualification.trim().toUpperCase(),
        address: offlineData.address.trim().toUpperCase(),
        appliedFor: offlineData.appliedFor,
        applicationType: "offline",
        paymentTransactionId: offlineExempt ? "" : offlineData.paymentTransactionId.trim().toUpperCase(),
        paymentStatus: offlineExempt ? "free_exemption" : "paid",
        // fill other fields as empty to comply with db constraints
        dob: "1990-01-01",
        age: 30,
        aadhar: "OFFLINE",
        pan: "OFFLINE",
        caste: "GENERAL",
        religion: "OFFLINE",
        isExperienced: false,
        marksheet10: "OFFLINE",
        cert10: "OFFLINE",
        marksheet12: "OFFLINE",
        cert12: "OFFLINE",
        marksheetUG: "OFFLINE",
        certUG: "OFFLINE",
        resume: "OFFLINE",
        photo: "OFFLINE",
        signature: "OFFLINE",
      };

      const res = await axios.post(`${apiBase}/job-applications`, payload);
      
      const generatedSerial = res.data.referenceNumber;
      alert(`Application registered! Serial Number: ${generatedSerial}. Your printable form will now download.`);
      
      downloadOfflineFormPDF(generatedSerial, offlineData);

      // Reset
      setOfflineData({
        fullName: "",
        email: "",
        phone: "",
        appliedFor: "",
        address: "",
        qualification: "",
        paymentTransactionId: "",
      });
      setShowOfflineModal(false);
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.message || err.message));
    } finally {
      setOfflineSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const res = await fetch(`${apiBase}/jobs`);
        if (res.ok) {
          const data = await res.json();
          setVacancies(data);
        }
      } catch (err) {
        console.error("Failed to fetch vacancies", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, [apiBase]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10 text-left">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.career || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"}
            alt="Careers"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <FaBriefcase className="text-white" size={12} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Careers & Recruitment
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Careers at <span className="text-amber-400 italic drop-shadow-md">Holy Name</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Join our team of educators and professionals committed to academic excellence and development.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        
        {/* VidyaBarta Disclaimer */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
          <FaInfoCircle className="text-indigo-500 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest">VidyaBarta Portal Integration</h4>
            <p className="text-sm text-indigo-700 leading-relaxed mt-1 font-medium">
              Note: All details regarding Admissions, Appointments, Job Applications, and Tenders are securely processed through the official VidyaBarta website portal.
            </p>
          </div>
        </div>

        {/* Buttons for applying */}
        <div className="flex gap-4 mb-8 justify-start">
          <button 
            onClick={() => setShowOfflineModal(true)} 
            className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-900/10 px-6 py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
          >
            <FaFileAlt className="text-primary" /> Apply Offline (Print Form)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left/Main Column - Vacancies and Guidelines */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Vacancies */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 relative overflow-hidden text-left">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-8 flex items-center">
                <span className="w-2 h-8 bg-amber-500 rounded-full mr-4"></span>
                Vacant Positions
              </h2>

              <div className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
                  </div>
                ) : vacancies.length > 0 ? (
                  vacancies.map(job => (
                    <div key={job.id} className="bg-[#F9F9FB] rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">{job.department}</span>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">{job.type}</span>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-sm font-bold text-gray-500 mb-1">Apply By</p>
                          <p className="text-amber-600 font-bold">{job.deadline}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="text-gray-500 text-sm font-bold mb-2 flex items-center">
                            <FaGraduationCap className="mr-2" /> Required Qualifications
                          </p>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            {job.qualifications.map((qual, idx) => (
                              <li key={idx}>{qual}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm font-bold mb-2 flex items-center">
                            <FaChalkboardTeacher className="mr-2" /> Minimum Experience
                          </p>
                          <p className="text-gray-700 text-sm bg-white inline-block px-3 py-1.5 rounded-lg border border-gray-200">{job.experience}</p>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                        <NavLink to={`/apply/${job.id}`} className="bg-primary text-white font-bold py-3.5 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center group">
                          Apply Online <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </NavLink>
                        <a href={`mailto:${schoolProfile?.email || ""}`} className="text-gray-400 hover:text-primary transition-colors text-sm font-medium">
                          Inquiry <FaEnvelopeOpenText className="ml-1 inline" />
                        </a>
                        <button 
                          onClick={(e) => handleShare(e, job)}
                          className="p-2.5 rounded-xl bg-white text-gray-400 hover:bg-primary/10 hover:text-primary transition-all shadow-sm border border-gray-200 hover:border-primary/20"
                          title="Share Vacancy"
                        >
                          <FaShareAlt size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-[#F9F9FB] rounded-2xl border border-gray-200">
                    <FaBriefcase className="text-5xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">No Current Vacancies</h3>
                    <p className="text-gray-500 mt-2">Please check back later for new opportunities.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informational Guidelines (Requirements 1-5) */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 text-left space-y-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 flex items-center">
                <span className="w-2 h-8 bg-amber-500 rounded-full mr-4"></span>
                Recruitment & Application Guidelines
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Eligibility */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-500" /> Eligibility Criteria
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {(careerPage?.eligibility || []).map((el, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                        <span>{el}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Qualifications */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <FaGraduationCap className="text-amber-500" /> Qualifications Required
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {(careerPage?.qualification || []).map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. Documents Required */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-emerald-500" /> Required Documents (Self-Attested Uploads)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 pl-2">
                  {(careerPage?.documents || []).map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1">
                      <FaCheckCircle className="text-emerald-500 flex-shrink-0" size={10} />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Processes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 4. Online Process */}
                <div className="border border-gray-200 p-6 rounded-2xl">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 uppercase text-xs tracking-widest text-primary">
                    Online Application Process
                  </h3>
                  <ol className="space-y-4">
                    {(careerPage?.online_process || []).map((p, idx) => (
                      <li key={idx} className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-600 leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* 5. Offline Process */}
                <div className="border border-gray-200 p-6 rounded-2xl">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 uppercase text-xs tracking-widest text-amber-600">
                    Offline Application Process
                  </h3>
                  <ol className="space-y-4">
                    {(careerPage?.offline_process || []).map((p, idx) => (
                      <li key={idx} className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-600 leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

            </div>
          </div>

          {/* Right/Sidebar Column - Track & Culture */}
          <div className="lg:col-span-1 flex flex-col gap-8 text-left">
            
            {/* Tracking panel */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden ring-4 ring-primary/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Track Application
              </h3>
              <p className="text-gray-500 text-xs font-medium mb-6">Check interview date, status and results.</p>

              <form onSubmit={handleTrack} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Reference ID</label>
                  <input
                    required
                    type="text"
                    value={trackingRef}
                    onChange={(e) => setTrackingRef(e.target.value.toUpperCase())}
                    placeholder="JOB-2026-XXXXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-primary outline-none transition-all placeholder:text-gray-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email</label>
                  <input
                    required
                    type="email"
                    value={trackingEmail}
                    onChange={(e) => setTrackingEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-primary outline-none transition-all placeholder:text-gray-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTracking}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isTracking ? <FaSpinner className="animate-spin" /> : "Track Status"}
                </button>
              </form>

              {trackError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wide flex items-center">
                   <FaExclamationTriangle className="mr-2" />
                   {trackError}
                </div>
              )}

              {trackResult && (
                <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-gray-200 animate-fadeIn space-y-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Application Status</p>
                    <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      trackResult.status === 'shortlisted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      trackResult.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                      trackResult.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>{trackResult.status}</span>
                  </div>

                  <div className="text-xs space-y-2 border-t pt-3">
                    <div className="flex justify-between"><span className="text-gray-400">Position:</span><span className="font-bold">{trackResult.appliedForTitle || 'Job Role'}</span></div>
                    {trackResult.interviewDate && (
                      <div className="flex justify-between"><span className="text-gray-400">Interview Date:</span><span className="font-bold text-blue-600">{new Date(trackResult.interviewDate).toLocaleString()}</span></div>
                    )}
                    {trackResult.interviewStatus && (
                      <div className="flex justify-between"><span className="text-gray-400">Interview Status:</span><span className="font-bold capitalize">{trackResult.interviewStatus}</span></div>
                    )}
                    {trackResult.interviewResultDate && (
                      <div className="flex justify-between"><span className="text-gray-400">Result Date:</span><span className="font-bold">{new Date(trackResult.interviewResultDate).toLocaleDateString()}</span></div>
                    )}
                  </div>

                  {/* Admin custom message card */}
                  {trackResult.adminMessage && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl">
                      <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">Authority Message</p>
                      <p className="text-xs text-amber-900 italic font-medium leading-relaxed">"{trackResult.adminMessage}"</p>
                    </div>
                  )}

                  {/* Preliminary appointment letter display */}
                  {trackResult.preliminaryAppointmentLetter && (
                    <div className="pt-2">
                      <button 
                        onClick={() => generateAppointmentPDF(trackResult)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-100 transition-all active:scale-95"
                      >
                        <FaDownload /> Preliminary Letter PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-primary rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
              <h3 className="font-serif text-3xl font-black text-white leading-tight mb-8">
                Why <span className="text-amber-400 italic drop-shadow-sm">Holy Name?</span>
              </h3>
              <p className="text-white/80 text-sm mb-4">
                We offer a supportive environment that fosters professional growth, innovation in teaching, and a strong sense of community.
              </p>
              <ul className="space-y-3 text-sm text-white/95 font-medium">
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-3"></span> Competitive Salary Package</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-3"></span> Professional Growth Plans</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-3"></span> Outstanding Infrastructure</li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Offline Application Form Popup Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 text-left">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Apply Offline (Get printable Form)</h2>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-0.5">Pre-fill basic details & pay online</p>
              </div>
              <button onClick={() => setShowOfflineModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-2xl">×</button>
            </div>

            <form onSubmit={handleOfflineSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Exemption alert */}
              {offlineData.email && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                  {checkingOfflineExempt ? (
                    <FaSpinner className="animate-spin text-indigo-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FaCheckCircle className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Checking yearly limit...</h4>
                    <p className="text-xs text-indigo-700 leading-normal mt-0.5">
                      {offlineExempt 
                        ? "Exemption Active: You have paid this year. This form is free of cost." 
                        : "First application this year. A processing fee of INR 250 is required."}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name *</label>
                  <input required name="fullName" value={offlineData.fullName} onChange={handleOfflineInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all uppercase" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email *</label>
                    <input required type="email" name="email" value={offlineData.email} onChange={handleOfflineInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone *</label>
                    <input required type="tel" name="phone" value={offlineData.phone} onChange={handleOfflineInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Job Role *</label>
                    <select required name="appliedFor" value={offlineData.appliedFor} onChange={handleOfflineInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all">
                      <option value="">Select Role</option>
                      {vacancies.map(j => <option key={j.id} value={j.title}>{j.title}</option>)}
                      <option value="GENERAL POST">Other / General Post</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Highest Qualification *</label>
                    <input required name="qualification" value={offlineData.qualification} onChange={handleOfflineInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all uppercase" placeholder="e.g. M.SC B.ED" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Address *</label>
                  <textarea required name="address" value={offlineData.address} onChange={handleOfflineInputChange} rows="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all uppercase" />
                </div>
              </div>

              {/* Offline UPI payment block */}
              {!offlineExempt && (
                <div className="bg-slate-50 border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="bg-white p-2 border rounded-xl flex-shrink-0">
                    <div className="w-28 h-28 bg-gray-100 flex items-center justify-center border rounded-lg relative overflow-hidden">
                      <span className="material-symbols-outlined text-gray-300 text-5xl">qr_code_2</span>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 text-xs">
                    <h4 className="font-bold text-gray-800">Scan QR to pay registration fee: <span className="text-primary font-black">INR 250</span></h4>
                    <p className="text-gray-500">Pay to UPI: <span className="font-mono font-bold text-blue-600 select-all">{schoolProfile?.admissionUpiId || "pay@holyname"}</span></p>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Transaction ID *</label>
                      <input 
                        required={!offlineExempt}
                        name="paymentTransactionId" 
                        value={offlineData.paymentTransactionId} 
                        onChange={handleOfflineInputChange} 
                        className="w-full bg-white border rounded-lg px-3 py-1.5 focus:border-primary outline-none font-bold" 
                        placeholder="12 Digit Transaction ID"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowOfflineModal(false)} className="px-5 py-2.5 border rounded-xl font-bold text-gray-500 hover:bg-gray-50 text-xs">Cancel</button>
                <button type="submit" disabled={offlineSubmitting} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:opacity-90 text-xs flex items-center gap-2">
                  {offlineSubmitting ? <FaSpinner className="animate-spin" /> : "Register & Download PDF"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Career;
