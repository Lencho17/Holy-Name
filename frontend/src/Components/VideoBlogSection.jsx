import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const VideoCard = ({ src, title }) => {
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      } else {
        return url;
      }
      return `https://www.youtube.com/embed/${videoId}?rel=0`;
    } catch (e) {
      return url;
    }
  };

  const embedUrl = getYouTubeEmbedUrl(src);

  const isYouTube = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div className="bg-white border-2 border-primary rounded-2xl p-3 shadow-md hover:scale-105 transition-transform duration-300 w-full sm:w-[320px] mx-auto">
      <div className="aspect-video bg-slate-100 flex items-center justify-center rounded-lg overflow-hidden mb-3">
        {isYouTube(src) ? (
          <iframe 
            src={embedUrl || null}
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure" 
            allowFullScreen 
            title={title}
          ></iframe>
        ) : (
          <video 
            src={src || null}
            width="100%" 
            height="100%" 
            controls
            title={title}
            className="bg-black object-cover"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <div className="text-slate-800 font-bold text-center leading-tight line-clamp-2 px-2">
        {title}
      </div>
    </div>
  );
};

const VideoBlogSection = () => {
  const { videos } = useContext(SiteDataContext);

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 md:px-8 bg-gradient-to-br from-[#f6f8fa] to-[#eaeff3] rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl md:text-6xl font-black text-slate-900 text-center mb-10 tracking-tight">
          Visual <span className="text-amber-600 italic">Insights</span>
        </h2>
        <div className="flex flex-wrap justify-center items-stretch gap-6 lg:gap-8">
          {videos.map((video, index) => (
            <VideoCard key={index} src={video.src} title={video.title} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoBlogSection;
