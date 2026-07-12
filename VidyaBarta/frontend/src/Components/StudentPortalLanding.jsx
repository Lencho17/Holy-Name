import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function StudentPortalLanding() {
  return (
    <div className="min-h-screen bg-white">
      <main className="relative">
        {/* Hero Section */}
        <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/login-bg.png"
              alt="University Campus"
              className="w-full h-full object-cover opacity-60"
            />
            {/* Elegant deep blue overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A]/90 via-[#1E3A8A]/70 to-[#3B82F6]/30"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full pt-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                <span className="material-symbols-outlined text-sm text-white drop-shadow-md">
                  public
                </span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-md">
                  Central Student Hub
                </span>
              </div>
              
              <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                Your entire{" "}
                <span className="text-amber-400 drop-shadow-md italic">
                  Academic Life
                </span>{" "}
                in one place.
              </h2>
              
              <p className="text-blue-100 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
                Welcome to the unified student portal. Access your grades, download assignments, pay fees, and stay updated with live announcements from your institution.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/login"
                  className="bg-white text-blue-900 font-bold px-8 py-4 rounded-xl flex items-center gap-3 hover:-translate-y-1 transition-all duration-300 shadow-xl"
                >
                  Login to Portal
                  <span className="material-symbols-outlined">
                    login
                  </span>
                </Link>
                <a
                  href="https://www.vidyabarta.com"
                  className="bg-white/10 backdrop-blur-2xl text-white border-[0.5px] border-white/30 shadow-lg font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Visit Main Website
                </a>
              </div>
            </motion.div>

            {/* Feature Cards Column */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="hidden lg:grid grid-cols-1 gap-6 justify-items-end"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] w-80 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-amber-900">analytics</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
                <p className="text-blue-100 text-sm">View real-time updates on your academic performance and attendance.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] w-80 shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-300 mr-8">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-white">receipt_long</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Manage Dues</h3>
                <p className="text-blue-100 text-sm">Download fee receipts and clear pending dues instantly online.</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentPortalLanding;
