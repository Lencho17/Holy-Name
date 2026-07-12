import React, { useContext, useState, useEffect } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Career = () => {
  const { schoolProfile, API_URL } = useContext(SiteDataContext);
  const apiBase = API_URL || import.meta.env.VITE_API_URL || '/api';
  
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const res = await axios.get(`${apiBase}/jobs/public`);
        if (res.data.success) {
          setVacancies(res.data.jobs);
        }
      } catch (err) {
        console.warn('Failed to load jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, [apiBase]);

  const handleApplicationSubmit = (e) => {
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
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen">
      <main className="pt-12">
        {/* Hero Section */}
        <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden py-section-padding">
          <div className="relative z-10 max-w-container-max mx-auto px-gutter text-center">
            <span className="inline-block py-1 px-4 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md mb-6">
              Careers at {schoolProfile?.name || 'Excellence Academy'}
            </span>
            <h1 className="font-display text-display mb-6 tracking-tight">
              Join Our <span className="text-primary">Team</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
              We are looking for passionate educators and administrators who are dedicated to shaping the next generation of global leaders through academic excellence and character development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a className="bg-primary text-on-primary px-8 py-4 rounded-lg font-label-md text-body-md transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2" href="#positions">
                View Open Positions
                <span className="material-symbols-outlined">arrow_downward</span>
              </a>
              <a className="bg-surface text-primary border-2 border-primary px-8 py-4 rounded-lg font-label-md text-body-md transition-all hover:bg-surface-container-low active:scale-95 flex items-center justify-center" href="#apply">
                Quick Application
              </a>
            </div>
          </div>
        </section>

        {/* Why Work With Us Section */}
        <section className="bg-surface-container-low py-section-padding">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="mb-16">
              <h2 className="font-headline-lg text-headline-lg mb-4">Why Work With Us</h2>
              <div className="h-1.5 w-24 bg-primary rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-12 gap-6">
              {/* Bento Item 1 */}
              <div className="col-span-12 lg:col-span-7 bg-white/80 backdrop-blur-md border border-slate-200 p-10 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <span className="material-symbols-outlined text-primary text-5xl mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  <h3 className="font-headline-md text-headline-md mb-4 text-on-background">Professional Growth</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed mb-6">
                    We invest in our people through continuous professional development programs, international exchange opportunities, and leadership pathways. Your growth is our priority.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-primary font-label-md">
                  <span>Learn about training</span>
                  <span className="material-symbols-outlined">arrow_right_alt</span>
                </div>
              </div>

              {/* Bento Item 2 (Image) */}
              <div className="col-span-12 lg:col-span-5 rounded-xl overflow-hidden relative min-h-[300px] shadow-sm">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCT8Y6L-HBLqGstPaRI8bpwEiwVfZftr--xZsJqKthopEd_b1AdDPUP_b0M92D0fn_EZP97dnRgegJExmudaZgtExaiaBTwOuq9dSgsOz4T5mL1kTbOJADDxWDrG9dGHbO3Td2lMSBmX2BrGnRSf-ok0mHs4KJpHXevzJAYnGOnliHl_hTMN95vqQInenECErumz5xdxDixOlrBG3OkOtwx38xiasJJ9F3L2DBw4LdnGrONh1PQviuaiyxWu9hNhsiaB3c10EPG00')" }}></div>
              </div>

              {/* Bento Item 3 */}
              <div className="col-span-12 md:col-span-4 bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                <h4 className="font-headline-md text-headline-md text-body-lg mb-3">Holistic Well-being</h4>
                <p className="text-on-surface-variant text-body-md">Comprehensive health benefits, mental wellness support, and a work-life balance that respects your personal time.</p>
              </div>

              {/* Bento Item 4 */}
              <div className="col-span-12 md:col-span-4 bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                <h4 className="font-headline-md text-headline-md text-body-lg mb-3">Inclusive Community</h4>
                <p className="text-on-surface-variant text-body-md">Join a vibrant culture where diverse perspectives are celebrated and every team member's voice is heard and valued.</p>
              </div>

              {/* Bento Item 5 */}
              <div className="col-span-12 md:col-span-4 bg-white/80 backdrop-blur-md border border-slate-200 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
                <h4 className="font-headline-md text-headline-md text-body-lg mb-3">Modern Infrastructure</h4>
                <p className="text-on-surface-variant text-body-md">Work with state-of-the-art classroom technology and research facilities designed to empower your instructional excellence.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section className="py-section-padding bg-surface" id="positions">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-headline-lg text-headline-lg mb-2">Open Positions</h2>
                <p className="text-on-surface-variant">Find your next calling in our academic ecosystem.</p>
              </div>
              <div className="flex gap-4">
                <select className="rounded-lg border-outline-variant bg-surface text-label-md px-4 py-2 focus:ring-primary focus:border-primary">
                  <option>All Departments</option>
                  <option>Academic</option>
                  <option>Administration</option>
                  <option>Sports &amp; Arts</option>
                </select>
                <select className="rounded-lg border-outline-variant bg-surface text-label-md px-4 py-2 focus:ring-primary focus:border-primary">
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-10">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
                  <p className="mt-2 text-on-surface-variant font-label-md">Loading open positions...</p>
                </div>
              ) : vacancies.length > 0 ? (
                vacancies.map((job) => (
                  <div key={job._id} className="group border border-outline-variant rounded-xl p-6 hover:border-primary hover:bg-surface-container-lowest transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary-container text-on-secondary-container p-3 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">work</span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-headline-md text-body-lg group-hover:text-primary transition-colors">{job.title}</h4>
                        <div className="flex gap-4 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {job.type || 'Full-time'}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> {job.department || 'Main Campus'}</span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/job-application/${job._id}`} className="self-start md:self-auto px-6 py-2 rounded-full border border-primary text-primary font-label-md hover:bg-primary hover:text-on-primary transition-all text-center">
                      Apply Now
                    </Link>
                  </div>
                ))
              ) : (
                <>
                  {/* Fallback Static Data */}
                  <div className="group border border-outline-variant rounded-xl p-6 hover:border-primary hover:bg-surface-container-lowest transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary-container text-on-secondary-container p-3 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">functions</span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-headline-md text-body-lg group-hover:text-primary transition-colors">Mathematics Teacher (Senior Secondary)</h4>
                        <div className="flex gap-4 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> Full-time</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> Main Campus</span>
                        </div>
                      </div>
                    </div>
                    <button className="self-start md:self-auto px-6 py-2 rounded-full border border-primary text-primary font-label-md hover:bg-primary hover:text-on-primary transition-all">Apply Now</button>
                  </div>

                  <div className="group border border-outline-variant rounded-xl p-6 hover:border-primary hover:bg-surface-container-lowest transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary-container text-on-secondary-container p-3 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">badge</span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-headline-md text-body-lg group-hover:text-primary transition-colors">Administrative Assistant</h4>
                        <div className="flex gap-4 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> Full-time</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> Registrar's Office</span>
                        </div>
                      </div>
                    </div>
                    <button className="self-start md:self-auto px-6 py-2 rounded-full border border-primary text-primary font-label-md hover:bg-primary hover:text-on-primary transition-all">Apply Now</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Application Form Section */}
        <section className="py-section-padding bg-surface-container-high relative" id="apply">
          <div className="max-w-4xl mx-auto px-gutter relative z-10">
            <div className="bg-surface rounded-2xl shadow-xl p-8 md:p-12 border border-outline-variant">
              <div className="text-center mb-10">
                <h2 className="font-headline-lg text-headline-lg mb-4">Submit Your Interest</h2>
                <p className="text-on-surface-variant">Don't see a perfect match? Fill out this general application and we'll reach out when a suitable role opens up.</p>
              </div>
              
              <form className="space-y-6" onSubmit={handleApplicationSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-background">Full Name</label>
                    <input required className="w-full rounded-lg border-outline bg-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="John Doe" type="text"/>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-background">Email Address</label>
                    <input required className="w-full rounded-lg border-outline bg-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="john@example.com" type="email"/>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-background">Phone Number</label>
                    <input className="w-full rounded-lg border-outline bg-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="+1 (555) 000-0000" type="tel"/>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-background">Desired Position Type</label>
                    <select className="w-full rounded-lg border-outline bg-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                      <option>Teaching / Academic</option>
                      <option>Administrative / Staff</option>
                      <option>Coaching / Extra-curricular</option>
                      <option>Support Staff</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-background">Resume / CV (PDF)</label>
                  <div className="border-2 border-dashed border-outline-variant rounded-lg p-8 text-center cursor-pointer hover:bg-surface-container-low transition-colors group">
                    <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary transition-colors">cloud_upload</span>
                    <p className="mt-2 text-on-surface-variant text-body-md">Click to upload or drag and drop</p>
                    <p className="text-label-sm text-outline">Max size: 5MB</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-background">Message / Cover Note</label>
                  <textarea required className="w-full rounded-lg border-outline bg-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all" placeholder="Tell us why you'd like to join Excellence Academy..." rows="4"></textarea>
                </div>
                
                <div className="flex items-start gap-3">
                  <input required className="mt-1 rounded text-primary focus:ring-primary" id="consent" type="checkbox"/>
                  <label className="text-label-sm text-on-surface-variant leading-tight" htmlFor="consent">
                    I agree to Excellence Academy's privacy policy and consent to having my information processed for recruitment purposes.
                  </label>
                </div>
                
                <button 
                  className={`w-full ${isSuccess ? 'bg-green-600' : 'bg-primary'} text-on-primary py-4 rounded-lg font-headline-md text-body-lg hover:shadow-lg transition-all flex items-center justify-center gap-2`} 
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                >
                  {isSubmitting ? (
                    <><span className="material-symbols-outlined animate-spin">sync</span> Submitting...</>
                  ) : isSuccess ? (
                    <><span className="material-symbols-outlined">check_circle</span> Application Sent!</>
                  ) : (
                    <>Submit Application</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Career;
