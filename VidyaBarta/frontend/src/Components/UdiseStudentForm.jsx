import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaArrowLeft, FaCheck, FaFileUpload, FaHome } from 'react-icons/fa';
import { StudentAuthContext } from '../context/StudentAuthContext';
import WebcamCapture from './WebcamCapture';

const UdiseStudentForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { student } = useContext(StudentAuthContext);

  const formatGender = (g) => {
    if (!g) return '';
    const lower = g.toLowerCase();
    if (lower === 'male') return 'Male';
    if (lower === 'female') return 'Female';
    if (lower === 'transgender') return 'Transgender';
    return g;
  };
  
  const [formData, setFormData] = useState({
    studentName: student?.name || student?.student_name || '',
    nameAsPerAadhaar: '',
    gender: formatGender(student?.gender),
    dob: student?.date_of_birth || '',
    bloodGroup: student?.blood_group || '',
    aadhaarNumber: student?.aadhar_number || '',
    bankAcNo: '',
    bankIfsc: '',
    admissionNo: student?.admissionId || student?.admission_id || '',
    admissionDate: '',
    class: student?.grade || '',
    section: student?.section || '',
    rollNo: student?.roll_number || '',
    address: student?.address || '',
    landmark: '',
    pincode: '',
    postOffice: '',
    policeStation: '',
    district: '',
    primaryContact: student?.contact_number || '',
    alternateContact: '',
    email: student?.email || '',
    nationality: 'Indian',
    distanceFromSchool: '',
    height: '',
    weight: '',
    
    motherTitle: 'Mrs.',
    motherName: student?.mother_name || '',
    motherAadhaar: '',
    motherPan: '',
    motherEducation: '',
    fatherTitle: 'Mr.',
    fatherName: student?.father_name || '',
    fatherAadhaar: '',
    fatherPan: '',
    fatherEducation: '',
    guardianName: student?.guardian_name || '',
    guardianRelation: '',
    parentBankAc: '',
    parentBankIfsc: '',
    
    hasSiblings: 'No',
    siblingName: '',
    siblingClass: '',
    siblingSection: '',
    
    isNewCommer: student?.enrollment_status === 'Active' ? 'No' : 'Yes',
    prevYearStatus: '',
    prevGrade: '',
    prevResult: '',
    prevMarks: '',
    prevDaysAttended: '',
    rteDetails: 'NO',
    rteAmount: '0',
    
    academicStream: '',
    educationPen: '',
    languageGroup: 'English_Assamese_Hindi',
    mediumOfInstruction: '19-English',
    learningDisability: 'No',
    gifted: 'No',
    participationState: 'No',
    participationNcc: 'No',
    digitalDeviceCapability: 'Yes',
    
    motherTongue: '',
    socialCategory: '',
    minorityGroup: '',
    isBpl: 'No',
    isAay: 'No',
    isEws: 'No',
    isCwsn: 'No',
    isOutOfSchool: 'No',
    freeUniform: 'No',
    freeTransport: 'No',
    communicationPreference: 'Email',
    parentLivePhoto: null,
  });

  const [bankDetails, setBankDetails] = useState({ student: null, parent: null });

  // Auto-fetch Bank details from IFSC
  React.useEffect(() => {
    const fetchBank = async (ifsc, type) => {
      if (ifsc && ifsc.length === 11) {
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
          if (res.ok) {
            const data = await res.json();
            setBankDetails(prev => ({ ...prev, [type]: `${data.BANK}, ${data.BRANCH}` }));
          } else {
            setBankDetails(prev => ({ ...prev, [type]: 'Invalid IFSC Code' }));
          }
        } catch (e) {
          setBankDetails(prev => ({ ...prev, [type]: 'Failed to fetch bank details' }));
        }
      } else {
        setBankDetails(prev => ({ ...prev, [type]: null }));
      }
    };

    fetchBank(formData.bankIfsc, 'student');
  }, [formData.bankIfsc]);

  React.useEffect(() => {
    const fetchBank = async (ifsc, type) => {
      if (ifsc && ifsc.length === 11) {
        try {
          const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
          if (res.ok) {
            const data = await res.json();
            setBankDetails(prev => ({ ...prev, [type]: `${data.BANK}, ${data.BRANCH}` }));
          } else {
            setBankDetails(prev => ({ ...prev, [type]: 'Invalid IFSC Code' }));
          }
        } catch (e) {
          setBankDetails(prev => ({ ...prev, [type]: 'Failed to fetch bank details' }));
        }
      } else {
        setBankDetails(prev => ({ ...prev, [type]: null }));
      }
    };

    fetchBank(formData.parentBankIfsc, 'parent');
  }, [formData.parentBankIfsc]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const isBankCompulsory = () => {
    const c = String(formData.class || '').toUpperCase();
    return ['IX', 'X', 'XI', 'XII', '9', '10', '11', '12'].includes(c);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard'); // Go back to student portal on success
    }, 1500);
  };

  // Helper for input styles to keep it clean
  const inputClass = "w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const fileInputClass = "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-body-md">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-primary px-8 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pattern-grid-lg"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-headline-lg">UDISE Student Form</h1>
              <p className="mt-2 text-primary-100 font-medium">Please complete your profile to continue</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm">
              <FaHome size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
            
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-primary text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? <FaCheck /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:flex">
            <span>Student Data</span>
            <span>Family & Sibling</span>
            <span>Academic Info</span>
            <span>Social Data</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4">
          
          {/* Step 1: Student Data */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Category 1: Student Data</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Student's Full Name</label>
                  <input type="text" name="studentName" value={formData.studentName} readOnly className={`${inputClass} bg-gray-50 text-gray-500 font-medium`} />
                </div>
                <div>
                  <label className={labelClass}>Name as per Aadhaar</label>
                  <input type="text" name="nameAsPerAadhaar" value={formData.nameAsPerAadhaar} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                <div>
                  <label className={labelClass}>Student's Photo (Yellow BG)</label>
                  <input type="file" accept="image/*" className={fileInputClass} />
                </div>
                <div>
                  <label className={labelClass}>Student Full Signature (Compulsory)</label>
                  <input type="file" accept="image/*" className={fileInputClass} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClass} required disabled={!!student?.gender}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className={inputClass} required readOnly={!!student?.date_of_birth} />
                </div>
                <div>
                  <label className={labelClass}>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={inputClass} disabled={!!student?.blood_group}>
                    <option value="">Select...</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Aadhaar Card Number (Optional)</label>
                  <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} className={inputClass} readOnly={!!student?.aadhar_number} />
                </div>
                <div>
                  <label className={labelClass}>Aadhaar of student (Doc upload)</label>
                  <input type="file" className={fileInputClass} />
                </div>
              </div>

              {/* Bank Details */}
              {isBankCompulsory() && (
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Student Bank Details</h3>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase tracking-wide">Compulsory for Class {formData.class}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className={labelClass}>Bank A/C No.</label>
                      <input type="text" name="bankAcNo" value={formData.bankAcNo} onChange={handleInputChange} className={inputClass} required />
                    </div>
                    <div>
                    <label className={labelClass}>Bank IFSC</label>
                    <input type="text" name="bankIfsc" value={formData.bankIfsc} onChange={handleInputChange} maxLength="11" className={inputClass} required />
                    {bankDetails.student && (
                      <div className={`mt-1 text-xs font-bold ${bankDetails.student.includes('Invalid') || bankDetails.student.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                        {bankDetails.student}
                      </div>
                    )}
                  </div>
                    <div>
                      <label className={labelClass}>Passbook Upload</label>
                      <input type="file" className={fileInputClass} required />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className={labelClass}>Admission No.</label>
                  <input type="text" name="admissionNo" value={formData.admissionNo} readOnly className={`${inputClass} bg-gray-100 text-gray-500`} />
                </div>
                <div>
                  <label className={labelClass}>Admission Date</label>
                  <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Class (Auto-detected)</label>
                  <input type="text" name="class" value={formData.class} readOnly className={`${inputClass} bg-gray-100 text-gray-800 font-bold`} />
                </div>
                <div>
                  <label className={labelClass}>Section</label>
                  <input type="text" name="section" value={formData.section} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>

              <div className="space-y-4">
                <label className={labelClass}>Full Address (Editable)</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className={inputClass} required></textarea>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className={labelClass}>Landmark (Optional)</label><input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Pincode</label><input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className={inputClass} required /></div>
                  <div><label className={labelClass}>District</label><input type="text" name="district" value={formData.district} onChange={handleInputChange} className={inputClass} required /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className={labelClass}>Primary Contact</label><input type="text" name="primaryContact" value={formData.primaryContact} readOnly className={`${inputClass} bg-gray-50 text-gray-500`} /></div>
                <div><label className={labelClass}>Alternate Contact</label><input type="text" name="alternateContact" value={formData.alternateContact} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className={labelClass}>Email ID</label><input type="email" name="email" value={formData.email} readOnly className={`${inputClass} bg-gray-50 text-gray-500`} /></div>
              </div>
            </div>
          )}

          {/* Step 2: Parent/Guardian Data & Sibling Data */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Parent/Guardian Data</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* Mother Details */}
                  <div className="space-y-4 p-5 bg-pink-50/30 rounded-2xl border border-pink-100">
                    <h3 className="text-lg font-bold text-pink-800">Mother's Details</h3>
                    <div>
                      <label className={labelClass}>Name</label>
                      <div className="flex gap-2">
                        <select name="motherTitle" value={formData.motherTitle} onChange={handleInputChange} className={`${inputClass} w-1/3`}>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Late">Late</option>
                          <option value="Miss">Miss</option>
                        </select>
                        <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className={`${inputClass} w-2/3`} readOnly={!!student?.mother_name} />
                      </div>
                    </div>
                    <div><label className={labelClass}>Aadhaar Number</label><input type="text" name="motherAadhaar" value={formData.motherAadhaar} onChange={handleInputChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Aadhaar Document</label><input type="file" className={fileInputClass} /></div>
                    <div><label className={labelClass}>PAN Number</label><input type="text" name="motherPan" value={formData.motherPan} onChange={handleInputChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Education Level</label>
                      <select name="motherEducation" value={formData.motherEducation} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select...</option><option value="Below Secondary">Below Secondary</option><option value="Secondary">Secondary</option><option value="Graduate">Graduate</option><option value="Post Graduate">Post Graduate</option>
                      </select>
                    </div>
                  </div>

                  {/* Father Details */}
                  <div className="space-y-4 p-5 bg-blue-50/30 rounded-2xl border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-800">Father's Details</h3>
                    <div>
                      <label className={labelClass}>Name</label>
                      <div className="flex gap-2">
                        <select name="fatherTitle" value={formData.fatherTitle} onChange={handleInputChange} className={`${inputClass} w-1/3`}>
                          <option value="Mr.">Mr.</option>
                          <option value="Late">Late</option>
                        </select>
                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className={`${inputClass} w-2/3`} readOnly={!!student?.father_name} />
                      </div>
                    </div>
                    <div><label className={labelClass}>Aadhaar Number</label><input type="text" name="fatherAadhaar" value={formData.fatherAadhaar} onChange={handleInputChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Aadhaar Document</label><input type="file" className={fileInputClass} /></div>
                    <div><label className={labelClass}>PAN Number</label><input type="text" name="fatherPan" value={formData.fatherPan} onChange={handleInputChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Education Level</label>
                      <select name="fatherEducation" value={formData.fatherEducation} onChange={handleInputChange} className={inputClass}>
                        <option value="">Select...</option><option value="Below Secondary">Below Secondary</option><option value="Secondary">Secondary</option><option value="Graduate">Graduate</option><option value="Post Graduate">Post Graduate</option>
                      </select>
                    </div>
                  </div>
                </div>

              {(formData.motherTitle === 'Late' && formData.fatherTitle === 'Late') && (
                <div className="space-y-4 p-5 bg-orange-50/30 rounded-2xl border border-orange-100 mt-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-orange-800">Guardian's Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Guardian Name</label>
                      <input type="text" name="guardianName" value={formData.guardianName} onChange={handleInputChange} className={inputClass} required readOnly={!!student?.guardian_name} />
                    </div>
                    <div>
                      <label className={labelClass}>Relation to Student</label>
                      <input type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleInputChange} className={inputClass} required />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Parent's Bank Details & Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div><label className={labelClass}>Parent's Bank A/C No.</label><input type="text" name="parentBankAc" value={formData.parentBankAc} onChange={handleInputChange} className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Parent's Bank IFSC</label>
                    <input type="text" name="parentBankIfsc" value={formData.parentBankIfsc} onChange={handleInputChange} maxLength="11" className={inputClass} />
                    {bankDetails.parent && (
                      <div className={`mt-1 text-xs font-bold ${bankDetails.parent.includes('Invalid') || bankDetails.parent.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                        {bankDetails.parent}
                      </div>
                    )}
                  </div>
                  <div><label className={labelClass}>Bank A/C Doc Upload</label><input type="file" className={fileInputClass} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <WebcamCapture 
                      label="Parent/Guardian Live Photo (Auto Blue BG)" 
                      onCapture={(blob) => setFormData(prev => ({...prev, parentLivePhoto: blob}))} 
                    />
                  </div>
                  <div><label className={labelClass}>Parent/Guardian Signature Photo</label><input type="file" className={fileInputClass} /></div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mt-8">Category 1: Sibling Data</h2>
              <div>
                <label className={labelClass}>Whether student has siblings in the same school</label>
                <select name="hasSiblings" value={formData.hasSiblings} onChange={handleInputChange} className={`${inputClass} max-w-xs`}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {formData.hasSiblings === 'Yes' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <label className={labelClass}>Sibling Name</label>
                    <input type="text" name="siblingName" value={formData.siblingName} onChange={handleInputChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Sibling Class</label>
                    <input type="text" name="siblingClass" value={formData.siblingClass} onChange={handleInputChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Sibling Section</label>
                    <input type="text" name="siblingSection" value={formData.siblingSection} onChange={handleInputChange} className={inputClass} required />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Academic Data & Subjects */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Category 2: Academic Data</h2>
              
              <div>
                <label className={labelClass}>Are you a New Commer? (Auto-detected)</label>
                <select name="isNewCommer" value={formData.isNewCommer} disabled className={`${inputClass} max-w-xs bg-gray-100 text-gray-500 font-bold`}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Previous Year Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Previous academic year status</label>
                    <select name="prevYearStatus" value={formData.prevYearStatus} onChange={handleInputChange} className={inputClass}>
                      <option value="">Select...</option><option value="Studied at Current/Same School">Studied at Current/Same School</option><option value="Studied at Other School">Studied at Other School</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Grade/Class studied previous</label>
                    <select name="prevGrade" value={formData.prevGrade} onChange={handleInputChange} className={inputClass}>
                      <option value="">Select...</option><option value="X">X</option><option value="IX">IX</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className={labelClass}>Result</label><input type="text" value={formData.prevResult} readOnly className={`${inputClass} bg-gray-100 text-gray-500`} /></div>
                  <div><label className={labelClass}>Marks obtained (%)</label><input type="text" value={formData.prevMarks} readOnly className={`${inputClass} bg-gray-100 text-gray-500`} /></div>
                  <div><label className={labelClass}>Days attended in previous year</label><input type="text" value={formData.prevDaysAttended} readOnly className={`${inputClass} bg-gray-100 text-gray-500`} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelClass}>RTE Section 12C details</label><input type="text" name="rteDetails" value={formData.rteDetails} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className={labelClass}>Amount claimed from RTE entitlement</label><input type="text" name="rteAmount" value={formData.rteAmount} onChange={handleInputChange} className={inputClass} /></div>
              </div>

              <h3 className="text-xl font-bold text-primary border-b pb-2 mt-8">Current Year Subjects</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelClass}>Current Class</label><input type="text" value={formData.class} readOnly className={`${inputClass} bg-gray-100 text-gray-500 font-bold`} /></div>
                {['XI', 'XII', '11', '12'].includes(String(formData.class || '').toUpperCase()) && (
                  <div>
                    <label className={labelClass}>Academic Stream</label>
                    <select name="academicStream" value={formData.academicStream} onChange={handleInputChange} className={inputClass}>
                      <option value="">Select...</option><option value="Science">Science</option><option value="Arts">Arts</option><option value="Commerce">Commerce</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={labelClass}>Education PEN Number (Optional)</label>
                  <input type="text" name="educationPen" value={formData.educationPen} onChange={handleInputChange} placeholder="Permanent Education Number" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Language group studied</label>
                  <select name="languageGroup" value={formData.languageGroup} onChange={handleInputChange} className={inputClass}>
                    <option value="English_Assamese_Hindi">English_Assamese_Hindi</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Medium of instruction</label>
                  <select name="mediumOfInstruction" value={formData.mediumOfInstruction} onChange={handleInputChange} className={inputClass}>
                    <option value="19-English">19-English</option><option value="Assamese">Assamese</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Specific learning disability/ASD/ADHD?</label>
                  <select name="learningDisability" value={formData.learningDisability} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Has been identified Gifted</label>
                  <select name="gifted" value={formData.gifted} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Participation in state/national</label>
                  <select name="participationState" value={formData.participationState} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Participation in NCC/NSS/Scouts</label>
                  <select name="participationNcc" value={formData.participationNcc} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Digital device handling capability?</label>
                  <select name="digitalDeviceCapability" value={formData.digitalDeviceCapability} onChange={handleInputChange} className={inputClass}><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Demographic & Social Data */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Category 3: Demographic & Social Data</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Mother tongue</label>
                  <select name="motherTongue" value={formData.motherTongue} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select...</option><option value="Assamese">Assamese</option><option value="English">English</option><option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Social Category</label>
                  <select name="socialCategory" value={formData.socialCategory} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select...</option><option value="General">General</option><option value="SC">SC</option><option value="ST">ST</option><option value="OBC">OBC</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Minority Group</label>
                  <select name="minorityGroup" value={formData.minorityGroup} onChange={handleInputChange} className={inputClass}>
                    <option value="">Select...</option><option value="NA">NA</option><option value="Muslim">Muslim</option><option value="Christian">Christian</option>
                  </select>
                </div>
              </div>

              <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Whether BPL beneficiary?</label>
                    <select name="isBpl" value={formData.isBpl} onChange={handleInputChange} className={inputClass}>
                      <option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Whether Antyodaya Anna Yojana (AAY)?</label>
                    <select name="isAay" value={formData.isAay} onChange={handleInputChange} disabled={formData.isBpl === 'No'} className={`${inputClass} ${formData.isBpl === 'No' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}>
                      <option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Whether belongs to EWS?</label>
                  <select name="isEws" value={formData.isEws} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>CWSN (Children with Special Needs)?</label>
                  <select name="isCwsn" value={formData.isCwsn} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Whether identified as Out-of-School Child</label>
                  <select name="isOutOfSchool" value={formData.isOutOfSchool} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Free Uniform Provided?</label>
                  <select name="freeUniform" value={formData.freeUniform} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Free Transport Provided?</label>
                  <select name="freeTransport" value={formData.freeTransport} onChange={handleInputChange} className={inputClass}><option value="No">No</option><option value="Yes">Yes</option></select>
                </div>
                <div>
                  <label className={labelClass}>Communication Preference</label>
                  <select name="communicationPreference" value={formData.communicationPreference} onChange={handleInputChange} className={inputClass}>
                    <option value="Email">Email</option><option value="SMS">SMS</option><option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex gap-4">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all">
                  <FaArrowLeft /> Back
                </button>
              )}
            </div>
            
            <div className="flex gap-4">
              <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-transparent hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl transition-all active:scale-95 hidden sm:block">
                Fill Later
              </button>
              {step < totalSteps ? (
                <button type="button" onClick={nextStep} className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-container text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95">
                  Next <FaArrowRight />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : 'Submit Final Form'} <FaCheck />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UdiseStudentForm;
