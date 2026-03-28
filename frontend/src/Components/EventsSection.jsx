import React, { useState, useContext, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes, FaImages } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";
import { useNavigate } from "react-router-dom";

const EventsSection = () => {
  const { events, schoolProfile } = useContext(SiteDataContext);
  const [showAll, setShowAll] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const navigate = useNavigate();

  const visibleEvents = showAll ? events : events.slice(0, 4);

  // Build the image list for the active event
  const getGallery = useCallback(
    (event) => (event?.galleryImages?.length > 0 ? event.galleryImages : [event?.image].filter(Boolean)),
    []
  );

  const handleOpen = (event) => {
    setSelectedEvent(event);
    setCurrentPhotoIndex(0);
  };

  const handleClose = () => setSelectedEvent(null);

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!selectedEvent) return;
      const gallery = getGallery(selectedEvent);
      setCurrentPhotoIndex((p) => (p + 1) % gallery.length);
    },
    [selectedEvent, getGallery]
  );

  const handlePrev = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!selectedEvent) return;
      const gallery = getGallery(selectedEvent);
      setCurrentPhotoIndex((p) => (p - 1 + gallery.length) % gallery.length);
    },
    [selectedEvent, getGallery]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedEvent) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent, handleNext, handlePrev]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedEvent ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedEvent]);

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] via-[#15152a] to-[#0d0d1a] rounded-3xl overflow-hidden font-sans text-gray-200 pb-16 shadow-2xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="py-12 px-6 text-center bg-white/5">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight flex items-center justify-center">
          <FaCalendarAlt className="text-amber-500 mr-4 drop-shadow-lg" />
          Our Events
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto font-light">
          Experience the vibrant life at {schoolProfile?.name || "Holy Name School"} through our academic,
          cultural, and sporting celebrations.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {/* ── Events Grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleEvents.map((event) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => handleOpen(event)}
              className="relative group cursor-pointer w-full aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl transition-all duration-300 sm:hover:-translate-y-2 overflow-hidden"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-4 md:p-6 text-center z-20 transition-transform duration-500 translate-y-1 group-hover:translate-y-0">
                <h3 className="text-white text-base md:text-lg font-sans font-bold mb-1 drop-shadow-2xl tracking-wide leading-tight line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-amber-400 text-[10px] md:text-xs font-bold uppercase tracking-widest drop-shadow-md pb-1 flex items-center gap-2">
                  <FaCalendarAlt className="text-[10px]" /> {event.date}
                </p>
                <p className="text-slate-300 text-[10px] md:text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mb-2 px-2">
                  {event.description || "View photos from this school event."}
                </p>

                {/* Photo count badge */}
                {event.galleryImages?.length > 0 && (
                  <span className="mt-1 px-3 py-1 bg-black/40 text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <FaImages className="text-amber-400" />
                    {event.galleryImages.length} Photos
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Empty State ─────────────────────────────────────────────────────── */}
        {events.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-700">
            <FaCalendarAlt className="text-6xl text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No events scheduled at the moment.</h3>
          </div>
        )}

        {/* ── Show All Button ─────────────────────────────────────────────────── */}
        {!showAll && events.length > 4 && (
          <div className="mt-16 text-center">
            <button
              className="px-8 py-4 bg-transparent border-2 border-amber-500 text-amber-500 font-bold rounded-xl hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-lg shadow-amber-900/20 uppercase tracking-widest text-sm"
              onClick={() => setShowAll(true)}
            >
              Discover More Events
            </button>
          </div>
        )}
      </div>

      {/* ── Event Modal ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (() => {
          const gallery = getGallery(selectedEvent);
          const hasMultiple = gallery.length > 1;

          return (
            <motion.div
              key="event-modal"
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
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative max-w-5xl w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close */}
                <button
                  className="absolute -top-3 -right-3 z-[110] text-white/60 hover:text-white bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full flex items-center justify-center border border-white/20 transition-all duration-200 backdrop-blur-md"
                  onClick={handleClose}
                >
                  <FaTimes />
                </button>

                {/* ── Image Viewer ───────────────────────────────────────────── */}
                <div className="relative w-full h-[55vh] md:h-[65vh] flex items-center justify-center group/lb rounded-2xl overflow-hidden bg-black/40">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentPhotoIndex}
                      src={gallery[currentPhotoIndex]}
                      alt={`${selectedEvent.title} — ${currentPhotoIndex + 1}`}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
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
                              ? "w-5 h-1.5 bg-amber-500"
                              : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Info Panel ─────────────────────────────────────────────── */}
                <div className="mt-4 w-full bg-white/5 backdrop-blur-xl rounded-2xl p-5 md:p-7 border border-white/10 shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">

                    {/* Left: event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded uppercase tracking-widest border border-amber-500/20">
                          EVENT GALLERY
                        </span>
                        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <FaCalendarAlt className="text-[9px]" />
                          {selectedEvent.date}
                        </p>
                      </div>
                      <h3 className="text-xl md:text-3xl font-serif font-bold text-white mb-1.5 tracking-tight leading-snug">
                        {selectedEvent.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 max-w-xl">
                        {selectedEvent.description || `Captured moments at ${schoolProfile?.name || "Holy Name School"}.`}
                      </p>
                    </div>

                    {/* Right: counter + controls + CTA */}
                    <div className="flex flex-col items-end gap-3 self-end md:self-center shrink-0">
                      {/* Counter + mobile nav */}
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
    </div>
  );
};

export default EventsSection;
