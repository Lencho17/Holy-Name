import React, { useContext, useState } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Contact = () => {
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
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      <main className="flex-grow pt-12 pb-section-padding max-w-container-max mx-auto w-full">
        {/* Hero Section */}
        <section className="px-gutter mb-16">
          <div className="relative rounded-xl overflow-hidden h-[300px] flex items-center justify-center">
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center" 
              style={{ backgroundImage: `url('${schoolProfile?.pageHeroImages?.contact || "https://lh3.googleusercontent.com/aida-public/AB6AXuCLQXsD_BHWC9zz8Q6Bh_uw7kwsNnq6vG9PPNkoth8QRVvM0o1b4u4Rib_wA3klvcLMLRzOL7cBGTI1weYCFMQoEhHuFbE_0mPfEMK4DNdR6dG17x9sSsuki_JTlYIc6q46N90FWVhcFWjtkQ-hYhrymm7TtEihS5SU_hcvGbqBTqIgx3Trhuqtjbq8h3EgkoKTbBYCed1zBLBIE0jlGeKb54YaWkXrm4IWM-qD6WS6eMRkGPbKfEw8FybcMrNIGdRHMT8jNU4Ljvc"}')` }}
            ></div>
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm z-10"></div>
            <div className="relative z-20 text-center px-4">
              <h1 className="font-display text-display text-on-primary mb-4">Contact Us</h1>
              <p className="font-body-lg text-body-lg text-on-primary/90 max-w-2xl mx-auto">We are here to help you navigate your educational journey. Reach out to us for any inquiries about admissions, faculty, or campus life.</p>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="px-gutter grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inquiry Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant">
            <h2 className="font-headline-lg text-headline-lg mb-6">Send an Inquiry</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Full Name</label>
                  <input required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all outline-none" placeholder="John Doe" type="text"/>
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Email Address</label>
                  <input required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all outline-none" placeholder="john@example.com" type="email"/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Subject</label>
                <select required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all outline-none">
                  <option>Admissions Inquiry</option>
                  <option>General Information</option>
                  <option>Faculty Careers</option>
                  <option>Event Participation</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Message</label>
                <textarea required className="w-full px-4 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all outline-none" placeholder="How can we help you?" rows="5"></textarea>
              </div>
              <button 
                className={`w-full ${isSuccess ? 'bg-green-600' : 'bg-primary'} text-on-primary font-label-md text-label-md py-4 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2`} 
                type="submit"
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting ? (
                  <><span className="material-symbols-outlined animate-spin">sync</span> Sending...</>
                ) : isSuccess ? (
                  <><span className="material-symbols-outlined">check_circle</span> Message Sent</>
                ) : (
                  <><span className="material-symbols-outlined">send</span> Submit Message</>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Contact Details & Hours */}
          <div className="lg:col-span-5 space-y-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant flex items-start gap-4">
                <div className="bg-primary-container text-on-primary-container p-3 rounded-lg">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-primary">Our Location</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{schoolProfile?.officeAddress || '123 Academic Way, Excellence Plaza, NY 10001'}</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant flex items-start gap-4">
                <div className="bg-primary-container text-on-primary-container p-3 rounded-lg">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-primary">Call Support</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">{schoolProfile?.phone ? `+91 ${schoolProfile.phone}` : '+1 (555) 0123-4567\n+1 (555) 9876-5432'}</p>
                </div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant flex items-start gap-4">
                <div className="bg-primary-container text-on-primary-container p-3 rounded-lg">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h3 className="font-label-md text-label-md text-primary">Email Us</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">{schoolProfile?.email || 'info@excellenceacademy.edu\nadmissions@excellenceacademy.edu'}</p>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-inverse-surface text-inverse-on-surface p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary-fixed">schedule</span>
                <h3 className="font-headline-md text-headline-md">Office Hours</h3>
              </div>
              {schoolProfile?.officeHours ? (
                <div className="font-body-md text-body-md opacity-80 whitespace-pre-line">{schoolProfile.officeHours}</div>
              ) : (
                <ul className="space-y-4">
                  <li className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="font-body-md text-body-md opacity-80">Monday - Friday</span>
                    <span className="font-label-md text-label-md">08:00 AM - 05:00 PM</span>
                  </li>
                  <li className="flex justify-between border-b border-outline-variant pb-2">
                    <span className="font-body-md text-body-md opacity-80">Saturday</span>
                    <span className="font-label-md text-label-md">09:00 AM - 01:00 PM</span>
                  </li>
                  <li className="flex justify-between pb-2">
                    <span className="font-body-md text-body-md opacity-80">Sunday</span>
                    <span className="font-label-md text-label-md text-error">Closed</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="px-gutter mt-16">
          <div className="bg-surface-container-highest p-4 rounded-2xl border border-outline-variant">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="font-headline-md text-headline-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">map</span>
                Find Us on Campus
              </h2>
              <a 
                href={schoolProfile?.mapLink || "https://maps.google.com"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1"
              >
                Get Directions
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
            
            {schoolProfile?.mapLink ? (
              <div className="w-full h-[450px] rounded-xl overflow-hidden shadow-inner">
                <iframe
                  title="Google Maps Location"
                  src={schoolProfile.mapLink.includes('embed') ? schoolProfile.mapLink : `https://maps.google.com/maps?q=${encodeURIComponent(schoolProfile.officeAddress || schoolProfile.name)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            ) : (
              <div className="w-full h-[450px] rounded-xl overflow-hidden grayscale contrast-125 brightness-90 hover:grayscale-0 transition-all duration-700">
                <img className="w-full h-full object-cover" alt="Map Location" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsFepIyMFXR0JCI-0vfxncOB1CYWQtOaT2Pz2cMUhSs89lQ9AJhvLDD9sDsvOYMFlR_kA48Ukivw2wte9Nr20pIZ1HQ6mI_7umT0ZktSui3Qp3Z8TBytG68XX4z5lLQ0LylLq4G3o84SrC1acIfK2Pr7zNtvQxGrNJnz9mEfM9cNbjqCCA0R5xM57edXHxBydb-JkVgHP_AplgBPlZDV6ZYtfWD31OwNj3Zfvzv9FztMqGj4ONmjU2GuA9B8HsXwLiURPziZMeJhY"/>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
