import React, { useContext } from "react";
import { FaUserTie, FaCalendarAlt, FaSkullCrossbones, FaRibbon } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Emeritus() {
  const { emeritus, schoolProfile } = useContext(SiteDataContext);

  const categories = ["Staff", "Teacher", "Student"];

  const LegacyCard = ({ member }) => (
    <div className="relative bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/80 group overflow-hidden flex flex-col items-center flex-1 transform hover:-translate-y-2 h-full">
      
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-100/40 to-blue-50/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none z-0"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-amber-100/40 to-orange-50/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none z-0"></div>

      {/* Status Badge (Top Left) */}
      <div className={`absolute top-4 left-4 z-20 flex items-center ${member.status === 'Deceased' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm border border-current/10 backdrop-blur-sm`}>
        {member.status === 'Deceased' ? <FaSkullCrossbones className="mr-1.5" /> : <FaRibbon className="mr-1.5" />}
        {member.status}
      </div>

      {/* Role Badge (Top Right) */}
      {member.role && (
        <div className="absolute top-4 right-4 z-20 flex items-center bg-white/90 backdrop-blur-sm border border-gray-100 text-indigo-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
          <FaUserTie className="mr-1.5 text-indigo-400" size={12} />
          {member.role}
        </div>
      )}

      {/* Profile Image with animated ring on hover */}
      <div className="relative z-10 w-32 h-32 mb-5 mt-10 group">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${member.status === 'Deceased' ? 'from-gray-400 via-gray-600 to-gray-400' : 'from-indigo-500 via-purple-500 to-amber-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[2px] -m-[2px]`}></div>
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 group-hover:border-transparent transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-white rounded-full m-[1px]"></div>
        <img
          src={member.photo || "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150&h=150&fit=crop"}
          alt={member.name}
          className={`w-full h-full object-cover rounded-full shadow-inner relative z-10 p-[2px] ${member.status === 'Deceased' ? 'grayscale group-hover:grayscale-0 transition-all duration-700' : ''}`}
        />
      </div>

      {/* Details */}
      <div className="relative z-10 w-full flex flex-col items-center flex-1">
        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors text-center">{member.name}</h3>
        
        {member.tenure && (
          <div className="flex items-center text-[12px] font-bold text-amber-500 tracking-wider uppercase mb-3 mt-1 bg-amber-50 px-3 py-1 rounded-full">
            <FaCalendarAlt className="mr-1.5" size={10} />
            {member.tenure}
          </div>
        )}

        {member.status === 'Deceased' && member.causeOfDeath && (
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter mb-4 opacity-80">Cause: {member.causeOfDeath}</p>
        )}

        {member.message && (
          <div className="w-full space-y-4 px-1 mt-2 text-center text-sm text-gray-600 leading-relaxed italic border-t border-gray-100 pt-4">
            "{member.message}"
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.alumestron || schoolProfile?.pageHeroImages?.legacyWall || schoolProfile?.pageHeroImages?.emeritus || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"}
            alt="Alumestron"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              history_edu
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Honoring Our Eternal Community
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Alumestron
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Celebrating the lives, contributions, and enduring impact of the staff, teachers, and students who remain forever a part of our school's heart.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 space-y-24">
        {categories.map(cat => {
          const filteredMembers = (emeritus || []).filter(m => m.category === cat);
          if (filteredMembers.length === 0) return null;

          return (
            <section key={cat} className="animate-fade-in-up">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-gray-200"></div>
                <h2 className="font-serif text-3xl md:text-4xl font-black text-gray-900 px-6 py-3 bg-white rounded-2xl shadow-sm border border-gray-50">
                  <span className="text-amber-600 italic">Distinguished</span> {cat}s
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 to-gray-200"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredMembers.map((member, index) => (
                  <LegacyCard key={`${cat}-${index}`} member={member} />
                ))}
              </div>
            </section>
          );
        })}

        {(!emeritus || emeritus.length === 0) && (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
            <FaUserTie className="mx-auto text-6xl text-gray-200 mb-4" />
            <p className="text-xl text-gray-500 font-medium">Alumestron is being prepared.</p>
            <p className="text-sm text-gray-400 mt-2">Check back soon as we honor our community members.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Emeritus;
