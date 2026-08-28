import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FaCamera, FaSync } from 'react-icons/fa';

const COLOR_MAP = {
  yellow: 'FFF9C4', // Soft gentle pastel yellow
  'light-yellow': 'FFFDE7', // Extra soft cream yellow
  blue: '81D4FA', // Soft studio sky blue
  'light-blue': 'B3E5FC',
  white: 'FFFFFF'
};

const WebcamCapture = ({ onCapture, label, bgColor = 'yellow', initialImage = null }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(initialImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialImage) {
      setCapturedImage(initialImage);
    }
  }, [initialImage]);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      setStream(mediaStream);
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
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    
    stopCamera();
    setIsProcessing(true);
    
    try {
      const base64Data = base64Image.split(',')[1];
      const resolvedColor = COLOR_MAP[bgColor?.toLowerCase()] || (bgColor ? bgColor.replace('#', '') : 'FFF9C4');
      
      const formData = new FormData();
      formData.append('image_file_b64', base64Data);
      formData.append('size', 'auto');
      formData.append('bg_color', resolvedColor);
      
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
      const reader = new FileReader();
      reader.readAsDataURL(resBlob);
      reader.onloadend = () => {
        const base64Result = reader.result;
        setCapturedImage(base64Result);
        if (onCapture) onCapture(base64Result);
      };
    } catch (err) {
      console.error(err);
      setError(`Background auto-processing unavailable. Saved original photo.`);
      setCapturedImage(base64Image);
      if (onCapture) onCapture(base64Image);
    } finally {
      setIsProcessing(false);
    }
  }, [stream, onCapture, bgColor]);

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream to video element when it mounts
  useEffect(() => {
    if (videoRef.current && stream && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isProcessing, capturedImage]);

  const bgLabel = bgColor ? bgColor.charAt(0).toUpperCase() + bgColor.slice(1) : 'Processed';

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}
      <div className="relative border-2 border-dashed border-primary/40 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center min-h-[240px]">
        
        {error && <div className="absolute top-2 left-2 right-2 bg-amber-100 text-amber-800 p-2 rounded text-xs z-20 text-center font-bold">{error}</div>}
        
        {!stream && !capturedImage && !isProcessing && (
          <button 
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center text-primary hover:text-primary/80 transition-colors w-full h-full py-8"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <FaCamera size={24} />
            </div>
            <span className="font-semibold text-sm">Take Live Photo</span>
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
            <div className="absolute inset-x-12 inset-y-6 z-10 border-2 border-white/60 border-dashed rounded-[40%] pointer-events-none"></div>
            
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
            <span className="text-sm font-semibold text-gray-600">Processing Background ({bgLabel})...</span>
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

