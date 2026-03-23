import React, { useState } from "react";
import { FaFilePdf, FaDownload, FaUpload, FaBell, FaCalendarAlt } from "react-icons/fa";

function Notice() {
  const previousNotices = [
    { id: 42, title: "Half-Yearly Examination Schedule", date: "2023-09-25", size: "1.2 MB", pdf: "/files/notice42.pdf" },
    { id: 41, title: "Parent-Teacher Meeting for Grades VI to X", date: "2023-08-12", size: "850 KB", pdf: "/files/notice41.pdf" },
    { id: 40, title: "Annual Foundation Day Celebrations", date: "2023-07-05", size: "2.5 MB", pdf: "/files/notice40.pdf" },
    { id: 39, title: "Summer Vacation Announcement", date: "2023-06-15", size: "1.1 MB", pdf: "/files/notice39.pdf" },
  ];

  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    // Simulate upload
    alert(`File "${file.name}" simulated upload successful!`);
    setFile(null);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center bg-gradient-to-r from-canva-cyan to-canva-purple overflow-hidden">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Latest Notice - Main Column */}
          <div className="lg:col-span-2 flex flex-col h-full">
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
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Winter Break Schedule 2023</h3>
                  <p className="text-gray-500 mb-8 font-medium bg-white inline-block px-4 py-1 rounded-full shadow-sm">Published on Oct 15, 2023</p>
                  <div>
                    <button className="bg-[#4C1A57] hover:bg-[#3a1343] text-white px-8 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg inline-flex items-center transform hover:scale-105">
                      <FaDownload className="mr-3" /> Download PDF
                    </button>
                  </div>
                </div>
                
                {/* Simulated Signature */}
                <div className="absolute bottom-6 right-8 text-right hidden sm:block opacity-60">
                  <div className="border-t border-gray-400 pt-2 px-6 mt-12 w-48 text-center text-sm text-gray-500 italic">
                    <span className="block font-bold text-gray-700 not-italic font-serif">Dr. Principal Name</span>
                    Principal's Signature
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Sidebar */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-[#4C1A57] rounded-3xl shadow-xl p-8 text-white flex-grow relative overflow-hidden flex flex-col justify-center">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-tl-full -mr-10 -mb-10"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-serif font-bold mb-4 flex items-center">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mr-4">
                    <FaUpload className="text-amber-400" />
                  </div>
                  Admin Upload
                </h2>
                <p className="text-white/80 text-sm mb-8 leading-relaxed">
                  Authorized personnel can upload new notices here. Files must be in PDF format.
                </p>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center bg-white/5 hover:bg-white/10 hover:border-amber-400/50 transition-all cursor-pointer group">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                      <FaFilePdf className="text-5xl text-amber-400/70 mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:text-amber-400" />
                      <span className="block text-sm font-medium text-white/90">
                        {file ? file.name : "Click to select local PDF file"}
                      </span>
                    </label>
                  </div>
                  
                  <button 
                    type="submit"
                    className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg ${
                      file 
                      ? "bg-amber-500 text-[#4C1A57] hover:bg-amber-400 hover:-translate-y-1 hover:shadow-xl" 
                      : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
                    }`}
                    disabled={!file}
                  >
                    Publish Notice
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Notices Archive */}
        <div className="mt-12 bg-white rounded-3xl shadow-lg p-8 md:p-12 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4C1A57]">Notice Archive</h2>
            <p className="text-sm text-gray-500 mt-2 sm:mt-0 bg-gray-100 px-4 py-2 rounded-lg">Showing latest {previousNotices.length} records</p>
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
                    key={notice.id} 
                    className="border-b last:border-0 border-gray-100 hover:bg-[#F3E8F5]/30 transition-colors group"
                  >
                    <td className="py-5 px-6 text-gray-400 font-medium">#{notice.id}</td>
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
                        href={notice.pdf}
                        download
                        onClick={(e) => e.preventDefault()} // prevent actual download in demo
                        className="inline-flex items-center justify-center bg-white border border-gray-200 hover:border-[#4C1A57] hover:bg-[#4C1A57] hover:text-white text-gray-700 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <FaDownload className="mr-2" />
                        <span className="text-xs">{notice.size}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notice;
