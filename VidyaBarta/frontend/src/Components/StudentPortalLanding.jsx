import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiShield, FiTrendingUp, FiChevronDown, FiChevronUp, FiBookOpen, FiBell, FiMenu, FiX } from 'react-icons/fi';

const FaqItem = ({ faq, isOpen, toggleOpen }) => (
  <div className="border border-outline-variant rounded-2xl bg-surface overflow-hidden mb-4 shadow-sm transition-all duration-300 hover:border-primary/30">
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
  <div className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
      <Icon size={28} />
    </div>
    <h3 className="text-title-lg font-bold font-headline text-neutral mb-3">{title}</h3>
    <p className="text-body-md text-on-surface-variant leading-relaxed">{description}</p>
  </div>
);

function StudentPortalLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      
      {/* --- Navigation Bar --- */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-outline-variant ${isScrolled ? 'bg-surface/95 backdrop-blur-md shadow-sm py-2' : 'bg-surface/80 backdrop-blur-sm py-3'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="VidyaBarta" className="h-8 md:h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
            <span className="font-bold text-neutral text-lg tracking-tight hidden sm:block">Student Hub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors">Features</a>
            <a href="#faq" className="text-body-md font-medium text-on-surface-variant hover:text-primary transition-colors">Support</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href="https://vidyabarta.com" className="text-body-md font-bold text-neutral hover:text-primary transition-colors">
              Main Site
            </a>
            <Link to="/login" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-body-md hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
              Login <FiArrowRight />
            </Link>
          </div>

          <button className="md:hidden text-neutral p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-surface shadow-xl border-t border-outline-variant py-4 px-6 flex flex-col gap-4 md:hidden"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-body-lg font-medium text-neutral py-2 border-b border-outline-variant">Features</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-body-lg font-medium text-neutral py-2 border-b border-outline-variant">Support</a>
              <a href="https://vidyabarta.com" onClick={() => setMobileMenuOpen(false)} className="text-body-lg font-medium text-neutral py-2 border-b border-outline-variant">Main Site</a>
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 bg-primary text-white rounded-xl font-bold">Login to Portal</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 pt-20">
        
        {/* --- Hero Section --- */}
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-background">
          <div className="absolute top-20 left-0 -ml-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 -mr-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Content */}
              <div className="max-w-2xl">
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
                  
                  <p className="text-title-md text-on-surface-variant mb-10 leading-relaxed max-w-xl">
                    Experience the next generation student dashboard. Access grades, download materials, and manage fees in a beautifully seamless environment.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-5 pt-2 w-full sm:w-auto">
                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-body-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                    >
                      Enter Dashboard
                      <FiArrowRight />
                    </Link>
                  </div>
                </motion.div>
              </div>

              {/* Right Visual Image */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="relative hidden lg:block"
              >
                <div className="relative z-10 mx-auto w-full max-w-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                    alt="Student using Portal" 
                    className="w-full h-auto object-cover rounded-2xl drop-shadow-2xl aspect-[4/3]"
                  />
                </div>
                {/* Floating elements */}
                <div className="absolute top-10 -left-10 z-20 bg-white/90 backdrop-blur-md border border-outline-variant p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                   <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                     <span className="material-symbols-outlined">task_alt</span>
                   </div>
                   <div>
                     <p className="text-body-sm font-bold text-neutral">Assignment Graded</p>
                     <p className="text-xs text-on-surface-variant">A+ in Mathematics</p>
                   </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section id="features" className="py-24 bg-surface-variant/30 border-y border-outline-variant relative">
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

        {/* --- Preview Section --- */}
        <section className="py-24 bg-background overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true, margin: "-100px" }}
                className="order-2 lg:order-1 relative"
              >
                 <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="rounded-3xl shadow-2xl w-full h-auto object-cover border border-outline-variant aspect-[4/3]" />
                 <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10"></div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="order-1 lg:order-2"
              >
                 <h2 className="text-headline-lg font-bold font-headline text-neutral mb-6 leading-tight">A beautifully crafted experience</h2>
                 <p className="text-body-lg text-on-surface-variant mb-8 leading-relaxed">The student portal has been completely redesigned with a focus on speed, clarity, and ease of use. Say goodbye to clunky interfaces.</p>
                 <ul className="space-y-6">
                   <li className="flex items-center gap-4 text-title-sm text-neutral">
                     <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined">speed</span>
                     </div>
                     Lightning fast navigation
                   </li>
                   <li className="flex items-center gap-4 text-title-sm text-neutral">
                     <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined">devices</span>
                     </div>
                     Optimized for all your devices
                   </li>
                 </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Support / FAQ Grid --- */}
        <section id="faq" className="py-24 bg-surface-variant/30 border-t border-outline-variant">
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
