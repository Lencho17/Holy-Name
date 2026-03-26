import React, { useState, useEffect, useContext } from "react";
import { FaChevronLeft, FaChevronRight, FaGraduationCap, FaUserTie } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Faculty() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      text: "Pre-Primary Educators",
      imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 2,
      text: "Primary Department",
      imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
    },
    {
      id: 3,
      text: "Secondary & Higher Secondary",
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 4,
      text: "Dedicated Support Staff",
      imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const { faculty: facultyData } = useContext(SiteDataContext);

  const FacultyCard = ({ member }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col items-center text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 bg-[#4C1A57] opacity-5 group-hover:opacity-10 transition-opacity"></div>
      <div className="relative z-10 w-32 h-32 mb-6">
        <div className="absolute inset-0 bg-amber-400 rounded-full blur-sm opacity-20 group-hover:opacity-60 transition-opacity duration-300 transform group-hover:scale-110"></div>
        <img
          src={member.photo}
          alt={member.name}
          className="w-full h-full object-cover rounded-full border-4 border-white shadow-md relative z-10"
        />
      </div>
      <h3 className="text-xl font-serif font-bold text-[#4C1A57] mb-1 group-hover:text-amber-600 transition-colors">{member.name}</h3>
      <p className="text-sm font-semibold text-amber-600 mb-3">{member.Subject}</p>
      
      <div className="w-full h-px bg-gray-100 my-3"></div>
      
      <div className="flex flex-col space-y-2 text-sm text-gray-600 w-full">
        <div className="flex items-center justify-center">
          <FaGraduationCap className="mr-2 text-gray-400" />
          <span className="truncate">{member.EduQua}</span>
        </div>
        <div className="flex items-center justify-center">
          <FaUserTie className="mr-2 text-gray-400" />
          <span>{member.title}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden bg-gradient-to-r from-primary to-primary-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay transform scale-105 transition-transform duration-[10000ms] ease-linear"
              style={{ backgroundImage: `url(${slide.imageUrl})` }}
            ></div>
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        ))}
        
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-lg">Our Esteemed Faculty</h1>
          <p className="text-xl md:text-2xl text-amber-400 font-light drop-shadow-md">
             {slides[currentSlide].text}
          </p>
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center space-x-6">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/20"
            >
              <FaChevronLeft />
            </button>
            <div className="flex space-x-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? "bg-amber-400 w-8" : "bg-white/50"
                  }`}
                ></div>
              ))}
            </div>
            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all border border-white/20"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mt-16 space-y-24">
        
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4C1A57]">Science Department</h2>
            <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Nurturing analytical minds and scientific inquiry through experienced mentorship.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {facultyData.Science.map((faculty, index) => (
              <FacultyCard key={`science-${index}`} member={faculty} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4C1A57]">Arts & Humanities</h2>
            <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Cultivating creativity, critical thinking, and a deeper understanding of human culture.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {facultyData.Arts.map((faculty, index) => (
              <FacultyCard key={`arts-${index}`} member={faculty} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F3E8F5] rounded-bl-full -mr-20 -mt-20 opacity-50"></div>
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4C1A57]">Guest & Visiting Faculty</h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-4xl">
                {facultyData.Guest.map((faculty, index) => (
                  <FacultyCard key={`guest-${index}`} member={faculty} />
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Faculty;
