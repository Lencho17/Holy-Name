import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  FaFileUpload, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaDownload, 
  FaFileExcel, 
  FaFileCsv, 
  FaTimes, 
  FaInfoCircle,
  FaKey
} from 'react-icons/fa';

const BulkUpload = ({ apiUrl, endpoint, token, entityName = 'Teachers', onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSkipped, setShowSkipped] = useState(false);
  const fileInputRef = useRef(null);

  const isTeachers = endpoint === 'teachers';

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setUploadStatus('error');
      setErrorMessage('Please select a valid CSV or Excel file (.csv, .xlsx, .xls).');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setUploadStatus(null);
    setResultData(null);
    setErrorMessage('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadStatus(null);
    setResultData(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async (format = 'csv') => {
    try {
      const url = `${apiUrl}/bulk-upload/${endpoint}/template?format=${format}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch template from server');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${endpoint}_template.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      // Fallback client-side template download
      const headers = isTeachers 
        ? 'Full Name,Email,Phone,Designation,Role\nDr. Anita Sharma,anita.sharma@school.edu,9876543210,Senior Mathematics Teacher,Teacher\nRajesh Verma,rajesh.verma@school.edu,9876543211,Physics Teacher,Teacher\nSunita Roy,sunita.roy@school.edu,9876543212,English Teacher,Teacher'
        : 'Full Name,Roll Number,Class Level,Section,Email,Phone,Parents Name,Address\nAarav Sharma,2024001,Class 1,A,aarav.parent@example.com,9876543210,Ramesh Sharma,123 Main Street\nDiya Patel,2024002,Class 1,A,diya.parent@example.com,9876543211,Suresh Patel,456 Park Avenue';

      const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${endpoint}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      setErrorMessage('Please select a CSV or Excel file first.');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setResultData(null);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${apiUrl}/bulk-upload/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setUploadStatus('success');
      setResultData(res.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) {
        onUploadSuccess(res.data);
      }
    } catch (err) {
      console.error(`Bulk upload failed for ${entityName}:`, err);
      setUploadStatus('error');
      setErrorMessage(err.response?.data?.message || err.message || 'Upload failed. Please check the file and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      {/* Header and Download Template Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
            <FaFileUpload className="text-lg" />
          </div>
          <div>
            <h4 className="font-bold text-base text-gray-800">Bulk Upload {entityName}</h4>
            <p className="text-xs text-gray-500">Upload multiple records at once using CSV or Excel (.xlsx, .xls)</p>
          </div>
        </div>

        {/* Template Download Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleDownloadTemplate('csv')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-xs"
            title="Download CSV Template"
          >
            <FaDownload className="text-emerald-600" />
            <span>Sample CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownloadTemplate('xlsx')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-xs"
            title="Download Excel Template"
          >
            <FaFileExcel className="text-blue-600" />
            <span>Sample Excel</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px] ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/60 scale-[1.01]' 
            : file 
              ? 'border-emerald-300 bg-emerald-50/30' 
              : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <input 
          ref={fileInputRef}
          id={`bulk-upload-${endpoint}`}
          type="file" 
          accept=".csv, .xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-between gap-4 w-full max-w-md bg-white p-3 rounded-xl border border-emerald-200 shadow-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 overflow-hidden text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                {file.name.endsWith('.csv') ? <FaFileCsv size={20} /> : <FaFileExcel size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB • Ready to upload</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1">
              <FaFileUpload className="text-xl" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Drag & drop your file here, or <span className="text-blue-600 font-bold hover:underline">browse</span>
            </p>
            <p className="text-xs text-gray-400">Supported formats: .CSV, .XLSX, .XLS (up to 10MB)</p>
          </>
        )}
      </div>

      {/* Expected Headers Guide */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FaInfoCircle className="text-blue-500" />
          <span>Expected Column Headers in Spreadsheet:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {isTeachers ? (
            <>
              <span className="font-mono text-[11px] bg-white text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">Full Name *</span>
              <span className="font-mono text-[11px] bg-white text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">Email *</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Phone</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Designation</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Role (Teacher/Clerk)</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Gender</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Joining Date</span>
            </>
          ) : (
            <>
              <span className="font-mono text-[11px] bg-white text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">Full Name *</span>
              <span className="font-mono text-[11px] bg-white text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">Roll Number *</span>
              <span className="font-mono text-[11px] bg-white text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">Class Level *</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Section</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Email</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Phone</span>
              <span className="font-mono text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded">Parents Name</span>
            </>
          )}
        </div>

        {isTeachers && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/60 p-2 rounded-lg">
            <FaKey className="text-amber-500 shrink-0" />
            <span>Default credentials for newly uploaded staff: <strong>Staff@123</strong> or their 10-digit mobile number. Staff can sign into the Teacher Portal immediately.</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button 
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? <FaSpinner className="animate-spin text-sm" /> : <FaFileUpload className="text-sm" />}
          {isUploading ? `Uploading ${entityName}...` : `Upload & Process ${entityName}`}
        </button>
      </div>

      {/* Upload Feedback / Results */}
      {uploadStatus === 'success' && resultData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={16} />
            <div className="flex-1">
              <h5 className="text-xs font-bold text-emerald-900">{resultData.message || `Successfully processed ${entityName}!`}</h5>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                <span className="bg-emerald-100/80 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  Total: {resultData.totalProcessed || 0}
                </span>
                {resultData.insertedCount !== undefined && (
                  <span className="bg-white text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    Newly Added: {resultData.insertedCount}
                  </span>
                )}
                {resultData.updatedCount !== undefined && (
                  <span className="bg-white text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                    Updated: {resultData.updatedCount}
                  </span>
                )}
                {resultData.skippedCount > 0 && (
                  <button 
                    onClick={() => setShowSkipped(!showSkipped)}
                    className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded hover:bg-amber-200 transition-colors underline"
                  >
                    Skipped: {resultData.skippedCount} (Click to {showSkipped ? 'hide' : 'view'})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skipped Rows Details */}
          {showSkipped && resultData.skipped && resultData.skipped.length > 0 && (
            <div className="mt-2 pt-2 border-t border-emerald-200/60 max-h-36 overflow-y-auto">
              <p className="text-[11px] font-bold text-gray-700 mb-1">Skipped Rows:</p>
              <ul className="space-y-1 text-[11px] text-gray-600 font-mono">
                {resultData.skipped.map((s, idx) => (
                  <li key={idx} className="bg-white/80 p-1.5 rounded border border-gray-100">
                    Row {s.row}: {s.name ? `[${s.name}] ` : ''}{s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2.5">
          <FaExclamationTriangle className="text-red-600 mt-0.5 shrink-0" size={16} />
          <div className="flex-1">
            <h5 className="text-xs font-bold text-red-900">Upload Failed</h5>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
