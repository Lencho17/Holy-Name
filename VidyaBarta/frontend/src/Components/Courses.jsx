import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Courses = () => {
  const { schoolProfile, coursesPage } = useContext(SiteDataContext);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      <main className="max-w-container-max mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16 relative rounded-3xl overflow-hidden min-h-[400px] flex items-center px-12 bg-surface-variant">
          <div className="absolute inset-0 opacity-40">
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{
                backgroundImage: `url('${schoolProfile?.pageHeroImages?.courses || "https://lh3.googleusercontent.com/aida-public/AB6AXuA6d-8aC5I8IHyAAYmqTJNAGIkjYy1MAZ3E-V88Sb-ryzPsj1R3AAF02MBxINj8FAO_V7MltiFP6bozTupCc68VRnycLt6O-AnOoPa3ree93yO2Y1Jrnas7JFtt1WTN4Jy6X7nr_PZxp1X32UhDmR4JLWkhTygJichWUA9c4A09j_nWt_H6KULyjrkFYEHHILU1kwBGIIMN5T55F9rHcYl_73fqhbUTqQVfbwSoZdkQXKLc9gPegrEgprAxHXT8RysMPgVi7Zi3hwI"}')`
              }}
            ></div>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-display text-display text-on-background mb-4">Academic Departments</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              {coursesPage?.higherEducation?.text || "Nurturing excellence through diverse curriculum streams and world-class faculty mentorship. Choose your path to greatness."}
            </p>
            <div className="flex gap-4">
              <a className="bg-primary text-white px-8 py-3 rounded-lg font-label-md hover:shadow-lg transition-shadow" href="#courses">Explore Courses</a>
              <a className="bg-white text-primary border border-primary px-8 py-3 rounded-lg font-label-md hover:bg-surface-container transition-colors" href="/faculty">Meet Faculty</a>
            </div>
          </div>
        </section>

        {/* Department Bento Grid */}
        <section className="mb-20" id="courses">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">Our Academic Streams</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Comprehensive programs designed for the global leaders of tomorrow.</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-outline-variant rounded-full hover:bg-surface-variant transition-colors"><span className="material-symbols-outlined">west</span></button>
              <button className="p-2 border border-outline-variant rounded-full hover:bg-surface-variant transition-colors"><span className="material-symbols-outlined">east</span></button>
            </div>
          </div>
          
          <div className="bento-grid grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Science Department */}
            <div className="col-span-12 md:col-span-7 bg-surface-container rounded-3xl p-8 hover:shadow-xl transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <span className="p-3 bg-primary/10 rounded-2xl"><span className="material-symbols-outlined text-primary text-3xl">science</span></span>
                <span className="bg-primary text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Top Rated</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Faculty of Science</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-md">Innovation-driven curriculum focusing on Physics, Chemistry, Biology, and Advanced Mathematics with state-of-the-art lab facilities.</p>
              <ul className="grid grid-cols-2 gap-y-3 mb-8">
                <li className="flex items-center gap-2 text-on-surface font-label-md"><span className="material-symbols-outlined text-sm text-primary">check_circle</span> Physics Honours</li>
                <li className="flex items-center gap-2 text-on-surface font-label-md"><span className="material-symbols-outlined text-sm text-primary">check_circle</span> Biotechnology</li>
                <li className="flex items-center gap-2 text-on-surface font-label-md"><span className="material-symbols-outlined text-sm text-primary">check_circle</span> Computer Science</li>
                <li className="flex items-center gap-2 text-on-surface font-label-md"><span className="material-symbols-outlined text-sm text-primary">check_circle</span> Pure Mathematics</li>
              </ul>
              <a className="inline-flex items-center gap-2 text-primary font-bold hover:underline" href="#">View Syllabus <span className="material-symbols-outlined">arrow_forward</span></a>
            </div>
            
            {/* Arts Department */}
            <div className="col-span-12 md:col-span-5 bg-surface-dim rounded-3xl p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="relative z-10">
                <span className="p-3 bg-white/50 rounded-2xl mb-6 inline-block"><span className="material-symbols-outlined text-on-surface text-3xl">palette</span></span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Liberal Arts</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">Cultivating critical thinking through Literature, History, and Social Sciences.</p>
                <div className="space-y-2">
                  <div className="bg-white/40 p-3 rounded-xl flex items-center justify-between">
                    <span className="font-label-md">English Literature</span>
                    <span className="material-symbols-outlined text-primary">arrow_outward</span>
                  </div>
                  <div className="bg-white/40 p-3 rounded-xl flex items-center justify-between">
                    <span className="font-label-md">Psychology &amp; Ethics</span>
                    <span className="material-symbols-outlined text-primary">arrow_outward</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Commerce Department */}
            <div className="col-span-12 md:col-span-5 bg-on-surface text-white rounded-3xl p-8 hover:shadow-xl transition-all duration-300">
              <span className="p-3 bg-primary rounded-2xl mb-6 inline-block"><span className="material-symbols-outlined text-white text-3xl">payments</span></span>
              <h3 className="font-headline-md text-headline-md mb-3">Commerce &amp; Finance</h3>
              <p className="font-body-md text-body-md opacity-80 mb-8">Building the next generation of financial analysts and entrepreneurs with real-world case studies.</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/10 px-4 py-2 rounded-lg font-label-sm border border-white/20">Accountancy</span>
                <span className="bg-white/10 px-4 py-2 rounded-lg font-label-sm border border-white/20">Economics</span>
                <span className="bg-white/10 px-4 py-2 rounded-lg font-label-sm border border-white/20">Business Math</span>
              </div>
            </div>
            
            {/* Vocational / Special */}
            <div className="col-span-12 md:col-span-7 bg-white border border-outline-variant rounded-3xl p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all duration-300">
              <div className="md:w-1/2">
                <img className="w-full h-48 object-cover rounded-2xl mb-4" alt="Vocational" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHBQsUDcVFG6ASQ8XfOkcJObepFaTOaDp8wIitUb--9XHGuI6xq4ksjz7JBsx0zGQZTMqY5H4VyDku7IMc-41VioyjIwmntaj1wEGzamv2dVludcGJDUzN5UMes4tizaVoTz3dsmYC2ZxLq7XFmVimgLc-nYl09S8B0MwFRrCRaHULlohM-H9T58zP30ND0HqBQEiAfZZFNCCY2bqOrEhGoz8qBKlLebfwpu039G0wk0-z5oDQ7T5jqtJN51eEj6TdEfLlA2pkv1g"/>
              </div>
              <div className="md:w-1/2 flex flex-col justify-center">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Technical Vocational</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">Hands-on skill development in emerging technologies and industrial applications.</p>
                <button className="w-full bg-surface-container text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-white transition-all">Download Brochure</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Courses;
