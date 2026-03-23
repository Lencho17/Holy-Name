import React from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe } from "react-icons/fa";

function Contact() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center bg-gradient-to-r from-canva-cyan to-canva-purple overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596522354195-e41cdab60538?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight flex items-center justify-center">
            <FaGlobe className="text-amber-500 mr-4 drop-shadow-lg" />
            Contact Info
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto">
            We're here to help. Reach out to us with any questions or inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Address */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
              <FaMapMarkerAlt className="text-2xl text-amber-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-[#4C1A57] mb-3">Our Campus</h3>
            <p className="text-gray-600">
              Holy Name Higher Secondary School<br />
              Cherekapar, Nazira Ali Rd, Hatimuria<br />
              Dist: Sivasagar, Assam - 785697
            </p>
          </div>

          {/* Card 2: Phone */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-[#F3E8F5] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#4C1A57] transition-colors">
              <FaPhoneAlt className="text-2xl text-[#4C1A57] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-[#4C1A57] mb-3">Phone Line</h3>
            <p className="text-gray-600 mb-4">
              We're available during office hours to answer your calls.
            </p>
            <a href="tel:6901055733" className="text-xl font-bold text-amber-600 hover:text-amber-500 transition-colors">
              +91 6901055733
            </a>
          </div>

          {/* Card 3: Email */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
              <FaEnvelope className="text-2xl text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-[#4C1A57] mb-3">Email Support</h3>
            <p className="text-gray-600 mb-4">
              Send us an email and we'll respond as soon as possible.
            </p>
            <a href="mailto:holynameschool@gmail.com" className="font-bold text-blue-600 hover:text-blue-500 transition-colors break-all">
              holynameschool@gmail.com
            </a>
          </div>

          {/* Card 4: Hours */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-500 transition-colors">
              <FaClock className="text-2xl text-green-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-[#4C1A57] mb-3">Office Hours</h3>
            <div className="text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">Mon - Sat</p>
              <p>9:00 AM - 1:30 PM</p>
              <div className="w-8 h-px bg-gray-200 mx-auto my-2"></div>
              <p className="font-medium text-gray-800">Sunday & Holidays</p>
              <p>Closed</p>
            </div>
          </div>

        </div>

        {/* Map Placeholder */}
        <div className="mt-12 bg-white rounded-3xl shadow-xl border border-gray-100 p-4 h-[400px] overflow-hidden relative group">
          <div className="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center m-4 rounded-2xl border-2 border-dashed border-gray-400">
              <FaMapMarkerAlt className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500 font-bold text-xl">Interactive Map Area</p>
              <p className="text-gray-400 max-w-sm text-center mt-2">Embed Google Maps iframe here replacing this placeholder.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Contact;
