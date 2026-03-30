import React, { useContext, useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Contact() {
  const { schoolProfile } = useContext(SiteDataContext);
  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.contact || "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=2070&auto=format&fit=crop"}
            alt="Contact Us"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              support_agent
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Get In Touch
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Contact <span className="text-amber-400 italic drop-shadow-md">Info</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            We're here to help. Reach out to us with any questions or inquiries about our school.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Address */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
              <FaMapMarkerAlt className="text-2xl text-amber-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-primary mb-3 font-serif italic">Our <span className="text-amber-600">Campus</span></h3>
            <p className="text-gray-600 whitespace-pre-line">
              {schoolProfile?.officeAddress || schoolProfile?.name}
            </p>
          </div>

          {/* Card 2: Phone */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
              <FaPhoneAlt className="text-2xl text-primary group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-primary mb-3 font-serif italic">Phone <span className="text-amber-600">Line</span></h3>
            <p className="text-gray-600 mb-4">
              We're available during office hours to answer your calls.
            </p>
            <a href={`tel:${schoolProfile?.phone || ""}`} className="text-xl font-bold text-amber-600 hover:text-amber-500 transition-colors">
              {schoolProfile?.phone && `+91 ${schoolProfile.phone}`}
            </a>
          </div>

          {/* Card 3: Email */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
              <FaEnvelope className="text-2xl text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-primary mb-3 font-serif italic">Email <span className="text-amber-600">Support</span></h3>
            <p className="text-gray-600 mb-4">
              Send us an email and we'll respond as soon as possible.
            </p>
            <a href={`mailto:${schoolProfile?.email || ""}`} className="font-bold text-blue-600 hover:text-blue-500 transition-colors break-all">
              {schoolProfile?.email}
            </a>
          </div>

          {/* Card 4: Hours */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500 transition-colors">
              <FaClock className="text-2xl text-green-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-black text-primary mb-3 font-serif italic">Office <span className="text-amber-600">Hours</span></h3>
            <p className="text-gray-600 mb-4">
              Visit us or call us during our standard operating hours.
            </p>
            <div className="text-gray-600 space-y-1">
              <p className="font-bold text-green-600 whitespace-pre-line text-lg">
                {schoolProfile?.officeHours || "Contact us for office hours"}
              </p>
            </div>
          </div>

        </div>

        <div className="mt-12 bg-white rounded-3xl shadow-xl border border-gray-100 p-4 h-[400px] overflow-hidden relative group">
          {schoolProfile?.mapLink ? (
            <iframe
              src={schoolProfile.mapLink}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl"
              title="School Location Map"
            ></iframe>
          ) : (
            <div className="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center m-4 rounded-2xl border-2 border-dashed border-gray-400">
                <FaMapMarkerAlt className="text-4xl text-gray-400 mb-4" />
                <p className="text-gray-500 font-bold text-xl">Interactive Map Area</p>
                <p className="text-gray-400 max-w-sm text-center mt-2">Map will be updated soon.</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}

export default Contact;
