import React, { useState, useEffect, useContext } from "react";
import { FaGraduationCap, FaChalkboardTeacher, FaBriefcase, FaEnvelopeOpenText, FaSpinner, FaArrowRight } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { SiteDataContext } from "../context/SiteDataContext";

function Career() {
  const { schoolProfile, API_URL } = useContext(SiteDataContext);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs`);
        if (res.ok) {
          const data = await res.json();
          setVacancies(data);
        }
      } catch (err) {
        console.error("Failed to fetch vacancies", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, [API_URL]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.career || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"}
            alt="Careers"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              work
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Join Our Team
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Careers at <span className="text-amber-400 italic drop-shadow-md">Holy Name</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Join our passionate team of educators and professionals dedicated to shaping the future of our students.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Vacancies */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 flex-grow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
              
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-8 relative z-10 flex items-center">
                <span className="w-2 h-8 bg-amber-500 rounded-full mr-4"></span>
                Current Vacancies
              </h2>

              <div className="space-y-6 relative z-10">
                {loading ? (
                  <div className="flex justify-center py-20">
                    <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
                  </div>
                ) : vacancies.length > 0 ? (
                  vacancies.map(job => (
                    <div key={job._id} className="bg-[#F9F9FB] rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-md transition-all duration-300 group">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">{job.department}</span>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">{job.type}</span>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-sm font-bold text-gray-500 mb-1">Apply By</p>
                          <p className="text-amber-600 font-bold">{job.deadline}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="text-gray-500 text-sm font-bold mb-2 flex items-center">
                            <FaGraduationCap className="mr-2" /> Required Qualifications
                          </p>
                          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            {job.qualifications.map((qual, idx) => (
                              <li key={idx}>{qual}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm font-bold mb-2 flex items-center">
                            <FaChalkboardTeacher className="mr-2" /> Minimum Experience
                          </p>
                          <p className="text-gray-700 text-sm bg-white inline-block px-3 py-1.5 rounded-lg border border-gray-200">{job.experience}</p>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                        <NavLink to={`/apply/${job._id}`} className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center group">
                          Apply Now <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </NavLink>
                        <a href={`mailto:${schoolProfile?.email || ""}`} className="text-gray-400 hover:text-primary transition-colors text-sm font-medium">
                          Inquiry <FaEnvelopeOpenText className="ml-1 inline" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-[#F9F9FB] rounded-2xl border border-gray-200">
                    <FaBriefcase className="text-5xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">No Current Vacancies</h3>
                    <p className="text-gray-500 mt-2">Please check back later for new opportunities.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - How to apply & Culture */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="bg-primary rounded-3xl shadow-xl p-8 text-white relative overflow-hidden max-h-min">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-tl-full -mr-10 -mb-10"></div>
              
              <h3 className="text-2xl font-serif font-bold mb-6 relative z-10 flex items-center">
                How to Apply
              </h3>
              
              <ol className="relative border-l border-amber-500/30 ml-3 space-y-8 z-10">                  
                <li className="mb-8 ml-6">            
                    <span className="absolute flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full -left-4 ring-4 ring-primary text-primary font-bold">
                      1
                    </span>
                    <h4 className="font-bold text-lg mb-1 leading-tight text-amber-400">Prepare</h4>
                    <p className="text-white/80 text-sm">Update your resume and prepare a cover letter detailing your teaching philosophy.</p>
                </li>
                <li className="mb-8 ml-6">            
                    <span className="absolute flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full -left-4 ring-4 ring-primary text-primary font-bold">
                      2
                    </span>
                    <h4 className="font-bold text-lg mb-1 leading-tight text-amber-400">Apply Online</h4>
                    <p className="text-white/80 text-sm mb-4">Fill out our comprehensive recruitment form and upload required documents.</p>
                    <Link to="/apply" className="inline-flex items-center px-4 py-2 bg-white text-primary rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-100 transition-all shadow-sm">
                       Open Form <FaArrowRight className="ml-2" />
                    </Link>
                </li>
                <li className="ml-6">            
                    <span className="absolute flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full -left-4 ring-4 ring-primary text-primary font-bold">
                      3
                    </span>
                    <h4 className="font-bold text-lg mb-1 leading-tight text-amber-400">Review</h4>
                    <p className="text-white/80 text-sm">Shortlisted candidates will be contacted for an interview and demo class.</p>
                </li>
              </ol>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden max-h-min">
              <h3 className="font-serif text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-8">
                Why <span className="text-amber-600 italic drop-shadow-sm">Holy Name?</span>
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                We offer a supportive environment that fosters professional growth, innovation in teaching, and a strong sense of community.
              </p>
              <ul className="space-y-3 text-sm text-gray-700 font-medium">
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-3"></span> Competitive Salary</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-3"></span> Professional Development</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-3"></span> Health Benefits</li>
                <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-3"></span> Modern Infrastructure</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Career;
