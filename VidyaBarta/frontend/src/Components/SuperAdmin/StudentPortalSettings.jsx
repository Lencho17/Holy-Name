import React, { useState } from 'react';
import { FiExternalLink, FiInfo, FiCopy, FiCheckCircle } from 'react-icons/fi';

const StudentPortalSettings = () => {
  const [copied, setCopied] = useState(false);
  
  const portalUrl = "https://student.vidyabarta.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Student Portal Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage centralized student access and routing settings.</p>
      </div>

      {/* Main Link Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
        <div className="flex-1 pl-2">
          <h2 className="text-base font-bold text-gray-800">Central Login Link</h2>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Universal portal URL for all students across the platform.
          </p>
          <div className="flex items-center gap-2 max-w-md">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm font-mono text-gray-700 truncate">{portalUrl}</span>
            </div>
            <button 
              onClick={handleCopy}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors flex-shrink-0"
              title="Copy"
            >
              {copied ? <FiCheckCircle className="text-green-500" /> : <FiCopy />}
            </button>
            <a 
              href={portalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              Open <FiExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">login</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Automated Credentials</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              System generates secure passwords and emails students upon admission approval. The <span className="font-semibold text-gray-800">Admission Reference Number</span> acts as the Login ID.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start">
          <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">hub</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Multi-Tenant Routing</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Portal dynamically adapts to display the specific school's logo, colors, and data based on the student's Admission ID at login.
            </p>
          </div>
        </div>
      </div>
      
      {/* Settings Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <FiInfo className="text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Global Portal Access</h3>
                <p className="text-xs text-gray-500 mt-1">Temporarily suspend all student logins during system maintenance.</p>
              </div>
              <label className="flex items-center cursor-not-allowed">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked readOnly disabled />
                  <div className="block bg-green-400 w-9 h-5 rounded-full opacity-50"></div>
                  <div className="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition transform translate-x-4"></div>
                </div>
                <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Active</span>
              </label>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentPortalSettings;
