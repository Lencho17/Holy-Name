import React, { useState, useContext } from "react";
import { SiteDataContext } from "../context/SiteDataContext";
import { FaBookOpen, FaAtom, FaBalanceScale, FaLandmark, FaChild, FaGraduationCap, FaShieldAlt, FaUniversity } from "react-icons/fa";

function Courses() {
  const { schoolProfile, coursesPage } = useContext(SiteDataContext);
  const [selectedCategory, setSelectedCategory] = useState("Science");

  const courses = coursesPage?.streams || {};
  const rules = coursesPage?.rules || [];

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.courses || "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2070&auto=format&fit=crop"}
            alt="Courses"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              menu_book
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Academic Excellence
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Academic <span className="text-amber-400 italic drop-shadow-md">Programmes</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Explore our diverse and rigorous curriculum designed to inspire curiosity and foster lifelong learning.
          </p>
        </div>
      </section>

      {/* --- Course Sections --- */}
      <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto space-y-16">

        {/* 1. Higher Education */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <FaUniversity className="text-3xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Higher Education <span className="text-lg text-gray-500 font-sans block mt-1">(Graduate/Diploma/PG)</span></h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {coursesPage?.higherEducation?.text || "Details about Graduate, Diploma, and PG courses will be updated soon."}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Higher Secondary */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-100 transition-colors duration-500"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <FaGraduationCap className="text-3xl text-amber-600" />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Higher Secondary <span className="text-lg text-gray-500 font-sans block mt-1">(XI & XII)</span></h2>
                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                  {coursesPage?.higherSecondary?.text || "Details about XI & XII courses will be updated soon."}
                </p>
              </div>
            </div>

            {/* Streams Tab */}
            <div className="mt-8 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
              <div className="flex flex-wrap gap-3 mb-8">
                {Object.keys(courses).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 shadow-sm ${
                      selectedCategory === category
                        ? "bg-primary text-white shadow-md transform scale-105"
                        : "bg-white text-gray-600 hover:text-primary hover:shadow-md border border-gray-200"
                    }`}
                  >
                    {category === "Science" && <FaAtom className="inline-block mr-2 -mt-1" />}
                    {category === "Commerce" && <FaBalanceScale className="inline-block mr-2 -mt-1" />}
                    {category === "Arts" && <FaLandmark className="inline-block mr-2 -mt-1" />}
                    {category}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border-l-4 border-primary">
                <h3 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center">
                  <span className="bg-amber-100 text-amber-700 p-2 rounded-lg mr-3">
                    {selectedCategory === "Science" && <FaAtom />}
                    {selectedCategory === "Commerce" && <FaBalanceScale />}
                    {selectedCategory === "Arts" && <FaLandmark />}
                  </span>
                  {selectedCategory} Subjects
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(courses[selectedCategory] || []).map((subject, index) => (
                    <div key={index} className="flex items-center bg-[#F9F9FB] p-4 rounded-xl border border-gray-100 hover:border-amber-300 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mr-3 hidden sm:block"></div>
                      <span className="text-gray-800 font-medium">{subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Upper Primary */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-100 transition-colors duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <FaBookOpen className="text-3xl text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Upper Primary <span className="text-lg text-gray-500 font-sans block mt-1">(IX & X)</span></h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {coursesPage?.upperPrimary?.text || "Details about IX & X courses will be updated soon."}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Lower Primary */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-100 transition-colors duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <FaBookOpen className="text-3xl text-purple-600" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Lower Primary <span className="text-lg text-gray-500 font-sans block mt-1">(I to VIII)</span></h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {coursesPage?.lowerPrimary?.text || "Details about I to VIII courses will be updated soon."}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Play School & Nursery */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-100 transition-colors duration-500"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <FaChild className="text-3xl text-pink-500" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Play School & Nursery</h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {coursesPage?.prePrimary?.text || "Details about Play School & Nursery courses will be updated soon."}
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Rules and Regulations */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="bg-primary rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-10 text-center">General Code of Conduct</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rules.map((rule, idx) => {
                const heading = typeof rule === 'string' ? '' : rule.heading;
                const description = typeof rule === 'string' ? rule : rule.description;
                return (
                  <div key={idx} className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors duration-300">
                    {heading && (
                      <h3 className="text-lg font-bold text-amber-400 mb-2 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-sm font-black text-amber-300 shrink-0">{idx + 1}</span>
                        {heading}
                      </h3>
                    )}
                    <p className="text-white/90 leading-relaxed text-[15px] font-medium pl-9">
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Courses;
