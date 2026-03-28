import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaClipboardCheck,
  FaExclamationCircle,
  FaUserGraduate,
  FaCalendarAlt,
  FaIdBadge,
  FaGraduationCap,
  FaPrint,
  FaCheckCircle,
  FaFileAlt,
  FaUserCheck,
  FaPhoneAlt,
  FaEnvelope,
  FaArrowRight,
} from "react-icons/fa";
import { SiteDataContext } from "../context/SiteDataContext";

// Status pipeline in order
const STATUS_STEPS = [
  { key: "pending", label: "Submitted", icon: FaFileAlt },
  { key: "reviewed", label: "Reviewed", icon: FaClipboardCheck },
  { key: "accepted", label: "Accepted", icon: FaUserCheck },
];

function StudentPortal() {
  const { schoolProfile, API_URL } = useContext(SiteDataContext);

  const [query, setQuery] = useState("");
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setStatusData(null);

    try {
      const res = await axios.get(
        `${API_URL}/admissions/status?q=${encodeURIComponent(trimmed)}`
      );
      setStatusData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          "No application found. Please double-check your Reference Number or Email and try again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Something went wrong. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "accepted":
        return {
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          ring: "ring-green-500/20",
          label: "Accepted",
          icon: "✅",
          desc: "Congratulations! Your application has been accepted. Please visit the school office with all original documents to complete the admission formalities.",
        };
      case "rejected":
        return {
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          ring: "ring-red-500/20",
          label: "Rejected",
          icon: "❌",
          desc: "We regret to inform you that your application was not accepted at this time. Please contact the admissions office for more details.",
        };
      case "reviewed":
        return {
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          ring: "ring-blue-500/20",
          label: "Under Review",
          icon: "📋",
          desc: "Your application has been reviewed by the admissions committee. An interview date will be allotted shortly.",
        };
      default:
        return {
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          ring: "ring-amber-500/20",
          label: "Pending",
          icon: "⏳",
          desc: "Your application has been received and is currently being processed. Please check back later for updates.",
        };
    }
  };

  // Determine which step in the pipeline is active
  const getActiveStep = (status) => {
    if (status === "rejected") return -1; // special case
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  // Compute status info once
  const statusInfo = statusData ? getStatusInfo(statusData.status) : null;
  const activeStep = statusData ? getActiveStep(statusData.status) : 0;

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-gray-800 pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[35vh] min-h-[260px] flex items-center justify-center bg-gradient-to-r from-primary to-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c476?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-15 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3 tracking-tight">
            Student Portal
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
            Track your admission application status in real-time.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 -mt-14 relative z-20">
        {/* Search Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Search by Reference Number or Email
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. HNS-2026-ABCDE or student@email.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg shadow-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`bg-primary text-white font-bold px-10 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-md transform hover:-translate-y-1 text-lg flex items-center justify-center whitespace-nowrap ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Check Status"
                )}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-400 text-center md:text-left">
              * Reference numbers are provided upon form submission.{" "}
              <NavLink
                to="/admission#apply"
                className="text-primary font-semibold hover:underline"
              >
                Apply here
              </NavLink>{" "}
              if you haven't already.
            </p>
          </form>

          {/* Error State */}
          {error && (
            <div className="flex items-start bg-red-50 border border-red-100 text-red-700 p-5 rounded-2xl animate-fade-in">
              <FaExclamationCircle className="text-xl mr-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Application Not Found</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {statusData && statusInfo && (
            <div className="mt-6 animate-fade-in">
              <div className="border-t border-gray-100 pt-8">
                {/* Section Header */}
                <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center">
                  <FaClipboardCheck className="mr-3 text-amber-500" />
                  Application Status
                </h2>

                {/* Progress Timeline (hidden for rejected) */}
                {statusData.status !== "rejected" && (
                  <div className="mb-10">
                    <div className="flex items-center justify-between relative">
                      {/* Connecting Line */}
                      <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full z-0">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full transition-all duration-700"
                          style={{
                            width:
                              activeStep === 0
                                ? "0%"
                                : activeStep === 1
                                ? "50%"
                                : "100%",
                          }}
                        ></div>
                      </div>

                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = idx <= activeStep;
                        const isCurrent = idx === activeStep;
                        const StepIcon = step.icon;

                        return (
                          <div
                            key={step.key}
                            className="flex flex-col items-center relative z-10 flex-1"
                          >
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-sm ${
                                isCompleted
                                  ? isCurrent
                                    ? "bg-amber-500 text-white scale-110 ring-4 ring-amber-200"
                                    : "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-400"
                              }`}
                            >
                              {isCompleted && !isCurrent ? (
                                <FaCheckCircle />
                              ) : (
                                <StepIcon />
                              )}
                            </div>
                            <p
                              className={`text-xs font-bold mt-2 uppercase tracking-wider ${
                                isCompleted
                                  ? "text-gray-800"
                                  : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Details (3/5) */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0">
                        <FaUserGraduate />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                          Student Name
                        </p>
                        <p className="text-lg font-bold text-gray-800 truncate">
                          {statusData.studentName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0">
                        <FaGraduationCap />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                          Grade Applied For
                        </p>
                        <p className="text-lg font-bold text-gray-800 uppercase">
                          {statusData.gradeApplied}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0">
                        <FaIdBadge />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                          Reference Code
                        </p>
                        <p className="text-lg font-mono font-bold text-gray-800">
                          {statusData.referenceNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/60 transition-colors">
                      <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary text-lg mr-4 flex-shrink-0">
                        <FaCalendarAlt />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                          Submitted On
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {new Date(statusData.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Card (2/5) */}
                  <div
                    className={`lg:col-span-2 p-8 rounded-3xl border-2 shadow-sm flex flex-col items-center justify-center text-center ring-4 ${statusInfo.bg} ${statusInfo.border} ${statusInfo.ring}`}
                  >
                    <p className="text-4xl mb-3">{statusInfo.icon}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                      Current Status
                    </p>
                    <h3
                      className={`text-3xl font-serif font-black uppercase mb-4 tracking-tight ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </h3>
                    <div className="h-0.5 w-12 bg-gray-300/50 mb-4"></div>
                    <p className="text-gray-600 text-sm font-medium leading-relaxed">
                      {statusInfo.desc}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => window.print()}
                    className="text-gray-600 font-bold hover:text-primary transition-colors flex items-center px-5 py-2.5 rounded-xl hover:bg-gray-50"
                  >
                    <FaPrint className="mr-2" />
                    Print Details
                  </button>
                  <NavLink
                    to="/admission#apply"
                    className="text-primary font-bold flex items-center px-5 py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
                  >
                    Submit New Application
                    <FaArrowRight className="ml-2 text-sm" />
                  </NavLink>
                </div>
              </div>
            </div>
          )}

          {/* Default Empty State (only when no search has been done) */}
          {!statusData && !error && !loading && (
            <div className="text-center py-8 text-gray-400">
              <FaSearch className="text-4xl mx-auto mb-4 opacity-30" />
              <p className="font-medium">
                Enter your Reference Number or Email above to check your
                application status.
              </p>
            </div>
          )}
        </div>

        {/* Help Desk Footer */}
        <div className="mt-8 bg-white rounded-2xl shadow-md p-6 border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3">
            Need Help? Contact Admissions Office
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <a
              href={`tel:${schoolProfile?.phone || "6901055733"}`}
              className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors"
            >
              <FaPhoneAlt className="text-amber-500 mr-2" />
              {schoolProfile?.phone || "6901055733"}
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a
              href={`mailto:${schoolProfile?.email || "holynameschool@gmail.com"}`}
              className="flex items-center text-gray-700 font-medium hover:text-primary transition-colors"
            >
              <FaEnvelope className="text-amber-500 mr-2" />
              {schoolProfile?.email || "holynameschool@gmail.com"}
            </a>
          </div>
          {schoolProfile?.officeHours && (
            <p className="text-xs text-gray-400 mt-2">
              Office Hours: {schoolProfile.officeHours}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentPortal;
