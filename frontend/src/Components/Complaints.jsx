import React, { useState } from "react";
import { FaCommentDots, FaPaperPlane, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function Complaints() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "suggestion"
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log("Feedback submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "", type: "suggestion" });
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center bg-gradient-to-r from-canva-cyan to-canva-purple overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight flex items-center justify-center">
            <FaCommentDots className="text-amber-500 mr-4 drop-shadow-lg" />
            Feedback
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto">
            Your suggestions and feedback help us continuously improve the Holy Name experience.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <h2 className="text-2xl font-serif font-bold text-[#4C1A57] mb-2 flex items-center relative z-10">
            <span className="w-2 h-8 bg-amber-500 rounded-full mr-3"></span>
            Share Your Thoughts
          </h2>
          <p className="text-gray-500 mb-8 relative z-10">Please fill out the form below. We review all feedback within 48 hours.</p>

          {submitted && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center shadow-sm animate-fade-in">
              <FaCheckCircle className="text-2xl mr-3 flex-shrink-0" />
              <p className="font-medium">Thank you for your valuable feedback! We will review it shortly.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative z-10">
            
            {/* Feedback Type Toggle */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">Feedback Type</label>
              <div className="flex flex-wrap gap-4">
                <label className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.type === 'suggestion' ? 'border-amber-500 bg-amber-50 text-[#4C1A57] font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input type="radio" name="type" value="suggestion" className="hidden" checked={formData.type === 'suggestion'} onChange={handleChange} />
                  Suggestion
                </label>
                <label className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.type === 'complaint' ? 'border-[#4C1A57] bg-[#F3E8F5] text-[#4C1A57] font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input type="radio" name="type" value="complaint" className="hidden" checked={formData.type === 'complaint'} onChange={handleChange} />
                  Complaint
                </label>
                <label className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl border-2 transition-all flex items-center justify-center ${formData.type === 'inquiry' ? 'border-blue-400 bg-blue-50 text-blue-800 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input type="radio" name="type" value="inquiry" className="hidden" checked={formData.type === 'inquiry'} onChange={handleChange} />
                  General Inquiry
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="name">Full Name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C1A57]/20 focus:border-[#4C1A57] transition-all"
                  id="name" name="name" type="text" placeholder="John Doe"
                  value={formData.name} onChange={handleChange} required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="email">Email Address</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C1A57]/20 focus:border-[#4C1A57] transition-all"
                  id="email" name="email" type="email" placeholder="john@example.com"
                  value={formData.email} onChange={handleChange} required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="subject">Subject</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C1A57]/20 focus:border-[#4C1A57] transition-all"
                id="subject" name="subject" type="text" placeholder="Brief summary of your message"
                value={formData.subject} onChange={handleChange} required
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="message">Message Details</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C1A57]/20 focus:border-[#4C1A57] transition-all resize-none"
                id="message" name="message" rows="5" placeholder="Please provide as much detail as possible..."
                value={formData.message} onChange={handleChange} required
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 hidden sm:flex items-center"><FaExclamationCircle className="mr-1"/> All fields are required</p>
              <button
                className="w-full sm:w-auto bg-[#4C1A57] hover:bg-[#3a1343] text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center transform hover:-translate-y-1"
                type="submit"
              >
                Send Message <FaPaperPlane className="ml-3" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Complaints;
