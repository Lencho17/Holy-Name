import React, { useState } from 'react';
import axios from 'axios';
import { FaFileUpload, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const BulkUpload = ({ apiUrl, endpoint, token, entityName, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      setMessage('Please select a CSV file first.');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error');
      setMessage('Only CSV files are supported.');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setMessage('');

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
      setMessage(res.data.message || `Successfully uploaded ${entityName}`);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
      
      // Reset input
      const fileInput = document.getElementById(`bulk-upload-${endpoint}`);
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error(`Bulk upload failed for ${entityName}:`, err);
      setUploadStatus('error');
      setMessage(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FaFileUpload className="text-primary" />
        <h4 className="font-bold text-sm text-gray-800">Bulk Upload {entityName} (CSV)</h4>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          id={`bulk-upload-${endpoint}`}
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          className="flex-1 text-xs border border-gray-300 rounded bg-white p-2 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        <button 
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? <FaSpinner className="animate-spin" /> : <FaFileUpload />}
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {uploadStatus && (
        <div className={`text-xs font-bold p-2 rounded flex items-center gap-2 ${uploadStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {uploadStatus === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          {message}
        </div>
      )}
      
      <div className="text-[10px] text-gray-500">
        Note: Ensure your CSV has the correct headers. For students: <span className="font-mono bg-white px-1">name, roll_number, class_level, section, email, phone</span>. For teachers: <span className="font-mono bg-white px-1">name, email, phone, designation, salary</span>.
      </div>
    </div>
  );
};

export default BulkUpload;
