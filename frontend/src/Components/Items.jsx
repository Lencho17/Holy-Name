import React, { useState } from "react";
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

const icons = [
  { title: "Clean / holistic",
    details: "Clean & holistic environment", 
    icon: FaLeaf },
  { title: "Co-ciricul",
    details: "Supplementary co-curricular activities", 
    icon: FaBook },
  { title: "Dedicated teacher", 
    details: "Supportive teachers and staff", 
    icon: FaChalkboardTeacher },
  { title: "NCC/scouts & guides", 
    details: "Residential camp for NCC and Scouts & Guide", 
    icon: FaUserFriends },
  { title: "Drinking water", 
    details: "RO drinking water facility", 
    icon: FaFaucet },
  { title: "Auditorium", 
    details: "Personal Amphitheatre", 
    icon: FaTheaterMasks },
  { title: "Parking", 
    details: "Parking space for HS Students", 
    icon: FaParking },
  { title: "Canteen", 
    details: "Hygienic school canteen", 
    icon: FaUtensils },
  { title: "Hostel", 
    details: "Hostel facility for girls", 
    icon: FaBed },
  { title: "Smart classes", 
    details: "Digital classrooms", 
    icon: FaLaptop },
  { title: "Science labs", 
    details: "Dedicated science labs", 
    icon: FaFlask },
  { title: "Comp labs", 
    details: "Two upgraded computer labs", 
    icon: FaDesktop },
];

const CircleIcon = ({ title, details, Icon }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant flex items-center justify-center cursor-pointer hover:bg-primary hover:text-on-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Icon className="text-xl md:text-2xl" />
      
      {/* Tooltip */}
      <div 
        className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-max max-w-[220px] bg-white text-slate-800 font-medium text-sm leading-snug text-center px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 pointer-events-none transition-all duration-300 ${
          hover ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        {details}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-100 rotate-45 rounded-tl-sm"></div>
      </div>
    </div>
  );
};

const Items = () => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 py-8 px-4 max-w-7xl mx-auto">
      {icons.map((icon, index) => (
        <CircleIcon key={index} title={icon.title} details={icon.details} Icon={icon.icon} />
      ))}
    </div>
  );
};

export default Items;
