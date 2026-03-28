import React, { useState, useContext } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaCommentDots, FaPaperPlane, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Complaints() {
  const { schoolProfile } = useContext(SiteDataContext);
  const initialFormState = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "Suggestion", // Capitalized to match backend "Suggestion" | "Complain" | "General Inquiry"
    userType: "Student",
    isAnonymous: false,
    className: "",
    section: ""
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitted(false);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.post(`${apiBase}/inquiries`, formData);
      const newInquiry = response.data.inquiry;
      
      setSubmitted(true);
      
      // Generate PDF Receipt
      try {
        if (formData.type === 'Suggestion' || formData.type === 'Complain') {
          generateReceiptPDF(newInquiry);
        }
      } catch (pdfErr) {
        console.error('PDF Generation failed:', pdfErr);
        // We don't block the UI success for a PDF failure, but we notify console
      }
      
      setFormData(initialFormState);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateReceiptPDF = (inquiry) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - School Name and Logo
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // Primary color #1E40AF
    doc.text(schoolProfile?.name || "Holy Name School", pageWidth / 2, 25, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(schoolProfile?.officeAddress || "Cherekapar, Sivasagar, Assam", pageWidth / 2, 32, { align: "center" });
    
    // Line separator
    doc.setDrawColor(200);
    doc.line(15, 40, pageWidth - 15, 40);
    
    // Receipt Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Acknowledgment Receipt", pageWidth / 2, 50, { align: "center" });
    
    // Tracking Details
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Tracking No: ${inquiry.trackingNumber}`, 15, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(inquiry.createdAt).toLocaleDateString()}`, pageWidth - 15, 65, { align: "right" });
    
    // Data Table
    const tableData = [
      ["Feedback Type", inquiry.type],
      ["Subject", inquiry.subject],
      ["Status", "Submitted"],
      ["Submitted By", inquiry.isAnonymous ? "Anonymous" : inquiry.name],
      ["User Category", inquiry.userType || "N/A"]
    ];
    
    if (inquiry.userType === 'Student' && inquiry.className) {
      tableData.push(["Class/Section", `${inquiry.className}${inquiry.section ? ` - ${inquiry.section}` : ""}`]);
    }
    
    if (!inquiry.isAnonymous) {
      tableData.push(["Email", inquiry.email || "N/A"]);
      if (inquiry.phone) tableData.push(["Phone", inquiry.phone]);
    }
    
    autoTable(doc, {
      startY: 75,
      head: [["Field", "Details"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });
    
    // Message Section
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Message Details:", 15, finalY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitMessage = doc.splitTextToSize(inquiry.message, pageWidth - 30);
    doc.text(splitMessage, 15, finalY + 7);
    
    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This is an automatically generated receipt. No signature required.", pageWidth / 2, pageHeight - 15, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()} | Holy Name School Management System`, pageWidth / 2, pageHeight - 10, { align: "center" });
    
    // Attempt to add logo if available
    if (schoolProfile?.logo) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = schoolProfile.logo;
      img.onload = () => {
        try {
          const format = schoolProfile.logo.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
          doc.addImage(img, format, 15, 12, 20, 20);
          saveAndFinish();
        } catch (err) {
          console.error("PDF Logo Error:", err);
          saveAndFinish();
        }
      };
      img.onerror = () => {
        console.warn("Could not load logo for PDF");
        saveAndFinish();
      };
    } else {
      saveAndFinish();
    }

    function saveAndFinish() {
      // Save the PDF
      const fileName = `${inquiry.type}_Receipt_${inquiry.trackingNumber.replace(/\//g, '_')}.pdf`;
      doc.save(fileName);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight flex items-center justify-center">
            <FaCommentDots className="text-amber-500 mr-4 drop-shadow-lg" />
            Feedback
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto">
            Your suggestions and feedback help us continuously improve the Holy Name experience.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <h2 className="text-2xl font-serif font-bold text-primary mb-2 flex items-center relative z-10">
            <span className="w-2 h-8 bg-amber-500 rounded-full mr-3"></span>
            Share Your Thoughts
          </h2>
          <p className="text-gray-500 mb-8 relative z-10">Please fill out the form below. We review all feedback within 48 hours.</p>

          {submitted && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center shadow-sm animate-fade-in">
              <FaCheckCircle className="text-2xl mr-3 flex-shrink-0" />
              <p className="font-medium">Thank you for your valuable feedback! We will review it shortly.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative z-10">
            
            {/* Feedback Type Toggle */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">Feedback Type</label>
              <div className="flex flex-wrap gap-4">
                <label className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.type === 'Suggestion' ? 'border-amber-500 bg-amber-50 text-primary font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input type="radio" name="type" value="Suggestion" className="hidden" checked={formData.type === 'Suggestion'} onChange={handleChange} />
                  Suggestion
                </label>
                <label className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.type === 'Complain' ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input type="radio" name="type" value="Complain" className="hidden" checked={formData.type === 'Complain'} onChange={handleChange} />
                  Complaint
                </label>
                <label className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.type === 'General Inquiry' ? 'border-blue-400 bg-blue-50 text-blue-800 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input type="radio" name="type" value="General Inquiry" className="hidden" checked={formData.type === 'General Inquiry'} onChange={handleChange} />
                  General Inquiry
                </label>
              </div>
            </div>

            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center shadow-sm">
                <FaExclamationCircle className="text-xl mr-3 flex-shrink-0" />
                <p className="font-medium">{submitError}</p>
              </div>
            )}

            {(formData.type === 'Suggestion' || formData.type === 'Complain') && (
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-primary">Additional Details</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      name="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700 font-medium cursor-pointer relative top-[1px]">Submit Anonymously</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="userType">Who is submitting? *</label>
                    <select 
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="Parent">Parent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {formData.userType === 'Student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="className">Class *</label>
                        <input 
                          type="text" 
                          id="className"
                          name="className"
                          value={formData.className}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                          placeholder="e.g. 10" 
                          required={formData.userType === 'Student'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="section">Section</label>
                        <input 
                          type="text" 
                          id="section"
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                          placeholder="e.g. A" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!formData.isAnonymous && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="name">Full Name {formData.type === 'General Inquiry' ? '*' : ''}</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    id="name" name="name" type="text" placeholder="John Doe"
                    value={formData.name} onChange={handleChange} required={!formData.isAnonymous}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">Email Address {formData.type === 'General Inquiry' ? '*' : ''}</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    id="email" name="email" type="email" placeholder="john@example.com"
                    value={formData.email} onChange={handleChange} required={!formData.isAnonymous}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {!formData.isAnonymous && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="phone">Phone Number</label>
                  <input
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${formData.phone.length > 0 && formData.phone.length < 10 ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="10-digit phone number"
                    value={formData.phone} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData({...formData, phone: val});
                    }}
                  />
                  {formData.phone.length > 0 && formData.phone.length < 10 && (
                    <p className="text-red-500 text-[10px] mt-1">Please enter a valid 10-digit number</p>
                  )}
                </div>
              )}
              <div className={formData.isAnonymous ? "md:col-span-2" : ""}>
                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="subject">Subject</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="subject" name="subject" type="text" placeholder="Brief summary of your message"
                  value={formData.subject} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="message">Message Details</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                id="message" name="message" rows="5" placeholder="Please provide as much detail as possible..."
                value={formData.message} onChange={handleChange} required
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 hidden sm:flex items-center"><FaExclamationCircle className="mr-1"/> All required fields must be filled</p>
              <button
                disabled={submitting}
                className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center justify-center transform hover:-translate-y-1 ${submitting ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-primary hover:bg-primary-container text-white hover:shadow-lg'}`}
                type="submit"
              >
                {submitting ? 'Sending...' : 'Send Message'} <FaPaperPlane className="ml-3" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Complaints;
