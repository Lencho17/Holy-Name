import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileAlt, FaDownload, FaSpinner } from 'react-icons/fa';

const ResultsPortal = ({ apiUrl, token }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/exams`, { headers: { Authorization: `Bearer ${token}` } });
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [apiUrl, token]);

  if (loading) return <div className="p-8 text-center text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading exams...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaFileAlt className="text-teal-600 text-2xl" />
        <h2 className="text-2xl font-black text-gray-800">Results & Marksheets</h2>
      </div>

      <div className="bg-teal-50/50 rounded-xl p-5 border border-teal-100">
        <h3 className="font-bold text-teal-800 mb-4">Generate Marksheets for Exams</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => (
            <div key={exam._id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-800">{exam.name}</div>
                <div className="text-xs text-gray-500">Class {exam.class_level} • Status: {exam.status}</div>
              </div>
              <button 
                onClick={() => {
                  import('jspdf').then(({ default: jsPDF }) => {
                    import('jspdf-autotable').then(() => {
                      const doc = new jsPDF();
                      doc.text(`Marksheet for ${exam.name}`, 14, 20);
                      doc.text(`Class: ${exam.class_level}`, 14, 30);
                      doc.autoTable({
                        startY: 40,
                        head: [['Subject', 'Max Marks', 'Marks Obtained']],
                        body: [
                          ['Mathematics', '100', '85'],
                          ['Science', '100', '92'],
                          ['English', '100', '78']
                        ]
                      });
                      doc.save(`Marksheet_${exam.name.replace(/\\s+/g, '_')}.pdf`);
                    });
                  });
                }}
                className="bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-200"
              >
                <FaDownload /> Download
              </button>
            </div>
          ))}
          {exams.length === 0 && (
             <div className="text-sm text-gray-400">No exams available for result generation.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPortal;
