import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { FaCalendarCheck, FaPaperPlane, FaCheckCircle, FaExclamationCircle, FaSearch, FaUserGraduate, FaUserTie, FaCloudUploadAlt, FaTimesCircle, FaMapMarkerAlt, FaPrint, FaRegClock } from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

function Appointment() {
  const { schoolProfile } = useContext(SiteDataContext);
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const initialForm = {
    category: '',
    name: '',
    phone: '',
    email: '',
    purpose: '',
    studentName: '',
    studentClass: '',
    gr_number: '',
    aadhaarNumber: '',
    appointmentDate: '',
    time_slot: '',
    address: '',
    po_ps: '',
    state: '',
    country: '',
    persons_count: 1
  };

  const [formData, setFormData] = useState(initialForm);
  const [schoolIdFile, setSchoolIdFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [appointmentResult, setAppointmentResult] = useState(null);
  const [isTimeLocked, setIsTimeLocked] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [schoolClosed, setSchoolClosed] = useState(false);

  // Tracking
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Time Lock check (10 PM to 5:30 AM IST)
  useEffect(() => {
    const checkTimeLock = () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      if (hours >= 22 || (hours < 5) || (hours === 5 && minutes <= 30)) {
        setIsTimeLocked(true);
      } else {
        setIsTimeLocked(false);
      }
    };
    checkTimeLock();
    const interval = setInterval(checkTimeLock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Time Slots on Date Change
  useEffect(() => {
    if (formData.appointmentDate) {
      setFetchingSlots(true);
      setSchoolClosed(false);
      setFormData(f => ({ ...f, time_slot: '' }));
      axios.get(`${apiBase}/appointments/slots?date=${formData.appointmentDate}`)
        .then(res => {
          if (Array.isArray(res.data) && res.data.length === 0) {
            setSchoolClosed(true);
          }
          setAvailableSlots(res.data || []);
        })
        .catch(err => {
          console.error(err);
          setAvailableSlots([]);
        })
        .finally(() => setFetchingSlots(false));
    }
  }, [formData.appointmentDate, apiBase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(f => ({ ...f, phone: value.replace(/\D/g, '').slice(0, 10) }));
    } else if (name === 'aadhaarNumber') {
      setFormData(f => ({ ...f, aadhaarNumber: value.replace(/\D/g, '').slice(0, 12) }));
    } else if (name === 'persons_count') {
      let val = parseInt(value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 2) val = 2; // Only two persons per appointment allowed
      setFormData(f => ({ ...f, persons_count: val }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isTimeLocked) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitted(false);

    if (!formData.category) {
      setSubmitError('Please select a category (Parent or Visitor).');
      setSubmitting(false);
      return;
    }

    if (formData.phone.length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      setSubmitting(false);
      return;
    }

    if (formData.category === 'Visitor' && formData.aadhaarNumber.length !== 12) {
      setSubmitError('Please enter a valid 12-digit Aadhaar number.');
      setSubmitting(false);
      return;
    }

    if (!formData.time_slot) {
      setSubmitError('Please select a time slot.');
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (schoolIdFile) fd.append('schoolIdCard', schoolIdFile);
      if (aadhaarFile) fd.append('aadhaarDocument', aadhaarFile);

      const res = await axios.post(`${apiBase}/appointments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAppointmentResult(res.data.appointment);
      setSubmitted(true);
      setFormData(initialForm);
      setSchoolIdFile(null);
      setAadhaarFile(null);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!trackInput.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);
    try {
      const res = await axios.get(`${apiBase}/appointments/track/${encodeURIComponent(trackInput.trim())}`);
      setTrackResult(res.data);
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Appointment not found.');
    } finally {
      setTrackLoading(false);
    }
  };

  const classOptions = [
    'Nursery', 'KG I', 'KG II',
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
  ];

  const statusColor = (s) => {
    switch(s) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handlePrintAllotment = () => {
    window.print();
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20 relative">
      {/* Hide hero and padding in print mode */}
      <div className="print:hidden">
        {/* Hero */}
        <section className="relative py-24 overflow-hidden bg-slate-900 mb-10">
          <div className="absolute inset-0 z-0">
            {schoolProfile?.pageHeroImages?.appointment ? (
              <img
                src={schoolProfile.pageHeroImages.appointment}
                alt="Book Appointment"
                className="w-full h-full object-cover opacity-50"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-slate-900 mix-blend-multiply" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.3),transparent)]" />
              </>
            )}
            {schoolProfile?.pageHeroImages?.appointment && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-900/60 mix-blend-multiply" />
            )}
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 mb-6 shadow-sm">
                <FaCalendarCheck className="text-blue-400 text-sm" />
                <span className="text-[11px] font-black tracking-[0.3em] text-blue-200 uppercase">
                  School Appointments
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white font-serif mb-6 tracking-tight">
                Book an <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500">Appointment</span>
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed italic">
                "Schedule your visit to Holy Name School. Parents and visitors can book appointments easily."
              </p>
            </div>
          </div>
          
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
          
          {/* School Timings Display */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 mb-8 flex items-center justify-between text-center sm:text-left flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <FaRegClock className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">School Timings</h3>
                <p className="text-gray-500 text-sm">Mon-Sat, 08:30 AM - 03:00 PM</p>
              </div>
            </div>
            {isTimeLocked && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-200">
                <FaExclamationCircle /> Online booking closed (10:00 PM - 5:30 AM)
              </div>
            )}
          </div>

          {/* Success State */}
          {submitted && appointmentResult ? (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle className="text-4xl" />
              </div>
              <h2 className="text-3xl font-serif font-black text-gray-800 mb-2">Appointment Booked!</h2>
              <p className="text-gray-500 mb-6">Your appointment has been successfully scheduled. Please save your appointment number for tracking.</p>
              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white inline-block mb-6">
                <p className="text-blue-200 text-xs font-black uppercase tracking-[0.2em] mb-1">Appointment Number</p>
                <p className="font-mono text-3xl font-black tracking-tight select-all">{appointmentResult.appointmentNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left mb-6">
                <div><span className="text-gray-400 font-bold uppercase text-[10px]">Category</span><p className="text-gray-800 font-medium">{appointmentResult.category}</p></div>
                <div><span className="text-gray-400 font-bold uppercase text-[10px]">Status</span><p className={`font-bold text-sm px-2 py-0.5 rounded-full w-fit ${statusColor(appointmentResult.status)}`}>{appointmentResult.status}</p></div>
              </div>
              <button onClick={() => { setSubmitted(false); setAppointmentResult(null); }}
                className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg">
                Book Another Appointment
              </button>
            </div>
          ) : (
            /* Form */
            <div className={`bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden ${isTimeLocked ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

              <h2 className="text-2xl font-serif font-bold text-primary mb-2 flex items-center relative z-10">
                <span className="w-2 h-8 bg-amber-500 rounded-full mr-3"></span>
                Book Your Visit
              </h2>
              <p className="text-gray-500 mb-8 relative z-10">Please select your category and fill in the required details.</p>

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center shadow-sm animate-fade-in">
                  <FaExclamationCircle className="text-xl mr-3 flex-shrink-0" />
                  <p className="font-medium">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative z-10">
                {/* Category Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-3">I am a... <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${formData.category === 'Parent' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="category" value="Parent" className="hidden" checked={formData.category === 'Parent'} onChange={handleChange} />
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.category === 'Parent' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                        <FaUserGraduate className="text-2xl" />
                      </div>
                      <span className={`font-bold ${formData.category === 'Parent' ? 'text-primary' : 'text-gray-600'}`}>Parent</span>
                      <span className="text-xs text-gray-400 text-center">Guardian of a student</span>
                    </label>
                    <label className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${formData.category === 'Visitor' ? 'border-amber-500 bg-amber-50/50 shadow-lg shadow-amber-100' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="category" value="Visitor" className="hidden" checked={formData.category === 'Visitor'} onChange={handleChange} />
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.category === 'Visitor' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                        <FaUserTie className="text-2xl" />
                      </div>
                      <span className={`font-bold ${formData.category === 'Visitor' ? 'text-amber-600' : 'text-gray-600'}`}>Visitor</span>
                      <span className="text-xs text-gray-400 text-center">General visitor</span>
                    </label>
                  </div>
                </div>

                {formData.category && (
                  <div className="animate-fade-in">
                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit number"
                          className={`w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${formData.phone.length > 0 && formData.phone.length < 10 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                        {formData.phone.length > 0 && formData.phone.length < 10 && (
                          <p className="text-red-500 text-[10px] mt-1">Enter a valid 10-digit number</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Optional"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Number of Persons <span className="text-red-500">*</span></label>
                        <input type="number" name="persons_count" value={formData.persons_count} onChange={handleChange} min="1" max="2" required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                        <p className="text-xs text-gray-400 mt-1">Max 2 persons per appointment</p>
                      </div>
                    </div>

                    {/* Date and Slots */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date <span className="text-red-500">*</span></label>
                        <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Time Slot <span className="text-red-500">*</span></label>
                        {fetchingSlots ? (
                          <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 animate-pulse">Loading slots...</div>
                        ) : schoolClosed ? (
                          <div className="w-full px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 font-medium text-sm flex items-center">
                            <FaTimesCircle className="mr-2"/> No slots available (School closed or fully booked).
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <select name="time_slot" value={formData.time_slot} onChange={handleChange} required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                            <option value="">Select a slot</option>
                            {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                          </select>
                        ) : (
                          <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500">Select a date first</div>
                        )}
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400"/> Address Details</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Address <span className="text-red-500">*</span></label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="Street, Locality"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">PO / PS</label>
                          <input type="text" name="po_ps" value={formData.po_ps} onChange={handleChange} placeholder="PO/PS"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                          <input type="text" name="state" value={formData.state} onChange={handleChange} required placeholder="State"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                          <input type="text" name="country" value={formData.country} onChange={handleChange} required placeholder="Country"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                        </div>
                      </div>
                    </div>

                    {/* Parent-specific Fields */}
                    {formData.category === 'Parent' && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-6 animate-fade-in">
                        <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><FaUserGraduate /> Student Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Student Name <span className="text-red-500">*</span></label>
                            <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} required placeholder="Student's full name"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Student Class <span className="text-red-500">*</span></label>
                            <select name="studentClass" value={formData.studentClass} onChange={handleChange} required
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                              <option value="">Select Class</option>
                              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Admission / GR Number</label>
                            <input type="text" name="gr_number" value={formData.gr_number} onChange={handleChange} placeholder="Required for auto-approval"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">School ID Card <span className="text-red-500">*</span></label>
                            <div className={`relative border-2 border-dashed rounded-xl p-3 transition-all text-center ${schoolIdFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-primary/30 bg-white'}`}>
                              <input type="file" accept="image/*,.pdf" onChange={(e) => setSchoolIdFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              {schoolIdFile ? (
                                <div className="flex items-center justify-center gap-2 text-green-700">
                                  <FaCheckCircle />
                                  <span className="font-medium text-xs truncate max-w-[150px]">{schoolIdFile.name}</span>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setSchoolIdFile(null); }} className="text-red-400 hover:text-red-600 ml-2"><FaTimesCircle /></button>
                                </div>
                              ) : (
                                <div className="text-gray-400">
                                  <FaCloudUploadAlt className="text-lg mx-auto mb-1" />
                                  <p className="text-[10px] font-bold">Upload ID (Image/PDF)</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visitor-specific Fields */}
                    {formData.category === 'Visitor' && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 mb-6 animate-fade-in">
                        <h3 className="font-bold text-amber-600 mb-4 flex items-center gap-2"><FaUserTie /> Visitor Identification</h3>
                        <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Aadhaar Number <span className="text-red-500">*</span></label>
                          <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} required
                            placeholder="12-digit Aadhaar number" maxLength={12}
                            className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all font-mono tracking-wider text-lg ${formData.aadhaarNumber.length > 0 && formData.aadhaarNumber.length < 12 ? 'border-red-300' : 'border-gray-200'}`} />
                          {formData.aadhaarNumber.length > 0 && formData.aadhaarNumber.length < 12 && (
                            <p className="text-red-500 text-[10px] mt-1">Aadhaar must be 12 digits</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Upload Aadhaar Card <span className="text-red-500">*</span></label>
                          <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all text-center ${aadhaarFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-amber-300 bg-white'}`}>
                            <input type="file" accept="image/*,.pdf" onChange={(e) => setAadhaarFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            {aadhaarFile ? (
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <FaCheckCircle />
                                <span className="font-medium text-sm truncate max-w-[200px]">{aadhaarFile.name}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setAadhaarFile(null); }} className="text-red-400 hover:text-red-600 ml-2"><FaTimesCircle /></button>
                              </div>
                            ) : (
                              <div className="text-gray-400">
                                <FaCloudUploadAlt className="text-2xl mx-auto mb-1" />
                                <p className="text-xs font-bold">Upload Aadhaar Card (Image/PDF)</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Purpose */}
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Purpose of Visit <span className="text-red-500">*</span></label>
                      <textarea name="purpose" value={formData.purpose} onChange={handleChange} required rows={4}
                        placeholder="Briefly describe the purpose of your visit..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none uppercase" />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 hidden sm:flex items-center"><FaExclamationCircle className="mr-1" /> All * fields are required</p>
                      <button type="submit" disabled={submitting || isTimeLocked}
                        className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center justify-center transform hover:-translate-y-1 ${submitting || isTimeLocked ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white hover:shadow-lg'}`}>
                        {submitting ? 'Booking...' : 'Book Appointment'} <FaPaperPlane className="ml-3" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Track Appointment */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 mt-10 relative overflow-hidden print:hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-br-full -ml-10 -mt-10 pointer-events-none"></div>
            <h2 className="text-2xl font-serif font-bold text-primary mb-2 flex items-center relative z-10">
              <span className="w-2 h-8 bg-blue-500 rounded-full mr-3"></span>
              Track Appointment
            </h2>
            <p className="text-gray-500 mb-6 relative z-10">Enter your appointment number to check its status or download your allotment.</p>
            <div className="flex gap-3 relative z-10">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={trackInput} onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
                  placeholder="e.g. HNS/APT/PAR/2026/0001"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono uppercase" />
              </div>
              <button onClick={handleTrack} disabled={trackLoading || !trackInput.trim()}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${trackLoading ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90 hover:shadow-lg'}`}>
                {trackLoading ? 'Searching...' : 'Track'}
              </button>
            </div>

            {trackError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center animate-fade-in">
                <FaExclamationCircle className="text-xl mr-3 flex-shrink-0" /><p className="font-medium">{trackError}</p>
              </div>
            )}

            {trackResult && (
              <div className="mt-6 bg-gray-50 rounded-2xl border border-gray-200 p-6 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-primary text-lg">{trackResult.appointmentNumber}</span>
                    <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${statusColor(trackResult.status)}`}>{trackResult.status}</span>
                  </div>
                  {trackResult.status === 'Approved' && (
                    <button onClick={handlePrintAllotment} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md transition-all">
                      <FaPrint className="mr-2" /> Print Allotment
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-400 font-bold uppercase text-xs">Category</span><p className="text-gray-800 font-medium">{trackResult.category}</p></div>
                  <div><span className="text-gray-400 font-bold uppercase text-xs">Purpose</span><p className="text-gray-800 font-medium">{trackResult.purpose}</p></div>
                  <div><span className="text-gray-400 font-bold uppercase text-xs">Booked On</span><p className="text-gray-800 font-medium">{new Date(trackResult.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                  <div><span className="text-gray-400 font-bold uppercase text-xs">Appointment Date</span><p className="text-gray-800 font-medium">{trackResult.appointmentDate ? new Date(trackResult.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p></div>
                  <div><span className="text-gray-400 font-bold uppercase text-xs">Time Slot</span><p className="text-gray-800 font-medium">{trackResult.timeSlot || 'N/A'}</p></div>
                </div>

                {trackResult.adminRemark && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">School's Remark</p>
                    <p className="text-sm text-emerald-800">{trackResult.adminRemark}</p>
                  </div>
                )}
                {trackResult.status === 'Rejected' && trackResult.adminCancelReason && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Cancellation Reason</p>
                    <p className="text-sm text-red-800">{trackResult.adminCancelReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Printable Allotment Document (Hidden on screen, visible on print) */}
        {trackResult && trackResult.status === 'Approved' && (
          <div className="hidden print:block absolute top-0 left-0 w-[210mm] min-h-[297mm] bg-white z-50 p-10 text-black">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-serif font-black uppercase">Holy Name School</h1>
              <h2 className="text-xl font-bold uppercase mt-2">Appointment Allotment Document</h2>
            </div>
            
            <div className="mb-6 flex justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Appointment Number</p>
                <p className="text-xl font-mono font-black">{trackResult.appointmentNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-500 uppercase">Date of Issue</p>
                <p className="text-lg font-bold">{new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="border border-black rounded-lg p-6 mb-6">
              <h3 className="font-bold border-b border-black pb-2 mb-4 uppercase">Visitor Details</h3>
              <div className="grid grid-cols-2 gap-y-4 text-lg">
                <div><span className="font-bold text-gray-600">Name:</span> {trackResult.name}</div>
                <div><span className="font-bold text-gray-600">Category:</span> {trackResult.category}</div>
                <div><span className="font-bold text-gray-600">Date of Meeting:</span> {trackResult.appointmentDate ? new Date(trackResult.appointmentDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                <div><span className="font-bold text-gray-600">Time of Meeting:</span> {trackResult.timeSlot || 'N/A'}</div>
                <div className="col-span-2"><span className="font-bold text-gray-600">Purpose of Visit:</span> {trackResult.purpose}</div>
                {trackResult.category === 'Parent' && (
                  <>
                    <div><span className="font-bold text-gray-600">Student Name:</span> {trackResult.studentName}</div>
                    <div><span className="font-bold text-gray-600">Class:</span> {trackResult.studentClass}</div>
                  </>
                )}
                {trackResult.category === 'Visitor' && (
                  <div className="col-span-2"><span className="font-bold text-gray-600">Aadhaar (Last 4 digits):</span> **** **** {trackResult.aadhaarNumber ? trackResult.aadhaarNumber.slice(-4) : 'N/A'}</div>
                )}
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg border border-black">
              <h3 className="font-bold text-lg mb-2 uppercase text-red-600">Terms of Visit & Requirements</h3>
              <ul className="list-disc pl-5 space-y-2 font-medium">
                <li>This document must be presented at the school security gate for entry.</li>
                <li>Only a maximum of 2 persons are allowed per appointment.</li>
                <li><strong className="text-black">MANDATORY:</strong> You must carry a Valid Govt ID (e.g., Aadhaar, PAN) as submitted during booking.</li>
                {trackResult.category === 'Parent' && (
                  <li><strong className="text-black">MANDATORY FOR PARENTS:</strong> You must carry the physical Student ID Card.</li>
                )}
                <li>Please arrive 10 minutes prior to your allocated time slot.</li>
                <li>The school administration reserves the right to cancel or reschedule the appointment without prior notice due to unforeseen circumstances.</li>
              </ul>
            </div>

            <div className="mt-24 flex justify-between items-end">
              <div className="border-t border-black pt-2 w-48 text-center font-bold">
                Visitor Signature
              </div>
              <div className="border-t border-black pt-2 w-48 text-center font-bold">
                Authorized Signatory
                <p className="text-xs font-normal mt-1">(Holy Name School)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointment;
