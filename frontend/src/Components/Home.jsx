import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Items from "./Items";
import EventsSection from "./EventsSection";
import VideoBlogSection from "./VideoBlogSection";
import HighlightsSection from "./HighlightsSection";
import AlumniSection from "./AlumniSection";
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Home() {
  const { videos, stats, schoolProfile } = useContext(SiteDataContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const images = schoolProfile?.heroImages?.length > 0 ? schoolProfile.heroImages : ["https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop", "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="min-h-screen bg-white">
      <main className="relative">


        {/* Hero Section */}
        <section className="relative w-full h-[600px] lg:h-[716px] flex items-center overflow-hidden bg-slate-900 rounded-none md:rounded-b-[4rem] shadow-2xl mb-12">
          <div className="absolute inset-0 z-0">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img || null}
                alt={`School Image ${idx}`}
                className={`w-full h-full object-cover transition-opacity duration-1000 ease-in-out absolute inset-0 ${
                  idx === currentIndex ? "opacity-80" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/75 via-[#1E40AF]/40 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/20 text-secondary border border-secondary/30">
                <span className="material-symbols-outlined text-sm text-white">
                  stars
                </span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white">
                  Established 1986
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                Nurturing the{" "}
                <span className="text-amber-400 drop-shadow-md italic">
                  Leaders
                </span>{" "}
                of Tomorrow.
              </h2>
              <p className="text-primary-fixed text-base md:text-lg max-w-xl font-medium leading-relaxed">
                {schoolProfile?.name || "Our School"} offers a transformative
                academic journey that bridges traditional values with futuristic
                learning architectures.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/admission"
                  className="bg-secondary-container text-on-secondary-container font-bold px-8 py-4 rounded-xl flex items-center gap-3 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-primary/20"
                >
                  Apply for Admission
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  to="/courses"
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Explore Curriculum
                </Link>
              </div>
            </motion.div>

            {/* Hero Bento Grid Fragment */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:grid grid-cols-2 gap-4 h-[500px]"
            >
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 flex flex-col justify-end border border-white/10 hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-secondary-container text-4xl mb-4">
                  science
                </span>
                <h4 className="text-white font-bold text-xl uppercase tracking-wider">
                  Advanced Labs
                </h4>
                <p className="text-primary-fixed/80 text-sm mt-2">
                  Equipped with the latest research technologies.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all">
                <div className="flex justify-between items-center">
                  <span className="material-symbols-outlined text-primary text-4xl">
                    workspace_premium
                  </span>
                  <span className="text-amber-600 font-black text-2xl">#1</span>
                </div>
                <h4 className="text-amber-600 flex flex-1 justify-center items-center text-center font-bold text-xl uppercase tracking-wider leading-none">
                  Top Rated School
                </h4>
              </div>
              <div className="col-span-2 bg-white/5 backdrop-blur-lg rounded-3xl p-6 flex items-center gap-6 border border-white/10">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined text-white text-3xl">
                    history_edu
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg uppercase tracking-wider">
                    Rich Heritage
                  </h4>
                  <p className="text-primary-fixed/80 text-sm">
                    38 years of academic excellence in Sivasagar.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <section className="py-8 bg-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 gap-4 ${
                stats.length === 1 ? 'md:grid-cols-1 max-w-sm' :
                stats.length === 2 ? 'md:grid-cols-2 max-w-screen-md' :
                stats.length === 3 ? 'md:grid-cols-3 max-w-screen-lg' :
                'md:grid-cols-4'
              }`}
            >
              {stats.map((stat, idx) => (
                <div key={stat.id || idx} className="text-center space-y-1 p-4 rounded-[1.5rem] bg-surface-container-low border border-outline-variant/30 hover:bg-white:bg-[#1E293B]:bg-[#1E293B] hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <div className="text-3xl md:text-4xl font-black text-primary academic-serif">
                    {stat.value}
                  </div>
                  <div className="text-[11px] font-bold text-secondary uppercase tracking-[0.15em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Values Section */}
        {/* Values Section */}
        <section className="w-full py-16 md:py-24 my-4 relative bg-gradient-to-r from-green-200 to-blue-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              <h3 className="font-serif text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tighter mb-8 transition-all hover:scale-[1.02]">
                Why <span className="text-amber-600 italic drop-shadow-sm">Holy Name?</span>
              </h3>
              
              <p className="text-lg md:text-2xl text-gray-600 leading-relaxed max-w-5xl mx-auto">
                "Because at Holy Name,we foster curiosity, creativity, and a love for learning, nurturing students to become confident, compassionate leaders of tomorrow.Empowering young minds to dream, discover, and achieve"
              </p>
            </motion.div>
          </div>
        </section>

        <AlumniSection />

        {/* Existing Component Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 py-6">
          <HighlightsSection />

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-outline-variant/30"
          >
            <h3 className="academic-serif text-3xl font-black mb-10 text-primary text-center">
              Campus Amenities
            </h3>
            <Items />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <EventsSection />
          </motion.section>

          {videos && videos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <VideoBlogSection />
            </motion.div>
          )}



        </div>
      </main>
    </div>
  );
}

export default Home;
