import React, { useState, useEffect, useContext } from 'react';
import { FaTimes } from 'react-icons/fa';
import { SiteDataContext } from '../context/SiteDataContext';

function PopupBanner() {
  const { banner, loading } = useContext(SiteDataContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only proceed if loading is finished and banner is active
    if (!loading && banner?.isActive && banner?.image) {
      // Check if it has been shown recently (within 12 hours) to avoid cross-tab issues
      const savedData = localStorage.getItem('popupBannerShown');
      let hasBeenShown = false;

      if (savedData) {
        try {
          const { timestamp, imageUrl } = JSON.parse(savedData);
          const now = new Date().getTime();
          // 1800000 ms = 30 minutes
          // Only skip showing if it's the SAME banner and within 30 minutes
          if (imageUrl === banner.image && (now - timestamp < 1800000)) {
            hasBeenShown = true;
          }
        } catch (e) {
          // Fallback if parsing fails (e.g. old data format)
          hasBeenShown = false;
        }
      }

      if (!hasBeenShown) {
        // Add a slight delay before showing for a smoother entry
        const showTimer = setTimeout(() => {
          setIsVisible(true);
          localStorage.setItem('popupBannerShown', JSON.stringify({
            timestamp: new Date().getTime(),
            imageUrl: banner.image
          }));
        }, 1000);

        return () => clearTimeout(showTimer);
      }
    }
  }, [loading, banner]);

  useEffect(() => {
    // If it becomes visible, set a timer to hide it after 15 seconds
    let hideTimer;
    if (isVisible) {
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 15000);
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white:bg-[#1E293B]:bg-[#1E293B] text-gray-800 p-2 rounded-full shadow-md transition-all sm:top-2 sm:right-2 backdrop-blur-md"
          aria-label="Close banner"
        >
          <FaTimes size={16} />
        </button>

        {banner.link ? (
          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer group">
            <img
              src={banner.image}
              alt="Website Banner"
              className="w-full h-auto max-h-[80vh] object-contain block group-hover:scale-[1.02] transition-transform duration-500"
            />
          </a>
        ) : (
          <img
            src={banner.image}
            alt="Website Banner"
            className="w-full h-auto max-h-[80vh] object-contain block"
          />
        )}

        {/* Progress bar to show the 15s timer */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-tertiary shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{
              animation: 'progress 15s linear forwards'
            }}
          />
        </div>
      </div>

      {/* Inline styles for the animation since it's dynamic */}
      <style>{`
        @keyframes progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default PopupBanner;
