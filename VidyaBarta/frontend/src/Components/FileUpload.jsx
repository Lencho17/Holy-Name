import React, { useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  // Helper function to inject 'fl_attachment' into the Cloudinary URL
  const generateDownloadUrl = (url) => {
    if (!url) return '';
    // This replaces the first instance of '/upload/' with '/upload/fl_attachment/'
    // transforming it into a forced download link.
    return url.replace('/upload/', '/upload/fl_attachment/');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setUploadedUrl('');
      setDownloadUrl('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadedUrl(data.url);
        // Process the URL for forcing downloads
        setDownloadUrl(generateDownloadUrl(data.url));
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Secure File Upload</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Document or Image (PDF, JPG, PNG)
          </label>
          <input
            type="file"
            accept=".pdf, image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 transition-all cursor-pointer"
          />
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload to Cloudinary'}
        </button>
      </form>

      {uploadedUrl && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
          <p className="text-sm text-green-800 font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            File uploaded successfully!
          </p>
          
          <div className="flex flex-col gap-2">
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              View File (In Browser)
            </a>
            
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-md shadow transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download File directly
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
