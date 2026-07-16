import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function StudentPortalLanding() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      question: "How do I get my login credentials?",
      answer: "Your initial Student ID and password are provided by your class teacher or the school administration at the beginning of the academic year."
    },
    {
      question: "What if I forget my password?",
      answer: "If you forget your password, please contact your class teacher or the IT department. They can reset your password. Currently, self-service password reset is disabled for security reasons."
    },
    {
      question: "Can my parents log in to the portal?",
      answer: "Yes! Parents can use the same login credentials to access the portal and monitor your academic progress, attendance, and fee status."
    },
    {
      question: "How do I download my fee receipt?",
      answer: "Navigate to the 'Fees' section in your dashboard. You will see a list of all past transactions. Click on the download icon next to any successful payment to get the PDF receipt."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500 selection:text-white scroll-smooth">
      <main className="relative">
        {/* 1. Hero Section */}
        <section className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden bg-[#0F172A]">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/login-bg.png"
              alt="University Campus"
              className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            />
            {/* Elegant deep blue gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-[#1E3A8A]/90 to-[#3B82F6]/40"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full pt-20 pb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
                <span className="material-symbols-outlined text-sm text-blue-200 drop-shadow-md">
                  public
                </span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-100 drop-shadow-md">
                  Central Student Hub
                </span>
              </div>
              
              <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                Your entire{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-md italic">
                  Academic Life
                </span>{" "}
                in one place.
              </h2>
              
              <p className="text-blue-100/80 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
                Welcome to the unified student portal. Access your grades, download assignments, pay fees, and stay updated with live announcements from your institution.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/login"
                  className="bg-white text-blue-900 font-bold px-8 py-4 rounded-2xl flex items-center gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 group"
                >
                  Login to Portal
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    login
                  </span>
                </Link>
                <a
                  href="https://www.vidyabarta.com"
                  className="bg-white/5 backdrop-blur-xl text-white border border-white/20 shadow-lg font-bold px-8 py-4 rounded-2xl hover:bg-white/10 hover:border-white/40 transition-all duration-300"
                >
                  Visit Main Website
                </a>
              </div>
            </motion.div>

            {/* Floating Hero Feature Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="hidden lg:grid grid-cols-1 gap-6 justify-items-end relative"
            >
              {/* Decorative elements */}
              <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl w-80 shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                  <span className="material-symbols-outlined text-amber-900 text-2xl">analytics</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
                <p className="text-blue-100/70 text-sm leading-relaxed">View real-time updates on your academic performance and daily attendance.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl w-80 shadow-2xl transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300 mr-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                  <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Manage Dues</h3>
                <p className="text-blue-100/70 text-sm leading-relaxed">Download fee receipts and clear pending dues instantly online, securely.</p>
              </div>
            </motion.div>
          </div>

          {/* Scroll Down Indicator */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
          >
            <span className="text-xs font-bold tracking-widest uppercase">Explore More</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
          </motion.div>
        </section>

        {/* 2. Features Grid Section */}
        <section className="py-24 md:py-32 bg-white relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230f172a\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything you need to <span className="text-blue-600">succeed.</span></h2>
              <p className="text-lg text-slate-600">The portal equips you with powerful tools to stay organized, connected, and ahead in your studies.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 group">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-blue-600">school</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Academic Records</h3>
                <p className="text-slate-600 leading-relaxed">Access your marksheets, subject-wise performance analysis, and complete academic history instantly.</p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.1 }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-300 group">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-indigo-600">event_available</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Attendance Tracking</h3>
                <p className="text-slate-600 leading-relaxed">Keep a close eye on your daily attendance, leaves taken, and ensure you meet the required criteria.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.2 }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-300 group">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-emerald-600">payments</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Online Fee Payment</h3>
                <p className="text-slate-600 leading-relaxed">Pay your tuition and other fees securely online. Instantly download receipts without standing in queues.</p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.3 }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-amber-900/5 transition-all duration-300 group">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-amber-600">menu_book</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Study Materials</h3>
                <p className="text-slate-600 leading-relaxed">Download assignments, class notes, syllabus copies, and reference materials uploaded by your teachers.</p>
              </motion.div>

              {/* Feature 5 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.4 }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-rose-900/5 transition-all duration-300 group">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-rose-600">campaign</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Notice Board</h3>
                <p className="text-slate-600 leading-relaxed">Never miss an important announcement. Get instant push notifications for holidays and events.</p>
              </motion.div>

              {/* Feature 6 */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.5 }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-cyan-900/5 transition-all duration-300 group">
                <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl text-cyan-600">calendar_month</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Exam Schedules</h3>
                <p className="text-slate-600 leading-relaxed">Keep track of upcoming examinations, class tests, and practicals with an integrated academic calendar.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. How It Works (Steps) */}
        <section className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Get started in <span className="text-amber-400">minutes.</span></h2>
              <p className="text-slate-300 text-lg">Your portal is already set up by your school. All you need to do is log in and explore.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="w-20 h-20 mx-auto bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-blue-400">1</div>
                <h3 className="text-2xl font-bold mb-4">Receive Credentials</h3>
                <p className="text-slate-400 leading-relaxed">Get your unique Student ID and temporary password directly from your class teacher or school administration.</p>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <div className="w-20 h-20 mx-auto bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-amber-400">2</div>
                <h3 className="text-2xl font-bold mb-4">Secure Login</h3>
                <p className="text-slate-400 leading-relaxed">Log in via the portal. You will be prompted to change your password on your first successful login for security.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                <div className="w-20 h-20 mx-auto bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-emerald-400">3</div>
                <h3 className="text-2xl font-bold mb-4">Explore Dashboard</h3>
                <p className="text-slate-400 leading-relaxed">That's it! You now have full access to your personalized dashboard, records, and school updates.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-24 md:py-32 bg-[#0F172A] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-blue-500/5"></div>
          
          <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Frequently Asked <span className="text-amber-400">Questions</span>
              </h2>
              <p className="text-blue-100/70 text-lg">Common questions about accessing and using the student portal.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'bg-white/10 shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                  >
                    <span className="font-bold text-white text-lg pr-8">{faq.question}</span>
                    <span className={`material-symbols-outlined text-amber-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  
                  <motion.div 
                    initial={false}
                    animate={{ height: openFaq === index ? 'auto' : 0, opacity: openFaq === index ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-blue-100/80 leading-relaxed border-t border-white/10 pt-4 mt-2">
                      {faq.answer}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Security & Support Banner */}
        <section className="py-16 bg-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-4xl text-white">lock</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Your Data is Secure</h3>
                <p className="text-blue-100">End-to-end encryption ensures your academic records remain strictly confidential.</p>
              </div>
            </div>
            <div className="shrink-0 text-center md:text-right">
              <p className="text-blue-100 text-sm mb-2 font-medium uppercase tracking-wider">Trouble Logging In?</p>
              <p className="text-white font-bold">Contact your Class Teacher</p>
            </div>
          </div>
        </section>

        {/* 5. Footer */}
        <footer className="bg-slate-950 py-12 text-slate-400">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500">school</span>
              <span className="text-xl font-bold text-white tracking-tight">Student Portal</span>
            </div>
            
            <div className="text-sm">
              &copy; {new Date().getFullYear()} Powered by <a href="https://www.vidyabarta.com" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">VidyaBarta</a>. All rights reserved.
            </div>
            
            <div className="flex gap-6 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default StudentPortalLanding;
