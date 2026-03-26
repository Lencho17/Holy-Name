import React from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaInstagram, FaFacebook } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full bg-[#f6f2ff] dark:bg-slate-900 border-t border-purple-100 dark:border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full max-w-7xl mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="font-['Prata'] font-bold text-[#500088] dark:text-purple-300 text-xl text-center md:text-left">
            Holy Name Higher Secondary School
          </div>
          <p className="text-slate-500 text-xs tracking-wider text-center md:text-left">
            XMH8+GGW, Nazira Ali Rd, Hatimuria, Assam 785697<br/>
            Office Timing: 9am - 1:30pm (Mon - Sat)
          </p>
        </div>
        <div className="flex flex-col items-center md:items-start gap-2">
          <h5 className="font-bold text-sm text-[#500088] uppercase tracking-wider">Curriculum & Board</h5>
          <p className="text-slate-500 text-sm">SEBA & ASHEC</p>
          <p className="text-slate-500 text-sm">Diocese of Dibrugarh</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/gallery" className="text-slate-500 dark:text-slate-400 text-sm font-['Outfit'] tracking-wide hover:text-[#500088] dark:hover:text-purple-300 transition-colors">Gallery</Link>
          <Link to="/career" className="text-slate-500 dark:text-slate-400 text-sm font-['Outfit'] tracking-wide hover:text-[#500088] dark:hover:text-purple-300 transition-colors">Career</Link>
          <Link to="/complaints" className="text-slate-500 dark:text-slate-400 text-sm font-['Outfit'] tracking-wide hover:text-[#500088] dark:hover:text-purple-300 transition-colors">Suggestions</Link>
          <Link to="/contact" className="text-slate-500 dark:text-slate-400 text-sm font-['Outfit'] tracking-wide hover:text-[#500088] dark:hover:text-purple-300 transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white hover:scale-110 transition-all cursor-pointer">
            <FaWhatsapp size={20} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white hover:scale-110 transition-all cursor-pointer">
            <FaInstagram size={20} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white hover:scale-110 transition-all cursor-pointer">
            <FaFacebook size={20} />
          </a>
        </div>
      </div>
      <div className="w-full py-6 text-center text-[10px] text-slate-400 font-medium tracking-widest uppercase border-t border-purple-50 flex flex-col items-center gap-2">
        <span>© 2026 Holy Name Higher Secondary School, Sivasagar. All Rights Reserved.</span>
        <span>
          Developed by{" "}
          <a className="text-primary hover:underline" href="https://www.LenchoSolutions.com" target="_blank" rel="noopener noreferrer">
            Lencho Solutions
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
