import React, { useState, useContext } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { SiteDataContext } from '../context/SiteDataContext';

const Complaints = () => {
  const { schoolProfile } = useContext(SiteDataContext);
  
  const initialFormState = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "Suggestion", // Default
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

  const generateReceiptPDF = (inquiry) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(22);
      doc.setTextColor(30, 64, 175);
      doc.text(schoolProfile?.name || "School", pageWidth / 2, 25, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Feedback/Suggestion Receipt", pageWidth / 2, 35, { align: "center" });
      
      doc.text(`Tracking ID: ${inquiry.referenceNumber || 'N/A'}`, 20, 50);
      doc.text(`Subject: ${inquiry.subject}`, 20, 60);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 70);
      
      doc.save(`Receipt_${inquiry.referenceNumber || 'Feedback'}.pdf`);
    } catch (err) {
      console.warn("PDF Generation skipped", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitted(false);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      const normalizedData = {
        ...formData,
        name: formData.isAnonymous ? "ANONYMOUS" : "Student",
        subject: (formData.subject || '').trim().toUpperCase(),
        message: (formData.message || '').trim().toUpperCase(),
        email: formData.isAnonymous ? "anonymous@local.com" : "student@local.com"
      };

      const response = await axios.post(`${apiBase}/inquiries`, normalizedData);
      const newInquiry = response.data.inquiry;
      
      setSubmitted(true);
      
      if (formData.type === 'Suggestion' || formData.type === 'Complain') {
        generateReceiptPDF(newInquiry);
      }
      
      setFormData(initialFormState);
      
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      <main className="pt-24 pb-section-padding">
        {/* Hero / Intro Section */}
        <section className="max-w-container-max mx-auto px-gutter mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-1/3 h-full opacity-10"></div>
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-md mb-4">Community Focused</span>
            <h1 className="font-display text-display text-on-surface mb-6">Your Voice Shapes Our <span className="bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent">Future</span></h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              At {schoolProfile?.name || 'Excellence Academy'}, we believe the best ideas come from our community. Whether it's a small suggestion for the cafeteria or a major academic initiative, we want to hear from you.
            </p>
          </div>
        </section>

        <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation (Portal Style) */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-stack-md sticky top-28 shadow-md">
              <div className="flex flex-col mb-6 p-2">
                <span className="font-headline-md text-headline-md font-bold text-primary">Student Portal</span>
                <span className="font-label-md text-label-md text-on-surface-variant">{schoolProfile?.name || 'Excellence Academy'}</span>
              </div>
              <nav className="space-y-1">
                <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
                  <span className="font-label-md text-label-md">Dashboard</span>
                </a>
                <a className="flex items-center gap-3 p-3 bg-primary-container text-on-primary-container rounded-lg font-bold" href="#">
                  <span className="material-symbols-outlined">reviews</span>
                  <span className="font-label-md text-label-md">Suggestions</span>
                </a>
                <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">school</span>
                  <span className="font-label-md text-label-md">Resources</span>
                </a>
                <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">newspaper</span>
                  <span className="font-label-md text-label-md">News &amp; Blog</span>
                </a>
                <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">settings</span>
                  <span className="font-label-md text-label-md">Settings</span>
                </a>
              </nav>
              <div className="pt-8 border-t border-outline-variant">
                <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg" href="#">
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-label-md text-label-md">Help</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* Feedback Form Section */}
            <section className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden" id="feedback-form">
              <div className="bg-primary p-8 text-on-primary">
                <h2 className="font-headline-lg text-headline-lg mb-2">Submit New Suggestion</h2>
                <p className="opacity-90">Please categorize your feedback to help us route it to the right department.</p>
              </div>
              
              <form className="p-8 space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="space-y-2 group-focus-within:text-primary transition-colors">
                    <label className="font-label-md text-label-md text-on-surface-variant transition-colors">Feedback Category</label>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleChange} 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    >
                      <option value="Suggestion">Suggestion</option>
                      <option value="Complain">Complaint</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>
                  
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant transition-colors">Brief Summary</label>
                    <input 
                      required 
                      name="subject" 
                      value={formData.subject} 
                      onChange={handleChange} 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                      placeholder="e.g. Library Hours Extension" 
                      type="text"
                    />
                  </div>
                </div>

                {/* Main Feedback */}
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant transition-colors">Detailed Description</label>
                  <textarea 
                    required 
                    name="message" 
                    value={formData.message} 
                    onChange={handleChange} 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none" 
                    placeholder="Share your thoughts, concerns, or ideas..." 
                    rows="5"
                  ></textarea>
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">visibility_off</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-bold">Submit Anonymously</p>
                      <p className="text-xs text-on-surface-variant">Your identity will be hidden from administrators.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isAnonymous" 
                      checked={formData.isAnonymous} 
                      onChange={handleCheckboxChange} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Submit Error Handling */}
                {submitError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {submitError}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button 
                    disabled={submitting || submitted}
                    className={`px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 ${submitted ? 'bg-green-600 text-white' : 'bg-primary text-on-primary'}`} 
                    type="submit"
                  >
                    {submitting ? (
                      <><span className="material-symbols-outlined animate-spin">sync</span> Sending...</>
                    ) : submitted ? (
                      <><span className="material-symbols-outlined">check_circle</span> Sent!</>
                    ) : (
                      <><span>Submit Feedback</span><span className="material-symbols-outlined">send</span></>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Impact Section: You Suggested, We Did */}
            <section className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">You Suggested, <span className="text-primary">We Did</span></h2>
                  <p className="text-on-surface-variant mt-2">Real changes implemented from community submissions.</p>
                </div>
                <button className="text-primary font-semibold flex items-center gap-1 hover:underline">
                  View All History <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Impact Card 1 */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  </div>
                  <span className="inline-block px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold bg-primary-fixed text-on-primary-fixed-variant mb-3">Implemented • Dec 2023</span>
                  <h3 className="font-headline-md text-headline-md mb-2 group-hover:text-primary transition-colors">Digital Meal Credits</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                    Students requested a cashless system for the campus cafeteria to reduce queues. We've launched the "Excellence Wallet" integrated into the mobile app.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    40% reduction in queue wait times.
                  </div>
                </div>

                {/* Impact Card 2 */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
                  </div>
                  <span className="inline-block px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold bg-primary-fixed text-on-primary-fixed-variant mb-3">Implemented • Jan 2024</span>
                  <h3 className="font-headline-md text-headline-md mb-2 group-hover:text-primary transition-colors">24/7 Library Access</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                    Feedback showed a need for late-night study spaces during finals. The North Wing library is now open 24/7 with secure badge access.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Used by 200+ students weekly.
                  </div>
                </div>

                {/* Impact Card 3 */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>wifi</span>
                  </div>
                  <span className="inline-block px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold bg-primary-fixed text-on-primary-fixed-variant mb-3">Implemented • Feb 2024</span>
                  <h3 className="font-headline-md text-headline-md mb-2 group-hover:text-primary transition-colors">Campus-wide High Speed Fiber</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                    You highlighted dead zones in the sports complex and dorms. We've upgraded 50+ access points to high-speed fiber-backed WiFi 6.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    100% campus coverage achieved.
                  </div>
                </div>

                {/* Impact Card 4 */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12">
                    <span className="material-symbols-outlined text-9xl">groups</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                  </div>
                  <span className="inline-block px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold bg-primary-fixed text-on-primary-fixed-variant mb-3">Implemented • Mar 2024</span>
                  <h3 className="font-headline-md text-headline-md mb-2 group-hover:text-primary transition-colors">Mentorship Program</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                    Alumni requested more ways to give back. We launched the Peer-to-Alumni mentorship matching platform this semester.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    150 pairings in the first month.
                  </div>
                </div>
              </div>
            </section>

            {/* Feedback Stats / Transparency */}
            <section className="bg-surface-container rounded-2xl p-8 flex flex-col md:flex-row items-center justify-around gap-8 text-center">
              <div>
                <div className="text-primary font-display text-4xl mb-1">1,240</div>
                <div className="font-label-md text-on-surface-variant">Suggestions Received</div>
              </div>
              <div className="w-px h-12 bg-outline-variant hidden md:block"></div>
              <div>
                <div className="text-primary font-display text-4xl mb-1">86%</div>
                <div className="font-label-md text-on-surface-variant">Response Rate</div>
              </div>
              <div className="w-px h-12 bg-outline-variant hidden md:block"></div>
              <div>
                <div className="text-primary font-display text-4xl mb-1">42</div>
                <div className="font-label-md text-on-surface-variant">Actions Implemented</div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Complaints;
