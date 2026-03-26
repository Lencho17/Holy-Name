import React, { useContext } from "react";
import { FaFilePdf, FaDownload, FaBell, FaCalendarAlt } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Notice() {
  const { notices } = useContext(SiteDataContext);
  const latestNotice = notices && notices.length > 0 ? notices[0] : null;
  const previousNotices = notices && notices.length > 1 ? notices.slice(1) : [];

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight flex items-center justify-center">
            <FaBell className="text-amber-500 mr-4 drop-shadow-lg" />
            Notice Board
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light mt-4">
            Stay updated with the latest announcements, circulars, and schedules.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 gap-8">
          
          {/* Latest Notice - Main Column */}
          {latestNotice ? (
            <div className="flex flex-col h-full">
              <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 flex-grow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10"></div>
                
                <div className="flex flex-wrap items-center justify-between mb-8 relative z-10">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4C1A57] flex items-center mb-4 sm:mb-0">
                    <span className="w-2 h-8 bg-amber-500 rounded-full mr-4"></span>
                    Latest Circular
                  </h2>
                  <span className="px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-sm font-bold tracking-wide animate-pulse shadow-sm">
                    NEW
                  </span>
                </div>

                {/* Notice Content Rendering Area */}
                <div className="bg-[#F9F9FB] rounded-2xl border border-gray-200 p-8 min-h-[300px] flex items-center justify-center relative shadow-inner group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 rounded-2xl pointer-events-none"></div>
                  <div className="text-center relative z-10 transform group-hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                       <FaFilePdf className="text-5xl text-red-500 drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{latestNotice.title}</h3>
                    <p className="text-gray-500 mb-8 font-medium bg-white inline-block px-4 py-1 rounded-full shadow-sm">Published on {latestNotice.date}</p>
                    <div>
                      <a href={latestNotice.pdfLink} target="_blank" rel="noreferrer" className="bg-[#4C1A57] hover:bg-[#3a1343] text-white px-8 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg inline-flex items-center transform hover:scale-105">
                        <FaDownload className="mr-3" /> View / Download PDF
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl p-20 text-center border border-gray-100">
              <p className="text-gray-400 font-medium">No notices published yet.</p>
            </div>
          )}
        </div>

        {/* Previous Notices Archive */}
        {previousNotices.length > 0 && (
          <div className="mt-12 bg-white rounded-3xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4C1A57]">Notice Archive</h2>
              <p className="text-sm text-gray-500 mt-2 sm:mt-0 bg-gray-100 px-4 py-2 rounded-lg">Showing archive</p>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9FB] border-b border-gray-200">
                    <th className="py-4 px-6 text-gray-500 font-semibold w-24">No.</th>
                    <th className="py-4 px-6 text-gray-500 font-semibold">Title</th>
                    <th className="py-4 px-6 text-gray-500 font-semibold w-48">Date</th>
                    <th className="py-4 px-6 text-gray-500 font-semibold w-40 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {previousNotices.map((notice, index) => (
                    <tr 
                      key={notice.id || index} 
                      className="border-b last:border-0 border-gray-100 hover:bg-[#F3E8F5]/30 transition-colors group"
                    >
                      <td className="py-5 px-6 text-gray-400 font-medium">#{index + 2}</td>
                      <td className="py-5 px-6 font-medium text-[#4C1A57] group-hover:text-amber-600 transition-colors">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-4">
                             <FaFilePdf className="text-red-400 text-sm" />
                          </div>
                          {notice.title}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-3 text-amber-500/70" />
                          <span className="font-medium bg-gray-50 px-3 py-1 rounded-md">{notice.date}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <a
                          href={notice.pdfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center bg-white border border-gray-200 hover:border-[#4C1A57] hover:bg-[#4C1A57] hover:text-white text-gray-700 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <FaDownload className="mr-2" />
                          <span className="text-xs">{notice.size || 'View'}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notice;
