import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const About = () => {
  const { visionStatement, aimsAndObjectives, headMistress, schoolProfile } = useContext(SiteDataContext);
  
  const headMistressPhoto = headMistress?.photo || "/Pictures/assets/head_mistress_photo.png";
  return (
    <div className="bg-surface min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
          <h2 className="text-5xl md:text-6xl font-black text-primary academic-serif inline-block relative z-10">
            About Us
          </h2>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 bg-secondary/10 -z-0 rounded-full blur-xl"></div>
          <div className="flex justify-center mt-6">
            <div className="w-24 h-1 bg-secondary rounded-full"></div>
          </div>
        </div>

        <div className="bg-surface-container-low shadow-2xl rounded-3xl p-8 md:p-14 border border-outline-variant/30 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <h3 className="academic-serif text-3xl md:text-4xl font-black text-primary mb-10 border-b border-outline-variant pb-4">Our History</h3>
          
          <div className="space-y-16 text-on-surface-variant text-lg leading-relaxed font-medium">
            
            {/* Section 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <p className="flex-1">
                It all begins with a small step. The Diocese of Dibrugarh had been
                on the hunt out for a plot of land from the year 1983 to establish
                a center of ours at Sivasagar. By the end of 1984, Rev. Fr. Alex
                Kapiarumala was entrusted with this task. Fr. Alex, aptly called
                the ‘Pioneer Palter’, visited various people and places in search
                of a suitable land in and around Sivasagar. Finally, Lt. Adv Mr.
                Anil Dutta directed Fr. Alex to Mr. Hemo Gogoi of Cherekapar, who,
                after a lot of negotiation, decided to part with a portion of his
                land. This plot is situated by the B.G. Road, some 3kms from
                Sivasagar Town.
              </p>
              <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">
                <img
                  src="/Pictures/about/Fr alex.jpg"
                  alt="Fr Alex"
                  className="w-full h-auto rounded-2xl shadow-lg border border-outline-variant/30 object-cover aspect-square grayscale hover:grayscale-0 transition-all duration-500"
                />
                <p className="text-center font-bold text-primary academic-serif text-xl border-b border-primary/20 pb-2">Fr. Alex Kapiarumala</p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
              <p className="flex-1">
                Most Rev. Thomas Menaparampil SDB, DD, the then Bishop of the
                Diocese of Dibrugarh, consented to go ahead with the purchase of
                the land in the name of the Catholic Church for the purpose of
                establishing an English Medium School and for other Church
                functions. The formal opening of the center was done in a public
                function held at the site on 19.01.1986, attended by a number of
                local dignitaries. The foundation stone of the permanent structure
                of the School was laid by most Rev. Thomas Menaparampil SDB, DD in
                October 1987, and the construction work of the ground floor was
                completed in March 1989.
              </p>
              <div className="w-full md:w-80 shrink-0">
                <img
                  src="/Pictures/about/sch building foundation.png"
                  alt="School Building Foundation"
                  className="w-full h-auto rounded-2xl shadow-lg border border-outline-variant/30 sepia hover:sepia-0 transition-all duration-500"
                />
                <p className="text-center text-sm mt-3 text-on-surface-variant italic">School Building Foundation (1987)</p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <p className="flex-1">
                In July 1988, the sisters of the Holy Cross of Chavanod joined the
                school staff, with Sr. Ragasblvi Michael in 1988 and Sr. Carmeline
                (Superior) joining the Holy Name family, giving great impetus to
                the overall functioning of the school. The Holy Cross sisters
                started with a very humble setup, using a portion of the temporary
                school shed as their convent. The new permanent accommodation for sisters was
                completed and blessed by most Rev. Thomas Menaparampil SDB, DD on 26.12.1990.
              </p>
              <div className="w-full md:w-80 shrink-0">
                <img
                  src="/Pictures/about/convent starting.png"
                  alt="Convent Starting"
                  className="w-full h-auto rounded-2xl shadow-lg border border-outline-variant/30 sepia hover:sepia-0 transition-all duration-500"
                />
                <p className="text-center text-sm mt-3 text-on-surface-variant italic">The First Convent Setup</p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="">
               <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">
                  <img
                    src="/Pictures/about/Fr Joy.png"
                    alt="Fr Joy"
                    className="w-full h-auto rounded-2xl shadow-lg border border-outline-variant/30 object-cover aspect-square grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  <p className="text-center font-bold text-primary academic-serif text-xl border-b border-primary/20 pb-2">Fr. Joseph Pallikunnel</p>
                  <p className="text-center text-secondary text-sm font-bold uppercase tracking-widest">(1992-1999)</p>
                </div>
                <div className="flex-1 space-y-4">
                  <p>
                    After the transfer of Fr. Alex on 11.04.1992, Fr. Joseph (Joy)
                    Pallikunnel was appointed as the next principal of the School. Fr.
                    Joy took up the infrastructure work at a marathon pace. Along with the construction work the School authorities tried
                    to introduce some of the time tested local customs in the School
                    like “Guru Sishya Parampara” blessing of the HSLC candidates in the
                    Church and the students seeking blessings from their “Gurus".
                  </p>
                  <div className="bg-white/50 p-6 rounded-2xl border border-outline-variant/50 relative">
                    <span className="material-symbols-outlined absolute top-2 right-2 text-primary/10 text-4xl">menu_book</span>
                    <p>
                    On the Initiation day the KG-I students were encouraged to offer a
                    “Dakshina” of Rs 1.25 in coins, and the Assamese traditional
                    “Phulam Gamusas” to their “Gurus”. Short passages from The Bible,
                    The Gita and The Quran were also read symbolizing the Secular
                    spirit of our Nation.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src="/Pictures/about/fr Joy in KG initiation day (1).png"
                      alt="Demo"
                      className="w-48 h-auto rounded-xl shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Gallery Grid */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h4 className="text-2xl font-bold text-primary academic-serif">Rev Fr. Jose Varghese (1999-2005)</h4>
                <div className="flex-1 h-px bg-outline-variant"></div>
              </div>
              <p>
                To inculcate in the students a spirit of team work, Co-operation and
                for the smooth running of the school the students were divided into
                four houses. The School conducts sports week and various Co-curricular activities such as:
                Solo Group Dance, Singing Competition, Recitation, Extempore Speech,
                Debate and Science Exhibition.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000804.jpg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /></div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000742.jpg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /></div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000719.jpg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /></div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000657.jpg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /></div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="">
               <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">
                  <img
                    src="/Pictures/about/IMG_20240731_000410.jpg"
                    alt="Fr Jose"
                    className="w-full h-auto rounded-2xl shadow-lg border border-outline-variant/30 object-cover aspect-square grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  <p className="text-center font-bold text-primary academic-serif text-xl border-b border-primary/20 pb-2">Rev Fr. Jose Mulloparampil</p>
                  <p className="text-center text-secondary text-sm font-bold uppercase tracking-widest">(2005-2010)</p>
                </div>
                <div className="flex-1 space-y-4">
                  <p>
                    Fr. Jose Mulloparampil undertook the much needed work of
                    constructing a School Auditorium Cum the Church, the ground floor
                    being the Auditorium and the 1st floor the Church. The construction
                    was completed in just two and half years. The auditorium became the
                    3rd largest in Sivasagar.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <img src="/Pictures/about/auditorium-1.JPG" className="w-full h-24 object-cover rounded-xl shadow-md" />
                    <img src="/Pictures/about/IMG_20240731_000637.jpg" className="w-full h-24 object-cover rounded-xl shadow-md" />
                    <img src="/Pictures/about/20240519055618_IMG_6597-1.JPG" className="w-full h-24 object-cover rounded-xl shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h4 className="text-2xl font-bold text-primary academic-serif">Rev Fr. Vijay Minj <span className="text-secondary text-sm ml-2 tracking-widest">(2010-2018)</span></h4>
                <div className="flex-1 h-px bg-outline-variant"></div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <img src="/Pictures/about/IMG_20240731_000427.jpg" className="w-40 h-40 object-cover rounded-2xl shadow-lg shrink-0" />
                <p>
                  Fr Vijay completed the extension work of the boys boarding. He tried
                  his level best to keep up the discipline and proper functioning of
                  the school on a day to day basis. Fr Vijay Successfully conducted
                  the Silver Jubilee Celebrations of the School in the year 2011. It
                  was an overwhelming moment to see the lights of Holy
                  Name School shining bright in various parts of the country and
                  abroad.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000508.jpg" className="w-full h-full object-cover" /></div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000532.jpg" className="w-full h-full object-cover" /></div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG-20240730-WA0035.jpg" className="w-full h-full object-cover" /></div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md"><img src="/Pictures/about/IMG_20240731_000603.jpg" className="w-full h-full object-cover" /></div>
              </div>
            </div>

            {/* Section 8 */}
             <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h4 className="text-2xl font-bold text-primary academic-serif">Rev Fr. Bartholomew Bhengra <span className="text-secondary text-sm ml-2 tracking-widest">(2018-2021)</span></h4>
                <div className="flex-1 h-px bg-outline-variant"></div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <img src="/Pictures/about/IMG_20240731_000445.jpg" className="w-40 h-40 object-cover rounded-2xl shadow-lg shrink-0" />
                <p>
                  Fr. Bartholomew’s tenure was mostly marked by the Pandemic
                  (Covid-19), which gravely affected the smooth functioning of the
                  School. During his time he constructed new toilets for both the Boys
                  and Girls. He successfully negotiated for
                  a plot of land contiguous with the school campus.
                </p>
              </div>
             </div>

             {/* Section 9 */}
             <div className="relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
               <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">
                  <img
                    src="/Pictures/picturesoftheweb/Fr Hemanta Pegu.JPG"
                    alt="Fr Hemanta"
                    className="w-full h-auto rounded-2xl shadow-lg border-[6px] border-white object-cover aspect-square"
                  />
                  <p className="text-center font-bold text-primary academic-serif text-xl border-b border-primary/20 pb-2">Rev Fr. Hemanta Pegu</p>
                  <p className="text-center text-secondary text-sm font-bold uppercase tracking-widest">(2021-Present)</p>
                </div>
                <div className="flex-1 space-y-4">
                  <p>
                    Fr. Hemanta initiated the opening of the Senior Secondary section of
                    the school with the Science & Arts Stream in the already existing
                    boys boarding building. The Computer Laboratory in the Senior
                    Secondary section was given a face-lift. In the ground floor of the same building well-equipped laboratories
                    of Physics, Chemistry and Biology are set up for the benefit of
                    Senior Secondary students.
                  </p>
                  <p className="font-bold text-primary">
                    Fr. Hemanta has also introduced NCC & Scouts and Guides for the
                    first time in {schoolProfile?.name || "Holy Name School"} and still counting...
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <img src="/Pictures/about/Chemistry Lab (1).jpg" className="w-full h-24 object-cover rounded-xl shadow-md border hover:scale-110 transition" />
                    <img src="/Pictures/about/bio lab (1).jpg" className="w-full h-24 object-cover rounded-xl shadow-md border hover:scale-110 transition" />
                    <img src="/Pictures/about/computer lab HS building (1).jpg" className="w-full h-24 object-cover rounded-xl shadow-md border hover:scale-110 transition" />
                    <img src="/Pictures/about/school building (1).JPG" className="w-full h-24 object-cover rounded-xl shadow-md border hover:scale-110 transition" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Block */}
            <div className="mt-12 p-10 bg-gradient-to-br from-primary to-primary-container rounded-3xl shadow-lg text-white text-center relative">
              <span className="material-symbols-outlined absolute top-4 left-4 text-white/20 text-6xl">format_quote</span>
              <p className="text-xl md:text-2xl italic font-serif leading-relaxed mb-6">
                “We are confident that with all the necessary facilities placed at
                the disposal of the students will enable them in all round
                development of Mind, Body and Spirit... ‘Education has
                limits but learning not!’, be a good learner life long.”
              </p>
              <div className="flex flex-col items-end opacity-90 text-sm">
                <span className="font-bold">Written By: Mrs Runa Sharma (English Faculty)</span>
                <span>Edited by: Rev Fr Jose Varghese</span>
              </div>
            </div>

          </div>
        </div>

        {/* Info Grid - Aims & Objectives, Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-8 hover:-translate-y-2 transition duration-500">
            <h2 className="text-3xl font-black text-primary academic-serif mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-4xl">flag</span>
              Aims & Objectives
            </h2>
            <div className="space-y-6 text-on-surface-variant font-medium">
              {(aimsAndObjectives || []).map((aim, index) => (
                <div key={index}>
                  {index > 0 && <div className="w-full h-px bg-outline-variant mb-6 mt-6"></div>}
                  <h4 className="text-xl font-bold text-primary mb-2">{aim.title}</h4>
                  <p className="whitespace-pre-line">{aim.description}</p>
                </div>
              ))}
              {(!aimsAndObjectives || aimsAndObjectives.length === 0) && (
                <p className="italic text-gray-400">Content updating soon...</p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-primary text-white rounded-3xl shadow-xl p-8 hover:-translate-y-2 transition duration-500">
              <h2 className="text-3xl font-black academic-serif mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-4xl">visibility</span>
                Vision Statement
              </h2>
              <p className="text-lg leading-relaxed text-white/90 whitespace-pre-line">
                {visionStatement}
              </p>
            </div>

             <div className="p-8 hover:-translate-y-2 transition duration-500">
                <h2 className="text-3xl font-black text-primary academic-serif mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-4xl">face_3</span>
                  Head Mistress
                </h2>
                <div className="flex flex-col sm:flex-row gap-6">
                  <img
                    src={headMistressPhoto}
                    alt="Head Mistress"
                    className="w-32 h-32 rounded-full shadow-lg object-cover border-4 border-white shrink-0 bg-white"
                  />
                  <div className="text-on-surface-variant text-sm space-y-3 font-medium">
                    <p className="font-bold text-primary">{headMistress?.greeting || ""}</p>
                    <div className="whitespace-pre-line">
                      {headMistress?.message || ""}
                    </div>
                    {headMistress?.signature && (
                      <div className="flex flex-col items-start pt-4 border-t border-outline-variant mt-4">
                        <img 
                          src={headMistress.signature} 
                          alt="Signature" 
                          className="h-16 mb-2 opacity-70 mix-blend-multiply flex-shrink-0"
                        />
                         <p className="font-bold text-primary italic text-sm">
                          Head Mistress
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
