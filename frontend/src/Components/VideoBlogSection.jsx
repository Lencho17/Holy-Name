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

  const cardStyle = {
    border: '2px solid rgb(59 130 246)',
    padding: '10px',
    margin: '10px',
    width: '300px',
    textAlign: 'center',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
    backgroundColor: '#fff',
  };

  const cardHoverStyle = {
    transform: 'scale(1.05)',
  };

  const videoStyle = {
    width: '100%',
    height: '200px',
    background: '#ccc', // Placeholder for video
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
    borderRadius: '4px',
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  };

  const isYouTube = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div
      style={cardStyle}
      className="hover:scale-105 transition-transform duration-200"
    >
      <div style={videoStyle} className="bg-gray-100 flex items-center justify-center">
        {isYouTube(src) ? (
          <iframe 
            src={embedUrl}
            width="100%" 
            height="200px" 
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen 
            title={title}
            style={{ borderRadius: '4px' }}
          ></iframe>
        ) : (
          <video 
            src={src}
            width="100%" 
            height="200px" 
            controls
            title={title}
            style={{ borderRadius: '4px', objectFit: 'cover' }}
            className="bg-black"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <div style={titleStyle}>{title}</div>
    </div>
  );
};

const VideoBlogSection = () => {
  const { videos } = useContext(SiteDataContext);

  if (!videos || videos.length === 0) {
    return null;
  }

  const sectionStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #f6f8fa, #eaeff3)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  };

  const videosContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  };

  const titleStyle = {
    fontSize: '32px',
    marginBottom: '20px',
    fontWeight: 'bold',
    color: '#333',
  };

  return (
    <div style={sectionStyle} className=''>
      <div style={titleStyle}>VIDEO BLOG</div>
      <div style={videosContainerStyle} className=''>
        {videos.map((video, index) => (
          <VideoCard key={index} src={video.src} title={video.title} />
        ))}
      </div>
    </div>
  );
};

export default VideoBlogSection;
