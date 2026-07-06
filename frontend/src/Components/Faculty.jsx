import React, { useContext } from "react";
import { FaGraduationCap, FaUserTie, FaFacebook, FaInstagram, FaWhatsapp, FaChalkboardTeacher, FaShareAlt } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Faculty() {
  const { faculty: facultyData, schoolProfile } = useContext(SiteDataContext);

  const handleShare = async (e, member) => {
    e?.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: member.name, 
          desc: `${member.Subject || 'Faculty'} — ${member.EduQua || 'Faculty member'} at Holy Name School`, 
          image: member.photo || schoolProfile?.pageHeroImages?.faculty || "", 
          page: '/faculty' 
        }),
      });
      const { url } = await res.json();
      const shareUrl = url || window.location.href;
      if (navigator.share) { 
        await navigator.share({ title: member.name, text: `${member.name} - ${member.Subject || ''}`, url: shareUrl }); 
      } else { 
        await navigator.clipboard.writeText(shareUrl); 
        alert('Link copied to clipboard!'); 
      }
    } catch (err) { if (err.name !== 'AbortError') console.warn('Share failed', err); }
  };

  const FacultyCard = ({ member, showJobTitle = true, showSubject = true, showQualifications = true, showExperience = true, showSocialLinks = true }) => {
    const experience = member.teachingExperience || member.title || "";
    const jobTitle = member.jobTitle || member.classes || "";
    
    return (
      <div className="relative bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100/80 group overflow-hidden flex flex-col items-center flex-1 transform hover:-translate-y-2 h-full w-full">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-100/40 to-blue-50/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-amber-100/40 to-orange-50/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none z-0"></div>

        {/* Experience / Job Title Badge (Top Right) */}
        {showJobTitle && jobTitle && (
          <div className="absolute top-4 right-4 z-20 flex items-center bg-white/90 backdrop-blur-sm border border-gray-100 text-indigo-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm max-w-[150px] truncate">
            <FaUserTie className="mr-1.5 text-indigo-400 shrink-0" size={12} />
            <span className="truncate">{jobTitle}</span>
          </div>
        )}

        {/* Profile Image with animated ring on hover */}
        <div className="relative z-10 w-28 h-28 mb-5 mt-4 group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[2px] -m-[2px]"></div>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 group-hover:border-transparent transition-colors duration-300"></div>
          <div className="absolute inset-0 bg-white rounded-full m-[1px]"></div>
          <img
            src={member.photo || "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150&h=150&fit=crop"}
            alt={member.name}
            className="w-full h-full object-cover rounded-full shadow-inner relative z-10 p-[2px]"
          />
        </div>

        {/* Details */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors text-center">{member.name}</h3>
          
          {showSubject && member.Subject && (
            <p className="text-[13px] font-bold text-amber-500 tracking-wider uppercase mb-5 text-center">{member.Subject}</p>
          )}

          <div className="w-full space-y-3 px-1">
            {showQualifications && member.EduQua && (
              <div className="flex items-start group/item">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mr-3 group-hover/item:bg-indigo-100 transition-colors">
                  <FaGraduationCap className="text-indigo-500" size={14} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Qualification</span>
                  <span className="text-sm text-gray-600 leading-tight font-medium">{member.EduQua}</span>
                </div>
              </div>
            )}
            
            {showExperience && experience && (
              <div className="flex items-start group/item">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mr-3 group-hover/item:bg-amber-100 transition-colors">
                  <FaChalkboardTeacher className="text-amber-500" size={14} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Experience</span>
                  <span className="text-sm text-gray-600 leading-tight font-medium">{experience}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Links Footer */}
        {showSocialLinks && (member.facebook || member.instagram || member.whatsapp) && (
          <div className="relative z-10 w-full mt-auto pt-6 flex flex-col justify-end">
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100 w-full">
              {member.facebook && (
                <a href={member.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-md border border-blue-100 hover:border-blue-600">
                  <FaFacebook size={16} />
                </a>
              )}
              {member.instagram && (
                <a href={member.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-pink-50/50 flex items-center justify-center text-pink-600 hover:bg-gradient-to-tr hover:from-orange-500 hover:via-pink-500 hover:to-purple-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-md border border-pink-100 hover:border-transparent">
                  <FaInstagram size={16} />
                </a>
              )}
              {member.whatsapp && (
                <a href={member.whatsapp.startsWith('http') ? member.whatsapp : `https://wa.me/${member.whatsapp}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-green-50/50 flex items-center justify-center text-green-600 hover:bg-green-500 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-md border border-green-100 hover:border-green-500">
                  <FaWhatsapp size={16} />
                </a>
              )}
              <button 
                onClick={(e) => handleShare(e, member)}
                className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-md border border-gray-100 hover:border-indigo-600"
                title="Share Faculty Profile"
              >
                <FaShareAlt size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Flatten and group faculty by section
  const allMembers = facultyData ? Object.values(facultyData).flat() : [];
  
  const sections = {
    graduate: [],
    higherSecondary: [],
    upperPrimary: [],
    primary: [],
    playSchool: [],
    administration: [],
    supportStaff: [],
    others: []
  };

  allMembers.forEach(member => {
    const sec = (member.section || 'Others').trim().toLowerCase();
    if (sec.includes('graduate')) {
      sections.graduate.push(member);
    } else if (sec.includes('higher secondary') || sec === 'hs' || sec.includes('higher-secondary')) {
      sections.higherSecondary.push(member);
    } else if (sec.includes('upper primary') || sec === 'up' || sec.includes('upper-primary')) {
      sections.upperPrimary.push(member);
    } else if (sec.includes('play school') || sec.includes('playschool')) {
      sections.playSchool.push(member);
    } else if (sec.includes('primary')) {
      sections.primary.push(member);
    } else if (sec.includes('administration') || sec.includes('admin')) {
      sections.administration.push(member);
    } else if (sec.includes('support')) {
      sections.supportStaff.push(member);
    } else {
      sections.others.push(member);
    }
  });

  // Subgrouping helper for Graduate
  const graduateGroups = {};
  sections.graduate.forEach(m => {
    const dept = m.department || 'General';
    if (!graduateGroups[dept]) graduateGroups[dept] = [];
    graduateGroups[dept].push(m);
  });

  // Stream helper for Higher Secondary
  const hsGroups = { Science: [], Commerce: [], Arts: [], Others: [] };
  sections.higherSecondary.forEach(m => {
    const dept = m.department || 'Others';
    if (dept.toLowerCase().includes('science')) hsGroups.Science.push(m);
    else if (dept.toLowerCase().includes('commerce')) hsGroups.Commerce.push(m);
    else if (dept.toLowerCase().includes('arts')) hsGroups.Arts.push(m);
    else hsGroups.Others.push(m);
  });

  // Stream/Subject helper for Upper Primary
  const upGroups = { Science: [], Commerce: [], Arts: [], Others: [] };
  sections.upperPrimary.forEach(m => {
    const dept = m.department || 'Others';
    if (dept.toLowerCase().includes('science')) upGroups.Science.push(m);
    else if (dept.toLowerCase().includes('commerce')) upGroups.Commerce.push(m);
    else if (dept.toLowerCase().includes('arts')) upGroups.Arts.push(m);
    else upGroups.Others.push(m);
  });

  const visibility = schoolProfile?.facultyVisibility || {
    graduate: true,
    higher_secondary: true,
    upper_primary: true,
    primary: true,
    play_school: true,
    administration: true,
    support_staff: true
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center overflow-hidden bg-white rounded-none md:rounded-b-[3rem] shadow-xl border-b border-blue-50/50 mb-10">
        <div className="absolute inset-0 z-0">
          <img
            src={schoolProfile?.pageHeroImages?.faculty || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"}
            alt="Faculty"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700/60 via-blue-700/30 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/30 text-white border border-white/20 backdrop-blur-sm shadow-sm mb-4">
            <span className="material-symbols-outlined text-sm text-white drop-shadow-sm">
              school
            </span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Academic Leaders
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
            Our Esteemed <span className="text-amber-400 italic drop-shadow-md">Faculty</span>
          </h1>
          <p className="text-white/95 text-lg mt-4 max-w-2xl hidden md:block font-medium drop-shadow-md">
            Meet our dedicated team of educators who are passionate about nurturing young minds and fostering excellence.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 space-y-24">
        
        {/* 1. Graduate Section */}
        {visibility.graduate && sections.graduate.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Graduate <span className="text-amber-600 italic">Section</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Our esteemed college and graduate-level professors delivering academic excellence.</p>
            </div>
            
            {Object.entries(graduateGroups).map(([dept, members]) => (
              <div key={dept} className="mb-12">
                <h3 className="text-xl font-bold text-indigo-900 border-l-4 border-indigo-500 pl-3 mb-6">{dept} Department</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {members.map((faculty, idx) => (
                    <FacultyCard key={`grad-${dept}-${idx}`} member={faculty} showJobTitle={true} showSubject={true} showQualifications={true} showExperience={true} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 2. Higher Secondary Section */}
        {visibility.higher_secondary && sections.higherSecondary.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Higher Secondary <span className="text-amber-600 italic">Section</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Guiding class XI & XII students in Science, Commerce, and Arts streams.</p>
            </div>
            
            {['Science', 'Commerce', 'Arts', 'Others'].map(stream => {
              const members = hsGroups[stream];
              if (!members || members.length === 0) return null;
              return (
                <div key={stream} className="mb-12">
                  <h3 className="text-xl font-bold text-indigo-900 border-l-4 border-indigo-500 pl-3 mb-6">{stream} Stream</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {members.map((faculty, idx) => (
                      <FacultyCard key={`hs-${stream}-${idx}`} member={faculty} showJobTitle={true} showSubject={true} showQualifications={true} showExperience={true} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* 3. Upper Primary Section */}
        {visibility.upper_primary && sections.upperPrimary.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Upper Primary <span className="text-amber-600 italic">Section</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Nurturing academic growth in classes VI to X.</p>
            </div>
            
            {['Science', 'Commerce', 'Arts', 'Others'].map(stream => {
              const members = upGroups[stream];
              if (!members || members.length === 0) return null;
              return (
                <div key={stream} className="mb-12">
                  <h3 className="text-xl font-bold text-indigo-900 border-l-4 border-indigo-500 pl-3 mb-6">{stream} Department</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {members.map((faculty, idx) => (
                      <FacultyCard key={`up-${stream}-${idx}`} member={faculty} showJobTitle={true} showSubject={true} showQualifications={true} showExperience={true} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* 4. Primary Section */}
        {visibility.primary && sections.primary.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Primary <span className="text-amber-600 italic">Section</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Laying strong foundational milestones for young learners.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.primary.map((faculty, idx) => (
                <FacultyCard key={`prim-${idx}`} member={faculty} showJobTitle={true} showSubject={true} showQualifications={true} showExperience={true} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Play School Section */}
        {visibility.play_school && sections.playSchool.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Play School <span className="text-amber-600 italic">Section</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Gentle guidance and play-based foundational growth.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.playSchool.map((faculty, idx) => (
                <FacultyCard key={`play-${idx}`} member={faculty} showJobTitle={false} showSubject={false} showQualifications={false} showExperience={true} showSocialLinks={false} />
              ))}
            </div>
          </section>
        )}

        {/* Legacy Administration */}
        {visibility.administration && sections.administration.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                School <span className="text-amber-600 italic">Administration</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.administration.map((faculty, idx) => (
                <FacultyCard key={`admin-${idx}`} member={faculty} />
              ))}
            </div>
          </section>
        )}

        {/* Legacy Support Staff */}
        {visibility.support_staff && sections.supportStaff.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Support <span className="text-amber-600 italic">Staff</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.supportStaff.map((faculty, idx) => (
                <FacultyCard key={`support-${idx}`} member={faculty} />
              ))}
            </div>
          </section>
        )}

        {/* Catch-all Others */}
        {sections.others.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-5xl font-black text-gray-900 mb-4">
                Other <span className="text-amber-600 italic">Faculty</span>
              </h2>
              <div className="h-1 w-24 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.others.map((faculty, idx) => (
                <FacultyCard key={`others-${idx}`} member={faculty} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default Faculty;
