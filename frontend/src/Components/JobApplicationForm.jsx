import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaUser, FaIdCard, FaMapMarkerAlt, FaGraduationCap, FaBriefcase, FaFileUpload, FaSpinner, FaCheckCircle, FaExclamationCircle, FaDownload } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function JobApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { API_URL: ctxApiUrl, schoolProfile } = useContext(SiteDataContext);
  const apiBase = ctxApiUrl || import.meta.env.VITE_API_URL || '/api';

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [37, 99, 235]; // Beautiful Blue
    const textColor = [50, 50, 50];
    const accentColor = [191, 219, 254]; // Light Blue / Accent
    const lightColor = [248, 250, 252]; // Off White / Light Section


    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    // --- 1. Bold Header Bar ---

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, 'F');

    // School Logo
    const logoImg = schoolProfile?.logo ? await loadImage(schoolProfile.logo) : null;
    if (logoImg) {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.8);
      doc.roundedRect(12, 10, 30, 30, 2, 2, 'D');
      doc.addImage(logoImg, 'PNG', 13, 11, 28, 28);
    }

    // Header Text (White)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(schoolProfile?.name?.toUpperCase() || "HOLY NAME HIGH SCHOOL", 110, 22, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(schoolProfile?.officeAddress || "", 110, 28, { align: "center" });
    
    const contactInfo = [schoolProfile?.email, schoolProfile?.phone].filter(Boolean).join(" | ");
    doc.text(contactInfo, 110, 33, { align: "center" });
    
    doc.setFontSize(8);
    doc.setTextColor(191, 219, 254);
    doc.text(`Recruitment Portal | Generated on ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 110, 38, { align: "center" });

    // --- 2. Title Section ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("JOB APPLICATION ACKNOWLEDGEMENT", 105, 65, { align: "center" });
    
    // Thin underline
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(60, 68, 150, 68);

    // --- 3. Reference & Photo Row ---
    // Reference Box
    doc.setFillColor(...lightColor);
    doc.roundedRect(15, 75, 140, 30, 3, 3, 'F');
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 75, 140, 30, 3, 3, 'D');
    
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(`REFERENCE ID: ${submittedRef}`, 22, 85);
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text(`Applicant Name: ${formData.fullName}`, 22, 91);
    doc.text(`Email: ${formData.email || 'N/A'}`, 22, 97);

    // Passport Photo
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(165, 75, 30, 35, 2, 2, 'D');
    
    let studentPhotoUrl = null;
    if (files?.passportPhoto) {
      studentPhotoUrl = URL.createObjectURL(files.passportPhoto);
    }

    const studentImg = studentPhotoUrl ? await loadImage(studentPhotoUrl) : null;
    if (studentImg) {
      doc.addImage(studentImg, 'JPEG', 166, 76, 28, 33);
    } else {
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("PHOTO\nSPACE", 180, 92, { align: "center" });
    }

    // --- 4. Watermark (Brackets Removed) ---
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(45);
    doc.setFont("helvetica", "bold");
    doc.text("VidyaBarta Lencho Solutions", 40, 220, { angle: 45 });

    // --- 5. Fields Section ---
    let leftColX = 15;
    let rightColX = 110;
    let startY = 120;
    let yInc = 8;
    let currY = startY;

    const fieldsLeft = [
      { label: "NAME OF CANDIDATE:", value: formData.fullName },
      { label: "JOB APPLIED FOR:", value: jobId || "General Application" },
      { label: "AADHAAR NO:", value: formData.aadhar },
      { label: "PAN NO:", value: formData.pan },
      { label: "GENDER:", value: formData.gender },
      { label: "RELIGION:", value: formData.religion },
      { label: "PO:", value: formData.postOffice },
      { label: "PS:", value: formData.policeStation }
    ];

    const fieldsRight = [
      { label: "DOB:", value: formData.dob },
      { label: "AGE:", value: formData.age },
      { label: "CASTE:", value: formData.caste },
      { label: "EMAIL:", value: formData.email },
      { label: "PHONE NO:", value: formData.phone },
      { label: "PIN CODE:", value: formData.pincode },
      { label: "ADDRESS:", value: formData.address }
    ];

    const formatValue = (val) => {
      if (val === undefined || val === null || val === '') return 'N/A';
      return val.toString().toUpperCase();
    };

    // Subheader
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CANDIDATE INFORMATION", 15, currY - 5);
    doc.setDrawColor(...accentColor);
    doc.line(15, currY - 3, 60, currY - 3);

    for (let i = 0; i < Math.max(fieldsLeft.length, fieldsRight.length); i++) {
      let leftSplit = fieldsLeft[i] ? doc.splitTextToSize(formatValue(fieldsLeft[i].value), 42) : [];
      let rightSplit = fieldsRight[i] ? doc.splitTextToSize(formatValue(fieldsRight[i].value), 42) : [];
      let maxLines = Math.max(leftSplit.length || 1, rightSplit.length || 1);

      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currY - 5, 186, yInc + ((maxLines - 1) * 4) + 2, 'F');
      }

      if (fieldsLeft[i]) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(fieldsLeft[i].label, leftColX, currY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(leftSplit, leftColX + 48, currY);
      }
      if (fieldsRight[i]) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(fieldsRight[i].label, rightColX, currY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(rightSplit, rightColX + 48, currY);
      }
      currY += yInc + ((maxLines - 1) * 4);
    }

    currY += 10;
    const renderField = (label, val, x, y, offset = 48, maxWidth = 42) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x, y);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const splitVal = doc.splitTextToSize(formatValue(val), maxWidth);
      doc.text(splitVal, x + offset, y);
      return splitVal.length;
    };

    let qualLines = renderField("HIGHEST QUALIFICATION:", formData.qualification, leftColX, currY, 48, 130);
    currY += yInc + ((qualLines - 1) * 4);

    renderField("EXPERIENCE TYPE:", formData.isExperienced ? formData.experienceType : 'FRESHER', leftColX, currY);
    const expYears = formData.isExperienced ? (formData.totalExperience ? `${formData.totalExperience} YRS` : 'N/A') : '0 YRS';
    renderField("TOTAL EXPERIENCE:", expYears, rightColX, currY);
    currY += yInc;

    if (formData.isExperienced) {
      let orgLines = renderField("PREVIOUS ORGANISATION:", formData.schoolName, leftColX, currY, 48, 130);
      currY += yInc + ((orgLines - 1) * 4);

      if (formData.experienceType === "Teacher") {
        renderField("UDISE CODE:", formData.udiseCode, leftColX, currY);
        currY += yInc;
      }
    }

    // --- 6. Footer ---
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);
    
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text(`${schoolProfile?.name || "Holy Name High School"} | Recruitment Cell | ${schoolProfile?.email || "N/A"}`, 105, 282, { align: "center" });
    
    doc.setTextColor(148, 163, 184);
    doc.text("Secured by VidyaBarta Recruitment Portal - A Product of Lencho Solutions", 105, 287, { align: "center" });

    doc.save(`Job_Application_${submittedRef}.pdf`);
    doc.setFontSize(9);
    doc.setTextColor(194, 65, 12); // Rust/Amber
    doc.setFont("helvetica", "bold");
    doc.text("NOTICE:", 20, currY + 8);
    doc.setFont("helvetica", "normal");
    doc.text("Please present this receipt during your scheduled interview. The reference number is ", 20, currY + 13);
    doc.text("required for all future correspondence regarding this application.", 20, currY + 17);

    // Footer
    currY += 28;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, currY, 195, currY);
    currY += 5;

    doc.setFontSize(8);
    doc.setTextColor(...primaryColor); // Use beautiful blue for footer emphasis
    const footerContactInfo = [schoolProfile?.name, schoolProfile?.phone, schoolProfile?.email].filter(Boolean).join(" | ");
    doc.text(footerContactInfo, 105, currY, { align: "center" });
    currY += 4;
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}, ${new Date().toLocaleTimeString('en-IN')}`, 105, currY, { align: "center" });
    
    // Software tag box
    currY += 4;
    doc.setDrawColor(200, 200, 200);
    doc.rect(60, currY, 90, 10);
    doc.text("VidyaBarta School Management Software owned by LENCHO SOLUTIONS", 105, currY + 4, { align: "center" });
    doc.text("Website: https://lenchosolutions.com, https://vidyabarta.com", 105, currY + 8, { align: "center" });

    doc.save(`Job_Application_Receipt_${submittedRef}.pdf`);
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedRef, setSubmittedRef] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleReview = (e) => {
    e.preventDefault();
    const form = e.target.closest('form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setShowPreview(true);
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-start gap-4 text-sm py-1">
      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest pt-0.5">{label}</span>
      <span className="text-slate-800 font-black text-right uppercase">{value || 'N/A'}</span>
    </div>
  );

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    age: "",
    aadhar: "",
    pan: "",
    qualification: "",
    isExperienced: false,
    schoolName: "",
    totalExperience: "Fresher",
    udiseCode: "",
    email: "",
    phone: "",
    gender: "",
    caste: "General",
    religion: "",
    postOffice: "",
    policeStation: "",
    pincode: "",
    address: "",
    experienceType: "Teacher", // "Teacher" or "Other"
  });

  const [files, setFiles] = useState({
    marksheet10: null, cert10: null,
    marksheet12: null, cert12: null,
    marksheetUG: null, certUG: null,
    marksheetPG: null, certPG: null,
    marksheetBEd: null, certBEd: null,
    marksheetDLed: null, certDLed: null,
    expCertificate: null,
    resume: null,
    photo: null,
    signature: null,
    casteCertificate: null
  });

  // Auto-calculate age
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age >= 0 ? age : "" }));
    }
  }, [formData.dob]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const data = new FormData();
      
      // Append text fields with normalization
      Object.keys(formData).forEach(key => {
        let value = formData[key];
        // Normalize to uppercase except for email and specific fields
        if (typeof value === 'string' && key !== 'email' && key !== 'dob') {
          value = value.trim().toUpperCase();
        } else if (typeof value === 'string' && key === 'email') {
          value = value.trim().toLowerCase();
        }
        data.append(key, value);
      });
      data.append('appliedFor', jobId || "");

      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          data.append(key, files[key]);
        }
      });

      const res = await axios.post(`${apiBase}/job-applications`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmittedRef(res.data.referenceNumber);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRef) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 py-20 animate-fade-in">
        <div className="max-w-3xl w-full">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm ring-8 ring-green-50">
              <FaCheckCircle />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-primary mb-3">Application Received!</h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
              Thank you for choosing Holy Name. Our recruitment team has received your profile and will review it shortly.
            </p>
          </div>

          {/* Receipt Preview Card */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 border-primary relative mb-12 transform transition-all hover:shadow-primary/5">
            <div className="bg-slate-50 p-8 md:p-12 border-b border-gray-100 flex flex-col items-center text-center">
              {schoolProfile?.logo && (
                <img src={schoolProfile.logo} alt="Logo" className="w-20 h-20 mb-4 opacity-90" />
              )}
              <h3 className="text-2xl font-serif font-black text-slate-800 tracking-tight mb-1">
                {schoolProfile?.name || "HOLY NAME HIGH SCHOOL"}
              </h3>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.3em] opacity-80 mb-8">
                Official Acknowledgement
              </p>

              <div className="bg-slate-900 rounded-2xl md:rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-slate-200">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Your Reference ID</p>
                <p className="font-mono text-4xl md:text-5xl font-black text-white tracking-tighter select-all">
                  {submittedRef}
                </p>
                <div className="h-1 w-12 bg-blue-500 mx-auto mt-6 rounded-full"></div>
              </div>
            </div>

            <div className="p-8 md:p-12 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Candidate</span>
                  <span className="font-bold text-slate-800">{formData.fullName}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Applied For</span>
                  <span className="font-bold text-slate-800 truncate pl-4">{jobId || "General Application"}</span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
                <FaExclamationCircle className="text-amber-500 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Next Steps</p>
                  <p className="text-sm text-amber-700 font-medium leading-relaxed">
                    Download this receipt and keep it for your interview. Our HR team will contact you via <span className="font-bold underline">{formData.email}</span> if your profile is shortlisted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <button 
              onClick={handleDownloadReceipt}
              className="flex-1 max-w-xs group bg-slate-900 text-white font-black px-10 py-5 rounded-3xl hover:bg-black transition-all shadow-2xl flex items-center justify-center transform hover:-translate-y-2 active:scale-95"
            >
              <FaDownload className="mr-3 text-xl group-hover:animate-bounce" />
              Download PDF Receipt
            </button>
            <button 
              onClick={() => navigate('/career')}
              className="flex-1 max-w-xs bg-white text-slate-900 font-black px-10 py-5 rounded-3xl hover:bg-gray-50 transition-all border-2 border-slate-900/10 flex items-center justify-center transform hover:-translate-y-1 active:scale-95"
            >
              Back to Careers List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="p-8 md:p-12 text-white relative overflow-hidden bg-primary rounded-none md:rounded-b-[3rem] mb-10 shadow-lg">
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
                alt="Job Application"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700/90 via-blue-700/70 to-blue-700/40"></div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 z-0"></div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4 relative z-10">Application Form</h1>
            <p className="text-white/90 relative z-10 max-w-xl font-medium">Please provide accurate information for background verification and qualification matching.</p>
          </div>

          <form id="job-form" onSubmit={handleSubmit} noValidate className="max-w-5xl mx-auto space-y-8">
            
            {/* --- PREVIEW VIEW --- */}
            <div className={`${showPreview ? 'block' : 'hidden'} animate-fade-in`}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden text-left">
                <div className="p-8 md:p-12 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-100 pb-8">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Review Your Profile</h2>
                      <p className="text-slate-500 font-medium">Verify your information before finalizing the application.</p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-200">
                      Draft Preview
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                      <section>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center">
                          <FaUser className="mr-2" /> Personal Details
                        </h4>
                        <div className="space-y-1 pl-1">
                          <DetailRow label="Full Name" value={formData.fullName} />
                          <DetailRow label="Date of Birth" value={formData.dob} />
                          <DetailRow label="Age" value={formData.age} />
                          <DetailRow label="Gender" value={formData.gender} />
                          <DetailRow label="Religion" value={formData.religion} />
                          <DetailRow label="Caste" value={formData.caste} />
                          <DetailRow label="Aadhar No" value={formData.aadhar} />
                          <DetailRow label="PAN No" value={formData.pan} />
                        </div>
                      </section>
                      
                      <section>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center">
                          <FaMapMarkerAlt className="mr-2" /> Address Information
                        </h4>
                        <div className="space-y-1 pl-1">
                          <DetailRow label="Post Office" value={formData.postOffice} />
                          <DetailRow label="Police Station" value={formData.policeStation} />
                          <DetailRow label="Pincode" value={formData.pincode} />
                          <DetailRow label="Full Address" value={formData.address} />
                        </div>
                      </section>
                    </div>

                    <div className="space-y-10">
                      <section>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center">
                          <FaGraduationCap className="mr-2" /> Professional Profile
                        </h4>
                        <div className="space-y-1 pl-1">
                          <DetailRow label="Highest Qual" value={formData.qualification} />
                          <DetailRow label="Job Type" value={formData.experienceType} />
                          <DetailRow label="Total Experience" value={formData.totalExperience} />
                          {formData.isExperienced && (
                            <>
                              <DetailRow label="Last Organization" value={formData.schoolName} />
                              <DetailRow label="UDISE Code" value={formData.udiseCode} />
                            </>
                          )}
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center">
                           <FaFileUpload className="mr-2" /> Uploaded Files
                        </h4>
                        <div className="flex flex-wrap gap-2 pt-2">
                           {Object.entries(files).map(([key, file]) => file && (
                             <div key={key} className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                               <FaCheckCircle className="text-green-500 text-[10px]" />
                               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{key.replace(/([A-Z])/g, ' $1')}</span>
                             </div>
                           ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    type="button"
                    onClick={() => {
                       setShowPreview(false);
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-10 py-5 bg-white/10 text-white font-black rounded-3xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 border border-white/10"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Modify Application
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-12 py-5 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                    {submitting ? 'Submitting...' : 'Confirm & Final Submit'}
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* --- EDITABLE VIEW --- */}
            <div className={`${showPreview ? 'hidden' : 'block'}`}>
                {/* 1. Personal Details */}
                <section>
                  <h2 className="text-xl font-bold text-primary flex items-center mb-6">
                    <FaUser className="mr-3" /> Personal Information
                  </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                  <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">DOB *</label>
                    <input required type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Age (Auto)</label>
                    <input readOnly name="age" value={formData.age} className="w-full bg-gray-200 border border-gray-300 rounded-xl p-3 cursor-not-allowed" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Aadhar Number *</label>
                    <input required name="aadhar" value={formData.aadhar} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Gender *</label>
                    <select required name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">PAN Number *</label>
                  <input required name="pan" value={formData.pan} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Religion *</label>
                  <input required name="religion" value={formData.religion} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Caste *</label>
                  <select name="caste" value={formData.caste} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all">
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="MOBC">MOBC</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 2. Contact & Address */}
            <section>
              <h2 className="text-xl font-bold text-primary flex items-center mb-6">
                <FaMapMarkerAlt className="mr-3" /> Contact & Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Email Address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Phone Number *</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Post Office</label>
                  <input name="postOffice" value={formData.postOffice} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Police Station</label>
                  <input name="policeStation" value={formData.policeStation} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pincode</label>
                  <input name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Full Address *</label>
                <textarea required name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase"></textarea>
              </div>
            </section>

            {/* 3. Qualifications */}
            <section>
              <h2 className="text-xl font-bold text-primary flex items-center mb-6">
                <FaGraduationCap className="mr-3" /> Qualifications & Experience
              </h2>
              <div className="space-y-2 mb-6">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Highest Qualification *</label>
                <input required name="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g. M.Sc B.Ed" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between mb-8 transition-all hover:border-primary/20">
                <div className="flex items-center">
                  <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-primary mr-4">
                    <FaBriefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Professional Experience?</h3>
                    <p className="text-sm text-gray-500 leading-tight">Check this if you have prior teaching or school experience.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isExperienced" checked={formData.isExperienced} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.isExperienced && (
                <div className="flex gap-6 mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="experienceType" 
                      value="Teacher" 
                      checked={formData.experienceType === "Teacher"} 
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary focus:ring-primary mr-2"
                    />
                    <span className="text-sm font-bold text-gray-700">Teaching Experience</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="experienceType" 
                      value="Other" 
                      checked={formData.experienceType === "Other"} 
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary focus:ring-primary mr-2"
                    />
                    <span className="text-sm font-bold text-gray-700">Other Professional Experience</span>
                  </label>
                </div>
              )}

              {formData.isExperienced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                  {formData.experienceType === "Teacher" ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">School Name *</label>
                        <input required={formData.isExperienced} name="schoolName" value={formData.schoolName} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Experience Range *</label>
                        <select name="totalExperience" value={formData.totalExperience} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all">
                          <option value="0-3">0-3 Years</option>
                          <option value="4-5">4-5 Years</option>
                          <option value="6-10">6-10 Years</option>
                          <option value="10-15">10-15 Years</option>
                          <option value="16-20">16-20 Years</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">UDISE Teacher Code *</label>
                        <input required={formData.isExperienced} name="udiseCode" value={formData.udiseCode} onChange={handleInputChange} placeholder="Alpha-numeric" className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Previous Organisation *</label>
                        <input required={formData.isExperienced} name="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="E.G. GOOGLE, TATA, ETC." className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all uppercase" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Experience Range *</label>
                        <select name="totalExperience" value={formData.totalExperience} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:border-primary outline-none transition-all">
                          <option value="0-3">0-3 Years</option>
                          <option value="4-5">4-5 Years</option>
                          <option value="6-10">6-10 Years</option>
                          <option value="10-15">10-15 Years</option>
                          <option value="16-20">16-20 Years</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* 4. Document Uploads */}
            <section className="space-y-8">
              <h2 className="text-xl font-bold text-primary flex items-center mb-6">
                <FaFileUpload className="mr-3" /> Document Uploads
              </h2>
              
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-8 flex items-start">
                <FaExclamationCircle className="text-amber-500 mt-1 mr-4 flex-shrink-0" size={20} />
                <p className="text-sm text-amber-800 leading-relaxed font-medium">
                  Accepted formats: <span className="font-bold underline">PDF, JPG, PNG</span>. Maximum file size: <span className="font-bold underline">5MB per doc</span>. Ensure text is clear and readable.
                </p>
              </div>

              {/* Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                
                {/* 10th Standard */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                   <h3 className="font-bold text-gray-800 border-l-4 border-amber-500 pl-3">Class 10th Documents *</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">MARKSHEET</label>
                       <input required type="file" name="marksheet10" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">PASS CERTIFICATE</label>
                       <input required type="file" name="cert10" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                     </div>
                   </div>
                </div>

                {/* 12th Standard */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                   <h3 className="font-bold text-gray-800 border-l-4 border-amber-500 pl-3">Class 12th Documents *</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">MARKSHEET</label>
                       <input required type="file" name="marksheet12" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">PASS CERTIFICATE</label>
                       <input required type="file" name="cert12" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                     </div>
                   </div>
                </div>

                {/* UG */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                   <h3 className="font-bold text-gray-800 border-l-4 border-amber-500 pl-3">Under-Graduate (UG) *</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">MARKSHEET</label>
                       <input required type="file" name="marksheetUG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">PASS CERTIFICATE</label>
                       <input required type="file" name="certUG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                     </div>
                   </div>
                </div>

                {/* PG */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 opacity-60 hover:opacity-100 transition-opacity">
                   <h3 className="font-bold text-gray-800 border-l-4 border-gray-300 pl-3">Post-Graduate (PG)</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">MARKSHEET (OPTIONAL)</label>
                       <input type="file" name="marksheetPG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-2">PASS CERTIFICATE (OPTIONAL)</label>
                       <input type="file" name="certPG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all" />
                     </div>
                   </div>
                </div>

                {/* Professional Qualifications */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-800 border-l-4 border-blue-400 pl-3">B.Ed (If applicable)</h3>
                    <div className="space-y-4">
                      <input type="file" name="marksheetBEd" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all" />
                      <input type="file" name="certBEd" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-800 border-l-4 border-blue-400 pl-3">D.Led (If applicable)</h3>
                    <div className="space-y-4">
                      <input type="file" name="marksheetDLed" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all" />
                      <input type="file" name="certDLed" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Caste Certificate Conditional */}
                {formData.caste !== 'General' && (
                  <div className="space-y-4 p-6 bg-red-50 rounded-2xl border border-red-100 animate-fadeIn">
                    <h3 className="font-bold text-red-800 border-l-4 border-red-500 pl-3">Caste Certificate *</h3>
                    <p className="text-xs text-red-600 font-medium">As you've selected {formData.caste}, a certificate is compulsory.</p>
                    <input required type="file" name="casteCertificate" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 transition-all" />
                  </div>
                )}

                {/* Experience Certificate Conditional */}
                {formData.isExperienced && (
                  <div className="space-y-4 p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-fadeIn">
                    <h3 className="font-bold text-primary-dark border-l-4 border-primary pl-3">Experience Certificate *</h3>
                    <input required type="file" name="expCertificate" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                  </div>
                )}

                {/* Core Professional Docs */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Update Resume *</label>
                     <input required type="file" name="resume" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Passport Photo *</label>
                     <input required type="file" name="photo" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white" />
                   </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Signature Image *</label>
                      <input required type="file" name="signature" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white" />
                    </div>
                  </div>


              </div>
            </section>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center shadow-sm">
                <FaExclamationCircle className="text-red-500 mr-3" size={20} />
                <p className="text-red-800 text-sm font-medium">{submitError}</p>
              </div>
            )}

            {/* Submit Section */}
            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-sm text-gray-500 font-medium">
                By submitting this form, you certify that the information provided is true and accurate to the best of your knowledge.
              </p>
              <button 
                type="button" 
                onClick={handleReview}
                disabled={submitting}
                className={`min-w-[200px] flex items-center justify-center bg-primary text-white font-bold py-4 px-8 rounded-2xl hover:bg-primary/90 transition-all shadow-xl hover:-translate-y-1 active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" /> Processing...
                  </>
                ) : "Review & Preview Application"}
              </button>
            </div>

            </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default JobApplicationForm;
