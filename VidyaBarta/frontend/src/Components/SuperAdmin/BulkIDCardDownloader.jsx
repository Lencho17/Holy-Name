import React, { useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FaDownload, FaTimes, FaSpinner } from 'react-icons/fa';
import { generatePDFData, generateImageCard } from '../../utils/IDCardGenerator';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const BulkIDCardDownloader = ({ school, onClose }) => {
  const [format, setFormat] = useState('pdf');
  const [targetGroup, setTargetGroup] = useState('both'); // students, staff, both
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setProgress(5);

      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/superadmin/schools/${school.id}/id-cards-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { students, staff, schoolProfile } = res.data;
      
      let toProcess = [];
      if (targetGroup === 'students' || targetGroup === 'both') toProcess = [...toProcess, ...students];
      if (targetGroup === 'staff' || targetGroup === 'both') toProcess = [...toProcess, ...staff];

      if (toProcess.length === 0) {
        alert('No data found for the selected group.');
        setLoading(false);
        return;
      }

      setProgress(20);
      const zip = new JSZip();

      const total = toProcess.length;
      let completed = 0;

      for (const person of toProcess) {
        const id = person.admission_id || person.employee_id || person.id;
        const name = person.student_name || person.name || 'Unknown';
        const role = person.role || (person.class_name ? 'Student' : 'Staff');
        const fileName = `${role}_${id}_${name.replace(/[^a-z0-9]/gi, '_')}`;

        if (format === 'pdf') {
          const pdfData = generatePDFData(person, schoolProfile);
          zip.file(`${fileName}.pdf`, pdfData);
        } else {
          const ext = format === 'jpeg' ? 'jpeg' : 'png';
          const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const imgBase64 = await generateImageCard(person, schoolProfile, mime);
          zip.file(`${fileName}.${ext}`, imgBase64, { base64: true });
        }
        
        completed++;
        setProgress(20 + Math.floor((completed / total) * 60));
      }

      setProgress(85);
      
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `${school.name}_IDCards_${targetGroup}.${format === 'pdf' ? 'zip' : 'zip'}`);
      
      setProgress(100);
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Failed to download ID cards', err);
      alert('Failed to generate bulk ID cards.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        <div className="flex justify-between items-center p-5 border-b border-outline-variant bg-surface">
          <h3 className="text-title-md font-bold text-neutral flex items-center gap-2">
            <FaDownload className="text-primary" /> Bulk Download ID Cards
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-neutral p-2 transition-colors">
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-body-md text-on-surface-variant">
            Download ID cards for <strong>{school.name}</strong>. A zip file will be generated containing the selected cards.
          </p>

          <div>
            <label className="block text-label-md font-medium text-neutral mb-2">Target Group</label>
            <div className="grid grid-cols-3 gap-3">
              {['both', 'students', 'staff'].map((grp) => (
                <button
                  key={grp}
                  onClick={() => setTargetGroup(grp)}
                  className={`py-2 px-3 rounded-xl border text-body-sm font-bold capitalize transition-all ${targetGroup === grp ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface border-outline-variant text-neutral hover:bg-surface-variant'}`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-label-md font-medium text-neutral mb-2">Format</label>
            <div className="grid grid-cols-3 gap-3">
              {['pdf', 'jpeg', 'png'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-3 rounded-xl border text-body-sm font-bold uppercase transition-all ${format === fmt ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface border-outline-variant text-neutral hover:bg-surface-variant'}`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-label-sm text-neutral font-medium">
                <span>Generating ID Cards...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-outline-variant bg-surface flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-label-md font-bold text-neutral hover:bg-surface-variant rounded-xl border border-outline-variant transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleDownload} disabled={loading} className="px-5 py-2.5 text-label-md font-bold text-white bg-primary hover:bg-primary/90 rounded-xl flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50">
            {loading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
            {loading ? 'Generating...' : 'Start Download'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkIDCardDownloader;
