import React from 'react';
import { FiArrowRight, FiShield, FiMonitor, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
      <Icon size={28} />
    </div>
    <h3 className="text-title-lg font-bold font-headline text-neutral mb-3">{title}</h3>
    <p className="text-body-md text-on-surface-variant leading-relaxed">{description}</p>
  </div>
);

const DashboardMockup = () => (
  <div className="w-full max-w-5xl mx-auto rounded-t-2xl shadow-2xl border-x border-t border-outline-variant/50 bg-background overflow-hidden flex h-[450px] text-left">
    {/* Sidebar */}
    <div className="w-56 bg-surface border-r border-outline-variant flex flex-col z-10 shrink-0">
      <div className="p-5 border-b border-outline-variant flex items-center justify-start pl-6">
        <img src="/logo.png" alt="VidyaBarta" className="h-8 w-auto object-contain" />
      </div>
      <div className="p-4 space-y-2 flex-1">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-xl font-medium text-body-sm">
          <FiMonitor size={16} /> Dashboard
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors rounded-xl font-medium text-body-sm">
          <FiShield size={16} /> Schools
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors rounded-xl font-medium text-body-sm">
          <FiTrendingUp size={16} /> Analytics
        </div>
      </div>
      <div className="p-4 border-t border-outline-variant">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs ml-4">
              SA
            </div>
            <div>
              <p className="text-label-md font-bold text-neutral leading-none">System Admin</p>
              <p className="text-[10px] text-on-surface-variant">admin@vidyabarta.com</p>
            </div>
        </div>
      </div>
    </div>
    
    {/* Main Content */}
    <div className="flex-1 flex flex-col min-w-0 bg-surface-variant/20">
      {/* Header */}
      <div className="h-16 bg-surface/50 backdrop-blur-sm border-b border-outline-variant flex items-center justify-between px-8">
        <h2 className="text-title-md font-bold text-neutral">Platform Overview</h2>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center text-on-surface-variant">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div className="px-3 py-1.5 bg-primary text-white rounded-lg text-label-sm font-bold shadow-sm">Export Report</div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="p-8 overflow-hidden flex-1 flex flex-col">
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Total Schools', value: '142', trend: '+12%', color: 'text-primary' },
            { label: 'Active Students', value: '45,291', trend: '+5.4%', color: 'text-neutral' },
            { label: 'Monthly Revenue', value: '₹12.4L', trend: '+8.1%', color: 'text-neutral' }
          ].map((stat, i) => (
            <div key={i} className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <p className="text-label-md font-medium text-on-surface-variant">{stat.label}</p>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{stat.trend}</span>
              </div>
              <p className={`text-display-sm font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Chart Area */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-title-md font-bold text-neutral">Growth Trends</h4>
              <p className="text-label-sm text-on-surface-variant mt-1">Student enrollment across all institutions</p>
            </div>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-primary mt-1.5"></span>
              <span className="text-label-sm font-medium text-neutral">2023-2024</span>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full drop-shadow-sm" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1A43BF" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1A43BF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,40 L0,25 Q10,18 20,28 T40,12 T60,22 T80,8 T100,18 L100,40 Z" fill="url(#chartGradient)" />
              <path d="M0,25 Q10,18 20,28 T40,12 T60,22 T80,8 T100,18" fill="none" stroke="#1A43BF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-dashed border-neutral w-full"></div>
              <div className="border-t border-dashed border-neutral w-full"></div>
              <div className="border-t border-dashed border-neutral w-full"></div>
              <div className="border-t border-neutral w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-background">
        {/* Abstract Glowing Orbs for depth */}
        <div className="absolute top-20 left-0 -ml-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 -mr-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-label-sm font-semibold uppercase tracking-wider">VidyaBarta - School Management Software</span>
              </div>
              
              <h1 className="text-display-sm md:text-display-md lg:text-display-lg font-bold font-headline text-neutral mb-6 leading-tight tracking-tight animate-slideUp" style={{ animationDelay: '100ms' }}>
                The Smart Operating System For <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Modern Schools</span>
              </h1>
              
              <p className="text-title-md text-on-surface-variant mb-10 leading-relaxed animate-slideUp" style={{ animationDelay: '200ms' }}>
                Ditch the paperwork and outdated software. VidyaBarta brings attendance, academics, and administration into one incredibly fast, intuitive platform.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 animate-slideUp" style={{ animationDelay: '300ms' }}>
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-body-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                > 
                  Register Your School
                  <FiArrowRight />
                </Link>
              </div>
            </div>

            {/* Right Visual Composition */}
            <div className="relative animate-slideUp mt-12 lg:mt-0" style={{ animationDelay: '400ms' }}>
              {/* The Student Image */}
              <div className="relative z-10 mx-auto w-full max-w-lg">
                <img 
                  src="/hero_student.png" 
                  alt="Student using VidyaBarta" 
                  className="w-full h-auto object-contain mix-blend-multiply drop-shadow-2xl"
                />
              </div>

              {/* Floating Card 1: Robust Features */}
              <div className="absolute top-12 -right-4 lg:-right-12 z-20 bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-xl max-w-[220px] hover:-translate-y-2 transition-transform duration-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FiShield size={20} />
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-neutral leading-tight mb-1">Opt for Vidyabarta</p>
                    <p className="text-xs text-on-surface-variant leading-tight">For robust features and enhanced experience.</p>
                  </div>
                </div>
              </div>

              {/* Floating Card 2: Trophy / School Management */}
              <div className="absolute bottom-16 -left-4 lg:-left-8 z-20 bg-white/90 backdrop-blur-md border border-white/50 p-5 rounded-3xl shadow-2xl flex flex-col items-center hover:-translate-y-2 transition-transform duration-500">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center mb-3 shadow-inner">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-label-lg font-bold text-neutral text-center leading-tight">School<br/>Management<br/>System</p>
              </div>

              {/* Decorative Abstract Vectors */}
              <div className="absolute top-0 right-10 text-primary opacity-30 z-0 animate-pulse">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 35L35 5M35 5H15M35 5V25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="absolute bottom-10 right-0 text-secondary opacity-30 z-0">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50L25 25L40 40L55 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mockup / Dashboard Preview Section */}
      <section className="py-24 bg-surface-variant/30 overflow-hidden relative border-t border-outline-variant">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 text-center mb-16"
        >
          <h2 className="text-headline-lg font-bold font-headline mb-4 text-neutral">Experience The Dashboard</h2>
          <p className="text-title-md text-on-surface-variant max-w-2xl mx-auto">Get a glimpse of the powerful interface that administrators use daily.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          className="px-6"
        >
          <DashboardMockup />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface-variant/30 border-t border-outline-variant">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6"
        >
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-headline-lg font-bold font-headline text-neutral mb-4">Why Choose VidyaBarta?</h2>
            <p className="text-body-lg text-on-surface-variant">Designed specifically for modern educational needs with a focus on simplicity and powerful features.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={FiMonitor}
              title="Intuitive Interface"
              description="A beautifully crafted, clutter-free dashboard that requires zero training. Get started instantly."
            />
            <FeatureCard 
              icon={FiShield}
              title="Enterprise Security"
              description="Bank-grade encryption for all your student data, financial records, and institutional communications."
            />
            <FeatureCard 
              icon={FiTrendingUp}
              title="Actionable Insights"
              description="Deep analytics and reporting to help administrators make data-driven decisions."
            />
          </div>
        </motion.div>
      </section>

      {/* Image & Text Section */}
      <section className="py-24 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
              className="order-2 lg:order-1 relative"
            >
               <img src="/modern_classroom.png" alt="Modern Classroom" className="rounded-3xl shadow-2xl w-full h-auto object-cover aspect-video lg:aspect-square" />
               <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10"></div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="order-1 lg:order-2"
            >
               <h2 className="text-headline-lg font-bold font-headline text-neutral mb-6 leading-tight">Empowering Education with Technology</h2>
               <p className="text-body-lg text-on-surface-variant mb-8 leading-relaxed">Our platform bridges the gap between administrators, teachers, and students. By automating administrative tasks, we give educators more time to focus on what truly matters: student success.</p>
               <ul className="space-y-6">
                 <li className="flex items-center gap-4 text-title-sm text-neutral">
                   <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0">
                     <FiShield size={20} />
                   </div>
                   Secure and reliable infrastructure
                 </li>
                 <li className="flex items-center gap-4 text-title-sm text-neutral">
                   <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                     <FiMonitor size={20} />
                   </div>
                   Accessible from any device
                 </li>
                 <li className="flex items-center gap-4 text-title-sm text-neutral">
                   <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center shrink-0">
                     <FiTrendingUp size={20} />
                   </div>
                   Continuous updates and improvements
                 </li>
               </ul>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-surface-variant/30 border-t border-outline-variant">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 text-center"
        >
          <h2 className="text-headline-lg font-bold font-headline text-neutral mb-4">Simple, Transparent Pricing</h2>
          <p className="text-title-md text-on-surface-variant max-w-2xl mx-auto mb-16">Choose the perfect plan for your institution's size and needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Basic Plan */}
            <div className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-title-lg font-bold text-neutral mb-2">Starter</h3>
              <p className="text-body-sm text-on-surface-variant mb-6">Perfect for small schools getting started.</p>
              <p className="text-display-sm font-bold text-neutral mb-6">₹1,999<span className="text-title-sm font-normal text-on-surface-variant">/mo</span></p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-body-md text-neutral"><FiShield className="text-primary" /> Up to 500 Students</li>
                <li className="flex items-center gap-3 text-body-md text-neutral"><FiMonitor className="text-primary" /> Core Management Modules</li>
                <li className="flex items-center gap-3 text-body-md text-neutral"><FiTrendingUp className="text-primary" /> Basic Reporting</li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-colors">Start Free Trial</button>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-primary p-8 rounded-3xl shadow-xl border border-primary flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-label-sm font-bold uppercase tracking-wide">Most Popular</div>
              <h3 className="text-title-lg font-bold text-white mb-2">Professional</h3>
              <p className="text-body-sm text-white/80 mb-6">For growing institutions needing more power.</p>
              <p className="text-display-sm font-bold text-white mb-6">₹4,999<span className="text-title-sm font-normal text-white/80">/mo</span></p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-body-md text-white"><FiShield className="text-white" /> Up to 2,000 Students</li>
                <li className="flex items-center gap-3 text-body-md text-white"><FiMonitor className="text-white" /> All Core & Advanced Modules</li>
                <li className="flex items-center gap-3 text-body-md text-white"><FiTrendingUp className="text-white" /> Advanced Analytics</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-colors shadow-lg">Get Started</button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-title-lg font-bold text-neutral mb-2">Enterprise</h3>
              <p className="text-body-sm text-on-surface-variant mb-6">For large schools and university campuses.</p>
              <p className="text-display-sm font-bold text-neutral mb-6">Custom</p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-body-md text-neutral"><FiShield className="text-primary" /> Unlimited Students</li>
                <li className="flex items-center gap-3 text-body-md text-neutral"><FiMonitor className="text-primary" /> Custom Integrations</li>
                <li className="flex items-center gap-3 text-body-md text-neutral"><FiTrendingUp className="text-primary" /> Dedicated Support Agent</li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-outline text-neutral font-bold hover:bg-surface-variant transition-colors">Contact Sales</button>
            </div>
          </div>
        </motion.div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 text-center"
        >
          <h2 className="text-headline-lg font-bold font-headline mb-6">Ready to transform your school?</h2>
          <p className="text-title-md text-white/80 max-w-2xl mx-auto mb-12">Join hundreds of institutions already using VidyaBarta to streamline their operations.</p>
          <Link 
            to="/login"
            className="inline-flex px-8 py-4 bg-white text-primary rounded-xl font-bold text-body-lg hover:bg-white/90 transition-all shadow-xl hover:-translate-y-1"
          >
            Get Started Today
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
