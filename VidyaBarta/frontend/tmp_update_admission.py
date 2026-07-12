import os

jsx_content = """import React, { useContext, useState } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Admission = () => {
  const { schoolProfile } = useContext(SiteDataContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      e.target.reset();
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-container-max mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm uppercase tracking-wider">Admission Open 2024-25</span>
              <h1 className="font-display text-display text-on-surface leading-tight">
                Empower Your Future at <span className="text-primary">{schoolProfile?.name || 'Excellence Academy'}</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Join a community of scholars and leaders. Our rigorous academic environment and holistic approach ensure every student achieves their fullest potential.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button className="bg-primary text-on-primary px-8 py-4 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
                  <span className="material-symbols-outlined">download</span>
                  Download Admission Form
                </button>
                <button className="border border-primary text-primary px-8 py-4 rounded-lg font-label-md text-label-md hover:bg-surface-container transition-all">
                  View Prospectus
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-surface-container relative">
                <img 
                  className="w-full h-full object-cover" 
                  alt="A professional architectural photograph of Excellence Academy's modern educational facility" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3aE-9kOiACoCDZ-bAzIMW5VjNG6dcJGHxRa7eZAdPmEu-dssCjkTY6i0zzBTVhIUhdNdDTTjNDSFk_uWMk-BbEdtWooWljOwk7fn8bYlbxcjb7tZyk9wxPQT_BrwdxstlxvMNcGZq3Mw0rraVZmlA0drZZzyUEivytQbEMmETd1Pvme1LbBUK3XsrdGWnlBuit7AuIVNnrlruzIaJ7KslDqeg3geFCOxmeXXx_L_tbv8xmmy4DTe4dWPDHBPt6rxo4zEF8i9Clkg"
                />
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-outline-variant flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Top 1% Global Ranking</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence Since {schoolProfile?.establishedYear || '1995'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admission Process Bento Grid */}
      <section className="py-section-padding bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Simplified Admission Journey</h2>
            <p className="text-on-surface-variant font-body-md text-body-md">Four clear steps to becoming an Excellence scholar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            {/* Step 1 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-lg bg-surface-container text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-[32px]">app_registration</span>
              </div>
              <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-widest block mb-2">Step 01</span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Online Registration</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">Fill out the digital application form and upload necessary scanned documents.</p>
            </div>
            {/* Step 2 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-lg bg-surface-container text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-[32px]">fact_check</span>
              </div>
              <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-widest block mb-2">Step 02</span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Document Verification</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">Our admissions team reviews your credentials and verifies educational history.</p>
            </div>
            {/* Step 3 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-lg bg-surface-container text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-[32px]">assignment_turned_in</span>
              </div>
              <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-widest block mb-2">Step 03</span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Entrance Assessment</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">Participate in an interactive evaluation focusing on core aptitude and values.</p>
            </div>
            {/* Step 4 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-lg bg-surface-container text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-[32px]">school</span>
              </div>
              <span className="text-primary font-label-sm text-label-sm font-bold uppercase tracking-widest block mb-2">Step 04</span>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Final Enrollment</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">Receive your admission offer letter and complete the fee payment process.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility & Important Dates */}
      <section className="py-section-padding bg-surface">
        <div className="max-w-container-max mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Eligibility Criteria */}
            <div className="flex-1 space-y-8">
              <h2 className="font-headline-lg text-headline-lg text-on-surface border-l-4 border-primary pl-4">Eligibility Criteria</h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Age Requirement</p>
                    <p className="text-on-surface-variant font-body-md text-body-md">Students must be between 16-19 years for undergraduate foundation programs.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Academic Performance</p>
                    <p className="text-on-surface-variant font-body-md text-body-md">Minimum of 75% aggregate in previous standard board examinations.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Language Proficiency</p>
                    <p className="text-on-surface-variant font-body-md text-body-md">Proficiency in English with minimum IELTS 6.5 or equivalent qualification.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Important Dates Table */}
            <div className="flex-1 space-y-8">
              <h2 className="font-headline-lg text-headline-lg text-on-surface border-l-4 border-primary pl-4">Important Dates</h2>
              <div className="overflow-hidden border border-outline-variant rounded-xl shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-surface-container text-on-surface">
                    <tr>
                      <th className="px-6 py-4 font-label-md text-label-md">Event Description</th>
                      <th className="px-6 py-4 font-label-md text-label-md">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-on-surface font-body-md">Opening of Online Applications</td>
                      <td className="px-6 py-4 font-label-md text-label-md text-primary">January 15, 2024</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-on-surface font-body-md">Scholarship Application Deadline</td>
                      <td className="px-6 py-4 font-label-md text-label-md text-error">March 31, 2024</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-on-surface font-body-md">First Entrance Assessment Wave</td>
                      <td className="px-6 py-4 font-label-md text-label-md text-primary">April 15-20, 2024</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-on-surface font-body-md">Final Admission Lists Released</td>
                      <td className="px-6 py-4 font-label-md text-label-md text-primary">May 25, 2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Appointment Form Section */}
      <section className="py-section-padding bg-surface-container text-on-surface overflow-hidden relative">
        <div className="max-w-container-max mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="font-display text-display leading-tight">Need Guidance? <br/>Book an Appointment</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Schedule a one-on-one session with our admissions counselors to discuss courses, scholarships, and campus life.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <span className="font-label-md text-label-md">{schoolProfile?.phone || '+1 (555) 0123 4567'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <span className="font-label-md text-label-md">{schoolProfile?.email || 'admissions@excellence.edu'}</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl border border-outline-variant">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md">Full Name</label>
                    <input required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Enter your name" type="text"/>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md">Email Address</label>
                    <input required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="email@example.com" type="email"/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md">Preferred Date</label>
                    <input required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" type="date"/>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md">Preferred Slot</label>
                    <select required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                      <option>Morning (10 AM - 12 PM)</option>
                      <option>Afternoon (2 PM - 4 PM)</option>
                      <option>Evening (4 PM - 6 PM)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md">Topic of Discussion</label>
                  <textarea required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Briefly describe your queries..." rows="3"></textarea>
                </div>
                <button 
                  className={`w-full ${isSuccess ? 'bg-green-600' : 'bg-primary'} text-on-primary py-4 rounded-lg font-label-md text-label-md shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all`} 
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                >
                  {isSubmitting ? 'Sending...' : isSuccess ? 'Request Sent!' : 'Confirm Appointment Request'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admission;
"""

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/Admission.jsx', 'w') as f:
    f.write(jsx_content)

print("Admission.jsx updated successfully!")
