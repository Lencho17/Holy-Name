import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaAward, FaBuilding, FaMapMarkerAlt, FaQuoteLeft, FaChevronRight } from 'react-icons/fa';

const ExcellenceSection = () => {
  const { centerOfExcellence } = useContext(SiteDataContext);

  // Only show if we have at least one record
  if (!centerOfExcellence || centerOfExcellence.length === 0) return null;

  // Take first 3 for the home page teaser
  const teaserAlumni = centerOfExcellence.slice(0, 3);

  return (
    <section className="py-24 bg-slate-50 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-[120px] -ml-48 -mb-48 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-200 mb-6 shadow-sm">
              <FaAward className="text-blue-600 text-sm" />
              <span className="text-[10px] font-black tracking-[0.3em] text-blue-700 uppercase">
                Hall of Fame
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 font-serif leading-tight">
              Center of <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">Excellence</span>
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl text-lg font-medium leading-relaxed italic">
              "Celebrating our distinguished alumni who continue to inspire the next generation with their remarkable journeys."
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/excellence" 
              className="group flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              View All Alumni
              <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                <FaChevronRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {teaserAlumni.map((alumni, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 border border-slate-100 flex flex-col h-full"
            >
              {/* Profile Photo */}
              <div className="relative mb-8 self-center">
                <div className="w-32 h-32 rounded-[2.2rem] overflow-hidden border-[4px] border-white shadow-xl relative z-10 ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={alumni.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"} 
                    alt={alumni.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -inset-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Identity */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-slate-800 font-serif tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                  {alumni.title ? `${alumni.title} ` : ''}{alumni.name}
                </h3>
                <div className="text-blue-600/70 font-bold text-[10px] uppercase tracking-[0.15em]">
                  {alumni.designation}
                </div>
              </div>

              {/* Work Info */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 border border-slate-100/50">
                <div className="flex items-center gap-3">
                  <FaBuilding className="text-blue-400 text-xs" />
                  <p className="text-xs font-bold text-slate-600 truncate">{alumni.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-indigo-400 text-xs" />
                  <p className="text-xs font-bold text-slate-600 truncate">{alumni.location}</p>
                </div>
              </div>

              {/* Quote */}
              <div className="relative flex-1">
                <FaQuoteLeft className="text-slate-100 text-3xl absolute -top-1 -left-1 z-0" />
                <p className="relative z-10 text-slate-500 text-sm leading-relaxed italic line-clamp-3 pl-4 border-l-2 border-blue-500/20">
                  "{alumni.message || "I am proud to be an alumnus of Holy Name School."}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExcellenceSection;
