import React, { useState, useContext, useEffect, useMemo } from "react";
import { FaImages, FaSearchPlus, FaArrowLeft } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";
import { useSearchParams, useNavigate } from "react-router-dom";

function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categories = ["All", "Campus Life", "Academic Events", "Sports", "Cultural Programs"];

  const { gallery: galleryItems, events, schoolProfile } = useContext(SiteDataContext);

  // Check if we're filtering by a specific event
  const eventId = searchParams.get("event") || null;

  // Find the event details for the heading
  const currentEvent = eventId ? events.find(e => e._id === eventId) : null;


  // Build the display items — if filtered by event, show only that event's gallery images
  let displayItems = galleryItems;

  if (eventId && currentEvent) {
    // Filter gallery items that belong to this event
    const eventGalleryItems = galleryItems.filter(item => item.eventId === eventId);
    
    // Also include galleryImages from the event itself (auto-generated entries)
    const eventExtraImages = (currentEvent.galleryImages || []).map((src, idx) => ({
      _id: `event-${eventId}-${idx}`,
      src,
      title: `${currentEvent.title}`,
      category: "Events",
      description: currentEvent.description || "",
      eventId: eventId,
    }));

    // Combine, removing duplicates by src
    const allSrcs = new Set(eventGalleryItems.map(item => item.src));
    const combined = [...eventGalleryItems];
    eventExtraImages.forEach(img => {
      if (!allSrcs.has(img.src)) {
        combined.push(img);
        allSrcs.add(img.src);
      }
    });

    displayItems = combined;
  } else {
    // Filter out any gallery items that belong to an event which no longer exists
    const validGalleryItems = galleryItems.filter(item => 
      !item.eventId || 
      events.some(e => String(e.id) === String(item.eventId) || String(e._id) === String(item.eventId))
    );
    
    displayItems = activeCategory === "All"
      ? validGalleryItems
      : validGalleryItems.filter(item => item.category === activeCategory);
  }

  // Ensure current image's collection is used for lightbox navigation
  const lightboxItems = useMemo(() => {
    if (!selectedImage) return [];
    if (eventId) return displayItems; // Stay in the event
    return galleryItems.filter(i => i.category === selectedImage.category);
  }, [selectedImage, galleryItems, eventId, displayItems]);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (!selectedImage) return;
    const currentIndex = lightboxItems.findIndex(i => (i._id && i._id === selectedImage._id) || i.src === selectedImage.src);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % lightboxItems.length;
    setSelectedImage(lightboxItems[nextIndex]);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (!selectedImage) return;
    const currentIndex = lightboxItems.findIndex(i => (i._id && i._id === selectedImage._id) || i.src === selectedImage.src);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + lightboxItems.length) % lightboxItems.length;
    setSelectedImage(lightboxItems[prevIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, displayItems]);

  // Reset category filter when event filter changes
  useEffect(() => {
    if (eventId) setActiveCategory("All");
  }, [eventId]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.gallery || "https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=2070&auto=format&fit=crop"}
            alt="Gallery"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              imagesmode
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Visual Journey
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            {currentEvent ? currentEvent.title : "Photo"} <span className="text-amber-400 italic drop-shadow-md">{currentEvent ? "" : "Gallery"}</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            {currentEvent
              ? currentEvent.description || `Photos from this event at ${schoolProfile?.name || "School"}.`
              : `Glimpses of academic excellence, vibrant campus life, and memorable events.`}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">

        {/* Back button when viewing event photos */}
        {eventId && (
          <button
            onClick={() => navigate("/gallery")}
            className="mb-6 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-all duration-300 flex items-center gap-2 border border-primary/20"
          >
            <FaArrowLeft /> Back to All Photos
          </button>
        )}
        
        {/* Filter Navigation — hidden when viewing event-specific gallery */}
        {!eventId && (
          <div className="bg-white rounded-2xl shadow-lg p-2 mb-12 flex flex-wrap justify-center border border-gray-100">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 m-1 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-primary text-white shadow-md transform scale-105"
                    : "bg-transparent text-gray-500 hover:bg-gray-50:bg-[#0F172A]:bg-[#0F172A] hover:text-primary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Horizontal Scroll / Desktop Grid */}
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-6 p-2 lg:p-4 rounded-xl snap-x snap-mandatory pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {displayItems.map((item) => (
            <div 
              key={item._id} 
              className="relative flex items-center justify-center shrink-0 snap-start w-[40vw] sm:w-auto h-auto transition-transform"
              onClick={() => setSelectedImage(item)}
            >
              {/* Card Container */ }
              <div className="relative overflow-hidden group cursor-pointer w-full aspect-[2/3] bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-300 sm:hover:-translate-y-2 z-10 flex-shrink-0 hover:border-primary/40 hover:shadow-xl:shadow-none:shadow-none">
                <img 
                  src={item.src || null} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-2 md:p-6 text-center z-20 transition-transform duration-500 translate-y-1 group-hover:translate-y-0">
                  <h3 className="text-white text-xs md:text-xl font-sans font-bold mb-1 shadow-black drop-shadow-2xl tracking-wide leading-tight px-1 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-amber-300 text-[9px] md:text-sm font-bold uppercase tracking-widest shadow-black drop-shadow-md pb-1">
                    {item.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
            <FaImages className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">
              {eventId ? "No photos found for this event yet." : "No images found in this category."}
            </h3>
            <p className="text-gray-400 mt-2 text-sm">Please check back later for new photos.</p>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 md:p-10" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center px-4" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 z-[60] text-white/50 hover:text-white text-4xl transition-colors bg-white/10 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>

            {/* Main Image Area */}
            <div className="relative w-full h-[65vh] flex items-center justify-center group/lightbox">
              {/* Navigation Arrows */}
              {displayItems.length > 1 && (
                <>
                  <button 
                    onClick={handlePrev}
                    className="absolute left-0 z-[60] text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-4 rounded-full transition-all border border-white/10 opacity-0 group-hover/lightbox:opacity-100 hidden md:flex"
                  >
                    <span className="material-symbols-outlined text-4xl">chevron_left</span>
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-0 z-[60] text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-4 rounded-full transition-all border border-white/10 opacity-0 group-hover/lightbox:opacity-100 hidden md:flex"
                  >
                    <span className="material-symbols-outlined text-4xl">chevron_right</span>
                  </button>
                </>
              )}

              <img 
                src={selectedImage.src || null} 
                alt={selectedImage.title} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              />
            </div>

            {/* Sub-panel */}
            <div className="mt-6 w-full max-w-4xl bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-500/20">{selectedImage.category}</span>
                    <h3 className="text-xl md:text-3xl font-serif font-bold text-white tracking-tight">{selectedImage.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed">{selectedImage.description || `Captured moment at ${schoolProfile?.name || "School"}.`}</p>
                </div>

                <div className="flex items-center gap-6 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 self-end md:self-center">
                  <span className="text-white font-mono text-lg font-black tracking-widest text-center px-4">
                    <span className="text-amber-500">
                      {Math.max(1, lightboxItems.findIndex(i => (i._id && i._id === selectedImage._id) || i.src === selectedImage.src) + 1)}
                    </span>
                    <span className="text-white/20 mx-2">/</span>
                    <span className="text-white/40">{lightboxItems.length}</span>
                  </span>
                  
                  {/* Mobile Nav */}
                  <div className="flex md:hidden gap-2">
                    <button onClick={handlePrev} className="p-2 bg-white/10 rounded-lg text-white"><span className="material-symbols-outlined">chevron_left</span></button>
                    <button onClick={handleNext} className="p-2 bg-white/10 rounded-lg text-white"><span className="material-symbols-outlined">chevron_right</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
