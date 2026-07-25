import React, { useRef, useState, useCallback } from 'react';
import { FaCamera, FaSync } from 'react-icons/fa';

const WebcamCapture = ({ onCapture, label }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;
    
    // Draw current video frame to canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL('image/jpeg');
    
    stopCamera();
    setIsProcessing(true);
    
    try {
      // Convert base64 to blob for API
      const response = await fetch(base64Image);
      const originalBlob = await response.blob();
      
      const formData = new FormData();
      formData.append('image_file', originalBlob, 'capture.jpg');
      formData.append('size', 'auto');
      formData.append('bg_color', 'blue');
      
      const apiRes = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': 'Q6TcrFQ3kWXBRYzhFSV857Bt',
        },
        body: formData
      });
      
      if (!apiRes.ok) {
        throw new Error('Background removal failed');
      }
      
      const resBlob = await apiRes.blob();
      const processedImageUrl = URL.createObjectURL(resBlob);
      
      setCapturedImage(processedImageUrl);
      if (onCapture) onCapture(resBlob);
    } catch (err) {
      console.error(err);
      setError('Failed to process image background. Using original image.');
      setCapturedImage(base64Image); // Fallback to original image
      // Try to convert to blob
      fetch(base64Image).then(r => r.blob()).then(blob => {
        if (onCapture) onCapture(blob);
      });
    } finally {
      setIsProcessing(false);
    }
  }, [stream, onCapture]);

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}
      <div className="relative border-2 border-dashed border-primary/40 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center min-h-[240px]">
        
        {error && <div className="absolute top-2 left-2 right-2 bg-red-100 text-red-600 p-2 rounded text-xs z-20 text-center font-bold">{error}</div>}
        
        {!stream && !capturedImage && !isProcessing && (
          <button 
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center text-primary hover:text-primary/80 transition-colors w-full h-full py-8"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <FaCamera size={24} />
            </div>
            <span className="font-semibold text-sm">Start Camera</span>
          </button>
        )}

        {stream && !capturedImage && !isProcessing && (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-[240px] object-cover"
            />
            {/* Camera Overlay for face alignment */}
            <div className="absolute inset-0 z-10 border-[30px] border-black/20 pointer-events-none">
              <div className="w-full h-full border-2 border-white/50 border-dashed rounded-full"></div>
            </div>
            
            <button 
              type="button"
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-primary z-20 hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
            >
              <div className="w-10 h-10 bg-primary rounded-full"></div>
            </button>
          </>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-8">
            <FaSync className="animate-spin text-primary text-3xl mb-2" />
            <span className="text-sm font-semibold text-gray-600">Processing Background (Blue)...</span>
          </div>
        )}

        {capturedImage && (
          <>
            <img src={capturedImage} alt="Captured" className="w-full h-[240px] object-cover" />
            <div className="absolute bottom-2 right-2 z-10 flex gap-2">
              <button 
                type="button"
                onClick={retakePhoto}
                className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-lg shadow-sm hover:bg-white text-sm font-bold flex items-center gap-1 backdrop-blur-sm transition-all"
              >
                <FaSync size={12} /> Retake
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
