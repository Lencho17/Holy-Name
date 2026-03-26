import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa";
import { TiMessages } from "react-icons/ti";

const BelowSocialbtn = () => {
  const [showIcons, setShowIcons] = useState(false);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (showIcons) {
      // If icons should be shown, animate them into view
      setStyle({
        opacity: 1,
        transform: "translateY(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      });
    } else {
      // If icons should be hidden, animate them out of view
      setStyle({
        opacity: 0,
        transform: "translateY(20px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        visibility: "hidden",
        transitionDelay: "0s, 0.3s", // Delay the visibility change until after the transform
      });
    }
  }, [showIcons]); // Depend on showIcons to trigger the effect

  return (
    <div className="fixed bottom-0 left-0 p-4 md:p-6 flex flex-col items-center z-50">
      <div style={style} className="flex flex-col items-center mb-4 space-y-3">
        <a
          href="whatsapp://send?text=Hello"
          className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110"
          title="WhatsApp Us"
        >
          <FaWhatsapp className="text-xl md:text-2xl" />
        </a>
        <a
          href="mailto:bambinabreeze@gmail.com"
          className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110"
          title="Email Us"
        >
          <FaEnvelope className="text-xl md:text-2xl" />
        </a>
        <a 
          href="tel:+1234567890" 
          className="bg-white text-primary p-3 rounded-full shadow-md hover:bg-primary hover:text-white transition-all hover:scale-110"
          title="Call Us"
        >
          <FaPhone className="text-xl md:text-2xl" />
        </a>
      </div>
      <button
        className="bg-primary hover:bg-primary-container text-white p-3 md:p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary/30"
        onClick={() => setShowIcons(!showIcons)}
        aria-label="Toggle contact options"
      >
        <TiMessages className="text-2xl md:text-3xl" />
      </button>
    </div>
  );
};

export default BelowSocialbtn;
