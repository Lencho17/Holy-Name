import React, { useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaStar, FaChevronLeft, FaChevronRight, FaImages } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

export default function HighlightsSection() {
  const { highlights } = useContext(SiteDataContext);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);


  const handleOpen = (item) => {
    setSelectedHighlight(item);
    setCurrentPhotoIndex(0);
  };

  const handleClose = () => setSelectedHighlight(null);

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!selectedHighlight) return;
      // Build image gallery helper inside the hook or keep it outside
      const gallery =
        selectedHighlight?.galleryImages?.length > 0
          ? selectedHighlight.galleryImages
          : [selectedHighlight?.image].filter(Boolean);
      setCurrentPhotoIndex((p) => (p + 1) % gallery.length);
    },
    [selectedHighlight]
  );

  const handlePrev = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!selectedHighlight) return;
      const gallery =
        selectedHighlight?.galleryImages?.length > 0
          ? selectedHighlight.galleryImages
          : [selectedHighlight?.image].filter(Boolean);
      setCurrentPhotoIndex((p) => (p - 1 + gallery.length) % gallery.length);
    },
    [selectedHighlight]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedHighlight) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHighlight, handleNext, handlePrev]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedHighlight ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedHighlight]);

  if (!highlights || highlights.length === 0) return null;

  const sortedHighlights = highlights;
  const displayedHighlights = showAll ? sortedHighlights : sortedHighlights.slice(0, 3);

  // Build image gallery: use galleryImages if available, else fallback to single image
  const getGallery = (highlight) =>
    highlight?.galleryImages?.length > 0
      ? highlight.galleryImages
      : [highlight?.image].filter(Boolean);

  return (
    <section className="py-2">
      <div className="flex justify-between items-end mb-10 px-4 md:px-0">
        <div>
          <h2 className="text-primary font-black text-xl tracking-widest uppercase mb-2 border-l-4 border-amber-500 pl-4">Spotlight</h2>
          <h1 className="font-serif text-3xl md:text-6xl font-black text-gray-900 leading-tight">
            School <span className="text-amber-600 italic">Highlights</span>
          </h1>
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
        {displayedHighlights.map((item, index) => {
          const gallery = getGallery(item);
          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => handleOpen(item)}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image || null} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider transition-colors">
                  {item.category}
                </div>
                {/* Photo count badge */}
                {gallery.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                    <FaImages className="text-amber-400 text-[9px]" />
                    {gallery.length}
                  </div>
                )}
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
          );
        })}
      </div>
      
      {highlights.length > 3 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="md:hidden mt-8 w-full py-4 rounded-xl bg-surface-container border border-outline-variant text-primary font-bold flex justify-center items-center gap-2"
        >
          {showAll ? 'View Less Highlights' : 'View All Highlights'} <span className="material-symbols-outlined">{showAll ? 'arrow_upward' : 'arrow_forward'}</span>
        </button>
      )}

      {/* Highlights Modal — Events-style full-screen viewer */}
      <AnimatePresence>
        {selectedHighlight && (() => {
          const gallery = getGallery(selectedHighlight);
          const hasMultiple = gallery.length > 1;

          return (
            <motion.div
              key="highlight-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 md:p-10"
              onClick={handleClose}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative max-w-5xl w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close */}
                <button
                  className="absolute -top-3 -right-3 z-[110] text-white/60 hover:text-white bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full flex items-center justify-center border border-white/20 transition-all duration-200 backdrop-blur-md"
                  onClick={handleClose}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                {/* ── Image Viewer ───────────────────────────────────── */}
                <div className="relative w-full h-[55vh] md:h-[65vh] flex items-center justify-center group/lb rounded-2xl overflow-hidden bg-black/40">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentPhotoIndex}
                      src={gallery[currentPhotoIndex] || null}
                      alt={`${selectedHighlight.title} — ${currentPhotoIndex + 1}`}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none"
                      draggable={false}
                    />
                  </AnimatePresence>

                  {/* Desktop arrows */}
                  {hasMultiple && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="absolute left-3 z-[110] text-white/60 hover:text-white bg-black/30 hover:bg-black/60 p-3 rounded-full border border-white/10 transition-all duration-200 opacity-0 group-hover/lb:opacity-100 hidden md:flex"
                      >
                        <FaChevronLeft className="text-xl" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-3 z-[110] text-white/60 hover:text-white bg-black/30 hover:bg-black/60 p-3 rounded-full border border-white/10 transition-all duration-200 opacity-0 group-hover/lb:opacity-100 hidden md:flex"
                      >
                        <FaChevronRight className="text-xl" />
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {hasMultiple && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPhotoIndex(i)}
                          className={`rounded-full transition-all duration-300 ${
                            i === currentPhotoIndex
                              ? 'w-5 h-1.5 bg-amber-500'
                              : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Info Panel ─────────────────────────────────────── */}
                <div className="mt-4 w-full bg-white/5 backdrop-blur-xl rounded-2xl p-5 md:p-7 border border-white/10 shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">

                    {/* Left: highlight info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded uppercase tracking-widest border border-amber-500/20">
                          <FaStar className="text-[8px]" /> FEATURED HIGHLIGHT
                        </span>
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <FaCalendarAlt className="text-[9px]" />
                          {selectedHighlight.date}
                        </p>
                        <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold rounded uppercase tracking-widest border border-white/10">
                          {selectedHighlight.category}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-3xl font-serif font-bold text-white mb-1.5 tracking-tight leading-snug">
                        {selectedHighlight.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 max-w-xl">
                        {selectedHighlight.description}
                      </p>
                    </div>

                    {/* Right: counter + controls */}
                    <div className="flex flex-col items-end gap-3 self-end md:self-center shrink-0">
                      <div className="flex items-center gap-4 bg-white/5 px-5 py-3 rounded-xl border border-white/5">
                        <span className="font-mono text-base font-black tracking-widest">
                          <span className="text-amber-500">{currentPhotoIndex + 1}</span>
                          <span className="text-white/20 mx-1.5">/</span>
                          <span className="text-white/40">{gallery.length}</span>
                        </span>

                        {/* Mobile arrows */}
                        {hasMultiple && (
                          <div className="flex md:hidden gap-2">
                            <button
                              onClick={handlePrev}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                            >
                              <FaChevronLeft />
                            </button>
                            <button
                              onClick={handleNext}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                            >
                              <FaChevronRight />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
