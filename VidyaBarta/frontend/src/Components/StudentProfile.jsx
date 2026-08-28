import React, { useContext } from 'react';
import { StudentAuthContext } from '../context/StudentAuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaIdCard, FaUniversity, FaUsers, FaArrowRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const StudentProfile = ({ udiseData }) => {
  const { student } = useContext(StudentAuthContext);
  const navigate = useNavigate();

  const glassCard = "bg-white border border-gray-200 shadow-sm rounded-xl";

  const renderSection = (title, icon, data) => (
    <div className={`${glassCard} overflow-hidden mb-6`}>
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(data).map(([key, value]) => {
            if (value === undefined || value === null || value === '') return null;
            return (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim().replace(/_/g, ' ')}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {value === true ? 'Yes' : value === false ? 'No' : value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your personal and UDISE information.</p>
        </div>
      </div>

      {/* Basic Student Info (from `students` table) */}
      <div className={`${glassCard} overflow-hidden mb-6 flex flex-col md:flex-row items-center p-6 gap-8`}>
        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-4 border-white shadow-md">
          <span className="text-4xl font-black text-indigo-500">{student.name.charAt(0)}</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-indigo-600 font-semibold mb-2">Class {student.grade} {student.section ? `- ${student.section}` : ''}</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              ID: {student.rollNumber}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">cake</span>
              DOB: {new Date(student.dateOfBirth).toLocaleDateString('en-GB')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">wc</span>
              Gender: {student.gender}
            </span>
          </div>
        </div>
      </div>

      {/* UDISE Info */}
      {!udiseData ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-yellow-800 mb-2">UDISE Profile Incomplete</h3>
          <p className="text-yellow-700 mb-6 max-w-lg mx-auto">
            You must complete your mandatory UDISE profile data for this academic year to keep your records updated with the government guidelines.
          </p>
          <button 
            onClick={() => navigate('/student-udise-form')}
            className="bg-yellow-600 text-white font-bold py-3 px-8 rounded-xl shadow hover:bg-yellow-700 transition-all flex items-center gap-2 mx-auto"
          >
            Complete Form Now <FaArrowRight />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
            <FaCheckCircle className="text-xl" />
            <span className="font-bold">Your UDISE profile is complete and verified.</span>
          </div>

          {renderSection("Personal Details (UDISE)", <FaIdCard />, {
            "Aadhaar Name": udiseData.nameAsPerAadhaar,
            "Blood Group": udiseData.bloodGroup,
            "Category": udiseData.category,
            "Religion": udiseData.religion,
            "Mother Tongue": udiseData.motherTongue,
            "Minority Group": udiseData.minorityGroup,
            "Height (cm)": udiseData.height,
            "Weight (kg)": udiseData.weight,
          })}

          {renderSection("Parent / Guardian Details", <FaUsers />, {
            "Mother Name": udiseData.motherTitle ? `${udiseData.motherTitle} ${udiseData.motherName}` : udiseData.motherName,
            "Mother Aadhaar": udiseData.motherAadhaar,
            "Father Name": udiseData.fatherTitle ? `${udiseData.fatherTitle} ${udiseData.fatherName}` : udiseData.fatherName,
            "Father Aadhaar": udiseData.fatherAadhaar,
            "Guardian Name": udiseData.guardianName,
            "Guardian Relation": udiseData.guardianRelation
          })}

          {renderSection("Bank Details", <FaUniversity />, {
            "Bank AC No": udiseData.bankAcNo || udiseData.parentBankAc,
            "Bank IFSC": udiseData.bankIfsc || udiseData.parentBankIfsc,
          })}

          {renderSection("Additional Info", <FaIdCard />, {
            "Has Relatives in School": udiseData.hasRelative || udiseData.hasSiblings || 'No',
            "Relative Name": udiseData.relativeName || udiseData.siblingName,
            "Relation": udiseData.relativeRelation,
            "Relative Class": udiseData.relativeClass || udiseData.siblingClass ? `${udiseData.relativeClass || udiseData.siblingClass} ${udiseData.relativeSection || udiseData.siblingSection || ''}`.trim() : null,
            "RTE Beneficiary": udiseData.rteDetails !== 'None' ? 'Yes' : 'No',
            "RTE Amount": udiseData.rteAmount,
            "BPL Beneficiary": udiseData.bplBeneficiary,
            "Free Uniform": udiseData.freeUniform,
            "Free Transport": udiseData.freeTransport,
            "New Commer": udiseData.isNewCommer,
          })}
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
