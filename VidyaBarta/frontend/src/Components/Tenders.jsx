import React, { useState, useEffect, useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import { Link } from 'react-router-dom';

const Tenders = () => {
  const { schoolProfile, API_URL } = useContext(SiteDataContext);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, archived, awarded

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const res = await fetch(`${API_URL}/tenders`);
        if (res.ok) {
          const data = await res.json();
          const mappedData = data.map(t => ({
            ...t,
            _id: t.id || t._id,
            tenderNumber: t.tender_number || t.tenderNumber,
            publishDate: t.publish_date || t.publishDate,
            closingDate: t.closing_date || t.closingDate,
            estimatedValue: t.estimated_value || t.estimatedValue,
            documentUrl: t.document_url || t.documentUrl
          }));
          setTenders(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch tenders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, [API_URL]);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      <main className="min-h-screen pt-12">
        {/* Hero Section */}
        <section className="bg-surface-container-highest py-16 mt-8">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <h1 className="font-display text-display text-on-background mb-4">Tenders &amp; Procurement</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                  {schoolProfile?.name || 'Excellence Academy'} maintains a transparent and fair procurement process. View active institutional tenders, past notices, and general guidelines for vendors.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col min-w-[160px]">
                  <span className="text-label-sm text-secondary font-label-sm uppercase tracking-wider">Active Tenders</span>
                  <span className="text-headline-lg font-headline-lg text-primary">{tenders.length > 0 ? tenders.length : '08'}</span>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col min-w-[160px]">
                  <span className="text-label-sm text-secondary font-label-sm uppercase tracking-wider">Archived</span>
                  <span className="text-headline-lg font-headline-lg text-secondary">142</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area: Bento Style */}
        <section className="py-section-padding px-gutter max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Procurement Guidelines (Bento Sidebar) */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 sticky top-28">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
                  <h2 className="font-headline-md text-headline-md">Procurement Guidelines</h2>
                </div>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">01</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface mb-1">Registration</h4>
                      <p className="text-label-sm text-on-surface-variant">Vendors must be registered with the Academic Vendor Council before submission.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">02</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface mb-1">Electronic Submission</h4>
                      <p className="text-label-sm text-on-surface-variant">All bids must be submitted through our encrypted portal or physical delivery as specified.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">03</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface mb-1">Compliance</h4>
                      <p className="text-label-sm text-on-surface-variant">Standard 128-bit encryption for all digital documentation is mandatory for security.</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-10 pt-6 border-t border-outline-variant">
                  <button className="flex items-center justify-between w-full p-4 bg-primary-container text-on-primary-container rounded-lg group hover:bg-primary transition-colors">
                    <span className="font-label-md">Download Full Policy PDF</span>
                    <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">download</span>
                  </button>
                </div>
              </div>

              {/* Call to Action Card */}
              <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-headline-md text-headline-md mb-2">Need Assistance?</h3>
                  <p className="text-body-md opacity-80 mb-6">Contact our procurement office for any clarification regarding technical specifications.</p>
                  <a className="inline-flex items-center gap-2 text-primary-fixed-dim font-label-md" href={`mailto:procurement@${schoolProfile?.domain || 'excellence.edu'}`}>
                    procurement@{schoolProfile?.domain || 'excellence.edu'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">contact_support</span>
                </div>
              </div>
            </aside>

            {/* Right Column: Tender Listings (Table) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Tab Navigation */}
              <div className="flex items-center border-b border-outline-variant gap-8 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`pb-4 px-2 font-label-md text-label-md whitespace-nowrap transition-colors ${activeTab === 'active' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Active Notices ({tenders.length > 0 ? tenders.length : '08'})
                </button>
                <button 
                  onClick={() => setActiveTab('archived')}
                  className={`pb-4 px-2 font-label-md text-label-md whitespace-nowrap transition-colors ${activeTab === 'archived' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Archived Tenders
                </button>
                <button 
                  onClick={() => setActiveTab('awarded')}
                  className={`pb-4 px-2 font-label-md text-label-md whitespace-nowrap transition-colors ${activeTab === 'awarded' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Recent Awards
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm text-secondary font-label-sm">Filter by:</span>
                  <select className="bg-surface border border-outline-variant rounded-full px-4 py-1.5 text-label-sm focus:ring-primary focus:border-primary">
                    <option>All Categories</option>
                    <option>Infrastructure</option>
                    <option>IT Services</option>
                    <option>Lab Equipment</option>
                  </select>
                </div>
                <p className="text-label-sm text-secondary italic">Showing latest procurement opportunities for FY 2024-25</p>
              </div>

              {/* Tender Table */}
              <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="px-6 py-4 font-label-md text-label-md text-on-surface">Tender ID</th>
                        <th className="px-6 py-4 font-label-md text-label-md text-on-surface">Title &amp; Description</th>
                        <th className="px-6 py-4 font-label-md text-label-md text-on-surface whitespace-nowrap">Release Date</th>
                        <th className="px-6 py-4 font-label-md text-label-md text-on-surface whitespace-nowrap">Last Date</th>
                        <th className="px-6 py-4 font-label-md text-label-md text-on-surface">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      
                      {loading ? (
                         <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-on-surface-variant">
                             <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                             <p className="mt-2 font-label-md">Loading tenders...</p>
                          </td>
                         </tr>
                      ) : tenders.length > 0 ? (
                        tenders.map((tender) => (
                          <tr key={tender._id} className="hover:bg-surface-container-lowest transition-colors cursor-pointer group" onClick={() => window.location.href = `/tenders/apply/${tender._id}`}>
                            <td className="px-6 py-6 font-label-sm text-label-sm text-primary font-bold">{tender.tenderNumber}</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-label-md text-label-md text-on-background group-hover:text-primary transition-colors">{tender.title}</span>
                                <span className="text-label-sm text-on-surface-variant line-clamp-1">{tender.description || 'No description provided.'}</span>
                                <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 bg-surface-container-high text-primary rounded text-[10px] uppercase font-bold tracking-tighter">
                                  {tender.category || 'General'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-label-sm text-label-sm text-on-surface-variant">{new Date(tender.publishDate).toLocaleDateString()}</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-error font-bold">{new Date(tender.closingDate).toLocaleDateString()}</span>
                                <span className="text-[10px] text-error uppercase">17:00 IST</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <a className="flex items-center gap-2 text-primary hover:underline font-label-md text-label-md" href={tender.documentUrl || '#'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                <span className="material-symbols-outlined text-sm">download</span>
                                Download
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        /* Fallback static data if no tenders found */
                        <>
                          <tr className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-6 font-label-sm text-label-sm text-primary font-bold">EA/2024/045</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-label-md text-label-md text-on-background">Modernization of Physics Laboratory</span>
                                <span className="text-label-sm text-on-surface-variant">Procurement and installation of advanced optical and thermal testing equipment...</span>
                                <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 bg-surface-container-high text-primary rounded text-[10px] uppercase font-bold tracking-tighter">Infrastructure</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-label-sm text-label-sm text-on-surface-variant">Oct 12, 2024</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-error font-bold">Nov 05, 2024</span>
                                <span className="text-[10px] text-error uppercase">17:00 IST</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <a className="flex items-center gap-2 text-primary hover:underline font-label-md text-label-md" href="#">
                                <span className="material-symbols-outlined text-sm">download</span>
                                Download
                              </a>
                            </td>
                          </tr>
                          <tr className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-6 font-label-sm text-label-sm text-primary font-bold">EA/2024/048</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-label-md text-label-md text-on-background">Campus-wide Wi-Fi 6 Upgrade</span>
                                <span className="text-label-sm text-on-surface-variant">Deployment of mesh network infrastructure across all academic and residential blocks...</span>
                                <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 bg-surface-container-high text-primary rounded text-[10px] uppercase font-bold tracking-tighter">IT Services</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-label-sm text-label-sm text-on-surface-variant">Oct 18, 2024</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface font-bold">Nov 12, 2024</span>
                                <span className="text-[10px] text-on-surface-variant uppercase">15:00 IST</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <a className="flex items-center gap-2 text-primary hover:underline font-label-md text-label-md" href="#">
                                <span className="material-symbols-outlined text-sm">download</span>
                                Download
                              </a>
                            </td>
                          </tr>
                          <tr className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-6 font-label-sm text-label-sm text-primary font-bold">EA/2024/051</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-label-md text-label-md text-on-background">Annual Maintenance: HVAC Systems</span>
                                <span className="text-label-sm text-on-surface-variant">Comprehensive AMC for central air conditioning and ventilation units in Library...</span>
                                <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 bg-surface-container-high text-primary rounded text-[10px] uppercase font-bold tracking-tighter">Maintenance</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-label-sm text-label-sm text-on-surface-variant">Oct 24, 2024</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface font-bold">Nov 20, 2024</span>
                                <span className="text-[10px] text-on-surface-variant uppercase">12:00 IST</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <a className="flex items-center gap-2 text-primary hover:underline font-label-md text-label-md" href="#">
                                <span className="material-symbols-outlined text-sm">download</span>
                                Download
                              </a>
                            </td>
                          </tr>
                          <tr className="hover:bg-surface-container-lowest transition-colors">
                            <td className="px-6 py-6 font-label-sm text-label-sm text-primary font-bold">EA/2024/055</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-label-md text-label-md text-on-background">Student ERP Software Solution</span>
                                <span className="text-label-sm text-on-surface-variant">Customized management information system for academic and administrative ops...</span>
                                <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 bg-surface-container-high text-primary rounded text-[10px] uppercase font-bold tracking-tighter">Software</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 font-label-sm text-label-sm text-on-surface-variant">Oct 30, 2024</td>
                            <td className="px-6 py-6">
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface font-bold">Dec 01, 2024</span>
                                <span className="text-[10px] text-on-surface-variant uppercase">17:00 IST</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <a className="flex items-center gap-2 text-primary hover:underline font-label-md text-label-md" href="#">
                                <span className="material-symbols-outlined text-sm">download</span>
                                Download
                              </a>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                  <span className="text-label-sm text-secondary">Showing 1-{tenders.length > 0 ? tenders.length : 4} of {tenders.length > 0 ? tenders.length : 8} results</span>
                  <div className="flex gap-2">
                    <button className="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Archived Section (Bento Preview) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-outline-variant p-6 rounded-xl group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-on-surface-variant">archive</span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_outward</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md mb-2">FY 2023-24 Archives</h4>
                  <p className="text-label-sm text-on-surface-variant">Review historical data and completed procurement projects from the previous financial year.</p>
                </div>
                
                <div className="bg-surface border border-outline-variant p-6 rounded-xl group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-on-surface-variant">award_star</span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_outward</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md mb-2">Awarded Contracts</h4>
                  <p className="text-label-sm text-on-surface-variant">List of recently awarded tenders and selected vendors for institutional transparency.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Institutional Trust Banner */}
        <section className="py-section-padding bg-on-background text-surface">
          <div className="max-w-container-max mx-auto px-gutter text-center">
            <span className="material-symbols-outlined text-6xl text-primary-fixed mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <h2 className="font-display text-display mb-6">Commitment to Integrity</h2>
            <p className="font-body-lg text-body-lg max-w-3xl mx-auto opacity-80">
              {schoolProfile?.name || 'Excellence Academy'} adheres strictly to the National Procurement Framework. Every tender is evaluated by an independent committee of academic and technical experts to ensure the highest standards of quality and cost-effectiveness.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-12 opacity-60 hover:opacity-100 transition-all">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">security</span>
                <span className="font-label-md">ISO 9001:2015</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">account_balance</span>
                <span className="font-label-md">MOE Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">public</span>
                <span className="font-label-md">Global Standards</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Tenders;
