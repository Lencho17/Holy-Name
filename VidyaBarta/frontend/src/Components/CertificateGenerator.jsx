import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCertificate, FaPrint, FaSearch, FaSpinner } from 'react-icons/fa';

const CertificateGenerator = ({ apiUrl, token }) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [certType, setCertType] = useState('Transfer Certificate');
  const [remarks, setRemarks] = useState('');

  // We could fetch students dynamically as user types, but for small-medium schools we can fetch all or search query
  const searchStudents = async () => {
    if (!search) return;
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/students?search=${search}`, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return alert('Select a student first');
    try {
      setGenerating(true);
      await axios.post(`${apiUrl}/certificates`, {
        student_id: selectedStudent.id,
        certificate_type: certType,
        remarks
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert(`${certType} generated and recorded for ${selectedStudent.student_name}!`);
      // Real app: generate PDF via html2canvas/jsPDF or backend puppeteer and trigger download here.
      
      setSelectedStudent(null);
      setSearch('');
      setStudents([]);
      setRemarks('');
    } catch (err) {
      alert('Failed to record certificate');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaCertificate className="text-yellow-600 text-2xl" />
        <h2 className="text-2xl font-black text-gray-800">Certificate Generator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Search & Select */}
        <div>
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Search Student</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && searchStudents()}
                placeholder="Search by name or admission ID" 
                className="w-full border-gray-200 p-2.5 rounded-lg text-sm" 
              />
              <button onClick={searchStudents} className="bg-gray-100 text-gray-700 p-2.5 rounded-lg hover:bg-gray-200">
                {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              </button>
            </div>
          </div>
          
          <div className="border border-gray-100 rounded-xl max-h-60 overflow-y-auto">
            {students.length > 0 ? students.map(st => (
              <div 
                key={st.id} 
                onClick={() => setSelectedStudent(st)}
                className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-yellow-50 transition-colors ${selectedStudent?.id === st.id ? 'bg-yellow-100 border-l-4 border-l-yellow-500' : ''}`}
              >
                <div className="font-bold text-gray-800">{st.student_name}</div>
                <div className="text-xs text-gray-500">ID: {st.admission_id} | Class: {st.grade}</div>
              </div>
            )) : <div className="p-4 text-center text-gray-400 text-sm">No students found. Search above.</div>}
          </div>
        </div>

        {/* RIGHT: Generate Form */}
        <div className="bg-yellow-50/50 p-6 rounded-xl border border-yellow-100">
          <h3 className="font-bold text-yellow-800 mb-4">Issue Certificate</h3>
          {selectedStudent ? (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-lg border border-yellow-200">
                <span className="text-xs text-gray-500">Selected Student</span>
                <div className="font-bold text-lg text-gray-800">{selectedStudent.student_name}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Certificate Type</label>
                <select value={certType} onChange={e => setCertType(e.target.value)} className="w-full border-gray-200 p-2.5 rounded-lg text-sm shadow-sm">
                  <option value="Transfer Certificate">Transfer Certificate (TC)</option>
                  <option value="Character Certificate">Character Certificate</option>
                  <option value="Bonafide Certificate">Bonafide Certificate</option>
                  <option value="Migration Certificate">Migration Certificate</option>
                  <option value="Provisional Marksheet">Provisional Marksheet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Remarks (Optional)</label>
                <textarea 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)} 
                  rows="2" 
                  className="w-full border-gray-200 p-2.5 rounded-lg text-sm shadow-sm"
                  placeholder="e.g. Conduct is good"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="bg-yellow-600 text-white w-full p-3 rounded-xl font-bold hover:bg-yellow-700 flex justify-center items-center gap-2 mt-4"
              >
                {generating ? <FaSpinner className="animate-spin" /> : <FaPrint />} 
                Generate & Record
              </button>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              Please select a student from the list to issue a certificate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
