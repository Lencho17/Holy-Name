import React from "react";
import { FaGraduationCap, FaChalkboardTeacher, FaBriefcase, FaEnvelopeOpenText } from "react-icons/fa";

function Career() {
  const vacancies = [
    {
      id: 1,
      title: "Senior Secondary Post Graduate Teacher (PGT) - Physics",
      department: "Science",
      type: "Full-Time",
      experience: "3+ Years",
      qualifications: ["Master's Degree in Physics", "B.Ed. preferred"],
      deadline: "Oct 30, 2023"
    },
    {
      id: 2,
      title: "Trained Graduate Teacher (TGT) - English",
      department: "Arts & Humanities",
      type: "Full-Time",
      experience: "2+ Years",
      qualifications: ["Bachelor's/Master's in English", "B.Ed. required"],
      deadline: "Nov 15, 2023"
    },
    {
      id: 3,
      title: "School Counselor",
      department: "Administration",
      type: "Full-Time",
      experience: "1+ Years",
      qualifications: ["Master's in Psychology or Counseling"],
      deadline: "Open until filled"
    }
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[280px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571260899304-42507011ec7b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 tracking-tight flex items-center justify-center">
            <FaBriefcase className="text-amber-500 mr-4 drop-shadow-lg" />
            Careers at Holy Name
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light mb-8 max-w-2xl mx-auto">
            Join our passionate team of educators and professionals dedicated to shaping the future.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
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
                {vacancies.map(job => (
                  <div key={job.id} className="bg-[#F9F9FB] rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-md transition-all duration-300 group">
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
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <a href="mailto:holynameschool@gmail.com" className="inline-flex items-center text-primary font-bold hover:text-amber-500 transition-colors">
                        Apply Now <FaEnvelopeOpenText className="ml-2" />
                      </a>
                    </div>
                  </div>
                ))}

                {vacancies.length === 0 && (
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
                    <h4 className="font-bold text-lg mb-1 leading-tight text-amber-400">Email</h4>
                    <p className="text-white/80 text-sm">Send your application package to <a href="mailto:holynameschool@gmail.com" className="underline font-bold">holynameschool@gmail.com</a></p>
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
              <h3 className="text-xl font-bold text-primary mb-4">Why Holy Name?</h3>
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
