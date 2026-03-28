import React, { useContext, useRef, useEffect, useState } from "react";
import { SiteDataContext } from "../context/SiteDataContext";
import { FaGraduationCap, FaMedal } from "react-icons/fa";

const AlumniSection = () => {
  const { alumni } = useContext(SiteDataContext);

  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId;
    
    const autoScroll = () => {
      // Only scroll if not being hovered/touched
      if (!isHovered) {
        scrollContainer.scrollLeft += 1;
        // Seamless loop horizontally:
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  if (!alumni || alumni.length === 0) return null;

  // We duplicate the alumni array to create a seamless loop
  const baseAlumni =
    alumni.length < 5
      ? Array(Math.ceil(5 / alumni.length))
          .fill(alumni)
          .flat()
      : alumni;
  const loopAlumni = [...baseAlumni, ...baseAlumni];

  return (
    <section className="py-8 relative overflow-hidden bg-gradient-to-br from-[#CCFFFF]/35 via-[#CCFFFF]/20 to-[#CCFFFF]/5 border-y border-slate-100 my-4 border-t-4 border-t-primary/40 shadow-[0_-4px_20px_rgba(204,255,255,0.3)]">
      {/* Decorative background elements - optimized for WHITE page background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-32 w-[700px] h-[700px] bg-blue-400/[0.35] rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute -bottom-20 -right-32 w-[650px] h-[650px] bg-blue-400/[0.30] rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "2.5s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-sky-300/[0.20] rounded-full blur-[140px]"></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-400/[0.15] rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 mb-2 shadow-sm">
          <FaGraduationCap className="text-primary text-sm" />
          <span className="text-[11px] font-bold tracking-[0.3em] text-primary uppercase">
            Legacy of Excellence
          </span>
        </div>

        <h3 className="text-4xl md:text-5xl font-black text-slate-800 font-serif mb-2 tracking-tight drop-shadow-sm">
          Board{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700">
            Toppers
          </span>
        </h3>

        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-lg font-light leading-relaxed italic">
          "The future belongs to those who believe in the beauty of their
          dreams."
        </p>
      </div>

      {/* Slider Wrapper */}
      <div className="relative z-10 w-full overflow-hidden flex py-2">
        <style>{`
          .hide-scroll::-webkit-scrollbar {
            display: none;
          }
          .hide-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {/* Continuous Slider Track */}
        <div 
          ref={scrollRef}
          className="flex w-full overflow-x-auto hide-scroll py-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loopAlumni.map((student, idx) => (
            <div
              key={`${student._id || idx}-${idx}`}
              className="w-56 mx-4 shrink-0 transition-all duration-700 hover:-translate-y-4 group"
            >
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 rounded-[2rem] flex flex-col items-center relative overflow-hidden h-full shadow-xl shadow-primary/10 group-hover:bg-white/10 group-hover:border-white/20 group-hover:shadow-2xl transition-all duration-500">
                {/* Visual Accent - Top Gradient Border */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

                {/* Rank Badge - Gold Pill at Top Right */}
                {student.rank && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white text-[9px] font-black py-1 px-3 rounded-full shadow-[0_4px_12px_rgba(245,158,11,0.3)] flex items-center gap-1.5 tracking-wider ring-1 ring-white/30">
                      <span>★</span> Rank {student.rank}
                    </div>
                  </div>
                )}

                {/* Profile Photo - Rounded Square (Squircle) */}
                <div className="relative mb-3 mt-2 transition-transform duration-500 group-hover:scale-105">
                  <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-[4px] border-white shadow-[0_15px_35px_rgba(30,64,175,0.15)] z-10 relative ring-1 ring-primary/10 ring-offset-2 ring-offset-transparent">
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white shadow-xl text-[#2563eb] flex items-center justify-center z-20 border border-blue-50 ring-2 ring-blue-50/50">
                    <FaGraduationCap size={14} />
                  </div>
                </div>

                {/* Name - Bold Serif Font */}
                <h4 className="text-xl font-black text-[#1e3a8a] mb-1 text-center leading-tight group-hover:text-primary transition-colors font-serif tracking-tight drop-shadow-sm">
                  {student.name}
                </h4>

                {/* Level & Year Badges Side-by-Side */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-amber-50/50 text-amber-800 border border-amber-200/40 font-bold tracking-wide font-sans shadow-sm backdrop-blur-sm">
                    Class of {student.passedYear}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-[#dbeafe] text-[#1e40af] py-1 px-3 rounded-full border border-blue-200/40 font-sans shadow-sm backdrop-blur-sm">
                    {student.level}
                  </span>
                </div>

                {/* Aggregate Score Container */}
                {student.percentage && (
                  <div className="mb-3 text-center w-full py-3 px-4 rounded-[1.5rem] bg-gradient-to-br from-[#f8faff] via-white to-[#f0f5ff] border border-blue-100/60 shadow-[inset_0_2px_10px_rgba(30,64,175,0.02)] relative overflow-hidden ring-1 ring-blue-50">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.03),transparent)] pointer-events-none"></div>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#60a5fa] tracking-tighter leading-none font-sans drop-shadow-sm">
                      {String(student.percentage).replace(/%/g, "")}%
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mt-1 font-sans opacity-70">
                      Aggregate Score
                    </p>
                  </div>
                )}

                {/* Horizontal Separator */}
                <div className="w-full border-t border-blue-100/50 mb-3 mx-4"></div>

                {student.level === "HS" && (
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2563eb] mb-2 font-sans drop-shadow-sm">
                      {student.stream} Stream
                    </span>
                    {student.subjects && student.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {student.subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-3 py-1 rounded-xl bg-white text-slate-500 border border-slate-200/50 shadow-sm whitespace-nowrap font-bold font-sans transition-all hover:border-primary/30 hover:text-primary hover:shadow-md cursor-default"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* HSLC-specific decorative footer */}
                {student.level === "HSLC" && (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <FaMedal className="text-amber-500 text-sm drop-shadow-sm" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#1e40af]/60 font-sans">
                        Matriculation
                      </span>
                      <FaMedal className="text-amber-500 text-sm drop-shadow-sm" />
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium text-center leading-relaxed max-w-[180px] opacity-80">
                      Building foundations for a brilliant career
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AlumniSection;
