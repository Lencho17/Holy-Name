import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiShield, FiTrendingUp, FiChevronDown, FiChevronUp, FiBookOpen, FiBell } from 'react-icons/fi';

const FaqItem = ({ faq, isOpen, toggleOpen }) => (
  <div className="border border-outline-variant rounded-2xl bg-surface overflow-hidden mb-4 shadow-sm transition-all duration-300">
    <button 
      onClick={toggleOpen}
      className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
    >
      <span className="text-title-md font-bold text-neutral">{faq.question}</span>
      <span className="ml-4 text-primary shrink-0">
        {isOpen ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
      </span>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 pt-0 text-body-md text-on-surface-variant leading-relaxed">
            {faq.answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
      <Icon size={28} />
    </div>
    <h3 className="text-title-lg font-bold font-headline text-neutral mb-3">{title}</h3>
    <p className="text-body-md text-on-surface-variant leading-relaxed">{description}</p>
  </div>
);

function StudentPortalLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqs = [
    {
      question: "How do I get my login credentials?",
      answer: "Your initial Student ID and password are provided securely by your class teacher at the start of the academic year."
    },
    {
      question: "What if I forget my password?",
      answer: "For security, self-service reset is disabled. Please contact the IT admin office to issue a temporary reset link."
    },
    {
      question: "Can my parents log in?",
      answer: "Yes, the portal is unified. Parents use your credentials to monitor progress and process fee payments."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      
      <main className="relative z-10">
        
        {/* --- Hero Section --- */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-background">
          <div className="absolute top-20 left-0 -ml-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 -mr-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-label-sm font-semibold uppercase tracking-wider">
                    Student Portal v2.0
                  </span>
                </div>
                
                <h1 className="text-display-sm md:text-display-md lg:text-display-lg font-bold font-headline text-neutral mb-6 leading-tight tracking-tight">
                  Your academic life, <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    unified and clear.
                  </span>
                </h1>
                
                <p className="text-title-md text-on-surface-variant mb-10 leading-relaxed max-w-2xl mx-auto">
                  Experience the next generation student dashboard. Access grades, download materials, and manage fees in a beautifully seamless environment.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 pt-2 justify-center w-full sm:w-auto">
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-body-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                  >
                    Enter Dashboard
                    <FiArrowRight />
                  </Link>
                  <a
                    href="https://www.vidyabarta.com"
                    className="w-full sm:w-auto px-8 py-4 bg-surface-variant text-neutral rounded-xl font-bold text-body-lg hover:bg-outline-variant/30 transition-all flex items-center justify-center border border-outline-variant"
                  >
                    School Website
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section className="py-24 bg-surface-variant/30 border-t border-outline-variant relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-headline-lg font-bold font-headline text-neutral mb-4">Everything you need.</h2>
              <p className="text-body-lg text-on-surface-variant">Deep dive into your grades, assignments, and school updates from one unified dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={FiTrendingUp}
                title="Academic Performance"
                description="Deep dive into your grades with visual charts, historical data, and predictive analytics."
              />
              <FeatureCard 
                icon={FiBookOpen}
                title="Study Materials"
                description="Access class notes, syllabus, and assignments organized beautifully by subject."
              />
              <FeatureCard 
                icon={FiBell}
                title="Live Updates"
                description="Instant notifications for crucial school announcements, exam schedules, and results."
              />
            </div>
          </div>
        </section>

        {/* --- Support / FAQ Grid --- */}
        <section className="py-24 bg-background border-t border-outline-variant">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left: Support CTA */}
            <div>
              <h2 className="text-headline-lg font-bold font-headline text-neutral mb-6">Need assistance?</h2>
              <p className="text-title-md text-on-surface-variant mb-10">We're here to help you navigate the portal and resolve any technical issues you might face.</p>
              
              <div className="bg-surface p-8 rounded-3xl border border-outline-variant shadow-sm flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <FiShield size={24} />
                </div>
                <div>
                  <h4 className="text-title-lg font-bold text-neutral mb-2">Contact IT Admin</h4>
                  <p className="text-body-md text-on-surface-variant mb-4">Available during school hours for account recovery and technical support.</p>
                  <button className="text-primary font-bold text-body-md hover:text-primary/80 transition-colors flex items-center gap-2">
                    Open Support Ticket <FiArrowRight />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: FAQs */}
            <div className="space-y-2">
              <h3 className="text-title-lg font-bold text-neutral mb-6">Common Questions</h3>
              {faqs.map((faq, index) => (
                <FaqItem 
                  key={index}
                  faq={faq}
                  isOpen={openFaqIndex === index}
                  toggleOpen={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
                />
              ))}
            </div>

          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="py-8 border-t border-outline-variant bg-surface text-on-surface-variant text-body-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-neutral">
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>VidyaBarta Student Hub</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} VidyaBarta Platform. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default StudentPortalLanding;
