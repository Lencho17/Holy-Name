import os

jsx_content = """import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Principal = () => {
  const { principal, schoolProfile } = useContext(SiteDataContext);

  if (!principal) return null;

  return (
    <div className="bg-background text-on-surface font-body-md antialiased overflow-x-hidden min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative pt-section-padding pb-20 bg-surface-container-low overflow-hidden">
          <div className="max-w-container-max mx-auto px-gutter relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text Content */}
              <div className="lg:col-span-7" id="hero-text">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary mb-6">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="font-label-sm text-label-sm">Leadership &amp; Vision</span>
                </div>
                <h1 className="font-display text-display text-on-background mb-6">A Message from the Principal</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  {principal.introQuote || '"Education is not the learning of facts, but the training of the mind to think." At Excellence Academy, we are committed to nurturing global citizens who are prepared to lead with integrity.'}
                </p>
              </div>
              {/* Portrait Area */}
              <div className="lg:col-span-5 relative group">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5]">
                  <img 
                    className="w-full h-full object-cover" 
                    alt={principal.name || "Principal"} 
                    src={principal.photo || "https://lh3.googleusercontent.com/aida-public/AB6AXuAxMOv-KMi_dlGlbvQSGn2NGIuuHLKugyrOvOG8Piry1BrtyLBe1L3axHm-xsaEIuczGnn7dyvVmNpo6lIwITmAYL4rSwBQs9d1vr-4bLB7ufjPZYbBq3XrlQ_tjz2SqlHvL0X72SaUBi8bPC1uQiy22V6YwbF8UYTMimHXB2T_xvBsDAmYP1G_XtmsmZ02KTbvlfiuGho6MYwbI-12ahjfAQckZgCszjLV8IbUAzMw5XmbOrtI7KwZxn-UGUcwHY7AIja22BKXyoI"}
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 shadow-xl rounded-xl border border-outline-variant max-w-xs">
                  <h3 className="font-headline-md text-headline-md text-primary mb-1">{principal.name || "Dr. Arthur J. Sterling"}</h3>
                  <p className="font-label-md text-label-md text-secondary mb-2">{principal.title || "Ph.D. in Educational Leadership"}</p>
                  <div className="flex gap-2">
                    <span className="w-8 h-1 bg-primary rounded-full"></span>
                    <span className="w-2 h-1 bg-primary/30 rounded-full"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Atmospheric Pattern */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern height="10" id="grid" patternUnits="userSpaceOnUse" width="10">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
                </pattern>
              </defs>
              <rect fill="url(#grid)" height="100" width="100"></rect>
            </svg>
          </div>
        </section>

        {/* Main Content (The Vision Statement) */}
        <section className="py-section-padding bg-surface">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Left Sidebar (Credentials & Stats) */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant">
                  <h4 className="font-label-md text-label-md uppercase tracking-wider text-primary mb-6">Academic Background</h4>
                  <ul className="space-y-6">
                    <li className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">history_edu</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Doctorate in Education</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Stanford University, 2012</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">school</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">M.A. International Policy</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">Oxford University, 2005</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">military_tech</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Global Educator Award</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">UNESCO Recognition, 2021</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="bg-primary p-8 rounded-xl text-on-primary">
                  <h4 className="font-label-md text-label-md uppercase tracking-wider opacity-80 mb-6">Our Philosophy</h4>
                  <p className="font-headline-md text-headline-md mb-6 italic">"To inspire is to lead. We build more than students; we build futures."</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-label-md text-label-md">Holistic Development</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-label-md text-label-md">Innovative Pedagogy</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-label-md text-label-md">Ethical Leadership</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column (The Long-form Message) */}
              <div className="lg:col-span-8">
                <div className="prose prose-lg max-w-none space-y-8">
                  {principal.message ? (
                    <div dangerouslySetInnerHTML={{ __html: principal.message }} className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed space-y-6" />
                  ) : (
                    <>
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                          Dear Students, Parents, and Faculty,
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                          It is with profound joy and a deep sense of responsibility that I welcome you to Excellence Academy. As we navigate an era of unprecedented global change, the role of education has transformed from simple instruction to an immersive journey of discovery and character-building. 
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                          At the heart of our institution lies a simple yet powerful belief: every child possesses a unique reservoir of potential. Our mission is to provide the catalyst that turns that potential into purpose. We have designed our curriculum not just to meet international standards, but to exceed them through critical thinking, digital literacy, and emotional intelligence.
                      </p>
                      <div className="py-6 border-l-4 border-primary pl-8 my-10 bg-surface-container-low rounded-r-lg">
                        <p className="font-headline-md text-headline-md text-on-background leading-snug italic">
                            "We don't just teach for the classroom; we prepare for the world. Our graduates leave these halls not just with diplomas, but with the courage to question and the empathy to serve."
                        </p>
                      </div>
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                          Looking ahead, we are investing heavily in STEAM initiatives and sustainable campus practices. We want our students to be as comfortable in a high-tech lab as they are in a community service project. Our faculty, a handpicked group of dedicated educators, are here to mentor, challenge, and support every student's individual journey.
                      </p>
                      <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                          I invite you to join us in this noble endeavor. Together, let us cultivate an environment where excellence is not an act, but a habit.
                      </p>
                    </>
                  )}
                  
                  <div className="pt-12">
                    <p className="font-body-md text-body-md text-on-surface-variant mb-4">Warm regards,</p>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-64 mb-2">
                        {principal.signature ? (
                          <img 
                            className="h-full object-contain filter brightness-90 contrast-125" 
                            alt="Signature" 
                            src={principal.signature}
                          />
                        ) : (
                          <img 
                            className="h-full object-contain filter brightness-90 contrast-125" 
                            alt="Signature" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi-JFHv9kUqABoYOXw-ooeSNxmbd451yPs1qdN-yK3WAQuk3mZCld2D-KNTnyd6sEiIU29vRS6ydnhN7egwlks3LIoS9oo1KNIq9mduCEaloxaWpQztWgO21oDqwtvN61_7hx9yLF-zTkTxDGS50YnkZYLG87CTurJlI1PGMgjm6BczoEDpfCpmikfbsv9CRcyz4k-7ZjP-QTRsLzP29uwPM031Ear5UvePJXZypchsQRPbt5EfQlwb0BbMfVgFo9mPHscriVAps4"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-headline-md text-headline-md text-on-background">{principal.name || "Dr. Arthur J. Sterling"}</p>
                        <p className="font-label-md text-label-md text-secondary">Principal, {schoolProfile?.name || "Excellence Academy"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter / CTA Section */}
        <section className="py-20 bg-surface-container-highest">
          <div className="max-w-container-max mx-auto px-gutter text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Stay Connected with our Vision</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">Subscribe to the Principal's monthly newsletter for insights on education, school updates, and leadership reflections.</p>
              <form className="flex flex-col sm:flex-row gap-4 justify-center" onSubmit={(e) => e.preventDefault()}>
                <input className="px-6 py-3 rounded-lg border border-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none min-w-[300px]" placeholder="Your email address" type="email"/>
                <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all active:scale-95" type="submit">Subscribe Now</button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Principal;
"""

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/Principal.jsx', 'w') as f:
    f.write(jsx_content)

print("Principal.jsx updated successfully!")
