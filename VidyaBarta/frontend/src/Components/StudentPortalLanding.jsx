import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

function StudentPortalLanding() {
  const [openFaq, setOpenFaq] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Parallax mouse effect for background orbs
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
    <div className="min-h-screen bg-[#030712] font-sans selection:bg-purple-500/30 selection:text-white scroll-smooth text-slate-300 overflow-hidden">
      
      {/* --- Global Background Effects --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Animated Orbs */}
        <motion.div 
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
          className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{
            x: mousePosition.x * -0.015,
            y: mousePosition.y * -0.015,
          }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.015] mix-blend-overlay"></div>
      </div>

      <main className="relative z-10">
        
        {/* --- Hero Section --- */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-10 max-w-5xl mx-auto flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/70">
                Portal v2.0 Live
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-[1.1] tracking-tight">
              Your academic life, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300">
                unified and clear.
              </span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              Experience the next generation student dashboard. Access grades, download materials, and manage fees in a beautifully seamless environment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 pt-6 w-full sm:w-auto">
              <Link
                to="/login"
                className="group relative px-8 py-4 bg-white text-black font-semibold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                <div className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors duration-300">
                  Enter Dashboard
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
              <a
                href="https://www.vidyabarta.com"
                className="px-8 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-white font-semibold rounded-2xl hover:bg-white/[0.08] transition-all"
              >
                School Website
              </a>
            </div>
          </motion.div>

          {/* Hero Dashboard Preview Mockup (Floating) */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="mt-24 relative w-full max-w-6xl mx-auto perspective-1000"
          >
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] aspect-video flex items-center justify-center transform rotateX-[5deg] hover:rotateX-[0deg] transition-transform duration-700">
               {/* Abstract Mockup inside */}
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-50"></div>
               <div className="text-center space-y-4 relative z-10">
                  <span className="material-symbols-outlined text-6xl text-white/20">dashboard</span>
                  <p className="text-white/30 font-medium tracking-widest uppercase text-sm">Dashboard Interface Preview</p>
               </div>
            </div>
          </motion.div>

        </section>

        {/* --- Features Bento Box --- */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Everything you need. <br/><span className="text-slate-500">Nothing you don't.</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[280px]">
              
              {/* Box 1 (Large Span) */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] p-8 flex flex-col justify-between hover:bg-white/[0.04] transition-colors group overflow-hidden relative">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-purple-500/20 blur-[80px] -z-10 group-hover:bg-purple-500/30 transition-colors"></div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
                    <span className="material-symbols-outlined text-purple-300">analytics</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Academic Performance</h3>
                  <p className="text-slate-400 text-lg max-w-md">Deep dive into your grades with visual charts, historical data, and predictive analytics.</p>
                </div>
              </motion.div>

              {/* Box 2 (Tall Span) */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="md:row-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] p-8 flex flex-col justify-between hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-blue-500/10 blur-[80px] -z-10 group-hover:bg-blue-500/20 transition-colors"></div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                    <span className="material-symbols-outlined text-blue-300">receipt_long</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Seamless Fee Payments</h3>
                  <p className="text-slate-400 text-lg">Pay tuition instantly via integrated payment gateways. Download highly detailed PDF receipts with a single click, completely eliminating queues.</p>
                </div>
                {/* Visual abstract for tall box */}
                <div className="mt-8 bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between text-sm text-white/50 mb-2"><span>Term 1</span><span>Paid</span></div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className="w-full h-full bg-green-400"></div></div>
                </div>
              </motion.div>

              {/* Box 3 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] p-8 hover:bg-white/[0.04] transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 border border-cyan-500/30">
                  <span className="material-symbols-outlined text-cyan-300">menu_book</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Study Materials</h3>
                <p className="text-slate-400">Access class notes and assignments organized by subject.</p>
              </motion.div>

              {/* Box 4 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] p-8 hover:bg-white/[0.04] transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
                  <span className="material-symbols-outlined text-emerald-300">campaign</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Live Updates</h3>
                <p className="text-slate-400">Instant push notifications for crucial school announcements.</p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- Support / FAQ Grid --- */}
        <section className="py-24 relative border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left: Support CTA */}
            <div>
              <h2 className="text-4xl font-black text-white mb-6">Need assistance?</h2>
              <p className="text-slate-400 text-lg mb-10">We're here to help you navigate the portal and resolve any technical issues you might face.</p>
              
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white">support_agent</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl mb-1">Contact IT Admin</h4>
                  <p className="text-slate-400 text-sm mb-4">Available during school hours for account recovery and technical support.</p>
                  <button className="text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors">Open Support Ticket &rarr;</button>
                </div>
              </div>
            </div>

            {/* Right: FAQs */}
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'bg-white/[0.05] border-white/20' : 'bg-transparent border-white/[0.05] hover:border-white/10'}`}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                  >
                    <span className="font-bold text-white text-lg pr-8">{faq.question}</span>
                    <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-white' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  
                  <motion.div 
                    initial={false}
                    animate={{ height: openFaq === index ? 'auto' : 0, opacity: openFaq === index ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-slate-400 leading-relaxed pt-2">
                      {faq.answer}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="py-8 border-t border-white/[0.05] text-slate-500 text-sm">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">school</span>
              <span className="font-bold text-slate-300">Vidyabarta Student Hub</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} Vidyabarta Platform. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default StudentPortalLanding;
