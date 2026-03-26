import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Items from "./Items";
import EventsSection from "./EventsSection";
import VideoBlogSection from "./VideoBlogSection";
import HighlightsSection from "./HighlightsSection";
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Home() {
  const { videos } = useContext(SiteDataContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "/Pictures/1.JPG",
    "/Pictures/2.JPG",
    "/Pictures/3.JPG",
    "/Pictures/4.JPG",
    "/Pictures/5.JPG",
    "/Pictures/6.JPG",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="bg-surface relative">
      <main className="relative">
        {/* Development Banner */}
        <div className="w-full flex justify-center py-2 px-5 bg-secondary-container text-on-secondary-container rounded-b-xl shadow-sm mb-4">
          <style jsx>{`
            @keyframes marquee {
              0% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(-100%);
              }
            }
            .marquee {
              display: inline-block;
              animation: marquee 15s linear infinite;
            }
          `}</style>
        </div>

        {/* Hero Section */}
        <section className="relative w-full h-[600px] lg:h-[716px] flex items-center overflow-hidden bg-slate-900 rounded-3xl mx-auto max-w-[98%] shadow-2xl">
          <div className="absolute inset-0 z-0">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`School Image ${idx}`}
                className={`w-full h-full object-cover transition-opacity duration-1000 ease-in-out absolute inset-0 ${
                  idx === currentIndex ? "opacity-80" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/75 via-[#1E40AF]/40 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
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
              <h2 className="font-['Prata'] text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                Nurturing the{" "}
                <span className="text-secondary drop-shadow-md italic">
                  Leaders
                </span>{" "}
                of Tomorrow.
              </h2>
              <p className="text-primary-fixed text-base md:text-lg max-w-xl font-medium leading-relaxed">
                Holy Name Higher Secondary School offers a transformative
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
                  <span className="text-primary font-black text-2xl">#1</span>
                </div>
                <h4 className="text-primary flex flex-1 justify-center items-center text-center font-bold text-xl uppercase tracking-wider leading-none">
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
        <section className="py-16 bg-surface">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center space-y-2 p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="text-4xl font-black text-primary academic-serif">
                2.5k+
              </div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">
                Students Enrolled
              </div>
            </div>
            <div className="text-center space-y-2 p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="text-4xl font-black text-primary academic-serif">
                150+
              </div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">
                Expert Faculty
              </div>
            </div>
            <div className="text-center space-y-2 p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="text-4xl font-black text-primary academic-serif">
                40+
              </div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">
                Laboratories
              </div>
            </div>
            <div className="text-center space-y-2 p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="text-4xl font-black text-primary academic-serif">
                100%
              </div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">
                Pass Result
              </div>
            </div>
          </motion.div>
        </section>

        {/* Values Section */}
        <section className="w-full py-16 my-10 bg-gradient-to-b from-[#dfc8ff] to-[#f8f5ff] relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl shadow-purple-900/10 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-container"></div>
              <span className="material-symbols-outlined text-purple-900/5 text-9xl absolute -bottom-10 -right-10 pointer-events-none">
                school
              </span>
              <h3 className="font-['Prata'] text-3xl md:text-5xl font-black mb-6 text-slate-800">
                Why Holy Name?
              </h3>
              <p className="text-lg md:text-2xl text-slate-700 leading-relaxed max-w-4xl mx-auto font-medium">
                "Because at Holy Name, we foster curiosity, creativity, and a love
                for learning, nurturing students to become confident,
                compassionate leaders of tomorrow. Empowering young minds to
                dream, discover, and achieve."
              </p>
            </motion.div>
          </div>
        </section>

        {/* Existing Component Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-20 py-10">
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
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="bg-primary-container text-on-primary rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl"
            >
              <VideoBlogSection />
            </motion.section>
          )}



        </div>
      </main>
    </div>
  );
}

export default Home;
