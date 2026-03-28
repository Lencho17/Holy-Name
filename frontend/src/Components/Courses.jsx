import React, { useState } from "react";
import { FaBookOpen, FaAtom, FaBalanceScale, FaLandmark, FaChild, FaGraduationCap } from "react-icons/fa";

function Courses() {
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
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[280px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Academic Programmes</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
            Empowering students with a comprehensive and dynamic curriculum designed for holistic excellence.
          </p>
        </div>
      </section>

      {/* School Levels Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Educational Wings</h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            From early childhood setting the foundation to secondary education shaping future leaders, we provide a seamless educational journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {levels.map((level, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-md">
                  {level.icon}
                </div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-3">{level.title}</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                  {level.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Higher Secondary Section (11th & 12th) */}
      <section className="py-20 bg-[#F9F9FB]">
        <div className="max-w-6xl mx-auto px-6">
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
                        : "bg-white text-gray-600 hover:bg-white hover:text-primary hover:shadow-md border border-gray-200"
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
      <section className="py-20 px-6 max-w-5xl mx-auto">
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

