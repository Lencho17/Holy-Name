import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaGavel, FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaDollarSign, FaClock, FaFileUpload, FaCheckCircle, FaSpinner, FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

function TenderApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_URL } = useContext(SiteDataContext);
  
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
          setTender(data);
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
        setRefNumber(data.referenceNumber);
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
          <Link to="/tenders" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg">
            Back to Tenders
          </Link>
          <button onClick={() => window.print()} className="text-gray-500 font-bold text-sm hover:text-primary transition-colors">
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 mb-10 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <Link to="/tenders" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1">{tender.tenderNumber}</p>
            <h1 className="text-sm font-black text-gray-800 uppercase tracking-tight">Bid Submission Form</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          {/* Form Header */}
          <div className="bg-primary p-8 md:p-12 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-serif font-black leading-tight mb-2">Apply for Tender</h2>
              <p className="text-white/80 text-lg font-medium">{tender.title}</p>
              <div className="flex gap-4 mt-6">
                <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 text-xs font-bold uppercase tracking-widest">
                  Category: {tender.category}
                </div>
                <div className="px-4 py-2 bg-amber-500 rounded-xl shadow-lg text-xs font-black uppercase tracking-widest text-primary">
                  Deadline: {new Date(tender.closingDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            {/* Section 1: Company Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <FaBuilding />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Company Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Name *</label>
                  <div className="relative">
                    <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" placeholder="e.g. Acme Construction Pvt Ltd" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registration Number *</label>
                  <div className="relative">
                    <FaFileAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="text" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" placeholder="CIN or Reg No." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Person Name *</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Email *</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number *</label>
                  <div className="relative">
                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registered Address *</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-6 text-gray-300" />
                    <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700 min-h-[100px]" placeholder="Full office address..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Bid Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <FaDollarSign />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Bid & Timeline</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Bid Amount (₹) *</label>
                  <div className="relative">
                    <FaDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="number" value={formData.bidAmount} onChange={e => setFormData({...formData, bidAmount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" placeholder="e.g. 500000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Proposed Timeline *</label>
                  <div className="relative">
                    <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input required type="text" value={formData.proposedTimeline} onChange={e => setFormData({...formData, proposedTimeline: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-gray-700" placeholder="e.g. 3 Months" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Document Uploads */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <FaFileUpload />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Proposal Documents</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 relative group transition-all hover:bg-white hover:shadow-lg">
                    <label className="block">
                      <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4 block">Technical Proposal * (PDF)</span>
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl bg-white group-hover:border-primary/50 transition-all cursor-pointer">
                        <div className="text-center">
                          {files.technical ? (
                            <div className="text-green-600 font-bold flex flex-col items-center">
                               <FaCheckCircle className="text-2xl mb-2" />
                               <span className="text-xs truncate max-w-[200px]">{files.technical.name}</span>
                            </div>
                          ) : (
                            <>
                              <FaFileUpload className="text-gray-300 text-3xl mx-auto mb-2" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Click to Upload PDF</span>
                            </>
                          )}
                        </div>
                      </div>
                      <input required type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'technical')} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 relative group transition-all hover:bg-white hover:shadow-lg">
                    <label className="block">
                      <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4 block">Financial Proposal * (PDF)</span>
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl bg-white group-hover:border-primary/50 transition-all cursor-pointer">
                        <div className="text-center">
                          {files.financial ? (
                            <div className="text-green-600 font-bold flex flex-col items-center">
                               <FaCheckCircle className="text-2xl mb-2" />
                               <span className="text-xs truncate max-w-[200px]">{files.financial.name}</span>
                            </div>
                          ) : (
                            <>
                              <FaFileUpload className="text-gray-300 text-3xl mx-auto mb-2" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Click to Upload PDF</span>
                            </>
                          )}
                        </div>
                      </div>
                      <input required type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'financial')} />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 relative group transition-all hover:bg-white hover:shadow-lg">
                    <label className="block">
                      <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-4 block">Company Profile (Optional PDF)</span>
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex-1 h-14 border-2 border-dashed border-gray-300 rounded-xl bg-white flex items-center px-4 group-hover:border-primary/30 transition-all cursor-pointer">
                             {files.profile ? (
                                <span className="text-xs font-bold text-green-600 flex items-center gap-2"><FaCheckCircle /> {files.profile.name}</span>
                             ) : (
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Profile Document</span>
                             )}
                         </div>
                         <div className="px-6 py-4 bg-primary text-white rounded-xl font-bold text-xs shadow-md">Browse</div>
                      </div>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'profile')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-primary text-white font-black py-5 rounded-[2rem] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-lg flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-gray-400 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" /> 
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <FaGavel /> 
                    <span>Submit Official Bid</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">
                By submitting, you agree to Holy Name School's procurement terms and conditions.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TenderApply;
