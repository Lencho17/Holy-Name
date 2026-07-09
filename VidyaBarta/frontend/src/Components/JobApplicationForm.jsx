import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FaUser, FaIdCard, FaMapMarkerAlt, FaGraduationCap, FaBriefcase, 
  FaFileUpload, FaSpinner, FaCheckCircle, FaExclamationCircle, 
  FaDownload, FaArrowRight, FaClipboardList, FaEdit, FaImage, FaQrcode 
} from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function JobApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { API_URL: ctxApiUrl, schoolProfile } = useContext(SiteDataContext);
  const apiBase = ctxApiUrl || import.meta.env.VITE_API_URL || '/api';
  const [jobTitle, setJobTitle] = useState('General Application');

  // Fetch job title from the job ID
  useEffect(() => {
    if (jobId && jobId !== 'undefined') {
      fetch(`${apiBase}/jobs`)
        .then(res => res.json())
        .then(jobs => {
          const found = jobs.find(j => j.id === jobId);
          if (found) setJobTitle(found.title);
        })
        .catch(() => {});
    }
  }, [jobId, apiBase]);

  // Payment Status Exemption Check
  const [isPaymentExempt, setIsPaymentExempt] = useState(false);
  const [checkingExemption, setCheckingExemption] = useState(false);

  const checkPaidExemption = async (emailVal) => {
    if (!emailVal || !emailVal.includes('@')) return;
    setCheckingExemption(true);
    try {
      const res = await axios.get(`${apiBase}/job-applications/has-paid?email=${emailVal.toLowerCase()}`);
      setIsPaymentExempt(res.data.hasPaid);
    } catch (err) {
      console.warn('Check payment status failed:', err);
    } finally {
      setCheckingExemption(false);
    }
  };

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    age: "",
    aadhar: "",
    pan: "",
    qualification: "",
    isExperienced: false,
    schoolName: "",
    totalExperience: "FRESHER",
    udiseCode: "",
    email: "",
    phone: "",
    gender: "",
    caste: "GENERAL",
    religion: "",
    postOffice: "",
    policeStation: "",
    pincode: "",
    address: "",
    experienceType: "TEACHER",
    state: "",
    motherTongue: "",
    parentsName: "",
    paymentTransactionId: "",
    paymentStatus: "pending",
    applicationType: "online"
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
    casteCertificate: null,
    // New files:
    aadharDoc: null,
    employmentExchangeCert: null,
    otherDoc: null
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

    if (name === 'email') {
      // Check for payment exemption on email change
      setTimeout(() => checkPaidExemption(value), 500);
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF();
    const primaryColor = [30, 41, 59];
    const secondaryColor = [100, 116, 139];
    const leftColX = 15;
    const rightColX = 110;
    const yInc = 7;

    const loadImage = (url) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });

    // Watermark
    doc.saveGraphicsState();
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(44);
    doc.setFont("helvetica", "bold");
    doc.text((schoolProfile?.name || "Our School"), 10, 200, { angle: 48 });
    doc.restoreGraphicsState();

    // Centered Letterhead
    const logoImg = schoolProfile?.logo ? await loadImage(schoolProfile.logo) : null;
    const cx = 105;
    if (logoImg) doc.addImage(logoImg, 'PNG', cx - 10, 6, 20, 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text((schoolProfile?.name || "Our School").toUpperCase(), cx, 32, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text(schoolProfile?.officeAddress || "", cx, 37, { align: "center" });
    doc.text([schoolProfile?.email, schoolProfile?.phone].filter(Boolean).join(" | "), cx, 42, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Official Receipt Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, cx, 47, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    // Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("JOB APPLICATION ACKNOWLEDGEMENT", cx, 58, { align: "center" });

    // Reference & Photo
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 62, 142, 20, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 62, 142, 20, 2, 2, 'D');

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(`REFERENCE ID: ${submittedRef}`, 20, 70);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(`Applicant: ${formData.fullName.toUpperCase()}  |  Email: ${formData.email.toLowerCase()}`, 20, 76);

    // Photo
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.roundedRect(165, 62, 28, 28, 2, 2, 'D');
    const photoUrl = files?.photo ? URL.createObjectURL(files.photo) : null;
    const photoImg = photoUrl ? await loadImage(photoUrl) : null;
    if (photoImg) {
      doc.addImage(photoImg, 'JPEG', 166, 63, 26, 26);
    } else {
      doc.setFontSize(7);
      doc.setTextColor(180);
      doc.text("CANDIDATE", 179, 73, { align: "center" });
      doc.text("PHOTO", 179, 77, { align: "center" });
    }

    // Details Grid
    let currY = 97;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text("APPLICATION DETAILS", 15, currY - 4);

    const fv = (val) => {
      if (val === undefined || val === null || val === '') return 'N/A';
      return val.toString().toUpperCase();
    };

    const fields = [
      { label: "Candidate Name", value: formData.fullName },
      { label: "Parents Name", value: formData.parentsName },
      { label: "Date of Birth", value: formData.dob },
      { label: "Age", value: formData.age },
      { label: "Gender", value: formData.gender },
      { label: "Mother Tongue", value: formData.motherTongue },
      { label: "Aadhaar Number", value: formData.aadhar },
      { label: "PAN Number", value: formData.pan },
      { label: "Religion", value: formData.religion },
      { label: "Caste", value: formData.caste },
      { label: "Contact Number", value: formData.phone },
      { label: "Email Address", value: formData.email },
      { label: "Post Office", value: formData.postOffice },
      { label: "Police Station", value: formData.policeStation },
      { label: "Pincode", value: formData.pincode },
      { label: "State", value: formData.state },
      { label: "Position Applied", value: jobTitle }
    ];

    const half = Math.ceil(fields.length / 2);

    for (let i = 0; i < Math.max(half, fields.length - half); i++) {
      const lf = fields[i];
      const rf = fields[i + half];
      const lv = fv(lf?.value);
      const rv = rf ? fv(rf.value) : '';

      const lls = lf ? doc.splitTextToSize(`${lf.label.toUpperCase()}:`, 52) : [];
      const rls = rf ? doc.splitTextToSize(`${rf.label.toUpperCase()}:`, 52) : [];
      const lvs = lf ? doc.splitTextToSize(lv, 38) : [];
      const rvs = rf ? doc.splitTextToSize(rv, 38) : [];

      const ml = Math.max(lvs.length || 1, rvs.length || 1, lls.length || 1, rls.length || 1);

      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currY - 4, 186, yInc + ((ml - 1) * 3.5) + 1, 'F');
      }

      if (lf) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...secondaryColor);
        doc.text(lls, leftColX, currY);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primaryColor);
        doc.text(lvs, leftColX + 54, currY);
      }
      if (rf) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...secondaryColor);
        doc.text(rls, rightColX, currY);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primaryColor);
        doc.text(rvs, rightColX + 54, currY);
      }
      currY += yInc + ((ml - 1) * 3.5);
    }

    currY += 2;
    doc.setFillColor(248, 250, 252);
    doc.rect(12, currY - 4, 186, 10, 'F');
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...secondaryColor);
    doc.text("FULL ADDRESS:", leftColX, currY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primaryColor);
    const addrSplit = doc.splitTextToSize(fv(formData.address), 130);
    doc.text(addrSplit, leftColX + 54, currY);
    currY += Math.max(addrSplit.length * 4, 6) + 4;

    // Qualification
    currY += 4;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primaryColor);
    doc.text("QUALIFICATION & EXPERIENCE", 15, currY - 4);

    const qFields = [
      { label: "Highest Qualification", value: formData.qualification },
      { label: "Experience Type", value: formData.isExperienced ? formData.experienceType : 'FRESHER' },
      { label: "Total Experience", value: formData.isExperienced ? `${formData.totalExperience || '0'} YRS` : 'FRESHER' },
    ];
    if (formData.isExperienced) {
      qFields.push({ label: "Previous Organisation", value: formData.schoolName });
      if (formData.udiseCode) qFields.push({ label: "UDISE Teacher Code", value: formData.udiseCode });
    }

    qFields.forEach((f, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currY - 4, 186, 8, 'F');
      }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...secondaryColor);
      doc.text(`${f.label.toUpperCase()}:`, leftColX, currY);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primaryColor);
      doc.text(fv(f.value), leftColX + 54, currY);
      currY += 7;
    });

    // Important Notice
    if (currY > 240) { doc.addPage(); currY = 20; }
    currY += 5;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, currY, 180, 20, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currY, 180, 20, 2, 2, 'D');

    doc.setFontSize(9); doc.setTextColor(...primaryColor); doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT NOTICE:", 20, currY + 7);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Please keep this receipt safe. You can check your application status using the tracking system on the website.", 20, currY + 13);
    doc.text("Present this receipt physically at the school when invited for the physical interview.", 20, currY + 17);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 280, 195, 280);
    doc.setFontSize(8); doc.setTextColor(...secondaryColor);
    doc.text(`${schoolProfile?.name || ""} | Contact: ${schoolProfile?.phone || ""}`, cx, 285, { align: "center" });

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

    if (!isPaymentExempt && !formData.paymentTransactionId) {
      alert("Please provide the UPI Payment Transaction ID to submit your application.");
      return;
    }
    setShowPreview(true);
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-start gap-4 text-sm py-1.5 border-b border-gray-50 text-left">
      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest pt-0.5">{label}</span>
      <span className="text-slate-800 font-black text-right uppercase">{value || 'N/A'}</span>
    </div>
  );

  const uploadFileToCloudinary = async (file, folder = 'recruitment') => {
    const signRes = await axios.get(`${apiBase}/upload/sign?folder=${folder}`);
    const { signature, timestamp, cloudName, apiKey } = signRes.data;

    const cloudFormData = new FormData();
    cloudFormData.append('file', file);
    cloudFormData.append('signature', signature);
    cloudFormData.append('timestamp', timestamp);
    cloudFormData.append('folder', folder);
    cloudFormData.append('api_key', apiKey);

    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    const resourceType = isPdf ? 'raw' : 'auto';

    const uploadRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      cloudFormData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return uploadRes.data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {};
      
      // Text normalization
      Object.keys(formData).forEach(key => {
        let value = formData[key];
        if (typeof value === 'string' && key !== 'email' && key !== 'dob') {
          value = value.trim().toUpperCase();
        } else if (typeof value === 'string' && key === 'email') {
          value = value.trim().toLowerCase();
        }
        payload[key] = value;
      });
      payload.appliedFor = jobTitle || "";
      payload.paymentStatus = isPaymentExempt ? 'free_exemption' : 'paid';

      // Compress and upload files
      const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
        return new Promise((resolve) => {
          if (!file.type.startsWith('image/')) return resolve(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let w = img.width, h = img.height;
              if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
              canvas.width = w;
              canvas.height = h;
              canvas.getContext('2d').drawImage(img, 0, 0, w, h);
              canvas.toBlob((blob) => {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        });
      };

      const fileEntries = Object.entries(files).filter(([, f]) => f);
      const uploadedFiles = await Promise.all(
        fileEntries.map(async ([key, file]) => {
          const compressed = await compressImage(file);
          const url = await uploadFileToCloudinary(compressed);
          return { key, url };
        })
      );
      
      uploadedFiles.forEach(({ key, url }) => {
        payload[`${key}Url`] = url;
      });

      const res = await axios.post(`${apiBase}/job-applications`, payload, {
        headers: { 'Content-Type': 'application/json' }
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
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 py-20 animate-fade-in text-left">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm ring-8 ring-green-50">
              <FaCheckCircle />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-primary mb-3">Application Received!</h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
              Your application has been logged under Reference ID below. Download your PDF receipt.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 border-primary relative mb-12">
            <div className="bg-slate-50 p-8 md:p-12 border-b border-gray-100 flex flex-col items-center text-center">
              {schoolProfile?.logo && (
                <img src={schoolProfile.logo} alt="Logo" className="w-20 h-20 mb-4 opacity-90" />
              )}
              <h3 className="text-2xl font-serif font-black text-slate-800 tracking-tight mb-1">
                {schoolProfile?.name || "Our School"}
              </h3>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.3em] opacity-80 mb-8">
                Official Acknowledgement
              </p>

              <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-slate-200">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Your Reference ID</p>
                <p className="font-mono text-4xl md:text-5xl font-black text-white tracking-tighter select-all">
                  {submittedRef}
                </p>
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
                  <span className="font-bold text-slate-800 truncate pl-4">{jobTitle}</span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
                <FaExclamationCircle className="text-amber-500 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Next Steps</p>
                  <p className="text-sm text-amber-700 font-medium leading-relaxed">
                    Download this receipt and keep it for your records. Check the Careers tab periodically using your Reference ID to check interview details.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-left">
      <div className="bg-white border-b border-gray-200 py-3 md:py-6 mb-6 md:mb-10 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <button onClick={() => navigate('/career')} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-xs md:text-sm group">
            <FaArrowRight className="group-hover:-translate-x-1 transition-transform rotate-180" /> <span className="hidden sm:inline">Back to Careers</span><span className="sm:hidden">Back</span>
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1">Recruitment Portal</p>
            <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Employment Application</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          
          <div className="bg-primary p-6 md:p-12 text-white relative">
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-bl-full -mr-16 -mt-16 md:-mr-20 md:-mt-20"></div>
            <div className="relative z-10">
              <h2 className="text-xl md:text-4xl font-serif font-black leading-tight mb-2">Job Application</h2>
              <p className="text-white/80 text-sm md:text-lg font-medium">Please provide accurate details for background verification.</p>
              
              <div className="flex flex-wrap gap-2 md:gap-4 mt-6">
                <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  {jobTitle}
                </div>
                <div className="px-3 py-1.5 md:px-4 md:py-2 bg-amber-500 rounded-xl shadow-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">
                  Official Form 2026
                </div>
              </div>
            </div>
          </div>

          <form id="job-form" onSubmit={handleSubmit} noValidate className="p-5 md:p-12 space-y-8 md:space-y-12">
            
            {/* Draft Preview View */}
            <div className={`${showPreview ? 'block' : 'hidden'} animate-fade-in`}>
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden text-left">
                <div className="p-6 md:p-10 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Review Your Profile</h2>
                      <p className="text-slate-500 font-medium">Verify your details before submission.</p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-200">
                      Draft Preview
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <section>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center">
                          <FaUser className="mr-2" /> Personal Details
                        </h4>
                        <div className="space-y-1 pl-1">
                          <DetailRow label="Full Name" value={formData.fullName} />
                          <DetailRow label="Parents Name" value={formData.parentsName} />
                          <DetailRow label="Date of Birth" value={formData.dob} />
                          <DetailRow label="Age" value={formData.age} />
                          <DetailRow label="Gender" value={formData.gender} />
                          <DetailRow label="Mother Tongue" value={formData.motherTongue} />
                          <DetailRow label="Aadhar No" value={formData.aadhar} />
                          <DetailRow label="PAN No" value={formData.pan} />
                          <DetailRow label="Religion" value={formData.religion} />
                          <DetailRow label="Caste" value={formData.caste} />
                        </div>
                      </section>
                      
                      <section>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center">
                          <FaMapMarkerAlt className="mr-2" /> Contact & Address
                        </h4>
                        <div className="space-y-1 pl-1">
                          <DetailRow label="Email Address" value={formData.email} />
                          <DetailRow label="Phone Number" value={formData.phone} />
                          <DetailRow label="Post Office" value={formData.postOffice} />
                          <DetailRow label="Police Station" value={formData.policeStation} />
                          <DetailRow label="Pincode" value={formData.pincode} />
                          <DetailRow label="State" value={formData.state} />
                          <DetailRow label="Full Address" value={formData.address} />
                        </div>
                      </section>
                    </div>

                    <div className="space-y-8">
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
                          <FaClipboardList className="mr-2" /> Payment Verification
                        </h4>
                        <div className="space-y-1 pl-1">
                          <DetailRow label="Exempt status" value={isPaymentExempt ? "YES" : "NO"} />
                          {!isPaymentExempt && (
                            <DetailRow label="Transaction ID" value={formData.paymentTransactionId} />
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

                {submitError && (
                  <div className="mx-8 mt-6 bg-red-500 text-white p-4 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                    <span className="material-symbols-outlined">error</span>
                    <p className="text-sm font-bold">{submitError}</p>
                  </div>
                )}
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
                    className="w-full sm:w-auto px-12 py-5 bg-primary text-white font-black rounded-3xl shadow-2xl hover:shadow-primary/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                    {submitting ? 'Submitting...' : 'Confirm & Final Submit'}
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Editable View */}
            <div className={`${showPreview ? 'hidden' : 'block'} space-y-12`}>
              
              {/* Exemption Alert */}
              {formData.email && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
                  {checkingExemption ? (
                    <FaSpinner className="animate-spin text-indigo-500 mt-1 flex-shrink-0" size={20} />
                  ) : (
                    <FaCheckCircle className="text-indigo-500 mt-1 flex-shrink-0" size={20} />
                  )}
                  <div>
                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest">Checking Exemption Status...</h4>
                    <p className="text-sm text-indigo-700 font-medium leading-relaxed mt-1">
                      {isPaymentExempt 
                        ? `Exemption Verified! You have already submitted a job application at ${schoolProfile?.name || "Our School"} this year. This application is free.` 
                        : "No prior yearly payment detected. If this is your first application this year, a processing fee is required below. Subsequent applications will be free."}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Personal Details */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                  <FaUser className="mr-3 text-lg" /> Personal Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Full Name *</label>
                    <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Father's / Mother's Name *</label>
                    <input required name="parentsName" value={formData.parentsName} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">DOB *</label>
                      <input required type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all" />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Age (Auto)</label>
                      <div className="w-full h-16 px-6 rounded-2xl border border-gray-400 bg-gray-100/50 flex items-center justify-center font-bold text-xl text-black">
                        {formData.age}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Gender *</label>
                    <select required name="gender" value={formData.gender} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all cursor-pointer">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Mother Tongue *</label>
                    <input required name="motherTongue" value={formData.motherTongue} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" placeholder="e.g. ASSAMESE, ENGLISH" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider font-bold">Aadhar Number *</label>
                    <input required name="aadhar" value={formData.aadhar} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" placeholder="12 Digit Aadhaar" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider font-bold">PAN Number *</label>
                    <input required name="pan" value={formData.pan} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" placeholder="10 Digit PAN" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Religion *</label>
                    <select required name="religion" value={formData.religion} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all cursor-pointer">
                      <option value="">SELECT RELIGION</option>
                      <option value="HINDU">HINDU</option>
                      <option value="MUSLIM">MUSLIM</option>
                      <option value="CHRISTIAN">CHRISTIAN</option>
                      <option value="SIKH">SIKH</option>
                      <option value="BUDDHIST">BUDDHIST</option>
                      <option value="JAIN">JAIN</option>
                      <option value="OTHERS">OTHERS</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Caste *</label>
                    <select name="caste" value={formData.caste} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all cursor-pointer">
                      <option value="">SELECT CASTE</option>
                      <option value="GENERAL">GENERAL</option>
                      <option value="OBC">OBC</option>
                      <option value="MOBC">MOBC</option>
                      <option value="SC">SC</option>
                      <option value="ST(P)">ST(P)</option>
                      <option value="ST(H)">ST(H)</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 2. Contact & Address */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                  <FaMapMarkerAlt className="mr-3 text-lg" /> Contact & Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Email Address *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Phone Number *</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Post Office *</label>
                    <input required name="postOffice" value={formData.postOffice} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Police Station *</label>
                    <input required name="policeStation" value={formData.policeStation} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Pincode *</label>
                    <input required name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">State *</label>
                    <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" placeholder="e.g. ASSAM" />
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Full Address *</label>
                  <textarea required name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full px-6 py-4 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase min-h-[100px]"></textarea>
                </div>
              </section>

              {/* 3. Qualifications */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                  <FaGraduationCap className="mr-3 text-lg" /> Qualifications & Experience
                </h4>
                <div className="space-y-1.5 text-left">
                  <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Highest Qualification *</label>
                  <input required name="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g. MA B.ED" className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between mb-8 transition-all hover:border-primary/20">
                  <div className="flex items-center text-left">
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
                  <div className="flex gap-6 mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn text-left">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="experienceType" 
                        value="TEACHER" 
                        checked={formData.experienceType === "TEACHER"} 
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary focus:ring-primary mr-2"
                      />
                      <span className="text-sm font-bold text-gray-700">Teaching Experience</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="experienceType" 
                        value="OTHER" 
                        checked={formData.experienceType === "OTHER"} 
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary focus:ring-primary mr-2"
                      />
                      <span className="text-sm font-bold text-gray-700">Other Professional Experience</span>
                    </label>
                  </div>
                )}

                {formData.isExperienced && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn mt-8 text-left">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Previous Institution / Organisation *</label>
                      <input required={formData.isExperienced} name="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="E.G. DPS SCHOOL" className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider">Experience Range *</label>
                      <select name="totalExperience" value={formData.totalExperience} onChange={handleInputChange} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all cursor-pointer">
                        <option value="0-3">0-3 Years</option>
                        <option value="4-5">4-5 Years</option>
                        <option value="6-10">6-10 Years</option>
                        <option value="10-15">10-15 Years</option>
                        <option value="16-20">16-20 Years</option>
                      </select>
                    </div>
                    {formData.experienceType === "TEACHER" && (
                      <div className="space-y-1.5">
                        <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider font-bold">UDISE Teacher Code *</label>
                        <input required={formData.isExperienced} name="udiseCode" value={formData.udiseCode} onChange={handleInputChange} placeholder="National Code from UDISE" className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-lg bg-white transition-all" />
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 4. Document Uploads */}
              <section className="space-y-8 text-left">
                <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                  <FaFileUpload className="mr-3 text-lg" /> Document Uploads
                </h4>
                
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-8 flex items-start">
                  <FaExclamationCircle className="text-amber-500 mt-1 mr-4 flex-shrink-0" size={20} />
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">
                    Accepted formats: <span className="font-bold underline">PDF, JPG, PNG</span>. Max size: <span className="font-bold underline">5MB per doc</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  
                  {/* Class 10th */}
                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                     <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Class 10th Documents *</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">MARKSHEET *</label>
                         <input required type="file" accept=".pdf, image/*" name="marksheet10" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">PASS CERTIFICATE *</label>
                         <input required type="file" accept=".pdf, image/*" name="cert10" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                     </div>
                  </div>

                  {/* Class 12th */}
                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                     <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Class 12th Documents *</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">MARKSHEET *</label>
                         <input required type="file" accept=".pdf, image/*" name="marksheet12" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">PASS CERTIFICATE *</label>
                         <input required type="file" accept=".pdf, image/*" name="cert12" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                     </div>
                  </div>

                  {/* UG */}
                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                     <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Under-Graduate (UG) *</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">MARKSHEET *</label>
                         <input required type="file" accept=".pdf, image/*" name="marksheetUG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">PASS CERTIFICATE *</label>
                         <input required type="file" accept=".pdf, image/*" name="certUG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                     </div>
                  </div>

                  {/* PG */}
                  <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                     <h3 className="font-bold text-gray-800 border-l-4 border-gray-300 pl-3">Post-Graduate (PG)</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">MARKSHEET (OPTIONAL)</label>
                         <input type="file" accept=".pdf, image/*" name="marksheetPG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">PASS CERTIFICATE (OPTIONAL)</label>
                         <input type="file" accept=".pdf, image/*" name="certPG" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all" />
                       </div>
                     </div>
                  </div>

                  {/* Aadhaar and Employment Docs */}
                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                     <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Aadhaar Card Document *</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">UPLOAD AADHAAR *</label>
                         <input required type="file" accept=".pdf, image/*" name="aadharDoc" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                     </div>
                  </div>

                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                     <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Employment Exchange Certificate *</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">UPLOAD EXCHANGE CERT *</label>
                         <input required type="file" accept=".pdf, image/*" name="employmentExchangeCert" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       </div>
                     </div>
                  </div>

                  {/* B.Ed & D.El.Ed */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                      <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">B.Ed Degree (If applicable)</h3>
                      <div className="space-y-4">
                        <input type="file" accept=".pdf, image/*" name="marksheetBEd" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-800 file:text-white hover:file:bg-black transition-all cursor-pointer shadow-sm" />
                        <input type="file" accept=".pdf, image/*" name="certBEd" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-800 file:text-white hover:file:bg-black transition-all cursor-pointer shadow-sm" />
                      </div>
                    </div>
                    <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                      <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">D.El.Ed Degree (If applicable)</h3>
                      <div className="space-y-4">
                        <input type="file" accept=".pdf, image/*" name="marksheetDLed" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-800 file:text-white hover:file:bg-black transition-all cursor-pointer shadow-sm" />
                        <input type="file" accept=".pdf, image/*" name="certDLed" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-800 file:text-white hover:file:bg-black transition-all cursor-pointer shadow-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Caste Certificate Conditional */}
                  {formData.caste && formData.caste.toUpperCase() !== 'GENERAL' && (
                    <div className="space-y-4 p-6 bg-red-50 rounded-2xl border border-red-100 animate-fadeIn">
                      <h3 className="font-bold text-red-800 border-l-4 border-red-500 pl-3">Caste Certificate *</h3>
                      <p className="text-xs text-red-600 font-medium">As you've selected {formData.caste}, a certificate is required.</p>
                      <input required type="file" accept=".pdf, image/*" name="casteCertificate" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 transition-all" />
                    </div>
                  )}

                  {/* Experience Certificate Conditional */}
                  {formData.isExperienced && (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-fadeIn">
                      <h3 className="font-bold text-primary-dark border-l-4 border-primary pl-3">Experience Certificate *</h3>
                      <input required type="file" accept=".pdf, image/*" name="expCertificate" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                    </div>
                  )}

                  {/* Other / Office Request Documents */}
                  <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                     <h3 className="font-bold text-gray-800 border-l-4 border-gray-300 pl-3">Other / Additional Documents</h3>
                     <div className="space-y-4">
                       <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">OTHER DOCS</label>
                       <input type="file" accept=".pdf, image/*" name="otherDoc" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition-all" />
                     </div>
                  </div>

                </div>

                {/* Core Docs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Curriculum Vitae / Resume *</label>
                    <input required type="file" accept=".pdf, image/*" name="resume" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Passport Photo *</label>
                    <input required type="file" accept=".pdf, image/*" name="photo" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Candidate Signature *</label>
                    <input required type="file" accept=".pdf, image/*" name="signature" onChange={handleFileChange} className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white" />
                  </div>
                </div>

              </section>

              {/* 5. Payment Section */}
              {!isPaymentExempt && (
                <section className="space-y-6 text-left">
                  <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                    <FaQrcode className="mr-3 text-lg" /> Online Fee Payment
                  </h4>
                  
                  <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-md flex-shrink-0 flex flex-col items-center">
                      {/* Generates a mock UPI QR code */}
                      <div className="w-40 h-40 bg-gray-100 flex items-center justify-center border rounded-xl relative overflow-hidden mb-2">
                        <span className="material-symbols-outlined text-gray-300 text-7xl">qr_code_2</span>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">UPI SCAN FOR PAYMENT</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg leading-tight">Pay processing fee: <span className="text-primary font-black">INR 250</span></h4>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          Please scan the UPI QR code or pay to the official school UPI ID: <span className="font-mono font-bold text-blue-600 select-all">{schoolProfile?.admissionUpiId || "pay@holyname"}</span>. Once paid, please enter your transaction ref number below.
                        </p>
                      </div>

                      <div className="space-y-1.5 text-left w-full max-w-md">
                        <label className="block text-gray-700 font-medium mb-1 text-xs uppercase tracking-wider font-bold">UPI Transaction Reference ID / UTR *</label>
                        <input 
                          required={!isPaymentExempt} 
                          name="paymentTransactionId" 
                          value={formData.paymentTransactionId} 
                          onChange={handleInputChange} 
                          className="w-full h-14 px-5 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-bold text-base bg-white" 
                          placeholder="e.g. 12 Digit Transaction Ref ID"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center shadow-sm">
                <FaExclamationCircle className="text-red-500 mr-3" size={20} />
                <p className="text-red-800 text-sm font-medium">{submitError}</p>
              </div>
            )}

            {/* Submit Section */}
            <div className="pt-10 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-8">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-md text-center md:text-left">
                By submitting this form, you certify that all information provided is true and accurate.
              </p>
              <button 
                type="button" 
                onClick={handleReview}
                disabled={submitting}
                className="w-full md:w-auto min-w-[280px] flex items-center justify-center bg-primary text-white font-black py-5 px-10 rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl hover:-translate-y-1 active:scale-95 disabled:bg-gray-400 text-lg"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" /> Processing...
                  </>
                ) : (
                  <>
                    Review & Preview Application <FaArrowRight className="ml-3" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default JobApplicationForm;
