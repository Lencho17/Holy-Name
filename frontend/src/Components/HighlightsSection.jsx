import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendarAlt, FaStar } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

export default function HighlightsSection() {
  const { highlights } = useContext(SiteDataContext);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!highlights || highlights.length === 0) return null;

  const sortedHighlights = [...highlights].reverse();
  const displayedHighlights = showAll ? sortedHighlights : sortedHighlights.slice(0, 3);

  return (
    <section className="py-2">
      <div className="flex justify-between items-end mb-10 px-4 md:px-0">
        <div>
          <h2 className="text-primary font-black text-xl tracking-widest uppercase mb-2">Spotlight</h2>
          <h3 className="academic-serif text-3xl md:text-5xl font-black text-on-surface">
            School Highlights
          </h3>
        </div>
        {highlights.length > 3 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="hidden md:flex items-center gap-2 text-secondary font-bold hover:text-primary transition-colors"
          >
            {showAll ? 'View Less' : 'View All'} <span className="material-symbols-outlined">{showAll ? 'arrow_upward' : 'arrow_forward'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayedHighlights.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className="group bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col cursor-pointer"
            onClick={() => setSelectedHighlight(item)}
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider hover:bg-white transition-colors">
                {item.category}
              </div>
            </div>
            <div className="p-4 pb-3 flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-medium mb-1.5">
                <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                {item.date}
              </div>
              <h4 className="text-[15px] font-bold text-on-surface mb-1.5 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {item.title}
              </h4>
              <p className="text-on-surface-variant text-[11px] line-clamp-2 mb-3 flex-1 leading-snug">
                {item.description}
              </p>
              <button className="text-secondary text-[11px] font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all mt-auto w-fit">
                Read More <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {highlights.length > 3 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="md:hidden mt-8 w-full py-4 rounded-xl bg-surface-container border border-outline-variant text-primary font-bold flex justify-center items-center gap-2"
        >
          {showAll ? 'View Less Highlights' : 'View All Highlights'} <span className="material-symbols-outlined">{showAll ? 'arrow_upward' : 'arrow_forward'}</span>
        </button>
      )}

      {/* Highlights Modal */}
      <AnimatePresence>
        {selectedHighlight && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHighlight(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedHighlight(null)}
                className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/30"
              >
                <FaTimes size={20} />
              </button>
              
              <div className="h-72 sm:h-96 w-full overflow-hidden relative">
                <img 
                  src={selectedHighlight.image} 
                  alt={selectedHighlight.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-widest mb-4">
                        <FaStar className="text-[10px]" /> Featured Highlight
                    </span>
                    <h3 className="text-3xl sm:text-5xl font-black academic-serif leading-tight">
                        {selectedHighlight.title}
                    </h3>
                </div>
              </div>
              
              <div className="p-8 sm:p-12">
                <div className="flex flex-wrap items-center gap-6 mb-8 text-slate-500 font-bold uppercase tracking-widest text-xs">
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                        <FaCalendarAlt className="text-amber-500" />
                        {selectedHighlight.date}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {selectedHighlight.category}
                    </div>
                </div>
                
                <p className="text-slate-700 text-lg sm:text-xl leading-relaxed font-medium">
                  {selectedHighlight.description}
                </p>
                
                <div className="mt-12 flex justify-between items-center gap-4">
                  <div className="flex -space-x-3 overflow-hidden">
                    {[1, 2, 3].map((i) => (
                        <img key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white" src={`https://i.pravatar.cc/100?u=${selectedHighlight._id}${i}`} alt="" />
                    ))}
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 ring-4 ring-white text-xs font-bold text-slate-500">+12</div>
                  </div>
                  <button 
                    onClick={() => setSelectedHighlight(null)}
                    className="px-8 py-3 bg-amber-500 text-slate-900 font-black rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    Close Story
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
