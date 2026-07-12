import os

jsx_content = """import React, { useContext, useState } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Notice = () => {
  const { notices, schoolProfile, API_URL } = useContext(SiteDataContext);
  const [searchTerm, setSearchTerm] = useState('');
  
  const getProxyUrl = (url) => {
    if (!url) return url;
    const isExternal = url.includes('cloudinary.com') || url.includes('supabase.co');
    if (!isExternal) return url;
    return `${API_URL}/files/proxy?url=${encodeURIComponent(url)}`;
  };

  const filteredNotices = (notices || []).filter(notice => 
    notice.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <main className="max-w-container-max mx-auto px-6 py-12">
        {/* Hero Title Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-primary font-label-md mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>campaign</span>
            COMMUNICATIONS HUB
          </div>
          <h1 className="font-display text-display text-on-surface mb-4">Notice Board</h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Stay updated with the latest announcements, examination schedules, and institutional circulars for the current academic year at {schoolProfile?.name || 'Excellence Academy'}.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <section className="bg-surface-container-lowest rounded-xl p-4 mb-10 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md">All Notices</button>
            <button className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-4 py-2 rounded-lg font-label-md text-label-md transition-colors">Exams</button>
            <button className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-4 py-2 rounded-lg font-label-md text-label-md transition-colors">Holidays</button>
            <button className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-4 py-2 rounded-lg font-label-md text-label-md transition-colors">Admissions</button>
          </div>
          <div className="relative w-full md:w-80 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-label-md focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Main Content Layout: Bento Grid Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Recent Announcements Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-headline-lg text-headline-lg flex items-center gap-3 mb-6">
              Recent Announcements
              <span className="h-1 flex-grow bg-outline-variant rounded-full opacity-30"></span>
            </h2>

            {filteredNotices.length > 0 ? (
              filteredNotices.map((notice, idx) => (
                <article key={idx} className="notice-card bg-surface-container-lowest border border-outline-variant rounded-xl p-6 transition-all hover:shadow-lg group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      {idx === 0 && (
                        <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>priority_high</span>
                          NEW
                        </span>
                      )}
                      <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-sm font-label-sm">General</span>
                    </div>
                    <time className="text-label-sm text-outline">{notice.date}</time>
                  </div>
                  <h3 className="notice-title font-headline-md text-headline-md mb-2 transition-colors group-hover:text-primary">{notice.title}</h3>
                  <p className="text-body-md text-on-surface-variant mb-6">Please find the attached document for more details.</p>
                  
                  {notice.pdf_url && (
                    <div className="flex flex-wrap gap-4">
                      <a 
                        className="flex items-center gap-2 bg-surface-container text-primary px-4 py-2 rounded-lg font-label-md hover:bg-primary hover:text-on-primary transition-all" 
                        href={getProxyUrl(notice.pdf_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined">download</span>
                        Download Document
                      </a>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="text-center py-10 bg-surface-container-lowest border border-outline-variant rounded-xl">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">inbox</span>
                <p className="text-on-surface-variant font-label-md">No notices found.</p>
              </div>
            )}
            
            {filteredNotices.length > 3 && (
              <button className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-outline font-label-md hover:border-primary hover:text-primary transition-all">
                Load Older Notices
              </button>
            )}
          </div>

          {/* Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Downloads */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant">
              <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">cloud_download</span>
                Key Documents
              </h3>
              <div className="space-y-3">
                <a className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg border border-outline-variant hover:border-primary transition-colors group" href="#">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                    <span className="text-label-md">Academic Calendar 24-25</span>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">download</span>
                </a>
                <a className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg border border-outline-variant hover:border-primary transition-colors group" href="#">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                    <span className="text-label-md">School Circular No. 42</span>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">download</span>
                </a>
                <a className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg border border-outline-variant hover:border-primary transition-colors group" href="#">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                    <span className="text-label-md">Fee Structure 2024</span>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">download</span>
                </a>
              </div>
            </div>

            {/* Mini Event Calendar */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm">
              <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                Upcoming Events
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-14 bg-primary rounded-lg flex flex-col items-center justify-center text-on-primary">
                    <span className="text-label-sm font-bold uppercase">Oct</span>
                    <span className="text-headline-md leading-none">28</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-on-surface">Parent-Teacher Meeting</h4>
                    <p className="text-label-sm text-outline">09:00 AM - Main Hall</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-14 bg-surface-container rounded-lg flex flex-col items-center justify-center text-on-surface-variant">
                    <span className="text-label-sm font-bold uppercase">Nov</span>
                    <span className="text-headline-md leading-none">05</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-on-surface">Inter-School Debates</h4>
                    <p className="text-label-sm text-outline">10:30 AM - Auditorium</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-14 bg-surface-container rounded-lg flex flex-col items-center justify-center text-on-surface-variant">
                    <span className="text-label-sm font-bold uppercase">Nov</span>
                    <span className="text-headline-md leading-none">12</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-on-surface">Basketball Finals</h4>
                    <p className="text-label-sm text-outline">03:00 PM - Sports Complex</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 text-primary font-label-md hover:underline flex items-center justify-center gap-2">
                View Full Calendar
                <span className="material-symbols-outlined">open_in_new</span>
              </button>
            </div>

            {/* Contact & Support Card */}
            <div className="relative overflow-hidden bg-primary rounded-xl p-6 text-on-primary">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>contact_support</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">Need Help?</h3>
              <p className="text-label-md mb-4 opacity-90">Have questions regarding a specific notice or scheduling conflict?</p>
              <a className="inline-block bg-on-primary text-primary px-4 py-2 rounded-lg font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all" href="#">
                Contact Office
              </a>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Notice;
"""

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/Notice.jsx', 'w') as f:
    f.write(jsx_content)

print("Notice.jsx updated successfully!")
