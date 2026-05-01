import React, { useState, useEffect, useContext } from "react";
import { FaGavel, FaBuilding, FaBriefcase, FaEnvelopeOpenText, FaSpinner, FaArrowRight, FaFilePdf, FaHistory, FaCheckCircle, FaExclamationCircle, FaShareAlt } from "react-icons/fa";
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
      // We'll implement this tracking endpoint in the backend if needed, or use a generic one
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
          setTenders(data);
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
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.tenders || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070&auto=format&fit=crop"}
            alt="Tenders"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-800/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-left text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 backdrop-blur-md shadow-sm mb-4">
            <FaGavel className="text-sm text-amber-400" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Procurement & Tenders</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter drop-shadow-lg">
            Active <span className="text-amber-400 italic">Tenders</span>
          </h1>
          <p className="text-white/90 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Participate in Holy Name's growth. We invite qualified vendors and contractors to apply for our upcoming projects and requirements.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Tenders */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 flex-grow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
              
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-8 relative z-10 flex items-center">
                <span className="w-2 h-8 bg-amber-500 rounded-full mr-4"></span>
                Open Tender Notices
              </h2>

              <div className="space-y-6 relative z-10">
                {loading ? (
                  <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
                  </div>
                ) : tenders.length > 0 ? (
                  tenders.map(tender => (
                    <div key={tender._id} className="bg-[#F9F9FB] rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-md transition-all duration-300 group relative">
                      <div className="absolute top-6 right-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          tender.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tender.status}
                        </span>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs font-black text-primary/50 uppercase tracking-widest mb-1">{tender.tenderNumber}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors pr-20">{tender.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider">{tender.category}</span>
                          {tender.estimatedValue && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">Est. Value: {tender.estimatedValue}</span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {tender.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center">
                            <FaHistory className="mr-2" /> Published Date
                          </p>
                          <p className="text-sm font-bold text-gray-700">{new Date(tender.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center">
                            <FaExclamationCircle className="mr-2" /> Closing Date
                          </p>
                          <p className="text-sm font-bold text-gray-700">{new Date(tender.closingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        {tender.status === 'Active' ? (
                          <Link to={`/tender-apply/${tender._id}`} className="bg-primary text-white font-bold py-3.5 px-8 rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center group flex-1">
                            Submit Bid <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        ) : (
                          <button disabled className="bg-gray-200 text-gray-500 font-bold py-3.5 px-8 rounded-xl flex items-center justify-center flex-1 cursor-not-allowed">
                            Tender Closed
                          </button>
                        )}
                        
                        {tender.documentUrl && (
                          <a href={tender.documentUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-primary border-2 border-primary/20 font-bold py-3.5 px-6 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center">
                            <FaFilePdf className="mr-2" /> View Details
                          </a>
                        )}
                        
                        <button 
                          onClick={(e) => handleShare(e, tender)}
                          className="bg-white text-gray-400 border-2 border-gray-100 font-bold py-3.5 px-5 rounded-xl hover:bg-gray-50 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center"
                          title="Share Tender"
                        >
                          <FaShareAlt />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-[#F9F9FB] rounded-3xl border border-gray-200 border-dashed">
                    <FaGavel className="text-6xl text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-600 uppercase tracking-widest">No Active Tenders</h3>
                    <p className="text-gray-400 mt-2 text-sm">There are currently no open procurement requirements.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Tracking Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden ring-4 ring-primary/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">Track Bid</h3>
              <p className="text-gray-500 text-xs font-medium mb-6">Check the status of your tender application.</p>

              <form onSubmit={handleTrack} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Reference No.</label>
                  <input
                    required
                    type="text"
                    value={trackingRef}
                    onChange={(e) => setTrackingRef(e.target.value.toUpperCase())}
                    placeholder="TDR-2026-XXXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Authorized Email</label>
                  <input
                    required
                    type="email"
                    value={trackingEmail}
                    onChange={(e) => setTrackingEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTracking}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isTracking ? <FaSpinner className="animate-spin" /> : "Track Bid Status"}
                </button>
              </form>

              {trackError && <p className="mt-4 text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{trackError}</p>}
              
              {trackResult && (
                <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-gray-200 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bid Status</p>
                  <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-sm ${
                    trackResult.status === 'Awarded' ? 'bg-green-100 text-green-700' :
                    trackResult.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {trackResult.status}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{trackResult.tenderTitle}</p>
                </div>
              )}
            </div>

            {/* How to Apply */}
            <div className="bg-primary rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
              <h3 className="text-2xl font-serif font-bold mb-6">Application Guide</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-amber-400">Download Document</h4>
                    <p className="text-xs text-white/70 mt-1">Carefully read the technical specifications in the PDF.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-amber-400">Prepare Proposals</h4>
                    <p className="text-xs text-white/70 mt-1">Prepare separate technical and financial bids on company letterhead.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-amber-400">Online Submission</h4>
                    <p className="text-xs text-white/70 mt-1">Upload your proposals and company profile before the deadline.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="bg-amber-500 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
              <FaEnvelopeOpenText className="text-6xl absolute -bottom-4 -right-4 opacity-10 rotate-12" />
              <h3 className="text-xl font-bold mb-2">Need Assistance?</h3>
              <p className="text-sm text-white/90 mb-4">Contact our procurement cell for any technical queries regarding the tenders.</p>
              <a href={`mailto:${schoolProfile?.email || ""}`} className="inline-block bg-white text-amber-600 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-50 transition-all shadow-md">
                Email Procurement
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Tenders;
