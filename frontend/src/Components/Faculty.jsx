import React, { useState, useEffect, useContext } from "react";
import { FaChevronLeft, FaChevronRight, FaGraduationCap, FaUserTie, FaFacebook, FaInstagram, FaChalkboardTeacher } from "react-icons/fa";
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

  const { faculty: facultyData , schoolProfile } = useContext(SiteDataContext);

  const FacultyCard = ({ member }) => (
    <div className="relative bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/80 group overflow-hidden flex flex-col items-center flex-1 transform hover:-translate-y-2 h-full">
      
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-100/40 to-blue-50/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none z-0"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-amber-100/40 to-orange-50/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none z-0"></div>

      {/* Experience Badge (Top Right) */}
      {member.title && (
        <div className="absolute top-4 right-4 z-20 flex items-center bg-white/90 backdrop-blur-sm border border-gray-100 text-indigo-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
          <FaUserTie className="mr-1.5 text-indigo-400" size={12} />
          {member.title}
        </div>
      )}

      {/* Profile Image with animated ring on hover */}
      <div className="relative z-10 w-28 h-28 mb-5 mt-4 group">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[2px] -m-[2px]"></div>
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 group-hover:border-transparent transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-white rounded-full m-[1px]"></div>
        <img
          src={member.photo || "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150&h=150&fit=crop"}
          alt={member.name}
          className="w-full h-full object-cover rounded-full shadow-inner relative z-10 p-[2px]"
        />
      </div>

      {/* Details */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">{member.name}</h3>
        <p className="text-[13px] font-bold text-amber-500 tracking-wider uppercase mb-5">{member.Subject}</p>

        <div className="w-full space-y-4 px-1">
          {member.EduQua && (
            <div className="flex items-start group/item">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mr-3 group-hover/item:bg-indigo-100 transition-colors">
                <FaGraduationCap className="text-indigo-500" size={14} />
              </div>
              <span className="text-sm text-gray-600 leading-tight pt-1.5">{member.EduQua}</span>
            </div>
          )}
          
          {member.classes && (
            <div className="flex items-start group/item">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mr-3 group-hover/item:bg-amber-100 transition-colors">
                <FaChalkboardTeacher className="text-amber-500" size={14} />
              </div>
              <span className="text-sm text-gray-600 leading-tight pt-1.5 whitespace-pre-wrap text-left break-words overflow-hidden">{member.classes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Social Links Footer */}
      <div className="relative z-10 w-full mt-auto pt-6 flex flex-col justify-end">
        {(member.facebook || member.instagram) && (
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100 w-full">
            {member.facebook && (
              <a href={member.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-md border border-blue-100 hover:border-blue-600">
                <FaFacebook size={16} />
              </a>
            )}
            {member.instagram && (
              <a href={member.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-pink-50/50 flex items-center justify-center text-pink-600 hover:bg-gradient-to-tr hover:from-orange-500 hover:via-pink-500 hover:to-purple-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-md border border-pink-100 hover:border-transparent">
                <FaInstagram size={16} />
              </a>
            )}
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
            src={schoolProfile?.pageHeroImages?.faculty || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"}
            alt="Faculty"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              school
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Academic Leaders
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Our Esteemed <span className="text-amber-400 italic drop-shadow-md">Faculty</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Meet our dedicated team of educators who are passionate about nurturing young minds and fostering excellence.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 space-y-24">
        
        {facultyData.Science.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-8">
                Science <span className="text-amber-600 italic">Department</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Nurturing analytical minds and scientific inquiry through experienced mentorship.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {facultyData.Science.map((faculty, index) => (
                <FacultyCard key={`science-${index}`} member={faculty} />
              ))}
            </div>
          </section>
        )}

        {facultyData.Arts.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-8">
                Arts & <span className="text-amber-600 italic">Humanities</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Cultivating creativity, critical thinking, and a deeper understanding of human culture.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {facultyData.Arts.map((faculty, index) => (
                <FacultyCard key={`arts-${index}`} member={faculty} />
              ))}
            </div>
          </section>
        )}

        {facultyData.Commerce?.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-8">
                Commerce <span className="text-amber-600 italic">Department</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Fostering business acumen and financial literacy with real-world applications.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {facultyData.Commerce.map((faculty, index) => (
                <FacultyCard key={`commerce-${index}`} member={faculty} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default Faculty;
