import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const About = () => {
  const { visionStatement, aimsAndObjectives, headMistress, schoolProfile, aboutPage } = useContext(SiteDataContext);

  const headMistressPhoto = headMistress?.photo || aboutPage?.leadership?.headMistress?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuA3LxXJGhgPPWbwxySCUIkZYMPfwyaeuYfhzrT6SiCGDAKDOl4o3VX9U04AqCBd7na-Y9oDHT5ZbzFP2kFnLozscSsMyJVU_83u-bGubVN9GPekl8ZDGQ_kvGImKGJbOGw4oXrc9pbik8nPEVPy4XlLJMlWRiSSVDp_fyq-xHj-iFY0WrbnRrva_2dzn-19WqaCjTF2hoLrsdxROxsJTy7eQk-E-sb7PDyL98J3OdU8KnwgIEErhDj9gdD8_8GbofZKR8r5hNbfP2M";

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen">
      <main className="max-w-container-max mx-auto px-6 py-section-padding">
        {/* Hero Section / Title */}
        <div className="mb-16">
          <nav aria-label="Breadcrumb" className="flex mb-4 text-on-surface-variant font-label-sm gap-2">
            <a className="hover:text-primary" href="/">Home</a>
            <span className="material-symbols-outlined text-xs" data-icon="chevron_right">chevron_right</span>
            <span className="text-primary font-bold">About Us</span>
          </nav>
          <h1 className="font-display text-display text-on-surface mb-4">Shaping Futures Since {schoolProfile?.establishedYear || '1992'}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            {aboutPage?.shortDescription?.text || `Learn more about ${schoolProfile?.name || 'Excellence Academy'}'s journey, our commitment to educational integrity, and the leadership that drives our success.`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-24">
            {/* Mission & Vision */}
            <section className="scroll-mt-32" id="mission-vision">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8 border-l-4 border-primary pl-6">Our Mission & Vision</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-4xl text-primary mb-4" data-icon="rocket_launch">rocket_launch</span>
                  <h3 className="font-headline-md text-headline-md mb-4">Our Mission</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    {visionStatement || "To provide a holistic, inclusive, and challenging learning environment that empowers students to become lifelong learners, critical thinkers, and ethical global citizens."}
                  </p>
                </div>
                <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant">
                  <span className="material-symbols-outlined text-4xl text-primary mb-4" data-icon="visibility">visibility</span>
                  <h3 className="font-headline-md text-headline-md mb-4">Our Vision</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    {aimsAndObjectives?.[0] || "To be a beacon of academic excellence and character development, recognized globally for producing leaders who positively transform society through innovation and integrity."}
                  </p>
                </div>
              </div>
            </section>

            {/* Principal's Message */}
            <section className="scroll-mt-32" id="principal">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8 border-l-4 border-primary pl-6">Principal's Message</h2>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-full md:w-2/5 shrink-0 group">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg transition-transform duration-500 group-hover:scale-[1.02]">
                    <img className="w-full aspect-[3/4] object-cover" alt="Principal" src={headMistressPhoto} />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <p className="font-headline-md text-headline-md">{headMistress?.name || aboutPage?.leadership?.headMistress?.name || "Dr. Alistair Vance"}</p>
                      <p className="font-label-md opacity-90">Principal</p>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-3/5 space-y-6">
                  <span className="material-symbols-outlined text-6xl text-surface-variant select-none" data-icon="format_quote">format_quote</span>
                  <p className="font-body-lg text-body-lg text-on-surface-variant italic leading-relaxed -mt-10">
                    "{headMistress?.greeting || "Education is not merely the transmission of information; it is the ignition of curiosity and the cultivation of character."}"
                  </p>
                  <div className="font-body-md text-body-md text-on-surface-variant space-y-4 whitespace-pre-line">
                    {headMistress?.message || aboutPage?.leadership?.headMistress?.text || "Welcome to Excellence Academy. As you browse our website, you will discover a vibrant community dedicated to fostering academic rigor and creative exploration. Our curriculum is designed to push boundaries while remaining grounded in the timeless values of respect and responsibility.\n\nWe believe that every child possesses a unique spark. Our role as educators is to provide the oxygen of opportunity and the structural support needed for that spark to become a roaring fire of achievement. We invite you to join us on this journey of discovery."}
                  </div>
                  {headMistress?.signature && (
                    <div className="pt-4">
                      <p className="font-serif italic text-xl text-primary font-bold tracking-wider mb-1">
                        {headMistress.signature}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* History */}
            <section className="scroll-mt-32" id="history">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-8 border-l-4 border-primary pl-6">Our Legacy</h2>
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-outline-variant -translate-x-1/2 hidden md:block"></div>
                <div className="space-y-12">
                  {/* Entry 1 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2 md:text-right">
                      <h4 className="font-headline-md text-headline-md text-primary mb-2">1992</h4>
                      <h5 className="font-label-md text-label-md mb-2">The Foundation</h5>
                      <p className="text-on-surface-variant">{schoolProfile?.name || "Excellence Academy"} opened its doors with a vision to redefine education in the region.</p>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white z-10 shrink-0 shadow-sm border-4 border-background">
                      <span className="material-symbols-outlined text-sm" data-icon="history">history</span>
                    </div>
                    <div className="w-full md:w-1/2"></div>
                  </div>
                  {/* Entry 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                    <div className="w-full md:w-1/2 text-left">
                      <h4 className="font-headline-md text-headline-md text-primary mb-2">2005</h4>
                      <h5 className="font-label-md text-label-md mb-2">Campus Expansion</h5>
                      <p className="text-on-surface-variant">Inauguration of the Science & Technology Wing, bringing state-of-the-art laboratories and digital learning tools to all students.</p>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white z-10 shrink-0 shadow-sm border-4 border-background">
                      <span className="material-symbols-outlined text-sm" data-icon="apartment">apartment</span>
                    </div>
                    <div className="w-full md:w-1/2"></div>
                  </div>
                  {/* Entry 3 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2 md:text-right">
                      <h4 className="font-headline-md text-headline-md text-primary mb-2">2023</h4>
                      <h5 className="font-label-md text-label-md mb-2">Global Accreditation</h5>
                      <p className="text-on-surface-variant">Achieved the International Excellence Shield for innovative teaching methodologies and student well-being programs.</p>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white z-10 shrink-0 shadow-sm border-4 border-background">
                      <span className="material-symbols-outlined text-sm" data-icon="public">public</span>
                    </div>
                    <div className="w-full md:w-1/2"></div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Core Values Sidebar Widget */}
            <div className="glass-sidebar p-8 rounded-2xl shadow-sm sticky top-32 bg-white/70 backdrop-blur-md border border-slate-200">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-icon="star" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                Core Values
              </h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg" data-icon="balance">balance</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">Integrity</h4>
                    <p className="text-sm text-on-surface-variant mt-1">Consistency of actions, values, and methods.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg" data-icon="psychology">psychology</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">Innovation</h4>
                    <p className="text-sm text-on-surface-variant mt-1">Fostering creativity and forward-thinking.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg" data-icon="handshake">handshake</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">Collaboration</h4>
                    <p className="text-sm text-on-surface-variant mt-1">Working together toward shared excellence.</p>
                  </div>
                </li>
              </ul>
              <div className="mt-12 h-px bg-outline-variant"></div>
              <h3 className="font-headline-md text-headline-md text-on-surface my-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-icon="trophy" style={{fontVariationSettings: "'FILL' 1"}}>trophy</span>
                Achievements
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-label-md text-primary">100% Pass Rate</span>
                    <span className="text-xs font-bold text-on-surface-variant">2023</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Board Examination Results</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-label-md text-primary">State Sports Gold</span>
                    <span className="text-xs font-bold text-on-surface-variant">2024</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Inter-Academy Athletics Meet</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-label-md text-primary">Best Green Campus</span>
                    <span className="text-xs font-bold text-on-surface-variant">2022</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Eco-Sustainability Award</p>
                </div>
              </div>
              <div className="mt-10">
                <a href="/admission" className="w-full py-3 rounded-lg border-2 border-primary text-primary font-label-md hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                  Apply Now
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default About;
