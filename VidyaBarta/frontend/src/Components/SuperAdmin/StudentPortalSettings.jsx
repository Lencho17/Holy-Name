import React, { useState } from 'react';
import { FiExternalLink, FiInfo, FiCopy, FiCheckCircle } from 'react-icons/fi';

const StudentPortalSettings = () => {
  const [copied, setCopied] = useState(false);
  
  // The central URL for the student portal
  const portalUrl = "https://student.vidyabarta.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Portal</h1>
        <p className="text-gray-500">Manage and monitor the centralized student login portal.</p>
      </div>

      {/* Main Link Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-container"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Central Portal Link</h2>
            <p className="text-sm text-gray-500 mb-6">
              This is the universal login portal for all students across every school on the VidyaBarta platform.
            </p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-lg font-mono font-semibold text-primary overflow-x-auto whitespace-nowrap">
                {portalUrl}
              </span>
              <button 
                onClick={handleCopy}
                className="ml-auto p-2 text-gray-400 hover:text-primary transition-colors"
                title="Copy Link"
              >
                {copied ? <FiCheckCircle className="text-green-500" /> : <FiCopy />}
              </button>
              <a 
                href={portalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
              >
                Open <FiExternalLink />
              </a>
            </div>
          </div>
          
          <div className="hidden md:flex flex-shrink-0 w-32 h-32 bg-primary/5 rounded-full items-center justify-center border-4 border-white shadow-inner">
            <span className="material-symbols-outlined text-5xl text-primary">school</span>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">login</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Automated Credentials</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            When a school administrator approves an admission, the system automatically generates a secure temporary password and emails it to the student. Their unique <strong>Admission Reference Number</strong> serves as their permanent Login ID.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Multi-Tenant Routing</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            The portal is completely dynamic. When a student logs in, the backend identifies their school based on their Admission ID. The dashboard instantly adapts to display their specific school's logo, colors, fee structures, and exams.
          </p>
        </div>
      </div>
      
      {/* Settings (Future-proofing) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-75">
        <div className="flex items-start gap-4">
          <FiInfo className="text-blue-500 text-xl mt-1" />
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Global Portal Access</h3>
            <p className="text-sm text-gray-500 mb-4">
              Advanced toggle settings to temporarily disable the student portal during global system maintenance will be available here.
            </p>
            <label className="flex items-center cursor-not-allowed">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked readOnly disabled />
                <div className="block bg-green-400 w-10 h-6 rounded-full opacity-50"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-4"></div>
              </div>
              <div className="ml-3 text-sm font-medium text-gray-400">Portal is globally active</div>
            </label>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentPortalSettings;
