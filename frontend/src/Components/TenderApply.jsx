import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaGavel, FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaDollarSign, FaClock, FaFileUpload, FaCheckCircle, FaSpinner, FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';
import { jsPDF } from 'jspdf';

function TenderApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_URL, schoolProfile } = useContext(SiteDataContext);
  
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    bidAmount: '',
    proposedTimeline: '',
    technicalProposalUrl: '',
    financialProposalUrl: '',
    companyProfileUrl: ''
  });

  const handleDownloadReceipt = async () => {
    const doc = new jsPDF();
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

    // --- 0. Background Watermark ---
    doc.saveGraphicsState();
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(38);
    doc.setFont("helvetica", "bold");
    doc.text("VidyaBarta School Management Software", 20, 280, { angle: 50 });
    doc.restoreGraphicsState();

    // --- 1. Clean Header Area ---
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
    doc.text(`Official Bid Receipt Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 115, 32, { align: "center" });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 36, 195, 36);

    // --- 2. Title Section ---
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TENDER BID ACKNOWLEDGEMENT", 105, 44, { align: "center" });
    
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(60, 47, 150, 47);

    // --- 3. Reference Box ---
    doc.setFillColor(...lightColor);
    doc.roundedRect(15, 51, 180, 22, 2, 2, 'F');
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 51, 180, 22, 2, 2, 'D');
    
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(`BID REFERENCE ID: ${refNumber}`, 20, 59);
    
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text(`Tender: ${tender?.title?.toUpperCase()}  |  Number: ${tender?.tenderNumber}`, 20, 66);

    // --- 5. Fields Section ---
    let leftColX = 15;
    let rightColX = 110;
    let startY = 88;
    let yInc = 7;
    let currY = startY;

    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("COMPANY & BID INFORMATION", 15, currY - 4);
    doc.setDrawColor(...accentColor);
    doc.line(15, currY - 2, 65, currY - 2);

    const formatValue = (val) => {
      if (val === undefined || val === null || val === '') return 'N/A';
      return val.toString().toUpperCase();
    };

    const fieldsLeft = [
      { label: "COMPANY NAME:", value: formData.companyName },
      { label: "REGISTRATION NO:", value: formData.registrationNumber },
      { label: "CONTACT PERSON:", value: formData.contactPerson },
      { label: "BID AMOUNT (INR):", value: `RS. ${formData.bidAmount}` }
    ];

    const fieldsRight = [
      { label: "COMPANY EMAIL:", value: formData.email },
      { label: "PHONE NO:", value: formData.phone },
      { label: "TIMELINE:", value: formData.proposedTimeline },
      { label: "ADDRESS:", value: formData.address }
    ];

    for (let i = 0; i < Math.max(fieldsLeft.length, fieldsRight.length); i++) {
      const leftField = fieldsLeft[i];
      const rightField = fieldsRight[i];

      const leftVal = leftField ? formatValue(leftField.value) : null;
      const rightVal = rightField ? formatValue(rightField.value) : null;

      const leftLabelSplit = leftField ? doc.splitTextToSize(`${leftField.label.toUpperCase()}:`, 52) : [];
      const rightLabelSplit = rightField ? doc.splitTextToSize(`${rightField.label.toUpperCase()}:`, 52) : [];
      const leftValSplit = leftField ? doc.splitTextToSize(leftVal, 40) : [];
      const rightValSplit = rightField ? doc.splitTextToSize(rightVal, 40) : [];

      const maxLines = Math.max(leftLabelSplit.length, rightLabelSplit.length, leftValSplit.length, rightValSplit.length, 1);
      const rowHeight = maxLines * 4 + 2;

      // Alternating Background
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, currY - 3, 180, rowHeight, 'F');
      }

      if (leftField) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(leftLabelSplit, leftColX, currY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        doc.text(leftValSplit, leftColX + 52, currY);
      }

      if (rightField) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(rightLabelSplit, rightColX, currY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        doc.text(rightValSplit, rightColX + 52, currY);
      }

      currY += rowHeight;
    }

    // --- 6. Footer ---
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 278, 195, 278);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(`${schoolProfile?.name || "Holy Name High School"} | Tender Cell | ${schoolProfile?.phone || "N/A"}`, 105, 284, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Securely Powered by VidyaBarta School Management Software - A Product of Lencho Solutions", 105, 289, { align: "center" });
    doc.text("Website: https://lenchosolutions.com, https://vidyabarta.com", 105, 294, { align: "center" });

    doc.save(`Tender_Bid_Receipt_${refNumber}.pdf`);
  };

  const [files, setFiles] = useState({
    technical: null,
    financial: null,
    profile: null
  });

  const [uploadStatus, setUploadStatus] = useState({
    technical: '',
    financial: '',
    profile: ''
  });

  useEffect(() => {
    const fetchTender = async () => {
      try {
        const res = await fetch(`${API_URL}/tenders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTender({
            ...data,
            _id: data.id,
            tenderNumber: data.tender_number,
            publishDate: data.publish_date,
            closingDate: data.closing_date,
            estimatedValue: data.estimated_value,
            documentUrl: data.document_url
          });
        } else {
          navigate('/tenders');
        }
      } catch (err) {
        console.error("Error fetching tender:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTender();
  }, [id, API_URL, navigate]);

  const handleFileChange = (e, type) => {
    setFiles({ ...files, [type]: e.target.files[0] });
    setUploadStatus({ ...uploadStatus, [type]: 'Selected' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email || !files.technical || !files.financial) {
      alert("Please fill all required fields and upload the mandatory proposals.");
      return;
    }

    setSubmitting(true);
    try {
      // Helper: Upload PDF to GitHub via public tender endpoint
      const uploadPdf = async (file) => {
        const fd = new FormData();
        fd.append('pdf', file);
        const res = await fetch(`${API_URL}/content/upload-tender-pdf`, {
          method: 'POST',
          body: fd
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Upload failed (${res.status})`);
        }
        const data = await res.json();
        return data.url;
      };

      // 1. Upload Files to GitHub (not Cloudinary)
      const techUrl = await uploadPdf(files.technical);
      const finUrl = await uploadPdf(files.financial);
      let profUrl = '';
      if (files.profile) profUrl = await uploadPdf(files.profile);

      // 2. Submit Application
      const res = await fetch(`${API_URL}/tender-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenderId: id,
          technicalProposalUrl: techUrl,
          financialProposalUrl: finUrl,
          companyProfileUrl: profUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setRefNumber(data.reference_number || data.referenceNumber);
      } else {
        alert("Submission failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><FaSpinner className="animate-spin text-4xl text-primary" /></div>;

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-fadeIn border border-green-100">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaCheckCircle className="text-4xl" />
        </div>
        <h2 className="text-3xl font-serif font-black text-gray-800 mb-2">Bid Submitted Successfully!</h2>
        <p className="text-gray-500 mb-8">Thank you for participating. Your application has been received and is under review.</p>
        
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-8">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Reference Number</p>
          <p className="text-2xl font-black text-primary font-mono tracking-wider">{refNumber}</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleDownloadReceipt}
            className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95"
          >
            <FaFileAlt /> Download Official Receipt
          </button>
          <Link to="/tenders" className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all text-sm">
            Back to Tenders
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-3 md:py-6 mb-6 md:mb-10 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <Link to="/tenders" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-xs md:text-sm group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> <span className="hidden sm:inline">Back to Tenders</span><span className="sm:hidden">Back</span>
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1">{tender.tenderNumber}</p>
            <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Bid Submission</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          {/* Form Header */}
          <div className="bg-primary p-6 md:p-12 text-white relative">
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-bl-full -mr-16 -mt-16 md:-mr-20 md:-mt-20"></div>
            <div className="relative z-10">
              <h2 className="text-xl md:text-4xl font-serif font-black leading-tight mb-2">Apply for Tender</h2>
              <p className="text-white/80 text-sm md:text-lg font-medium">{tender.title}</p>
              <div className="flex flex-wrap gap-2 md:gap-4 mt-6">
                <div className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  {tender.category}
                </div>
                <div className="px-3 py-1.5 md:px-4 md:py-2 bg-amber-500 rounded-xl shadow-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">
                  {new Date(tender.closingDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 md:p-12 space-y-8 md:space-y-12">
            {/* Section 1: Company Information */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                <FaBuilding className="mr-3 text-lg" /> Company Information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Company Name *</label>
                  <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm uppercase" placeholder="e.g. Acme Construction Pvt Ltd" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Registration Number *</label>
                  <input required type="text" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm uppercase" placeholder="CIN or Reg No." />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Contact Person Name *</label>
                  <input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Company Email *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Phone Number *</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Registered Address *</label>
                  <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm uppercase min-h-[120px]" placeholder="Full office address..." />
                </div>
              </div>
            </div>

            {/* Section 2: Bid Details */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                <FaDollarSign className="mr-3 text-lg" /> Bid & Timeline
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Total Bid Amount (₹) *</label>
                  <input required type="number" value={formData.bidAmount} onChange={e => setFormData({...formData, bidAmount: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm" placeholder="e.g. 500000" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium mb-2 text-xs uppercase tracking-wider">Proposed Timeline *</label>
                  <input required type="text" value={formData.proposedTimeline} onChange={e => setFormData({...formData, proposedTimeline: e.target.value})} className="w-full h-16 px-6 rounded-2xl border border-gray-400 focus:ring-2 focus:ring-black outline-none font-black text-lg bg-white transition-all shadow-sm uppercase" placeholder="e.g. 3 Months" />
                </div>
              </div>
            </div>

            {/* Section 3: Document Uploads */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center bg-gray-100 p-2 rounded-lg w-fit pr-6">
                <FaFileUpload className="mr-3 text-lg" /> Proposal Documents
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                   <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Technical Proposal *</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center">UPLOAD PDF ONLY</label>
                       <input required type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'technical')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       {files.technical && <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center justify-center gap-1"><FaCheckCircle /> {files.technical.name}</p>}
                     </div>
                   </div>
                </div>

                <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                   <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Financial Proposal *</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center">UPLOAD PDF ONLY</label>
                       <input required type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'financial')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                       {files.financial && <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center justify-center gap-1"><FaCheckCircle /> {files.financial.name}</p>}
                     </div>
                   </div>
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-4 p-6 bg-white rounded-2xl border border-gray-400 shadow-sm transition-all hover:border-black/20">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Company Profile (Optional)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center">UPLOAD PDF ONLY</label>
                        <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'profile')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-800 file:text-white hover:file:bg-black transition-all cursor-pointer shadow-sm" />
                        {files.profile && <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center justify-center gap-1"><FaCheckCircle /> {files.profile.name}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-md text-center md:text-left">
                By submitting this bid, you agree to Holy Name School's procurement terms.
              </p>
              <button 
                type="submit" 
                disabled={submitting}
                className={`w-full md:w-auto min-w-[280px] flex items-center justify-center bg-primary text-white font-black py-5 px-10 rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-primary/20 hover:-translate-y-1 active:scale-95 disabled:bg-gray-400 disabled:shadow-none text-lg`}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" /> Processing...
                  </>
                ) : (
                  <>
                    <FaGavel className="mr-3" /> Submit Official Bid
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

export default TenderApply;
