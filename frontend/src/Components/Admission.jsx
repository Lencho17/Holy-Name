import React from "react";
import { NavLink } from "react-router-dom";
import { FaLaptop, FaBuilding, FaClipboardList, FaGraduationCap, FaPhoneAlt, FaEnvelope } from "react-icons/fa";

function Admission() {
  const steps = [
    { title: "Registration", desc: "Start by registering your ward's details online or at the school office." },
    { title: "Entrance Exam", desc: "A brief assessment to understand the student's current academic level." },
    { title: "Interview", desc: "A personal interaction with the student and parents." },
    { title: "Final Results", desc: "Selection is based on the assessment and interview performance." },
    { title: "Admission Confirmation", desc: "Submit the required documents and complete the fee payment." },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] flex items-center justify-center bg-gradient-to-r from-canva-cyan to-canva-purple overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">Admissions</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
            Join a community dedicated to educational excellence and holistic growth.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#4C1A57]">Admission Process</h2>
            <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-4 text-gray-600">A simple, transparent, and seamless five-step journey.</p>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {index !== steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-[2px] bg-gray-200">
                     <div className="h-full bg-amber-500 w-0 group-hover:w-full transition-all duration-500"></div>
                  </div>
                )}
                <div className="w-16 h-16 mx-auto bg-amber-50 relative z-10 rounded-full flex items-center justify-center border-4 border-white shadow-md text-amber-500 text-xl font-bold mb-4 transition-transform group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-serif font-bold text-[#4C1A57] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Online Application */}
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100 hover:border-blue-200 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                 <FaLaptop />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#4C1A57]">Online Mode</h2>
            </div>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Visit our official website and navigate to the Admission section.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Create an account and fill out the online application form.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Upload digital copies of required documents (Birth Certificate, previous records).
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Complete the secure online payment for the application fee.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Receive instant confirmation and further instructions via email.
              </li>
            </ul>
          </div>

          {/* Offline Application */}
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100 hover:border-amber-200 transition-colors">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                 <FaBuilding />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#4C1A57]">Offline Mode</h2>
            </div>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Visit the school administrative block during working hours (9 AM - 3 PM).
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Collect the admission application packet from the front desk.
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Fill out the form manually in CAPITAL letters.
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Attach photocopies of necessary documents.
              </li>
              <li className="flex items-start">
                <span className="text-amber-500 mr-2">✓</span>
                Submit the completed docket and pay the fee at the cash counter.
              </li>
            </ul>
          </div>
        </div>

        {/* Info & CTA */}
        <div className="bg-[#4C1A57] rounded-3xl shadow-2xl p-8 md:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
          
          <div className="mb-8 md:mb-0 md:pr-12 relative z-10 w-full md:w-2/3">
            <h2 className="text-3xl font-serif font-bold mb-4">Ready to Apply?</h2>
            <p className="text-white/80 mb-6 text-lg">
              Begin your child's journey of academic excellence today. Access our Student Portal for all admission-related activities.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 text-white/90">
              <div className="flex items-center">
                <FaPhoneAlt className="text-amber-400 mr-3" />
                <span>(123) 456-7890</span>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-amber-400 mr-3" />
                <span>admissions@school.com</span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 w-full md:w-1/3 text-left md:text-right">
            <NavLink
              to="/studentportal"
              className="inline-flex items-center justify-center bg-amber-500 text-[#4C1A57] font-bold px-8 py-4 rounded-full hover:bg-amber-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full md:w-auto text-lg"
            >
              <FaGraduationCap className="mr-2 text-xl" />
              Student Portal
            </NavLink>
            <p className="text-sm text-white/60 mt-4 md:text-center block md:inline-block w-full text-center">
              Click here to apply online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admission;
