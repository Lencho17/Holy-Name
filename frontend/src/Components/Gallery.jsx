import React, { useState, useContext } from "react";
import { FaImages, FaPlay, FaSearchPlus } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = ["All", "Campus Life", "Academic Events", "Sports", "Cultural Programs"];

  const { gallery: galleryItems } = useContext(SiteDataContext);

  const filteredItems = activeCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <div className="bg-gradient-to-b from-[#141414] to-black min-h-screen font-sans text-gray-200 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay transform scale-105 hover:scale-100 transition-transform duration-1000"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 tracking-tight flex items-center justify-center">
            <FaImages className="text-amber-500 mr-4 drop-shadow-lg" />
            Photo Gallery
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-light mb-8">
            Glimpses of academic excellence, vibrant campus life, and memorable events at Holy Name School.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        
        {/* Filter Navigation */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-12 flex flex-wrap justify-center border border-gray-100">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 m-1 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeCategory === category
                  ? "bg-[#4C1A57] text-white shadow-md transform scale-105"
                  : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-[#4C1A57]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Mobile Horizontal Scroll / Desktop Grid */}
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-6 p-2 lg:p-4 rounded-xl snap-x snap-mandatory pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="relative flex items-center justify-center shrink-0 snap-start w-[40vw] sm:w-auto h-auto transition-transform"
              onClick={() => setSelectedImage(item)}
            >
              {/* Card Container */ }
              <div className="relative overflow-hidden group cursor-pointer w-full aspect-[2/3] bg-black rounded-xl border border-red-600/70 shadow-2xl transition-all duration-300 sm:hover:-translate-y-2 z-10 flex-shrink-0">
                <img 
                  src={item.src} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-2 md:p-6 text-center z-20 transition-transform duration-500 translate-y-1 group-hover:translate-y-0">
                  <h3 className="text-white text-xs md:text-xl font-sans font-bold mb-1 shadow-black drop-shadow-2xl tracking-wide leading-tight px-1">
                    {item.title}
                  </h3>
                  <p className="text-red-500 text-[9px] md:text-sm font-bold uppercase tracking-widest shadow-black drop-shadow-md pb-1">
                    {item.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-[#1c1c1c] rounded-3xl shadow-sm border border-red-900/30">
            <FaImages className="text-6xl text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No images found in this category.</h3>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 text-white hover:text-amber-400 text-3xl transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
            <div className="bg-white p-2 rounded-2xl shadow-2xl relative">
              <img 
                src={selectedImage.src} 
                alt={selectedImage.title} 
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
              <div className="absolute bottom-6 left-6 right-6 p-4 md:p-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 bg-[#4C1A57] text-white text-[10px] font-bold rounded uppercase tracking-wider">{selectedImage.category}</span>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-[#4C1A57]">{selectedImage.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{selectedImage.description || "Captured moment at Holy Name School."}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-6 py-3 bg-amber-500 text-[#4C1A57] font-bold rounded-xl hover:bg-amber-400 transition-all shadow-sm flex items-center justify-center gap-2">
                    <FaSearchPlus /> Zoom
                  </button>
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
