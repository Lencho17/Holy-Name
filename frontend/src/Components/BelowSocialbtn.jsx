import React, { useState, useEffect, useContext } from "react";
import { FaWhatsapp, FaWhatsappSquare, FaEnvelope, FaPhone } from "react-icons/fa";
import { TiMessages } from "react-icons/ti";
import { SiteDataContext } from "../context/SiteDataContext";

const BelowSocialbtn = () => {
  const [showIcons, setShowIcons] = useState(false);
  const [style, setStyle] = useState({});
  const { socialLinks } = useContext(SiteDataContext);

  useEffect(() => {
    if (showIcons) {
      setStyle({
        opacity: 1,
        transform: "translateY(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      });
    } else {
      setStyle({
        opacity: 0,
        transform: "translateY(20px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        visibility: "hidden",
        transitionDelay: "0s, 0.3s",
      });
    }
  }, [showIcons]);

  return (
    <div className="fixed bottom-0 left-0 p-4 md:p-6 flex flex-col items-center z-50">
      <div style={style} className="flex flex-col items-center mb-4 space-y-3">
        {socialLinks?.whatsappChannel && (
          <a
            href={socialLinks.whatsappChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110 flex items-center justify-center border border-primary/10"
            title="Join WhatsApp Channel"
          >
            <FaWhatsappSquare className="text-xl md:text-2xl" />
          </a>
        )}
        {socialLinks?.whatsapp && (
          <a
            href={socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110 flex items-center justify-center border border-primary/10"
            title="WhatsApp Us"
          >
            <FaWhatsapp className="text-xl md:text-2xl" />
          </a>
        )}
        {socialLinks?.email && (
          <a
            href={`mailto:${socialLinks.email}`}
            className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110 flex items-center justify-center border border-primary/10"
            title="Email Us"
          >
            <FaEnvelope className="text-xl md:text-2xl" />
          </a>
        )}
        {socialLinks?.phone && (
          <a 
            href={`tel:${socialLinks.phone}`} 
            className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110 flex items-center justify-center border border-primary/10"
            title="Call Us"
          >
            <FaPhone className="text-xl md:text-2xl" />
          </a>
        )}
      </div>
      <button
        className="bg-primary hover:bg-primary-container text-white p-3 md:p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary/30 border-2 border-white/20"
        onClick={() => setShowIcons(!showIcons)}
        aria-label="Toggle contact options"
      >
        <TiMessages className="text-2xl md:text-3xl" />
      </button>

    </div>
  );
};

export default BelowSocialbtn;
