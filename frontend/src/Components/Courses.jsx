import React, { useState, useContext } from "react";
import { SiteDataContext } from "../context/SiteDataContext";
import { FaBookOpen, FaAtom, FaBalanceScale, FaLandmark, FaChild, FaGraduationCap, FaShieldAlt } from "react-icons/fa";

function Courses() {
  const { schoolProfile } = useContext(SiteDataContext);
  const [selectedCategory, setSelectedCategory] = useState("Science");

  const courses = {
    Science: [
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
      "Computer Science",
    ],
    Commerce: [
      "Accountancy",
      "Business Studies",
      "Economics",
      "Mathematics",
      "Informatics Practices",
    ],
    Arts: [
      "History",
      "Geography",
      "Political Science",
      "Sociology",
      "Psychology",
    ],
  };

  const levels = [
    { title: "Play School", desc: "A nurturing environment where early learning meets structured play, setting the foundational stones for lifelong curiosity.", icon: <FaChild className="text-3xl text-amber-500" /> },
    { title: "Nursery", desc: "Fostering social skills, early literacy, and numeracy through engaging and interactive activities.", icon: <FaChild className="text-3xl text-amber-500" /> },
    { title: "Lower Primary", desc: "Building core academic competencies in a supportive setting, encouraging independent thought and collaborative learning.", icon: <FaBookOpen className="text-3xl text-amber-500" /> },
    { title: "Upper Primary", desc: "Expanding knowledge horizons with a diverse curriculum designed to challenge and inspire growing minds.", icon: <FaBookOpen className="text-3xl text-amber-500" /> },
    { title: "Secondary School", desc: "Preparing students for rigorous academic challenges and holistic personal development ahead of crucial board examinations.", icon: <FaGraduationCap className="text-3xl text-amber-500" /> },
    { title: "HS Science", desc: "Specialized focus on Physics, Chemistry, Biology, and Mathematics to prepare students for engineering, medical, and research careers.", icon: <FaAtom className="text-3xl text-amber-500" /> },
    { title: "HS Commerce", desc: "In-depth study of Accountancy, Business Studies, and Economics, building a strong foundation for future business and financial leaders.", icon: <FaBalanceScale className="text-3xl text-amber-500" /> },
    { title: "HS Arts", desc: "Comprehensive exploration of Humanities, History, and Political Science, fostering critical thinking and social awareness.", icon: <FaLandmark className="text-3xl text-amber-500" /> },
    { title: "NCC 11th Assam Battalion", desc: "Elite membership program focused on discipline, leadership, and national service, building character through rigorous training.", icon: <FaShieldAlt className="text-3xl text-amber-500" /> },
  ];

  const rules = [
    "Students must maintain 80% attendance throughout the academic year.",
    "Strict adherence to the school uniform policy is mandatory at all times.",
    "Mobile phones and electronic gadgets are strictly prohibited on campus.",
    "Respectful code of conduct towards peers, faculty, and administrative staff.",
    "Participation in at least one extracurricular activity is highly encouraged.",
    "Timely submission of assignments and project work is essential.",
  ];

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

      {/* School Levels Grid */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Educational Wings</h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            From early childhood setting the foundation to secondary education shaping future leaders, we provide a seamless educational journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {levels.map((level, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl:shadow-none:shadow-none transition-all duration-300 border border-gray-100 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-md">
                  {level.icon}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-3">{level.title}</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-800:text-gray-100:text-gray-100 transition-colors">
                  {level.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Higher Secondary Section (11th & 12th) */}
      <section className="py-20 bg-[#F9F9FB]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="md:w-1/2 mb-8 md:mb-0 pr-0 md:pr-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Higher Secondary</h2>
              <h3 className="text-xl text-amber-600 font-semibold mb-6">Grades XI & XII</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Our senior secondary curriculum provides specialized streams allowing students to focus on their passions and prepare meticulously for higher education and competitive examinations.
              </p>
              
              {/* Custom Tab Navigation */}
              <div className="flex flex-wrap gap-3">
                {Object.keys(courses).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 shadow-sm ${
                      selectedCategory === category
                        ? "bg-primary text-white shadow-md transform scale-105"
                        : "bg-white text-gray-600 hover:bg-white:bg-[#1E293B]:bg-[#1E293B] hover:text-primary hover:shadow-md border border-gray-200"
                    }`}
                  >
                    {category === "Science" && <FaAtom className="inline-block mr-2 -mt-1" />}
                    {category === "Commerce" && <FaBalanceScale className="inline-block mr-2 -mt-1" />}
                    {category === "Arts" && <FaLandmark className="inline-block mr-2 -mt-1" />}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject List Display */}
            <div className="md:w-1/2 w-full">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border-t-4 border-primary">
                <h3 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center">
                  <span className="bg-amber-100 text-amber-700 p-2 rounded-lg mr-3">
                    {selectedCategory === "Science" && <FaAtom />}
                    {selectedCategory === "Commerce" && <FaBalanceScale />}
                    {selectedCategory === "Arts" && <FaLandmark />}
                  </span>
                  {selectedCategory} Stream
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses[selectedCategory].map((subject, index) => (
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
      </section>

      {/* Rules and Regulations */}
      <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="bg-primary rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-center">General Code of Conduct</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-start bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold mr-4 mt-1">
                    {idx + 1}
                  </span>
                  <p className="text-white/90 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Courses;

