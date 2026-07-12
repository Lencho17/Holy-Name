import os

jsx_content = """import React, { useState, useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Gallery = () => {
  const { gallery: galleryItems } = useContext(SiteDataContext);
  const [activeCategory, setActiveCategory] = useState('all');

  // Helper to determine tailwind classes based on index to create a bento-grid feel
  const getBentoClasses = (index) => {
    const pattern = index % 8;
    // We want a mix of aspect ratios and col-spans to match the template
    if (pattern === 0) return 'aspect-[4/5] lg:col-span-1'; // Academic Item 1 style
    if (pattern === 1) return 'aspect-square lg:col-span-2'; // Infrastructure Item 1 style
    if (pattern === 2) return 'aspect-square lg:col-span-1'; // Sports Item 1 style
    if (pattern === 3) return 'aspect-square lg:col-span-1'; // Cultural Item 1 style
    if (pattern === 4) return 'aspect-square lg:col-span-1'; // Infrastructure Item 2 style
    if (pattern === 5) return 'aspect-video lg:col-span-2'; // Academic Item 2 style
    if (pattern === 6) return 'aspect-square lg:col-span-1'; // Cultural Item 2 style
    if (pattern === 7) return 'aspect-[4/5] lg:col-span-1'; // Sports Item 2 style
    return 'aspect-square lg:col-span-1';
  };

  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'infrastructure', label: 'Campus Infrastructure' },
    { id: 'sports', label: 'Sports Events' },
    { id: 'cultural', label: 'Cultural Fest' },
    { id: 'academic', label: 'Classroom Activities' }
  ];

  const handleFilter = (categoryId) => {
    setActiveCategory(categoryId);
  };

  // Convert generic backend categories to template categories if needed
  const mapCategory = (cat) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('campus') || lower.includes('infrastructure')) return 'infrastructure';
    if (lower.includes('sport')) return 'sports';
    if (lower.includes('cultur') || lower.includes('event')) return 'cultural';
    if (lower.includes('academic') || lower.includes('class')) return 'academic';
    return 'academic'; // default fallback
  };

  const filteredItems = (galleryItems || []).filter(item => {
    if (activeCategory === 'all') return true;
    return mapCategory(item.category) === activeCategory;
  });

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen">
      <main className="pt-20 pb-section-padding">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-gutter mb-12 text-center pt-12">
          <h1 className="font-display text-display mb-4">Capturing Excellence</h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">Explore our vibrant campus life, academic achievements, and the diverse activities that define the Excellence Academy experience.</p>
        </section>

        {/* Filter Bar */}
        <section className="max-w-container-max mx-auto px-gutter mb-10 overflow-x-auto">
          <div className="flex items-center justify-start md:justify-center space-x-3 pb-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleFilter(cat.id)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full border font-label-md transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white border-primary' 
                    : 'border-outline-variant text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Gallery Grid (Bento Style) */}
        <section className="max-w-container-max mx-auto px-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const bentoClasses = getBentoClasses(index);
                const itemCat = mapCategory(item.category);
                return (
                  <div key={item._id || index} className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer ${bentoClasses}`}>
                    <img 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={item.title || item.caption || 'Gallery Image'} 
                      src={item.image || item.url}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                      <span className="text-white/80 font-label-sm text-label-sm mb-1 capitalize">{item.category || itemCat}</span>
                      <h3 className="text-white font-headline-md text-headline-md leading-tight">{item.title || item.caption || 'Gallery Image'}</h3>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback static content from template */
              <>
                {/* Academic Item 1 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-[4/5] lg:col-span-1 ${activeCategory !== 'all' && activeCategory !== 'academic' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Advanced Science Lab Session" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF2otJxMBYpQ0-tLPnzYuCIyRAsXFd0LRmLjgDRzSLz-sDRpn9TlZeTAcQwB3G7Q2SdJxmHfTW3oNJbelYLTEdlAk5UvEid8hLoSzovhEqQYE_0jezMTe7pqeNGKrOtbSXZTYLGaHNxtnigBlnWJnR5UWI0c5gLVS869pSflV8qqT043I4HNKCqbNXRl6JVg0Ge44krXBOLtlaWuB1v-ZNuMh5YvOcUTFjW4-HuUk70tR5_6AylJrmkzCZSENr66OviEnHzw3O7cw"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Classroom Activities</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Advanced Science Lab Session</h3>
                  </div>
                </div>
                
                {/* Infrastructure Item 1 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-square lg:col-span-2 ${activeCategory !== 'all' && activeCategory !== 'infrastructure' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="The Central Knowledge Hub" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOW-QlcOtFNt2YBphXWT1ojD2u1VrdD0Uk-UHKmA5YlYwOR4PPSF3aQbeus-GRm0prpDd32MkKcPaTqTYAOeeq5bir4lNf0UXoZAeTtoRCvzPoRnropxIfxXFa_KdouJLvdOfFCwKblW_7KcZ9PpBKgbFJrp6Nz3GNYQhX_63fyvg6FGCBsoosf88xNAgcWiGvCUkSeI14zeWh7p293VDQCuWGqpxlVHjeATMfYEYVwRRYbqHbMd4o88V2X87QSwqBj0sR4-z9PtY"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-8 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Campus Infrastructure</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">The Central Knowledge Hub</h3>
                  </div>
                </div>

                {/* Sports Item 1 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-square lg:col-span-1 ${activeCategory !== 'all' && activeCategory !== 'sports' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Annual Sports Championship" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDd90WbD7EYBL6HJnE0fi94xalXzt5DfE63Xs5p6hrFWcvKq2Uk-d5q8vbd-ZrUQZP8QegkU-g7YWDS9qFhmQnFgSRlRzIdhKVhNucF2hBRLhuLGgkAu9r5MJC53VoC5GKjnLOGM9LPMKoyilCYA2OfHjB9TwT5MtkiRmdox9JSFSKz-0JQdkSuzowqLpP95Ey0W4i6KdstQ1uo6h5xrt55W8YqaJZsCHDnnwZBvPPE-v1W9YBt7dzH7bS3Y_OUWHWfGg8uMIKSgBs"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Sports Events</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Annual Sports Championship</h3>
                  </div>
                </div>

                {/* Cultural Item 1 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-square lg:col-span-1 ${activeCategory !== 'all' && activeCategory !== 'cultural' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Spring Cultural Gala" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUz02cGCZ1yhOsmaLJZZ7BNnEmIECXlJtuNTcTq9sdsl4PBXtzhFPmSBCmJ46ORWTEcXuBCbUt9hOVO3JBsmWkO5tof9NSx1RPSEpZzrbxk1HUa9oBNlqid-kv9bn7MMj8cnrH0Z57qmAcgcn5WooLW5wDqgwGAoq53AON8hhXctVuUpibSlt7eeGP3WwDr_GmdUp0Gm5B4-Xbon0dGba2wlAbwnTlPmMzGJySmUJ63IaQNc-mDEquRPzmpFFn_JAs9sTCcteAYHg"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Cultural Fest</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Spring Cultural Gala</h3>
                  </div>
                </div>

                {/* Infrastructure Item 2 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-square lg:col-span-1 ${activeCategory !== 'all' && activeCategory !== 'infrastructure' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Modern Academic Block" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCZk3E_BybpWVBtByU-PdZXrlYs0vvaDOI7KLUcnKlqyBDRZmCvTZu0e4-u5RcuMNJ1ab_h6UONxfzLokFQNLerbgc1qc1F_1VsV-gkGSTg_du2swwnQ-l9cBvcr6z6POagtkdY269FE4Gbd9HcyhFhtjP8bTlWPS2sFTROmHck0zYbjhsncnnUbK9biTOFjQ6UumfQC7eF4Sdf9kes_ensfl9KwIB_Ikf8bj2A1hwdUqPKdTC2sk5mfOI-DzLZow34P0c7wua5h0"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Campus Infrastructure</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Modern Academic Block</h3>
                  </div>
                </div>

                {/* Academic Item 2 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-video lg:col-span-2 ${activeCategory !== 'all' && activeCategory !== 'academic' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Collaborative Robotics Workshop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfOg4KYrTAopMvaSgg-9byaIHSQ1evwdEsTe6QQnjdCQ-Lj8_7KsKh9rrVW4QEi6tHFa0tcQbZGy48mTVxAktFJzy-ZxIpEZeP5Uf4sDFVL7IztwXxir1pFLlV02fDsrPe_507NrvLj97-RfKRzXkRZom1c5sfoLt7t_J2FISesNg2h0ZuMBkzTGId2URPlDXLGaPocm63x8jDJgZoyyh-68LcY_vhx5TzyZVgDCYlipQnFu-ZdU-fksrpNytxjgfWO627J3-cl9s"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-8 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Classroom Activities</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Collaborative Robotics Workshop</h3>
                  </div>
                </div>

                {/* Cultural Item 2 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-square lg:col-span-1 ${activeCategory !== 'all' && activeCategory !== 'cultural' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Fine Arts Exhibition" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQr67xTcYyWYLSypzY0QQLdU5NTCJLFQnMor5WYPa3wgUGz4Ki75V8KFVWhGd_oxkboHw0yVU5uSedFhA2VIRV4nOauzzZfCvI8Oj6l_1syigtL6ZQ0wQaCEc08jttEY86rJDrLBbVIGyDh0Y3UGh6plSuIOLVH0cQer2f1MJHHyqHfA_VPZAR2EebSepNlNzs_XrGcjw9sC19b02b9e7pGVGohxZdO6gINt4EHyXajbYiu9jbiMs_5NZeoBtnB3T1RBAbCPEqlt0"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Cultural Fest</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Fine Arts Exhibition</h3>
                  </div>
                </div>

                {/* Sports Item 2 */}
                <div className={`group relative overflow-hidden rounded-xl bg-surface shadow-sm cursor-pointer aspect-[4/5] lg:col-span-1 ${activeCategory !== 'all' && activeCategory !== 'sports' ? 'hidden' : ''}`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Aquatic Sports Meet" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqI5iiIiCJlrtvQigGT7YIxmfnFXi3tPKkGTqby1t0fex5IbzNvuG6oESYxbCH1wR22WsEysAQTuXjzQATYlt0OT7rD5yLutRunKb6LI_7rnMCk6hubPi6Zm8JL-KXhvyHI_Q80XPsQtH2Jw0zRmQMJGhDM5vL3o4pYnApdUm3cIn0fYDbNy5JXryUxZ7JjOGA0_1M-qGt2HDHGpiubY3cxd_YaGsjv7Ipo9eQ9UtolsLmsGOkDSe3BG181csDOK_i0X4B4sRqWrA"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 group-hover:opacity-100">
                    <span className="text-white/80 font-label-sm text-label-sm mb-1">Sports Events</span>
                    <h3 className="text-white font-headline-md text-headline-md leading-tight">Aquatic Sports Meet</h3>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Newsletter / CTA */}
        <section className="mt-section-padding px-gutter">
          <div className="max-w-container-max mx-auto bg-primary-container rounded-3xl p-12 text-center text-on-primary-container relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg fill="none" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern height="40" id="pattern" patternUnits="userSpaceOnUse" width="40" x="0" y="0">
                  <circle cx="2" cy="2" fill="currentColor" r="1"></circle>
                </pattern>
                <rect fill="url(#pattern)" height="100%" width="100%"></rect>
              </svg>
            </div>
            <h2 className="font-display text-display mb-6">Stay Connected with Our Journey</h2>
            <p className="font-body-lg text-body-lg mb-8 max-w-xl mx-auto text-on-primary-container/80">Subscribe to get monthly highlights and announcements from the Excellence Academy community.</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
              <input className="w-full px-6 py-3 rounded-lg border-none text-on-background focus:ring-2 focus:ring-primary shadow-lg" placeholder="Enter your email" type="email"/>
              <button className="w-full md:w-auto px-8 py-3 bg-on-background text-surface rounded-lg font-label-md hover:opacity-90 transition-all active:scale-95 whitespace-nowrap">Subscribe Now</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Gallery;
"""

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/Gallery.jsx', 'w') as f:
    f.write(jsx_content)

print("Gallery.jsx updated successfully!")
