import React, { useContext } from "react";
import { SiteDataContext } from "../context/SiteDataContext";

function Principal() {
  const { principal } = useContext(SiteDataContext);

  if (!principal) return null;

  return (
    <div className="min-h-screen bg-surface py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-surface-container-low shadow-2xl rounded-3xl overflow-hidden mt-8 p-8 md:p-12 border border-outline-variant/30 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <h1 className="text-center text-4xl md:text-5xl font-black text-primary mb-6 academic-serif relative z-10 pt-4">
          From the Principal's Desk
        </h1>
        
        <div className="flex justify-center mb-10">
          <div className="w-24 h-1 bg-secondary rounded-full"></div>
        </div>

        <p className="italic text-secondary text-center text-xl md:text-2xl border-l-4 border-primary pl-6 my-10 max-w-2xl mx-auto font-medium">
          "{principal.introQuote}"
        </p>
        
        <div className="flex flex-col items-center">
          {principal.photo && !principal.photo.includes("signature") && (
            <div className="relative mb-10 group">
              <div className="absolute inset-0 bg-primary rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
              <img
                src={principal.photo}
                alt={principal.name}
                className="relative w-80 h-auto rounded-3xl shadow-xl transition-transform duration-300 group-hover:-translate-y-2 border-4 border-white"
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
            <span className="text-secondary tracking-widest uppercase text-sm font-bold mt-1">
              {principal.title === "PRINCIPAL" ? "Principal" : principal.title}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Principal;
