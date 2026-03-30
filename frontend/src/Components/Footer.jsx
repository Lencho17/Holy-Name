import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaWhatsappSquare, FaInstagram, FaFacebook, FaYoutube, FaTwitter, FaLinkedin, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

const Footer = () => {
  const { socialLinks, schoolProfile } = useContext(SiteDataContext);

  const linkClass = "text-slate-600 dark:text-slate-400 text-sm font-medium tracking-wide hover:text-primary dark:hover:text-blue-400 transition-colors duration-fast focus-ring rounded";
  const socialBtnClass = "w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-primary dark:text-blue-400 shadow-soft hover:shadow-medium dark:hover:shadow-md hover:bg-primary hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:scale-110 transition-all duration-fast cursor-pointer border border-slate-200 dark:border-slate-600 focus-ring";

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start px-4 md:px-8 py-8 md:py-12 w-full max-w-7xl mx-auto gap-10 lg:gap-12">
        
        {/* Brand Column */}
        <div className="flex flex-col items-start gap-4 w-full md:w-auto max-w-xs">
          <div className="flex items-center gap-3">
            <img
              src={schoolProfile?.logo || null}
              alt="School Logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg shadow-soft object-cover hover:shadow-medium transition-all duration-fast"
            />
            <div className="font-headline font-bold text-primary dark:text-blue-400 text-lg md:text-xl leading-tight">
              {schoolProfile?.name || "School"}
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs tracking-wide text-left leading-relaxed">
            {schoolProfile?.punchLine}
          </p>
          <div className="flex flex-col gap-2.5 mt-2 text-xs text-slate-600 dark:text-slate-400">
            <a href={`https://maps.google.com/?q=${schoolProfile?.officeAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-primary dark:hover:text-blue-400 transition-colors duration-fast focus-ring rounded px-1">
              <FaMapMarkerAlt className="text-primary/70 dark:text-blue-400/70 shrink-0 w-4 h-4" />
              <span className="leading-snug">{schoolProfile?.officeAddress}</span>
            </a>
            <a href={`tel:+91${schoolProfile?.phone}`} className="flex items-center gap-2.5 hover:text-primary dark:hover:text-blue-400 transition-colors duration-fast focus-ring rounded px-1">
              <FaPhoneAlt className="text-primary/70 dark:text-blue-400/70 shrink-0 w-4 h-4" />
              <span>{schoolProfile?.phone && `+91 ${schoolProfile.phone}`}</span>
            </a>
            <a href={`mailto:${schoolProfile?.email}`} className="flex items-center gap-2.5 hover:text-primary dark:hover:text-blue-400 transition-colors duration-fast focus-ring rounded px-1">
              <FaEnvelope className="text-primary/70 dark:text-blue-400/70 shrink-0 w-4 h-4" />
              <span className="break-all">{schoolProfile?.email}</span>
            </a>
          </div>
        </div>

        {/* Links Wrapper */}
        <div className="flex flex-row justify-start w-full md:w-auto gap-14 sm:gap-20 md:gap-12">
          {/* Quick Links Column */}
          <div className="flex flex-col items-start gap-2.5">
            <h5 className="font-bold text-xs text-primary dark:text-blue-400 uppercase tracking-widest mb-1">Quick Links</h5>
            <Link to="/about" className={linkClass}>About Us</Link>
            <Link to="/admission" className={linkClass}>Admission</Link>
            <Link to="/courses" className={linkClass}>Courses</Link>
            <Link to="/notice" className={linkClass}>Notice Board</Link>
          </div>

          {/* Resources Column */}
          <div className="flex flex-col items-start gap-2.5">
            <h5 className="font-bold text-xs text-primary dark:text-blue-400 uppercase tracking-widest mb-1">Resources</h5>
            <Link to="/faculty" className={linkClass}>Faculty</Link>
            <Link to="/gallery" className={linkClass}>Gallery</Link>
            <Link to="/career" className={linkClass}>Career</Link>
            <Link to="/complaints" className={linkClass}>Suggestions</Link>
            <Link to="/contact" className={linkClass}>Contact</Link>
          </div>
        </div>

        {/* Affiliation & Social Wrapper */}
        <div className="flex flex-row justify-start w-full md:w-auto gap-10 sm:gap-16 md:gap-10">
          {/* Affiliation Column */}
          <div className="flex flex-col items-start gap-2.5">
            <h5 className="font-bold text-xs text-primary dark:text-blue-400 uppercase tracking-widest mb-1">Affiliation</h5>
            {schoolProfile?.affiliation?.map((aff, idx) => (
              <p key={idx} className="text-slate-600 dark:text-slate-400 text-sm font-medium">{aff}</p>
            ))}
            {(!schoolProfile?.affiliation || schoolProfile.affiliation.length === 0) && (
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium italic">No affiliation set</p>
            )}
            {schoolProfile?.officeHours && <p className="text-slate-500 dark:text-slate-500 text-[11px] mt-1 font-medium">Office: {schoolProfile.officeHours}</p>}
          </div>
          
          {/* Social Column */}
          <div className="flex flex-col items-start gap-2.5">
            <h5 className="font-bold text-xs text-primary dark:text-blue-400 uppercase tracking-widest mb-1">Connect</h5>
            <div className="flex flex-wrap gap-3 mt-0.5 max-w-[180px]">
              {socialLinks?.whatsappChannel && (
                <a href={socialLinks.whatsappChannel} title="WhatsApp Channel" target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaWhatsappSquare size={18} />
                </a>
              )}
              {socialLinks?.whatsapp && (
                <a href={socialLinks.whatsapp} title="WhatsApp" target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaWhatsapp size={18} />
                </a>
              )}
              {socialLinks?.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaFacebook size={18} />
                </a>
              )}
              {socialLinks?.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaInstagram size={18} />
                </a>
              )}
              {socialLinks?.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaTwitter size={18} />
                </a>
              )}
              {socialLinks?.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaYoutube size={18} />
                </a>
              )}
              {socialLinks?.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={socialBtnClass}>
                  <FaLinkedin size={18} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full py-4 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 bg-white/50 dark:bg-slate-900/50 transition-colors duration-300">
        <span>&copy; {new Date().getFullYear()} {schoolProfile?.name || "Holy Name School"}. All Rights Reserved.</span>
        <span className="hidden md:inline">•</span>
        <span>
          Developed by{" "}
          <a className="text-primary dark:text-blue-400 hover:underline focus-ring rounded px-1" href="https://www.LenchoSolutions.com" target="_blank" rel="noopener noreferrer">
            Lencho Solutions
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
