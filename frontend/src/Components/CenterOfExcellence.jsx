import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import { motion } from 'framer-motion';
import { FaAward, FaBuilding, FaMapMarkerAlt, FaQuoteLeft, FaGraduationCap } from 'react-icons/fa';

const CenterOfExcellence = () => {
  const { centerOfExcellence, schoolProfile } = useContext(SiteDataContext);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          {schoolProfile?.pageHeroImages?.excellence ? (
            <img
              src={schoolProfile.pageHeroImages.excellence}
              alt="Center of Excellence"
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-900 mix-blend-multiply" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.3),transparent)]" />
            </>
          )}
          {schoolProfile?.pageHeroImages?.excellence && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-900/60 mix-blend-multiply" />
          )}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 mb-6 shadow-sm">
              <FaAward className="text-blue-400 text-sm" />
              <span className="text-[11px] font-black tracking-[0.3em] text-blue-200 uppercase">
                Hall of Fame
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white font-serif mb-6 tracking-tight">
              Center of <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500">Excellence</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed italic">
              "Honoring our distinguished alumni who have carried the torch of {schoolProfile?.name || 'our school'} into the world with brilliance and integrity."
            </p>
          </motion.div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {!centerOfExcellence || centerOfExcellence.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <FaAward className="text-6xl mx-auto mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-400">Our Wall of Fame is currently being curated.</h3>
            <p className="text-slate-400 mt-2">Check back soon to see our distinguished alumni profiles.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {centerOfExcellence.map((alumni, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="group relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-slate-100 flex flex-col h-full"
              >
                {/* Profile Photo */}
                <div className="relative mb-8 self-center">
                  <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl relative z-10 ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={alumni.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300"} 
                      alt={alumni.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Decorative element behind photo */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Batch Badge */}
                  <div className="absolute -bottom-2 -right-2 z-20 bg-primary text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-lg border-2 border-white tracking-widest flex items-center gap-2">
                    <FaGraduationCap size={14} />
                    <span>CLASS OF {alumni.passedYear}</span>
                  </div>
                </div>

                {/* Identity */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800 font-serif tracking-tight mb-1 group-hover:text-primary transition-colors">
                    {alumni.title ? `${alumni.title} ` : ''}{alumni.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-[0.1em]">
                    <span className="text-primary/70">{alumni.designation}</span>
                  </div>
                </div>

                {/* Work Info */}
                <div className="bg-slate-50 rounded-3xl p-5 mb-6 space-y-3 border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100">
                      <FaBuilding size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</p>
                      <p className="text-sm font-bold text-slate-700">{alumni.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500 border border-slate-100">
                      <FaMapMarkerAlt size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-bold text-slate-700">{alumni.location}</p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="relative flex-1">
                  <FaQuoteLeft className="text-slate-100 text-4xl absolute -top-2 -left-2 z-0" />
                  <p className="relative z-10 text-slate-600 text-sm leading-relaxed italic line-clamp-4 pl-4 border-l-2 border-primary/20">
                    "{alumni.message || "I am proud to be an alumnus of Holy Name School. The values I learned here have shaped my career and life."}"
                  </p>
                </div>

                {/* Bottom Accents */}
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary/20" />
                    ))}
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Alumni Profile</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-primary">
            <FaAward size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 font-serif mb-4">Are you a successful Alumnus?</h2>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed">
            We are always proud to showcase the achievements of our former students. If you would like to be featured in our Center of Excellence, please reach out to us.
          </p>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            Connect With Us
          </button>
        </div>
      </section>
    </div>
  );
};

export default CenterOfExcellence;
