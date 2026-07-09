import React from "react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

function SocialMediaBar() {
  return (
    <div className="bg-gray-100 pl-2 flex flex-col justify-around items-center rounded-xl shadow-md h-auto py-6">
      <div className="flex flex-col items-center mb-8">
        <a
          href="https://wa.me/yourphonenumber"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-primary p-3 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all hover:scale-110 mb-2"
        >
          <FaWhatsapp className="w-6 h-6" />
        </a>
        <span className="text-sm font-semibold text-primary">WhatsApp</span>
      </div>
      <div className="flex flex-col items-center mb-8">
        <a
          href="https://www.instagram.com/yourprofile"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-primary p-3 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all hover:scale-110 mb-2"
        >
          <FaInstagram className="w-6 h-6" />
        </a>
        <span className="text-sm font-semibold text-primary">Instagram</span>
      </div>
      <div className="flex flex-col items-center">
        <a
          href="https://www.facebook.com/yourprofile"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-primary p-3 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all hover:scale-110 mb-2"
        >
          <FaFacebook className="w-6 h-6" />
        </a>
        <span className="text-sm font-semibold text-primary">Facebook</span>
      </div>
    </div>
  );
}

export default SocialMediaBar;
