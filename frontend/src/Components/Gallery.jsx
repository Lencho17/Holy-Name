import React, { useState } from "react";
import { FaImages, FaPlay, FaSearchPlus } from "react-icons/fa";

function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = ["All", "Campus Life", "Academic Events", "Sports", "Cultural Programs"];

  const galleryItems = [
    {
      id: 1,
      category: "Academic Events",
      title: "Science Exhibition 2023",
      src: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&auto=format&fit=crop&q=60",
      featured: true,
    },
    {
      id: 2,
      category: "Sports",
      title: "Annual Sports Day",
      src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60",
      featured: false,
    },
    {
      id: 3,
      category: "Campus Life",
      title: "Morning Assembly",
      src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=60",
      featured: true,
    },
    {
      id: 4,
      category: "Cultural Programs",
      title: "Foundation Day Celebration",
      src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60",
      featured: false,
    },
    {
      id: 5,
      category: "Academic Events",
      title: "Inter-School Debate",
      src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60",
      featured: false,
    },
    {
      id: 6,
      category: "Campus Life",
      title: "Library Reading Session",
      src: "https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=60",
      featured: false,
    },
    {
      id: 7,
      category: "Sports",
      title: "Basketball Tournament",
      src: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&auto=format&fit=crop&q=60",
      featured: true,
    },
    {
      id: 8,
      category: "Cultural Programs",
      title: "Art & Craft Workshop",
      src: "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800&auto=format&fit=crop&q=60",
      featured: false,
    },
    {
      id: 9,
      category: "Campus Life",
      title: "Computer Lab Session",
      src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
      featured: false,
    },
  ];

  const filteredItems = activeCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] flex items-center justify-center bg-gradient-to-r from-canva-cyan to-canva-purple overflow-hidden">
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

        {/* Grid matching reference image */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 bg-black p-4 lg:p-6 rounded-xl">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="relative overflow-hidden group cursor-pointer aspect-video bg-black"
              onClick={() => setSelectedImage(item)}
            >
              <img 
                src={item.src} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-500"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 transition-transform duration-500 group-hover:scale-105">
                <h3 className="text-white text-2xl md:text-3xl font-serif font-bold mb-2 shadow-black drop-shadow-xl tracking-wide">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-sm tracking-widest shadow-black drop-shadow-md">
                  {item.category}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <FaImages className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">No images found in this category.</h3>
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
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-[#4C1A57]">{selectedImage.title}</h3>
                  <p className="text-gray-500 font-medium mt-1">{selectedImage.category}</p>
                </div>
                <button className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-[#4C1A57] hover:bg-amber-400 transition-colors shadow-sm">
                  <FaPlay className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
