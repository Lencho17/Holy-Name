import React, { useContext } from "react";
import { SiteDataContext } from "../context/SiteDataContext";

function Principal() {
  const { principal, schoolProfile } = useContext(SiteDataContext);

  if (!principal) return null;

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-4">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.principal || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"}
            alt="Principal's Desk"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              history_edu
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Leadership Message
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            From the <span className="text-amber-400 italic drop-shadow-md">Principal's Desk</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            A message from our Principal on our vision, values, and commitment to excellence.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 z-20 bg-surface-container-low shadow-2xl rounded-3xl overflow-hidden p-8 md:p-14 border border-outline-variant/30 relative">
        
        <div className="flex justify-center mb-10">
          <div className="w-24 h-1 bg-amber-500 rounded-full shadow-sm shadow-amber-200"></div>
        </div>

        <p className="italic text-amber-600 text-center text-xl md:text-2xl border-l-4 border-primary pl-6 my-10 max-w-2xl mx-auto font-medium">
          "{principal.introQuote}"
        </p>
        
        <div className="flex flex-col items-center">
          {principal.photo && !principal.photo.includes("signature") && (
            <div className="relative mb-10 group w-64 md:w-80 max-w-full">
              <div className="absolute inset-0 bg-primary rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <img
                src={principal.photo}
                alt={principal.name}
                className="relative w-full h-auto rounded-3xl shadow-xl transition-transform duration-300 group-hover:-translate-y-2 border-4 border-white"
              />
            </div>
          )}

          <div className="space-y-6 text-on-surface-variant leading-relaxed text-lg text-justify md:text-left font-medium">
            {principal.message.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            
            {principal.closingQuote && (
              <div className="p-6 bg-primary-container/30 rounded-2xl border border-primary/10 mt-8">
                <p className="text-center italic font-bold text-primary text-xl">
                  {principal.closingQuote}
                </p>
              </div>
            )}
          </div>

          <footer className="mt-16 flex flex-col items-center text-on-surface-variant">
            {principal.signature && (
              <img
                src={principal.signature}
                className="h-16 mb-4 opacity-70 mix-blend-multiply flex-shrink-0"
                alt="Signature"
              />
            )}
            <div className="w-16 h-px bg-outline-variant mb-4"></div>
            <span className="text-2xl font-black text-primary academic-serif">
              {principal.name === "Hitler" ? "Fr. Hemanta Pegu" : principal.name}
            </span>
            <span className="text-amber-600 tracking-widest uppercase text-sm font-bold mt-1">
              {principal.title === "PRINCIPAL" ? "Principal" : principal.title}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Principal;
