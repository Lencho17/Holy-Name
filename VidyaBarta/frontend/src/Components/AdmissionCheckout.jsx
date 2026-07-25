import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { FaCheckCircle, FaSpinner, FaShoppingCart, FaDownload, FaUser, FaBoxOpen, FaCreditCard, FaArrowRight, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdmissionCheckout() {
  const { refNum } = useParams();
  const navigate = useNavigate();
  const { API_URL, schoolProfile, admissionPage, admissionFee } = useContext(SiteDataContext);
  const apiBase = API_URL || import.meta.env.VITE_API_URL || '/api';

  const [admissionData, setAdmissionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kit, setKit] = useState(null);

  // 3-step flow: 'verify', 'kit', 'payment'
  const [step, setStep] = useState('verify');
  const [selectedOptional, setSelectedOptional] = useState({});
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (refNum) {
      const schoolIdQuery = schoolProfile?.id ? `&school_id=${schoolProfile.id}` : '';
      axios.get(`${apiBase}/admissions/status?q=${refNum}${schoolIdQuery}`)
        .then(res => {
          const data = res.data.data || res.data;
          setAdmissionData(data);
          
          // Match the kit from admissionPage context
          const kits = admissionPage?.admissionKits || [];
          const grade = data.grade_applied || data.gradeApplied;
          const matchedKit = kits.find(k => k.className?.toUpperCase() === grade?.toUpperCase());
          setKit(matchedKit);
          
          // Default: all optional items are INCLUDED (user can exclude)
          if (matchedKit && matchedKit.optionalItems) {
            const initialOptional = {};
            matchedKit.optionalItems.forEach(item => {
              initialOptional[item.name] = true; // included by default
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
  }, [refNum, apiBase, admissionPage]);

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

  const ADMISSION_FEE = admissionData?.dynamic_admission_fee !== undefined && admissionData?.dynamic_admission_fee !== null 
    ? Number(admissionData.dynamic_admission_fee) 
    : 0;
  
  const Q1_FEE = admissionData?.dynamic_q1_fee ? Number(admissionData.dynamic_q1_fee) : 0;

  const getTotal = () => ADMISSION_FEE + Q1_FEE + getCompulsoryTotal() + getOptionalTotal();

  const handlePayment = async () => {
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setPaymentProcessing(true);
    setShowPaymentModal(false);
    try {
      const purchasedItems = [
        ...(kit?.compulsoryItems || []).map(i => ({ ...i, type: 'compulsory' })),
        ...(kit?.optionalItems || []).filter(i => selectedOptional[i.name]).map(i => ({ ...i, type: 'optional' }))
      ];
      
      const mockTxnId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const payload = {
        purchasedItems,
        paymentTotal: getTotal(),
        transactionId: mockTxnId
      };

      const res = await axios.post(`${apiBase}/admissions/checkout/${refNum}`, payload);
      
      setTransactionId(res.data.transactionId || mockTxnId);
      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Helper function for PDF generation
  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const addPdfHeader = async (doc) => {
    const primaryColor = [15, 23, 42];
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
    return primaryColor;
  };

  // Receipt 1: Proof of Payment
  const generatePaymentProof = async () => {
    const doc = new jsPDF();
    const primaryColor = await addPdfHeader(doc);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", 105, 46, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Official Proof of Payment", 105, 52, { align: 'center' });

    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    autoTable(doc, {
      startY: 62,
      body: [
        ['Reference Number', refNum],
        ['Transaction ID', transactionId || 'N/A'],
        ['Student Name', admissionData?.student_name || admissionData?.studentName || 'N/A'],
        ['Class Applied', admissionData?.grade_applied || admissionData?.gradeApplied || 'N/A'],
        ['Email', admissionData?.email || 'N/A'],
        ['Contact', admissionData?.contact_number || admissionData?.contactNumber || 'N/A'],
        ['Payment Date', dateStr],
        ['Total Amount Paid', `₹${getTotal()}`],
        ['Payment Status', 'SUCCESSFUL ✓'],
      ],
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, textColor: [100, 116, 139] },
        1: { fontStyle: 'bold', textColor: [15, 23, 42] }
      },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 15, right: 15 },
    });

    const finalY = doc.lastAutoTable.finalY || 150;
    
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(15, finalY + 10, 195, finalY + 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("This is a computer-generated receipt and does not require a physical signature.", 105, finalY + 20, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, finalY + 26, { align: 'center' });

    doc.save(`Payment_Receipt_${refNum}.pdf`);
  };

  // Receipt 2: Kit Items Invoice
  const generateKitInvoice = async () => {
    const doc = new jsPDF();
    const primaryColor = await addPdfHeader(doc);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ADMISSION KIT INVOICE", 105, 46, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Itemized List of Purchased Kit Items", 105, 52, { align: 'center' });

    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    doc.text(`Reference No: ${refNum}`, 15, 62);
    doc.text(`Date: ${dateStr}`, 140, 62);
    doc.text(`Student: ${admissionData?.student_name || admissionData?.studentName || 'N/A'}`, 15, 70);
    doc.text(`Class: ${admissionData?.grade_applied || admissionData?.gradeApplied || 'N/A'}`, 140, 70);

    const tableData = [];
    let slNo = 1;
    if (kit?.compulsoryItems) {
      kit.compulsoryItems.forEach(item => {
        tableData.push([slNo++, item.name, "Compulsory", `₹${Number(item.price) || 0}`]);
      });
    }
    if (kit?.optionalItems) {
      kit.optionalItems.filter(i => selectedOptional[i.name]).forEach(item => {
        tableData.push([slNo++, item.name, "Optional", `₹${Number(item.price) || 0}`]);
      });
    }
    const footArr = [
      ['', '', 'New Admission Fee', `₹${ADMISSION_FEE}`]
    ];
    if (Q1_FEE > 0) footArr.push(['', '', 'Quarter 1 Tuition Fee', `₹${Q1_FEE}`]);
    footArr.push(['', '', 'Compulsory Total', `₹${getCompulsoryTotal()}`]);
    footArr.push(['', '', 'Optional Total', `₹${getOptionalTotal()}`]);
    footArr.push(['', '', 'GRAND TOTAL', `₹${getTotal()}`]);

    autoTable(doc, {
      startY: 80,
      head: [['Sl.', 'Item Name', 'Category', 'Amount (₹)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 35 },
        3: { cellWidth: 30, halign: 'right' }
      },
      foot: footArr,
      footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold', fontSize: 10 },
      margin: { left: 15, right: 15 },
    });

    const finalY = doc.lastAutoTable.finalY || 150;
    
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(15, finalY + 10, 195, finalY + 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("Please present this invoice at the school office to collect your items.", 105, finalY + 20, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text(`Transaction ID: ${transactionId || 'N/A'}`, 105, finalY + 28, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, finalY + 34, { align: 'center' });

    doc.save(`Kit_Invoice_${refNum}.pdf`);
  };

  // Step indicator
  const steps = [
    { key: 'verify', label: 'Verify Details', icon: FaUser },
    { key: 'kit', label: 'Select Kit', icon: FaBoxOpen },
    { key: 'payment', label: 'Payment', icon: FaCreditCard }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-primary opacity-50" />
          <p className="text-gray-500 font-medium">Loading admission details...</p>
        </div>
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
          <button onClick={() => window.location.href = 'https://student.vidyabarta.com'} className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-primary/90 transition-all">
            Go to Your Account
          </button>
        </div>
      </div>
    );
  }

  // Payment success screen with 2 receipts
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success card */}
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100 mb-8">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <FaCheckCircle className="text-5xl" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-2">Reference: <strong className="text-gray-900">{refNum}</strong></p>
            <p className="text-gray-500 mb-6">Transaction ID: <strong className="text-gray-900 font-mono text-sm">{transactionId}</strong></p>
            
            <div className="bg-gradient-to-r from-primary/5 to-blue-50 p-6 rounded-2xl mb-8">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700">Total Amount Paid</span>
                <span className="text-3xl font-black text-primary">₹{getTotal()}</span>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-8">Your enrollment is now complete. Please download both receipts below for your records.</p>
          </div>

          {/* Receipt download cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={generatePaymentProof}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FaDownload className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Payment Receipt</h3>
              <p className="text-sm text-gray-500">Proof of payment with transaction details</p>
            </button>

            <button 
              onClick={generateKitInvoice}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FaDownload className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Kit Invoice</h3>
              <p className="text-sm text-gray-500">Itemized list of kit items with amounts</p>
            </button>
          </div>

          <div className="text-center mt-8">
            <button onClick={() => window.location.href = 'https://student.vidyabarta.com'} className="text-gray-500 hover:text-gray-700 font-medium text-sm underline">
              Go to Your Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = s.key === step;
            const isCompleted = idx < currentStepIndex;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
                    isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <FaCheck /> : <StepIcon />}
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all ${idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: Verify Details */}
        {step === 'verify' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Verify Your Details</h1>
              <p className="text-gray-500">Please confirm the information below is correct before proceeding.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Student Name', value: admissionData?.student_name || admissionData?.studentName },
                  { label: 'Class Applied', value: admissionData?.grade_applied || admissionData?.gradeApplied },
                  { label: 'Date of Birth', value: admissionData?.date_of_birth || admissionData?.dateOfBirth },
                  { label: 'Gender', value: admissionData?.gender },
                  { label: "Father's Name", value: admissionData?.father_name || admissionData?.fatherName },
                  { label: "Mother's Name", value: admissionData?.mother_name || admissionData?.motherName },
                  { label: 'Contact Number', value: admissionData?.contact_number || admissionData?.contactNumber },
                  { label: 'Email', value: admissionData?.email },
                  { label: 'Address', value: admissionData?.address },
                  { label: 'Reference No.', value: refNum },
                ].map((field, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{field.label}</span>
                    <span className="text-gray-900 font-semibold">{field.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setStep('kit')} 
                className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                Confirm & Continue <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Kit Selection */}
        {step === 'kit' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Admission Kit</h1>
              <p className="text-gray-500">Review items for <strong>{admissionData?.grade_applied || admissionData?.gradeApplied}</strong>. Optional items are included by default but can be removed.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Compulsory Items */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    Compulsory Items
                    <span className="text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase tracking-wider">Required</span>
                  </h2>
                  
                  <div className="space-y-3">
                    {kit.compulsoryItems && kit.compulsoryItems.length > 0 ? kit.compulsoryItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center">
                            <FaCheck className="text-xs" />
                          </div>
                          <span className="font-bold text-gray-800">{item.name}</span>
                        </div>
                        <span className="font-black text-gray-900">₹{Number(item.price) || 0}</span>
                      </div>
                    )) : (
                      <p className="text-gray-500 italic">No compulsory items configured.</p>
                    )}
                  </div>
                </div>

                {/* Optional Items */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    Optional Items
                    <span className="text-xs font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">Adjustable</span>
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">All optional items are included by default. Uncheck any you do not want.</p>
                  
                  <div className="space-y-3">
                    {kit.optionalItems && kit.optionalItems.length > 0 ? kit.optionalItems.map((item, idx) => (
                      <label key={idx} className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all ${selectedOptional[item.name] ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300 opacity-60'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={!!selectedOptional[item.name]} 
                          onChange={() => toggleOptional(item.name)} 
                        />
                        <div className="flex items-center gap-4">
                          <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${selectedOptional[item.name] ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                            {selectedOptional[item.name] && <FaCheck className="text-xs" />}
                          </div>
                          {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-100" />}
                          <span className={`font-bold ${selectedOptional[item.name] ? 'text-blue-900' : 'text-gray-500 line-through'}`}>{item.name}</span>
                        </div>
                        <span className="font-black text-gray-900">₹{Number(item.price) || 0}</span>
                      </label>
                    )) : (
                      <p className="text-gray-500 italic">No optional items configured.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-primary text-white rounded-3xl p-8 shadow-xl sticky top-32">
                  <h3 className="text-xl font-black mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-white/80 pb-3 border-b border-white/20">
                      <span>New Admission Fee</span>
                      <span className="font-bold text-white">₹{ADMISSION_FEE}</span>
                    </div>
                    {Q1_FEE > 0 && (
                      <div className="flex justify-between items-center text-white/80">
                        <span>Quarter 1 Tuition Fee</span>
                        <span className="font-bold text-white">₹{Q1_FEE}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-white/80">
                      <span>Compulsory Kit Total</span>
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
                    onClick={() => setStep('payment')} 
                    className="w-full bg-white text-primary font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
                  >
                    Continue to Payment <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-start mt-6">
              <button 
                onClick={() => setStep('verify')} 
                className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2"
              >
                <FaArrowLeft /> Back to Verification
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 'payment' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Complete Payment</h1>
              <p className="text-gray-500">Review your order and proceed to pay.</p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Summary Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider">Payment Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">New Admission Fee <span className="text-xs text-red-500 font-bold">(Required)</span></span>
                    <span className="font-bold">₹{ADMISSION_FEE}</span>
                  </div>
                  {Q1_FEE > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Quarter 1 Tuition Fee <span className="text-xs text-red-500 font-bold">(Required)</span></span>
                      <span className="font-bold">₹{Q1_FEE}</span>
                    </div>
                  )}
                  {(kit?.compulsoryItems || []).map((item, idx) => (
                    <div key={`c-${idx}`} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.name} <span className="text-xs text-red-500 font-bold">(Required)</span></span>
                      <span className="font-bold">₹{Number(item.price) || 0}</span>
                    </div>
                  ))}
                  {(kit?.optionalItems || []).filter(i => selectedOptional[i.name]).map((item, idx) => (
                    <div key={`o-${idx}`} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.name} <span className="text-xs text-blue-500 font-bold">(Optional)</span></span>
                      <span className="font-bold">₹{Number(item.price) || 0}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-3xl font-black text-primary">₹{getTotal()}</span>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400 font-bold text-xs">STUDENT</span><br/><span className="font-bold text-gray-900">{admissionData?.student_name || admissionData?.studentName}</span></div>
                  <div><span className="text-gray-400 font-bold text-xs">CLASS</span><br/><span className="font-bold text-gray-900">{admissionData?.grade_applied || admissionData?.gradeApplied}</span></div>
                  <div><span className="text-gray-400 font-bold text-xs">REF NO.</span><br/><span className="font-bold text-gray-900">{refNum}</span></div>
                  <div><span className="text-gray-400 font-bold text-xs">EMAIL</span><br/><span className="font-bold text-gray-900">{admissionData?.email}</span></div>
                </div>
              </div>

              {/* Pay Button */}
              <button 
                onClick={handlePayment} 
                disabled={paymentProcessing}
                className={`w-full bg-primary text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-xl transition-all ${paymentProcessing ? 'opacity-80 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-2xl'}`}
              >
                {paymentProcessing ? (
                  <><FaSpinner className="animate-spin" /> Processing Payment...</>
                ) : (
                  <><FaCreditCard /> Pay ₹{getTotal()}</>
                )}
              </button>
              <p className="text-gray-400 text-xs text-center mt-3">🔒 Secure payment processing</p>

              <div className="flex justify-start mt-6">
                <button 
                  onClick={() => setStep('kit')} 
                  className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2"
                >
                  <FaArrowLeft /> Back to Kit Selection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Mock Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Gateway header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <FaCreditCard className="text-sm" />
                </div>
                <span className="font-black text-lg">SecurePay Gateway</span>
              </div>
              <p className="text-white/70 text-sm">Secured by 256-bit SSL encryption</p>
            </div>

            <div className="p-6">
              <div className="bg-indigo-50 rounded-xl p-4 mb-6 text-center">
                <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Amount to Pay</p>
                <p className="text-4xl font-black text-indigo-700 mt-1">₹{getTotal()}</p>
                <p className="text-xs text-indigo-400 mt-1">Ref: {refNum}</p>
              </div>

              <p className="text-sm text-gray-500 text-center mb-6">
                This is a simulated payment gateway for demonstration purposes.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={processPayment}
                  className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <FaCheck /> Simulate Successful Payment
                </button>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default AdmissionCheckout;
