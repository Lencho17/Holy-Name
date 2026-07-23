import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { FaCheckCircle, FaSpinner, FaShoppingCart, FaDownload } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdmissionCheckout() {
  const { refNum } = useParams();
  const navigate = useNavigate();
  const { API_URL, schoolProfile, siteData } = useContext(SiteDataContext);
  const apiBase = API_URL || import.meta.env.VITE_API_URL || '/api';

  const [admissionData, setAdmissionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kit, setKit] = useState(null);
  
  const [selectedOptional, setSelectedOptional] = useState({});
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (refNum) {
      axios.get(`${apiBase}/admissions/status?q=${refNum}`)
        .then(res => {
          const data = res.data.data || res.data;
          setAdmissionData(data);
          
          // Match the kit
          const kits = siteData?.admissionPage?.admissionKits || [];
          const grade = data.grade_applied || data.gradeApplied;
          const matchedKit = kits.find(k => k.className?.toUpperCase() === grade?.toUpperCase());
          setKit(matchedKit);
          
          if (matchedKit && matchedKit.optionalItems) {
            const initialOptional = {};
            matchedKit.optionalItems.forEach(item => {
              initialOptional[item.name] = false;
            });
            setSelectedOptional(initialOptional);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError("Could not load admission details.");
          setLoading(false);
        });
    }
  }, [refNum, apiBase, siteData]);

  const toggleOptional = (name) => {
    setSelectedOptional(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const getCompulsoryTotal = () => {
    if (!kit || !kit.compulsoryItems) return 0;
    return kit.compulsoryItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  };

  const getOptionalTotal = () => {
    if (!kit || !kit.optionalItems) return 0;
    return kit.optionalItems.reduce((sum, item) => {
      return selectedOptional[item.name] ? sum + (Number(item.price) || 0) : sum;
    }, 0);
  };

  const getTotal = () => getCompulsoryTotal() + getOptionalTotal();

  const handlePayment = async () => {
    setPaymentProcessing(true);
    try {
      const purchasedItems = [
        ...(kit?.compulsoryItems || []).map(i => ({ ...i, type: 'compulsory' })),
        ...(kit?.optionalItems || []).filter(i => selectedOptional[i.name]).map(i => ({ ...i, type: 'optional' }))
      ];
      
      const payload = {
        purchasedItems,
        paymentTotal: getTotal()
      };

      await axios.post(`${apiBase}/admissions/checkout/${refNum}`, payload);
      
      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const generateReceipt = async () => {
    const doc = new jsPDF();
    const primaryColor = [15, 23, 42]; 

    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    if (schoolProfile?.logo) {
      const logoImg = await loadImage(schoolProfile.logo);
      if (logoImg) doc.addImage(logoImg, 'PNG', 15, 8, 25, 25);
    }

    doc.setTextColor(...primaryColor);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(schoolProfile?.name || "Our School", 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(schoolProfile?.officeAddress || "Assam, India", 105, 25, { align: 'center' });
    doc.text(`Phone: ${schoolProfile?.phone || ''} | Email: ${schoolProfile?.email || ''}`, 105, 30, { align: 'center' });

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(15, 36, 195, 36);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ADMISSION KIT RECEIPT", 105, 46, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Reference No: ${refNum}`, 15, 60);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')}`, 140, 60);
    doc.text(`Student Name: ${admissionData?.student_name || admissionData?.studentName || 'N/A'}`, 15, 70);
    doc.text(`Class: ${admissionData?.grade_applied || admissionData?.gradeApplied || 'N/A'}`, 140, 70);

    const tableData = [];
    if (kit?.compulsoryItems) {
      kit.compulsoryItems.forEach(item => {
        tableData.push([item.name, "Compulsory", `₹${item.price}`]);
      });
    }
    if (kit?.optionalItems) {
      kit.optionalItems.filter(i => selectedOptional[i.name]).forEach(item => {
        tableData.push([item.name, "Optional", `₹${item.price}`]);
      });
    }

    autoTable(doc, {
      startY: 80,
      head: [['Item Name', 'Category', 'Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      foot: [['', 'Total Paid', `₹${getTotal()}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.text("Thank you for your purchase.", 105, finalY + 20, { align: 'center' });
    doc.text("Please show this receipt to collect your items from the school office.", 105, finalY + 26, { align: 'center' });

    doc.save(`Receipt_${refNum}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 shadow-sm text-center">
          <p className="font-bold">{error}</p>
          <button onClick={() => navigate('/admission')} className="mt-4 text-sm underline">Go Back</button>
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-8 text-lg">Your admission form was submitted successfully (Ref: <strong>{refNum}</strong>). <br/><br/>No admission kit is configured for <strong>{admissionData?.grade_applied || admissionData?.gradeApplied}</strong> at this moment.</p>
          <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-5xl" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-8 text-lg">Your items have been recorded for Reference: <strong>{refNum}</strong>.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <span className="font-bold text-gray-700">Total Paid:</span>
              <span className="text-2xl font-black text-primary">₹{getTotal()}</span>
            </div>
            <p className="text-sm text-gray-500 text-center">Please download your receipt to collect the items from the school office.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={generateReceipt} className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
              <FaDownload /> Download Receipt
            </button>
            <button onClick={() => navigate('/')} className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Admission Kit</h1>
          <p className="text-gray-600 text-lg">Select and purchase your required items for {admissionData?.grade_applied || admissionData?.gradeApplied}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Compulsory Items */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                Compulsory Items
                <span className="text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase tracking-wider">Required</span>
              </h2>
              
              <div className="space-y-4">
                {kit.compulsoryItems && kit.compulsoryItems.length > 0 ? kit.compulsoryItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center">
                        <FaCheckCircle className="text-sm" />
                      </div>
                      <span className="font-bold text-gray-800">{item.name}</span>
                    </div>
                    <span className="font-black text-gray-900">₹{item.price}</span>
                  </div>
                )) : (
                  <p className="text-gray-500 italic">No compulsory items configured.</p>
                )}
              </div>
            </div>

            {/* Optional Items */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                Optional Items
                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">Optional</span>
              </h2>
              
              <div className="space-y-4">
                {kit.optionalItems && kit.optionalItems.length > 0 ? kit.optionalItems.map((item, idx) => (
                  <label key={idx} className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all ${selectedOptional[item.name] ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={!!selectedOptional[item.name]} 
                      onChange={() => toggleOptional(item.name)} 
                    />
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center border-2 ${selectedOptional[item.name] ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                        {selectedOptional[item.name] && <FaCheckCircle className="text-sm" />}
                      </div>
                      {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-100" />}
                      <span className={`font-bold ${selectedOptional[item.name] ? 'text-blue-900' : 'text-gray-700'}`}>{item.name}</span>
                    </div>
                    <span className="font-black text-gray-900">₹{item.price}</span>
                  </label>
                )) : (
                  <p className="text-gray-500 italic">No optional items configured.</p>
                )}
              </div>
            </div>

          </div>

          {/* Order Summary Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-primary text-white rounded-3xl p-8 shadow-xl sticky top-32">
              <h3 className="text-2xl font-black mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-white/80">
                  <span>Compulsory Total</span>
                  <span className="font-bold text-white">₹{getCompulsoryTotal()}</span>
                </div>
                <div className="flex justify-between items-center text-white/80 pb-4 border-b border-white/20">
                  <span>Optional Total</span>
                  <span className="font-bold text-white">₹{getOptionalTotal()}</span>
                </div>
                <div className="flex justify-between items-center text-xl">
                  <span className="font-bold">Total to Pay</span>
                  <span className="font-black">₹{getTotal()}</span>
                </div>
              </div>

              <button 
                onClick={handlePayment} 
                disabled={paymentProcessing}
                className={`w-full bg-white text-primary font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${paymentProcessing ? 'opacity-80 cursor-not-allowed' : 'hover:scale-105 hover:shadow-white/20'}`}
              >
                {paymentProcessing ? (
                  <><FaSpinner className="animate-spin" /> Processing...</>
                ) : (
                  <><FaShoppingCart /> Pay ₹{getTotal()}</>
                )}
              </button>
              <p className="text-white/60 text-xs text-center mt-4">Secure payment processing</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdmissionCheckout;
