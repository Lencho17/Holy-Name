import React, { useState, useEffect, useContext } from "react";
import { FaGavel, FaBuilding, FaBriefcase, FaEnvelopeOpenText, FaSpinner, FaArrowRight, FaFilePdf, FaHistory, FaCheckCircle, FaExclamationCircle, FaShareAlt, FaSearch } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { SiteDataContext } from "../context/SiteDataContext";

function Tenders() {
  const { schoolProfile, API_URL } = useContext(SiteDataContext);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleShare = async (e, tender) => {
    e?.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: tender.title, 
          desc: `${tender.tenderNumber} — ${tender.category}. Closing on ${new Date(tender.closingDate).toLocaleDateString()} at Holy Name School`, 
          image: schoolProfile?.pageHeroImages?.tenders || "", 
          page: '/tenders' 
        }),
      });
      const { url } = await res.json();
      const shareUrl = url || window.location.href;
      if (navigator.share) { 
        await navigator.share({ title: tender.title, text: tender.title, url: shareUrl }); 
      } else { 
        await navigator.clipboard.writeText(shareUrl); 
        alert('Link copied to clipboard!'); 
      }
    } catch (err) { if (err.name !== 'AbortError') console.warn('Share failed', err); }
  };

  // --- Tracking State ---
  const [trackingRef, setTrackingRef] = useState("");
  const [trackingEmail, setTrackingEmail] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingRef || !trackingEmail) return;
    
    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(`${API_URL}/tender-applications/track/${trackingRef}?email=${trackingEmail}`);
      const data = await res.json();
      
      if (res.ok) {
        setTrackResult(data);
      } else {
        setTrackError(data.message || "Failed to track tender application.");
      }
    } catch (err) {
      setTrackError("Network error. Please try again.");
    } finally {
      setIsTracking(false);
    }
  };

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const res = await fetch(`${API_URL}/tenders`);
        if (res.ok) {
          const data = await res.json();
          const mappedData = data.map(t => ({
            ...t,
            _id: t.id,
            tenderNumber: t.tender_number,
            publishDate: t.publish_date,
            closingDate: t.closing_date,
            estimatedValue: t.estimated_value,
            documentUrl: t.document_url
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
    <div className="bg-[#fcf8ff] min-h-screen font-sans text-[#181445] pb-24">
      {/* Editorial Hero Section */}
      <section className="relative w-full h-[450px] md:h-[550px] flex items-center overflow-hidden bg-[#181445]">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.tenders || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070&auto=format&fit=crop"}
            alt="Tenders"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-105 transition-transform duration-1000 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#181445]/80 via-transparent to-[#181445]"></div>
          {/* Stylized background elements */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#6b21a8] rounded-full blur-[120px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#d4af37] rounded-full blur-[120px] opacity-10"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl mb-8 transform -rotate-1">
            <FaGavel className="text-[#d4af37] text-sm" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/90">Institutional Procurement</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter mb-6">
            Active <br className="hidden md:block" />
            <span className="text-[#d4af37] italic font-serif">Tender</span> Notices
          </h1>
          
          <p className="text-white/70 text-lg md:text-xl mt-4 max-w-2xl font-medium leading-relaxed mb-10">
            Partner with Holy Name in shaping academic excellence. We invite industry-leading vendors to join our mission through transparent procurement.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-12">
            <div className="text-center md:text-left">
              <p className="text-[#d4af37] text-2xl font-serif font-black">{tenders.length}</p>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Open Projects</p>
            </div>
            <div className="w-[1px] h-10 bg-white/10 hidden md:block"></div>
            <div className="text-center md:text-left">
              <p className="text-white text-2xl font-serif font-black">2026</p>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Financial Year</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Listings - Tenders */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-purple-900/5 p-10 md:p-16 border border-[#e3dfff]/50 relative overflow-hidden min-h-[600px]">
              {/* Subtle background texture */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#f6f2ff] rounded-bl-full opacity-50 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 relative z-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif font-black text-[#181445] flex items-center">
                    <span className="w-12 h-[3px] bg-[#d4af37] mr-6"></span>
                    Current Invitations
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#6b21a8] uppercase tracking-[0.2em] bg-[#f6f2ff] px-6 py-3 rounded-full">
                  <FaSearch className="opacity-50" /> Filter: All Categories
                </div>
              </div>

              <div className="space-y-12 relative z-10">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="w-12 h-12 border-4 border-[#6b21a8]/20 border-t-[#6b21a8] rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-[#6b21a8] uppercase tracking-widest animate-pulse">Syncing Procurement Database...</p>
                  </div>
                ) : tenders.length > 0 ? (
                  tenders.map(tender => (
                    <div key={tender._id} className="group relative border-b border-[#f0ebff] pb-12 last:border-0 hover:translate-x-1 transition-all duration-500">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-[10px] font-black text-[#6b21a8] bg-[#f6f2ff] px-4 py-1 rounded-full uppercase tracking-widest">{tender.tenderNumber}</span>
                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              tender.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {tender.status}
                            </span>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-serif font-black text-[#181445] mb-4 group-hover:text-[#6b21a8] transition-colors leading-tight">
                            {tender.title}
                          </h3>

                          <div className="flex flex-wrap gap-6 mb-6">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full"></div>
                              <span className="text-[10px] font-black text-[#4c4452] uppercase tracking-widest">{tender.category}</span>
                            </div>
                            {tender.estimatedValue && (
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#6b21a8] rounded-full"></div>
                                <span className="text-[10px] font-black text-[#4c4452] uppercase tracking-widest">Est. {tender.estimatedValue}</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-[#4c4452] text-sm leading-relaxed mb-8 max-w-2xl font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            {tender.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Published</p>
                              <p className="text-xs font-black text-[#181445]">{new Date(tender.publishDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest">Submission Deadline</p>
                              <p className="text-xs font-black text-rose-600">{new Date(tender.closingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            {tender.status === 'Active' ? (
                              <Link to={`/tender-apply/${tender._id}`} className="bg-[#6b21a8] text-white font-black text-[11px] uppercase tracking-widest py-4 px-10 rounded-xl hover:bg-[#581c87] transition-all shadow-xl shadow-purple-500/20 flex items-center gap-3">
                                Participate <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
                              </Link>
                            ) : (
                              <button disabled className="bg-gray-100 text-gray-400 font-black text-[11px] uppercase tracking-widest py-4 px-10 rounded-xl cursor-not-allowed">
                                Submissions Closed
                              </button>
                            )}
                            
                            {tender.documentUrl && (
                              <a href={tender.documentUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-[#181445] border-2 border-[#e3dfff] font-black text-[11px] uppercase tracking-widest py-4 px-8 rounded-xl hover:bg-[#f6f2ff] transition-all flex items-center gap-3">
                                <FaFilePdf className="text-rose-500" /> Specifications
                              </a>
                            )}
                            
                            <button 
                              onClick={(e) => handleShare(e, tender)}
                              className="w-12 h-12 rounded-xl border-2 border-[#e3dfff] flex items-center justify-center text-[#6b21a8] hover:bg-[#f6f2ff] transition-all"
                              title="Share Tender"
                            >
                              <FaShareAlt />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-32 bg-[#fcf8ff] rounded-[3rem] border border-dashed border-[#e3dfff]">
                    <FaGavel className="text-7xl text-[#6b21a8]/10 mx-auto mb-6" />
                    <h3 className="text-xl font-serif font-black text-[#181445] uppercase tracking-widest mb-2">No Active Invitations</h3>
                    <p className="text-[#4c4452] text-sm font-medium">Please check back later for new procurement requirements.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Precision tracking and guides */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            
            {/* Tracking Terminal */}
            <div className="bg-[#181445] rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#6b21a8] flex items-center justify-center text-[#d4af37] shadow-lg">
                  <FaHistory />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-black">Track Application</h3>
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Real-time Status Check</p>
                </div>
              </div>

              <form onSubmit={handleTrack} className="space-y-8">
                <div className="space-y-2 group">
                  <label className="block text-white/40 font-black text-[9px] uppercase tracking-widest group-focus-within:text-[#d4af37] transition-colors pl-1">Reference Identifier</label>
                  <input
                    required
                    type="text"
                    value={trackingRef}
                    onChange={(e) => setTrackingRef(e.target.value.toUpperCase())}
                    placeholder="TDR-2026-XXXX"
                    className="w-full bg-transparent border-b border-white/20 py-3 text-lg font-black tracking-widest focus:border-[#d4af37] outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-2 group">
                  <label className="block text-white/40 font-black text-[9px] uppercase tracking-widest group-focus-within:text-[#d4af37] transition-colors pl-1">Authorized Email</label>
                  <input
                    required
                    type="email"
                    value={trackingEmail}
                    onChange={(e) => setTrackingEmail(e.target.value)}
                    placeholder="CORPORATE@ENTITY.COM"
                    className="w-full bg-transparent border-b border-white/20 py-3 text-lg font-black tracking-tight focus:border-[#d4af37] outline-none transition-all placeholder:text-white/10 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTracking}
                  className="w-full bg-[#d4af37] text-[#181445] font-black text-[11px] uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-[#c4a132] transition-all shadow-xl shadow-yellow-500/10 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {isTracking ? <FaSpinner className="animate-spin" /> : "Verify Status"}
                </button>
              </form>

              {trackError && (
                <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <p className="text-rose-400 text-[9px] font-black text-center uppercase tracking-widest">{trackError}</p>
                </div>
              )}
              
              {trackResult && (
                <div className="mt-10 p-8 bg-white/5 rounded-3xl border border-white/10 text-center animate-fade-in">
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-4">Official Determination</p>
                  <div className={`inline-block px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl ${
                    trackResult.status === 'Awarded' ? 'bg-emerald-500 text-white' :
                    trackResult.status === 'Rejected' ? 'bg-rose-500 text-white' :
                    'bg-[#d4af37] text-[#181445]'
                  }`}>
                    {trackResult.status}
                  </div>
                  <p className="text-sm font-serif font-black text-white leading-tight">{trackResult.tenderTitle}</p>
                </div>
              )}
            </div>

            {/* Application Protocols */}
            <div className="bg-[#f6f2ff] rounded-[3rem] p-10 border border-[#e3dfff] relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#6b21a8]/5 rounded-tl-full pointer-events-none"></div>
              <h3 className="text-2xl font-serif font-black text-[#181445] mb-8">Submission <br/> Protocols</h3>
              <div className="space-y-10">
                <div className="flex gap-6">
                  <span className="text-[#d4af37] font-serif text-3xl font-black italic opacity-50">01</span>
                  <div>
                    <h4 className="text-[11px] font-black text-[#181445] uppercase tracking-widest mb-2">Technical Dossier</h4>
                    <p className="text-xs text-[#4c4452] font-medium leading-relaxed">Download and scrutinize the architectural requirements and compliance standards.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-[#d4af37] font-serif text-3xl font-black italic opacity-50">02</span>
                  <div>
                    <h4 className="text-[11px] font-black text-[#181445] uppercase tracking-widest mb-2">Financial Proposal</h4>
                    <p className="text-xs text-[#4c4452] font-medium leading-relaxed">Submit itemized commercial bids on verified company letterhead with official seals.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-[#d4af37] font-serif text-3xl font-black italic opacity-50">03</span>
                  <div>
                    <h4 className="text-[11px] font-black text-[#181445] uppercase tracking-widest mb-2">Final Certification</h4>
                    <p className="text-xs text-[#4c4452] font-medium leading-relaxed">Upload authenticated PDF documentation before the digital portal closes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Helpdesk */}
            <div className="bg-[#6b21a8] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-purple-500/20">
              <FaEnvelopeOpenText className="text-9xl absolute -bottom-10 -right-10 opacity-10 rotate-12" />
              <h3 className="text-2xl font-serif font-black mb-4">Inquiries?</h3>
              <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed">Our procurement secretariat is available for clarification regarding technical specifications.</p>
              <a href={`mailto:${schoolProfile?.email || ""}`} className="inline-flex items-center justify-center w-full bg-[#d4af37] text-[#181445] py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#c4a132] transition-all">
                Contact Secretariat
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Tenders;
