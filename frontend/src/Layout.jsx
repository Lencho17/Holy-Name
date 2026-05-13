import React, { useContext } from "react";
import { FaTools } from "react-icons/fa";
import Header from "./Components/Header.jsx";
import Footer from "./Components/Footer.jsx";
import PopupBanner from "./Components/PopupBanner.jsx";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import { Outlet } from "react-router-dom";
import { SiteDataContext } from "./context/SiteDataContext.jsx";

// Premium skeleton loading screen shown while backend is waking up
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="hidden md:block">
              <div className="w-48 h-4 bg-gray-200 rounded-md mb-1" />
              <div className="w-28 h-3 bg-gray-100 rounded-md" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-16 h-3 bg-gray-200 rounded-md" />
            ))}
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-md md:hidden" />
        </div>
      </div>

      {/* Skeleton Hero */}
      <div className="relative w-full h-[300px] md:h-[480px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-20 h-20 bg-white/40 rounded-full" />
          <div className="w-72 h-6 bg-white/40 rounded-lg" />
          <div className="w-56 h-4 bg-white/30 rounded-lg" />
          <div className="w-40 h-10 bg-white/20 rounded-xl mt-4" />
        </div>
      </div>

      {/* Skeleton Content Blocks */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-16 h-8 bg-gray-200 rounded-lg mb-2" />
              <div className="w-24 h-3 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Section title */}
        <div className="text-center mb-10">
          <div className="w-48 h-5 bg-gray-200 rounded-lg mx-auto mb-2" />
          <div className="w-72 h-3 bg-gray-100 rounded-md mx-auto" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-6">
                <div className="w-3/4 h-4 bg-gray-200 rounded-md mb-3" />
                <div className="w-full h-3 bg-gray-100 rounded-md mb-2" />
                <div className="w-2/3 h-3 bg-gray-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Notice skeleton */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="w-32 h-5 bg-gray-200 rounded-lg mb-6" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <div className="w-2 h-2 bg-gray-200 rounded-full" />
              <div className="flex-1 h-3 bg-gray-100 rounded-md" />
              <div className="w-20 h-3 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border border-gray-100 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-semibold text-gray-500">Loading school data...</span>
        </div>
      </div>
    </div>
  );
}

function Layout() {
  const { loading, isMaintenanceMode, schoolProfile } = useContext(SiteDataContext);
  const isAdmin = localStorage.getItem('adminToken');

  if (loading) {
    return <SkeletonLoader />;
  }

  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden p-4 font-sans">
        {/* Soft Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
           <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100 blur-[120px] rounded-full" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-50 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-white text-center">
            {/* Minimalist Logo */}
            {schoolProfile?.logo && (
              <div className="flex justify-center mb-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse" />
                  <img src={schoolProfile.logo} alt="School Logo" className="relative w-24 h-24 rounded-full border-4 border-white shadow-xl" />
                </div>
              </div>
            )}

            <div className="flex flex-col items-center">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                Be right <span className="text-primary">back.</span>
              </h1>
              
              <div className="w-12 h-1.5 bg-primary/20 rounded-full mb-8" />

              <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-md mx-auto mb-12">
                {schoolProfile?.name || "Holy Name High School"} is getting a scheduled upgrade. We're making things better for you.
              </p>

              <div className="space-y-4">
                 <div className="inline-flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Maintenance in progress</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col items-center opacity-30">
             <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-900 mb-2">Est. 1986</span>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Holy Name High School, Sivasagar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Header />
      <PopupBanner />
      <Outlet />
      <Footer />
    </>
  );
}

export default Layout;
