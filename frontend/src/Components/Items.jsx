import React, { useState, useContext } from "react";
import {
  FaLeaf,
  FaBook,
  FaChalkboardTeacher,
  FaUserFriends,
  FaFaucet,
  FaTheaterMasks,
  FaParking,
  FaUtensils,
  FaBed,
  FaLaptop,
  FaFlask,
  FaDesktop,
} from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

// Map icon string names to actual React components
const iconMap = {
  FaLeaf,
  FaBook,
  FaChalkboardTeacher,
  FaUserFriends,
  FaFaucet,
  FaTheaterMasks,
  FaParking,
  FaUtensils,
  FaBed,
  FaLaptop,
  FaFlask,
  FaDesktop,
};

const CircleIcon = ({ title, details, icon, image }) => {
  const [hover, setHover] = useState(false);
  const IconComponent = typeof icon === "string" ? iconMap[icon] : icon;
  const hasImage = image && image.trim() !== "";

  return (
    <div
      className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant flex items-center justify-center cursor-pointer transition-all duration-300 group hover:bg-primary hover:text-on-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 ${hover ? 'z-50' : 'z-10'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setHover(!hover)}
    >
      {IconComponent ? <IconComponent className="text-xl md:text-2xl" /> : <FaLeaf className="text-xl md:text-2xl" />}
      
      {/* Image Popup Tooltip */}
      {hasImage ? (
        <div 
          className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-[220px] md:w-[260px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-300/40 border border-white/60 z-50 pointer-events-none transition-all duration-300 overflow-hidden ${
            hover ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
          }`}
        >
          <div className="relative w-full h-[140px] md:h-[160px] overflow-hidden">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
          <div className="px-4 py-3">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{details}</p>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-white/60 rotate-45 rounded-br-sm shadow-sm" />
        </div>
      ) : (
        /* Fallback text-only tooltip */
        <div 
          className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-max max-w-[220px] bg-white text-slate-800 font-medium text-sm leading-snug text-center px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 pointer-events-none transition-all duration-300 ${
            hover ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
          }`}
        >
          {details}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-100 rotate-45 rounded-tl-sm"></div>
        </div>
      )}
    </div>
  );
};

const Items = () => {
  const { amenities } = useContext(SiteDataContext);

  return (
    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 py-8 px-4 max-w-7xl mx-auto">
      {amenities.map((item, index) => (
        <CircleIcon 
          key={index} 
          title={item.title}
          details={item.details} 
          icon={item.icon} 
          image={item.image}
        />
      ))}
    </div>
  );
};

export default Items;
