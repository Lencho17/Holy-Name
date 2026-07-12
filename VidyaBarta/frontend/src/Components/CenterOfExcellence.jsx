import React, { useContext, useEffect, useRef } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';
import { motion, useInView } from 'framer-motion';

const CenterOfExcellence = () => {
  const { schoolProfile } = useContext(SiteDataContext);
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true, margin: "-100px" });

  // Number counting animation component
  const AnimatedStat = ({ end, suffix = "", duration = 2 }) => {
    const [count, setCount] = React.useState(0);
    
    useEffect(() => {
      if (isInView) {
        let startTime;
        let animationFrame;
        
        const updateCount = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = (timestamp - startTime) / (duration * 1000);
          
          if (progress < 1) {
            setCount(Math.floor(end * progress));
            animationFrame = requestAnimationFrame(updateCount);
          } else {
            setCount(end);
          }
        };
        
        animationFrame = requestAnimationFrame(updateCount);
        return () => cancelAnimationFrame(animationFrame);
      }
    }, [isInView, end, duration]);
    
    return <>{count}{suffix}</>;
  };

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-section-padding overflow-hidden">
          <div className="max-w-container-max mx-auto px-gutter relative z-10">
            <div className="max-w-3xl">
              <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-full font-label-md text-label-md mb-6 uppercase tracking-wider">
                The Standard of Quality
              </span>
              <h1 className="font-display text-display mb-6">Redefining Educational Excellence Through Rigorous Standards</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 leading-relaxed">
                At {schoolProfile?.name || 'Excellence Academy'}, quality isn't just a goal—it's our foundation. Our Excellence Framework ensures that every student, teacher, and academic partner experiences the highest levels of institutional integrity and success.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="font-label-md text-label-md">ISO 9001:2015 Certified</span>
                </div>
                <div className="flex items-center space-x-2 border-l border-outline-variant pl-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label-md text-label-md">Top 1% National Ranking</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Excellence Framework Bento Grid */}
        <section className="py-section-padding bg-surface-container-low">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg mb-4">The Excellence Framework</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                A data-driven methodology governing our curriculum, faculty development, and student success metrics.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Framework Core */}
              <div className="md:col-span-8 bg-surface-container-lowest p-10 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-6">schema</span>
                  <h3 className="font-headline-md text-headline-md mb-4">Core Academic Integrity</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6">Our framework utilizes 120+ unique data points to monitor student progress and curriculum effectiveness in real-time. This ensures that academic standards are not just met, but continuously improved upon through iterative feedback loops.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant">
                  <div>
                    <div className="font-display text-headline-lg text-primary">98%</div>
                    <div className="font-label-sm text-label-sm text-secondary">Course Alignment</div>
                  </div>
                  <div>
                    <div className="font-display text-headline-lg text-primary">4.9/5</div>
                    <div className="font-label-sm text-label-sm text-secondary">Faculty Rating</div>
                  </div>
                  <div>
                    <div className="font-display text-headline-lg text-primary">0%</div>
                    <div className="font-label-sm text-label-sm text-secondary">Gap Tolerance</div>
                  </div>
                  <div>
                    <div className="font-display text-headline-lg text-primary">12+</div>
                    <div className="font-label-sm text-label-sm text-secondary">Global Accreditations</div>
                  </div>
                </div>
              </div>
              
              {/* Innovation Pillar */}
              <div className="md:col-span-4 bg-primary text-on-primary p-10 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-4xl mb-6">lightbulb</span>
                  <h3 className="font-headline-md text-headline-md mb-4">Adaptive Learning</h3>
                  <p className="font-body-md text-body-md opacity-90 mb-6">Tailoring the educational journey to individual student performance benchmarks through AI-driven insights.</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-2 rounded-lg transition-all w-fit">
                  Explore Metrics
                </button>
              </div>
              
              {/* Faculty Excellence */}
              <div className="md:col-span-4 bg-surface-container-highest p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-primary text-3xl mb-4">groups</span>
                <h4 className="font-label-md text-label-md font-bold mb-2">Faculty Development</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Continuous professional development programs mandatory for all teaching staff to ensure global teaching standards.</p>
              </div>
              
              {/* Digital Quality */}
              <div className="md:col-span-4 bg-surface-container-highest p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-primary text-3xl mb-4">laptop_mac</span>
                <h4 className="font-label-md text-label-md font-bold mb-2">Digital Integration</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Seamless integration of modern learning management systems and digital resources to facilitate 24/7 learning accessibility.</p>
              </div>
              
              {/* Ethics Pillar */}
              <div className="md:col-span-4 bg-surface-container-highest p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-primary text-3xl mb-4">gavel</span>
                <h4 className="font-label-md text-label-md font-bold mb-2">Institutional Ethics</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Upholding the highest standards of transparency and fairness in all administrative and academic operations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Awards & Certifications Showcase */}
        <section className="py-section-padding">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div className="max-w-xl">
                <h2 className="font-headline-lg text-headline-lg mb-4">Validated Excellence</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Our commitment to quality is recognized by leading international and national accreditation bodies.</p>
              </div>
              <div className="flex gap-4">
                <button className="p-3 rounded-full border border-outline-variant hover:bg-surface-variant transition-all">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button className="p-3 rounded-full border border-outline-variant bg-primary text-on-primary hover:bg-primary-container transition-all">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* ISO Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                className="bg-white p-8 rounded-xl border border-outline-variant flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-5xl">verified_user</span>
                </div>
                <h5 className="font-headline-md text-[18px] mb-2">ISO 9001:2015</h5>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Quality Management Systems Standard Accreditation</p>
              </motion.div>
              
              {/* MOE Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="bg-white p-8 rounded-xl border border-outline-variant flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-5xl">account_balance</span>
                </div>
                <h5 className="font-headline-md text-[18px] mb-2">MOE Gold Star</h5>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Ministry of Education Highest Quality Distinction</p>
              </motion.div>
              
              {/* Academic Partner */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="bg-white p-8 rounded-xl border border-outline-variant flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-5xl">workspace_premium</span>
                </div>
                <h5 className="font-headline-md text-[18px] mb-2">EduTrust Certified</h5>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Premier International Education Quality Framework</p>
              </motion.div>
              
              {/* Innovation Award */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="bg-white p-8 rounded-xl border border-outline-variant flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-5xl">trophy</span>
                </div>
                <h5 className="font-headline-md text-[18px] mb-2">Global Innovation</h5>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Excellence in Digital Learning Integration 2023</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-section-padding bg-surface-container-low relative overflow-hidden">
          <div className="max-w-container-max mx-auto px-gutter relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg mb-4">Voices of Partnership</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Hear from the academic leaders and institutional partners who collaborate with us.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-10 rounded-2xl flex flex-col md:flex-row gap-8 items-start shadow-sm hover:shadow-md transition-all">
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-primary shadow-md">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6QEcV4RM7IVf7vS_iwGOp8KXDCCSjg9GqGKxCFyBJoaLayupAU8Uwq37kKz-Y25pHpYGtlM1o0tEO2V0xDGI2RdeIW-vkvBo0yYt51JTcfdJAYpO14NlNUx54s3NuY96RMSdh3XTOMtAu0TyqH8QDgqCWQA3wjTd0imHwuVnJd5MabMzO4HwqBGfDC1BT0aggA_LQHL38ZmiEfXGGKIr-i5xbVzRd3PudBLY6w4KJo6K9DeNSw99MDHNVtacqWWzNSy4Ld0kJe-Y" alt="Dr. Alistair Vaughn" />
                </div>
                <div>
                  <div className="flex text-primary mb-4">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <p className="font-body-md text-body-md italic mb-6">"Excellence Academy has consistently demonstrated a commitment to academic rigor that is rare in today's landscape. Their Framework is a benchmark for quality."</p>
                  <div>
                    <div className="font-label-md text-label-md font-bold">Dr. Alistair Vaughn</div>
                    <div className="font-label-sm text-label-sm text-secondary">Dean of Academic Affairs, Global University Network</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 p-10 rounded-2xl flex flex-col md:flex-row gap-8 items-start shadow-sm hover:shadow-md transition-all">
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-primary shadow-md">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUn1ktiqMYNvUUNLJ1UUlns1TFB6FoAtH9mrjkJNOJE_QNcudxVa1yk1DVmTIuxMeToYE2yP8XkjtBx80OUjyhW_2RydCrQNJPpRmDK_jw31Eliy7cOuZ-n3c9lkZME9NkODhlyCUzD9pIBbDNjPh-CmWxqumz5WLl__qXKHbc5w54lroG_LgLwQIda6NCwinYbYiGEOLC5UQFDJbvlxjfMxqs3qLo4EKG4LJyU_kaEYCUdvlMmlchBO8qOUSpvkh3LYLZs2mqnX0" alt="Prof. Elena Martinez" />
                </div>
                <div>
                  <div className="flex text-primary mb-4">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <p className="font-body-md text-body-md italic mb-6">"Their dedication to transparency and quality control makes them our preferred regional partner for curriculum development and teacher training."</p>
                  <div>
                    <div className="font-label-md text-label-md font-bold">Prof. Elena Martinez</div>
                    <div className="font-label-sm text-label-sm text-secondary">Director, International Education Standards Institute</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Statistics Row */}
        <section ref={statsRef} className="py-20 bg-primary text-on-primary">
          <div className="max-w-container-max mx-auto px-gutter grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
              <div className="font-display text-[48px] font-extrabold"><AnimatedStat end={95} suffix="%" /></div>
              <div className="font-label-md text-label-md uppercase tracking-widest opacity-80">Graduate Placement</div>
            </div>
            <div className="space-y-2">
              <div className="font-display text-[48px] font-extrabold"><AnimatedStat end={1500} suffix="+" /></div>
              <div className="font-label-md text-label-md uppercase tracking-widest opacity-80">Research Citations</div>
            </div>
            <div className="space-y-2">
              <div className="font-display text-[48px] font-extrabold"><AnimatedStat end={99} suffix="%" /></div>
              <div className="font-label-md text-label-md uppercase tracking-widest opacity-80">Student Satisfaction</div>
            </div>
            <div className="space-y-2">
              <div className="font-display text-[48px] font-extrabold"><AnimatedStat end={450} suffix="" /></div>
              <div className="font-label-md text-label-md uppercase tracking-widest opacity-80">Annual Scholarships</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-section-padding bg-surface">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="bg-surface-container-highest rounded-2xl p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
              <div className="relative z-10 max-w-2xl">
                <h2 className="font-display text-headline-lg mb-6 text-on-surface">Experience Excellence Firsthand</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-10 leading-relaxed">
                  Join an institution that values quality above all else. Our admission specialists are ready to guide you through our standard-setting educational journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-primary text-on-primary px-8 py-4 rounded-lg font-bold hover:bg-primary-container shadow-lg transition-all">Download Excellence Report</button>
                  <button className="bg-white text-primary border border-primary px-8 py-4 rounded-lg font-bold hover:bg-surface-container-low transition-all">Apply for Admission</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CenterOfExcellence;
