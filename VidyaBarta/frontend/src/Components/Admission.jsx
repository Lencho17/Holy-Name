import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { SiteDataContext } from '../context/SiteDataContext';
import { FaFileDownload, FaBuilding, FaInfoCircle, FaLaptop, FaMoneyCheckAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';

function Admission() {
  const { admissionPage, API_URL: ctxApiUrl } = useContext(SiteDataContext);
  const apiBase = ctxApiUrl || import.meta.env.VITE_API_URL || '/api';

  const [leadForm, setLeadForm] = useState({
    student_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [downloadRef, setDownloadRef] = useState(null);

  const handleInputChange = (e) => {
    setLeadForm({ ...leadForm, [e.target.name]: e.target.value });
  };

  const handleProspectusSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${apiBase}/admissions/prospectus`, leadForm);
      const { refNum } = res.data;
      
      // Simulate Payment Verification
      const verifyRes = await axios.post(`${apiBase}/admissions/prospectus/verify`, { refNum });
      
      if (verifyRes.data.success) {
        setDownloadRef(refNum);
        setMessage({ type: 'success', text: 'Payment successful! Downloading prospectus...' });
        generateProspectusPDF(refNum, leadForm.student_name);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit form.' });
    } finally {
      setLoading(false);
    }
  };

  const generateProspectusPDF = (refNum, name) => {
    if (admissionPage?.prospectusPdfLink) {
      window.open(admissionPage.prospectusPdfLink, '_blank');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Admission Prospectus 2026", 20, 20);
    doc.setFontSize(14);
    doc.text(`Reference Number: ${refNum}`, 20, 35);
    doc.text(`Student Name: ${name}`, 20, 45);
    doc.setFontSize(12);
    doc.text("Thank you for downloading our prospectus.", 20, 60);
    doc.text("Please click 'Apply Online' to submit your full application.", 20, 70);
    doc.save(`Prospectus_${refNum}.pdf`);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      
      {/* 1. Advertisements Carousel */}
      {admissionPage?.advertisements?.length > 0 && (
        <section className="w-full bg-blue-900 py-10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto snap-x gap-6 pb-4">
            {admissionPage.advertisements.map((ad, idx) => (
              <img 
                key={idx} 
                src={ad} 
                alt={`Advertisement ${idx + 1}`} 
                className="h-64 object-cover rounded-2xl snap-center shadow-xl border-4 border-white/20"
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        {/* VidyaBarta Disclaimer */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
          <FaInfoCircle className="text-indigo-500 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest">VidyaBarta Portal Integration</h4>
            <p className="text-sm text-indigo-700 leading-relaxed mt-1 font-medium">
              Note: All details regarding Admissions, Appointments, Job Applications, and Tenders are securely processed through the official VidyaBarta website portal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Rules & Vacant Seats */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Vacant Seats */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 flex items-center">
              <FaBuilding className="text-primary mr-3" /> Vacant Seats
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-bold text-gray-700 rounded-tl-xl">Class</th>
                    <th className="p-4 font-bold text-gray-700 rounded-tr-xl">Available Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {admissionPage?.vacantSeats?.map((seat, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{seat.className}</td>
                      <td className="p-4 font-bold text-primary">{seat.vacant}</td>
                    </tr>
                  ))}
                  {(!admissionPage?.vacantSeats || admissionPage.vacantSeats.length === 0) && (
                    <tr>
                      <td colSpan="2" className="p-4 text-center text-gray-500">No vacant seats information available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rules and Regulations */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 flex items-center">
              <FaInfoCircle className="text-amber-500 mr-3" /> Rules & Regulations
            </h2>
            <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
              {admissionPage?.rules}
            </div>
          </section>

          {/* Procedures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl shadow-sm border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <FaBuilding className="mr-2" /> Offline Admission
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{admissionPage?.offlineProcedure}</p>
            </section>
            
            <section className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-3xl shadow-sm border border-amber-100">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                <FaLaptop className="mr-2" /> Online Admission
              </h3>
              <p className="text-gray-600 whitespace-pre-line">{admissionPage?.onlineProcedure}</p>
            </section>
          </div>
        </div>

        {/* Right Column: Download Form & Apply Online */}
        <div className="space-y-6">
          
          {/* Apply Online Sticky Action */}
          <div className="bg-primary text-white p-8 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <h2 className="text-2xl font-bold mb-3 relative z-10">Ready to Apply?</h2>
            <p className="text-white/80 mb-6 relative z-10 text-sm">Submit your documents and apply directly for admission.</p>
            <NavLink 
              to="/admission/form" 
              className="block w-full bg-white text-primary text-center font-bold py-4 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative z-10"
            >
              Apply Online Now
            </NavLink>
          </div>

          {/* Download Prospectus Form */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
              <FaFileDownload className="text-primary mr-2" /> Download Prospectus
            </h2>
            <p className="text-sm text-gray-500 mb-6">Fill this form and complete the Rs.500 payment to download the prospectus.</p>

            {message && (
              <div className={`p-4 mb-6 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.type === 'success' ? <FaCheckCircle className="mt-1" /> : <FaInfoCircle className="mt-1" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {!downloadRef ? (
              <form onSubmit={handleProspectusSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Student Name</label>
                  <input required type="text" name="student_name" value={leadForm.student_name} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input required type="email" name="email" value={leadForm.email} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                  <input required type="tel" name="phone" value={leadForm.phone} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                  <textarea required name="address" value={leadForm.address} onChange={handleInputChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-[80px]" />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaMoneyCheckAlt />}
                  Pay & Download
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">Your Reference Number:</p>
                <p className="text-2xl font-mono font-bold text-primary mb-6">{downloadRef}</p>
                <button 
                  onClick={() => generateProspectusPDF(downloadRef, leadForm.student_name)}
                  className="bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Download Again
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}

export default Admission;
