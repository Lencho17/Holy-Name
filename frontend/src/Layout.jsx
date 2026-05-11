import React, { useContext } from "react";
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
  const { loading } = useContext(SiteDataContext);

  if (loading) {
    return <SkeletonLoader />;
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
