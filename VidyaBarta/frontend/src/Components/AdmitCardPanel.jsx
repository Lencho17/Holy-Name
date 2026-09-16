import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FaIdBadge,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaCalendarAlt,
  FaFilePdf,
  FaExclamationTriangle,
  FaLock,
  FaEye,
  FaUsers,
  FaFilter,
  FaHandHoldingUsd,
  FaClock,
  FaShieldAlt
} from 'react-icons/fa';
import AdmitCardPreviewModal from './AdmitCardPreviewModal';
import { generateBulkAdmitCardBookletPDF, generateSingleAdmitCardPDF } from '../utils/admitCardPdfGenerator';

const AdmitCardPanel = ({ apiUrl, token }) => {
  // Navigation tabs within module
  const [activeTab, setActiveTab] = useState('admitCards'); // 'admitCards' | 'concessions'

  // Exam and Student states
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Roster & Metrics
  const [rosterData, setRosterData] = useState(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Selection for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Modals
  const [previewCardData, setPreviewCardData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [overrideModal, setOverrideModal] = useState({ isOpen: false, cardId: null, studentName: '', action: 'force_release', reason: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Concessions legacy state
  const [concessions, setConcessions] = useState([]);
  const [loadingConcessions, setLoadingConcessions] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 1. Fetch available exams
  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const res = await axios.get(`${apiUrl}/admit-cards/exams`, authHeaders);
      if (res.data?.success) {
        const examsList = res.data.data || [];
        setExams(examsList);
        if (examsList.length > 0 && !selectedExamId) {
          setSelectedExamId(examsList[0].id);
        }
      }
    } catch (err) {
      console.error('[FETCH_EXAMS_ERROR]', err);
    } finally {
      setLoadingExams(false);
    }
  };

  // 2. Fetch classes for selected exam
  const fetchExamClasses = async (examId) => {
    if (!examId) return;
    try {
      const res = await axios.get(`${apiUrl}/admit-cards/exams/${examId}/classes`, authHeaders);
      if (res.data?.success) {
        const classes = res.data.data || [];
        setAvailableClasses(classes);
        if (classes.length > 0) {
          setSelectedClass(classes[0].classLevel);
          setSelectedSection('');
        } else {
          setSelectedClass('');
          setSelectedSection('');
        }
      }
    } catch (err) {
      console.error('[FETCH_CLASSES_ERROR]', err);
    }
  };

  // 3. Fetch student roster & live eligibility
  const fetchStudents = async () => {
    if (!selectedExamId || !selectedClass) return;
    try {
      setLoadingStudents(true);
      let url = `${apiUrl}/admit-cards/exams/${selectedExamId}/students?class_level=${encodeURIComponent(selectedClass)}`;
      if (selectedSection) {
        url += `&section=${encodeURIComponent(selectedSection)}`;
      }
      const res = await axios.get(url, authHeaders);
      if (res.data?.success) {
        setRosterData(res.data.data);
        setSelectedStudentIds([]);
      }
    } catch (err) {
      console.error('[FETCH_STUDENTS_ERROR]', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 4. Fetch Concessions for legacy management tab
  const fetchConcessions = async () => {
    try {
      setLoadingConcessions(true);
      const res = await axios.get(`${apiUrl}/concessions`, authHeaders);
      setConcessions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConcessions(false);
    }
  };

  const updateConcessionStatus = async (id, status) => {
    try {
      await axios.put(`${apiUrl}/concessions/${id}/status`, { status }, authHeaders);
      fetchConcessions();
      fetchStudents(); // Refresh dues in real-time
    } catch (err) {
      alert('Failed to update concession status');
    }
  };

  useEffect(() => {
    fetchExams();
    fetchConcessions();
  }, [apiUrl, token]);

  useEffect(() => {
    if (selectedExamId) {
      fetchExamClasses(selectedExamId);
    }
  }, [selectedExamId]);

  useEffect(() => {
    if (selectedExamId && selectedClass) {
      fetchStudents();
    }
  }, [selectedExamId, selectedClass, selectedSection]);

  // Bulk Release Action
  const handleBulkRelease = async (mode) => {
    if (!selectedExamId || !selectedClass) return;
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${apiUrl}/admit-cards/bulk-release`,
        {
          examId: selectedExamId,
          class_level: selectedClass,
          section: selectedSection || undefined,
          mode,
          studentIds: mode === 'selected_students' ? selectedStudentIds : undefined
        },
        authHeaders
      );

      if (res.data?.success) {
        alert(res.data.message || 'Admit cards released successfully.');
        fetchStudents();
      }
    } catch (err) {
      console.error('[BULK_RELEASE_ERROR]', err);
      const msg = err.response?.data?.message || 'Failed to release admit cards';
      alert(`Error: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Withhold Action
  const handleBulkWithhold = async () => {
    if (!selectedStudentIds || selectedStudentIds.length === 0) {
      alert('Please select at least one student to withhold.');
      return;
    }
    const reason = prompt('Please enter the reason for withholding these admit cards:');
    if (!reason || !reason.trim()) return;

    try {
      setActionLoading(true);
      const res = await axios.post(
        `${apiUrl}/admit-cards/bulk-withhold`,
        {
          examId: selectedExamId,
          studentIds: selectedStudentIds,
          reason: reason.trim()
        },
        authHeaders
      );
      if (res.data?.success) {
        alert(res.data.message || 'Admit cards withheld.');
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withhold admit cards');
    } finally {
      setActionLoading(false);
    }
  };

  // Apply Manual Override
  const submitOverride = async () => {
    if (!overrideModal.reason || !overrideModal.reason.trim()) {
      alert('A detailed reason is mandatory for manual overrides.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await axios.patch(
        `${apiUrl}/admit-cards/${overrideModal.cardId}/override`,
        {
          action: overrideModal.action,
          reason: overrideModal.reason.trim()
        },
        authHeaders
      );
      if (res.data?.success) {
        alert(res.data.message || 'Override applied.');
        setOverrideModal({ isOpen: false, cardId: null, studentName: '', action: 'force_release', reason: '' });
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply override');
    } finally {
      setActionLoading(false);
    }
  };

  // Preview Single Card
  const handlePreviewCard = async (cardId) => {
    try {
      setActionLoading(true);
      const res = await axios.get(`${apiUrl}/admit-cards/${cardId}/card-data`, authHeaders);
      if (res.data?.success) {
        setPreviewCardData(res.data.data);
        setIsPreviewOpen(true);
      }
    } catch (err) {
      alert('Failed to load card preview data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Single Card PDF
  const handleDownloadSinglePDF = async (cardId, studentName, rollNumber) => {
    try {
      setActionLoading(true);
      const res = await axios.get(`${apiUrl}/admit-cards/${cardId}/card-data`, authHeaders);
      if (res.data?.success) {
        const doc = generateSingleAdmitCardPDF(res.data.data);
        doc.save(`AdmitCard_${rollNumber || studentName}.pdf`);
      }
    } catch (err) {
      alert('Failed to generate PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Bulk Class Booklet (2 cards per A4 page)
  const handleDownloadBulkBooklet = async () => {
    if (!rosterData || !rosterData.students || rosterData.students.length === 0) {
      alert('No students found to export.');
      return;
    }

    const releasedStudents = rosterData.students.filter((s) => s.admitCardStatus === 'released' && s.admitCardId);
    if (releasedStudents.length === 0) {
      alert('No released admit cards found in this class. Only released cards can be exported to booklet.');
      return;
    }

    try {
      setActionLoading(true);
      // Fetch card data payloads in parallel batches
      const payloads = await Promise.all(
        releasedStudents.map(async (st) => {
          const res = await axios.get(`${apiUrl}/admit-cards/${st.admitCardId}/card-data`, authHeaders);
          return res.data?.data;
        })
      );

      const validPayloads = payloads.filter(Boolean);
      const doc = generateBulkAdmitCardBookletPDF(validPayloads);
      doc.save(`AdmitCard_Booklet_Class_${selectedClass}_${selectedSection || 'All'}.pdf`);
    } catch (err) {
      console.error('[BULK_PDF_ERROR]', err);
      alert('Failed to generate bulk booklet PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle selection
  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!rosterData?.students) return;
    if (selectedStudentIds.length === rosterData.students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(rosterData.students.map((s) => s.studentId));
    }
  };

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const isRoutineFinalized = rosterData?.routineStatus?.isFinalized === true;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center text-2xl font-bold border border-blue-100">
              <FaIdBadge />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admit Card Engine</h2>
              <p className="text-xs text-slate-500 font-medium">
                Integrated Examination Routines, Fee-Gating Eligibility & Deterministic A4 PDF Printing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('admitCards')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'admitCards'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admit Card Management
            </button>
            <button
              onClick={() => setActiveTab('concessions')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'concessions'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Concessions & Extensions ({concessions.filter((c) => c.status === 'pending').length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ADMIT CARDS OPERATIONAL DASHBOARD */}
      {activeTab === 'admitCards' && (
        <div className="space-y-6">
          {/* SECTION 1: EXAM & CLASS SELECTORS */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exam Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Examination
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} {ex.routineFinalized ? '✓ (Routine Finalized)' : '⚠ (Unfinalized)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Class Level
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {availableClasses.map((c) => (
                    <option key={c.classLevel} value={c.classLevel}>
                      Class {c.classLevel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Section Filter
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">All Sections</option>
                  {(availableClasses.find((c) => c.classLevel === selectedClass)?.sections || ['A']).map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: ROUTINE STATUS BANNER */}
          {rosterData?.routineStatus && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isRoutineFinalized
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isRoutineFinalized ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isRoutineFinalized ? <FaCheckCircle className="text-xl" /> : <FaExclamationTriangle className="text-xl" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {isRoutineFinalized ? 'Exam Routine Finalized & Ready' : 'Exam Routine Not Finalized'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {rosterData.routineStatus.reason} &bull; Total Scheduled Subjects: {rosterData.routineStatus.routineCount}
                  </p>
                </div>
              </div>

              {!isRoutineFinalized && (
                <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-3 py-1.5 rounded-lg">
                  Release Actions Blocked
                </span>
              )}
            </div>
          )}

          {/* SECTION 3: SUMMARY METRIC COUNTERS */}
          {rosterData?.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Enrolled</span>
                  <FaUsers className="text-sm text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900">{rosterData.metrics.totalStudents}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
                <div className="flex items-center justify-between text-emerald-600 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Fees Cleared</span>
                  <FaCheckCircle className="text-sm" />
                </div>
                <div className="text-2xl font-black text-emerald-700">{rosterData.metrics.eligible}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs bg-purple-50/20">
                <div className="flex items-center justify-between text-purple-600 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Concessions</span>
                  <FaHandHoldingUsd className="text-sm" />
                </div>
                <div className="text-2xl font-black text-purple-700">{rosterData.metrics.concessionApproved}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
                <div className="flex items-center justify-between text-blue-600 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Extensions</span>
                  <FaClock className="text-sm" />
                </div>
                <div className="text-2xl font-black text-blue-700">{rosterData.metrics.extensionApproved}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
                <div className="flex items-center justify-between text-rose-600 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dues Pending</span>
                  <FaTimesCircle className="text-sm" />
                </div>
                <div className="text-2xl font-black text-rose-700">{rosterData.metrics.duesPending}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs bg-indigo-50/20">
                <div className="flex items-center justify-between text-indigo-600 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Released</span>
                  <FaIdBadge className="text-sm" />
                </div>
                <div className="text-2xl font-black text-indigo-900">{rosterData.metrics.released}</div>
              </div>
            </div>
          )}

          {/* SECTION 4: BULK ACTION TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={!isRoutineFinalized || actionLoading}
                onClick={() => handleBulkRelease('cleared_students')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Releases cards only for students with cleared fees or valid extensions"
              >
                <FaCheckCircle />
                Release All Cleared Students
              </button>

              <button
                disabled={!isRoutineFinalized || actionLoading}
                onClick={() => {
                  if (confirm('Are you sure you want to release admit cards for the ENTIRE class, including students with pending dues?')) {
                    handleBulkRelease('entire_class');
                  }
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <FaUsers />
                Release Entire Class
              </button>

              {selectedStudentIds.length > 0 && (
                <>
                  <button
                    disabled={!isRoutineFinalized || actionLoading}
                    onClick={() => handleBulkRelease('selected_students')}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    Release Selected ({selectedStudentIds.length})
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={handleBulkWithhold}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <FaLock />
                    Withhold Selected ({selectedStudentIds.length})
                  </button>
                </>
              )}
            </div>

            <div>
              <button
                disabled={actionLoading || !rosterData?.metrics?.released}
                onClick={handleDownloadBulkBooklet}
                className="px-4 py-2.5 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <FaFilePdf />
                Download Class PDF Booklet (2 Cards / Page)
              </button>
            </div>
          </div>

          {/* SECTION 5: STUDENT ELIGIBILITY ROSTER TABLE */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Class {selectedClass} Candidate Roster</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                  {rosterData?.students?.length || 0} Students
                </span>
              </h3>
              {loadingStudents && (
                <div className="text-xs text-blue-600 font-medium flex items-center gap-1.5">
                  <FaSpinner className="animate-spin" /> Evaluating fee status...
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          rosterData?.students?.length > 0 &&
                          selectedStudentIds.length === rosterData.students.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Roll / Admission ID</th>
                    <th className="py-3 px-4">Fee Eligibility</th>
                    <th className="py-3 px-4">Admit Card Status</th>
                    <th className="py-3 px-4 text-center">Manual Override</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rosterData?.students && rosterData.students.length > 0 ? (
                    rosterData.students.map((st) => {
                      const isSelected = selectedStudentIds.includes(st.studentId);
                      const isReleased = st.admitCardStatus === 'released';
                      const isWithheld = st.admitCardStatus === 'withheld';

                      return (
                        <tr
                          key={st.studentId}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isSelected ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(st.studentId)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200">
                                {st.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{st.name}</div>
                                <div className="text-[10px] text-slate-400">Guardian: {st.guardianName || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">Roll: {st.rollNumber || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400">ID: {st.admissionId || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4">
                            {st.feeStatus === 'eligible' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <FaCheckCircle className="text-[10px]" /> Fees Cleared
                              </span>
                            )}
                            {st.feeStatus === 'extension_approved' && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                  <FaClock className="text-[10px]" /> Extension Approved
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Pending: ₹{st.outstandingFee} (Until {new Date(st.validExtensionDate).toLocaleDateString('en-GB')})
                                </div>
                              </div>
                            )}
                            {st.feeStatus === 'dues_pending' && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                  <FaTimesCircle className="text-[10px]" /> Dues: ₹{st.outstandingFee}
                                </span>
                                {st.approvedDiscount > 0 && (
                                  <div className="text-[10px] text-purple-600">
                                    Concession: ₹{st.approvedDiscount}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isReleased && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Released
                              </span>
                            )}
                            {isWithheld && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                <FaLock className="text-[9px]" />
                                Withheld
                              </span>
                            )}
                            {!isReleased && !isWithheld && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {st.manualOverride ? (
                              <span
                                className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]"
                                title={`Reason: ${st.releaseReason}`}
                              >
                                {st.overrideType === 'force_release' ? 'Force Released' : 'Force Withheld'}
                              </span>
                            ) : (
                              <span className="text-slate-300">&mdash;</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {st.admitCardId && (
                                <>
                                  <button
                                    onClick={() => handlePreviewCard(st.admitCardId)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="1:1 Print Preview"
                                  >
                                    <FaEye className="text-sm" />
                                  </button>

                                  {isReleased && (
                                    <button
                                      onClick={() => handleDownloadSinglePDF(st.admitCardId, st.name, st.rollNumber)}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      title="Download Single Card PDF"
                                    >
                                      <FaFilePdf className="text-sm" />
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                onClick={() =>
                                  setOverrideModal({
                                    isOpen: true,
                                    cardId: st.admitCardId,
                                    studentName: st.name,
                                    action: isReleased ? 'force_withhold' : 'force_release',
                                    reason: ''
                                  })
                                }
                                disabled={!st.admitCardId}
                                className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                              >
                                Override
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No students enrolled in Class {selectedClass} {selectedSection ? `Section ${selectedSection}` : ''}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEE CONCESSIONS & EXTENSIONS (LEGACY PRESERVED) */}
      {activeTab === 'concessions' && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <FaHandHoldingUsd className="text-orange-500 text-2xl" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pending Requests for Extension / Concession</h3>
              <p className="text-xs text-slate-500">
                Approved extensions grant temporary exam admit card eligibility while keeping outstanding dues on record.
              </p>
            </div>
          </div>

          {loadingConcessions ? (
            <div className="p-8 text-center text-slate-400">
              <FaSpinner className="animate-spin inline mr-2" /> Loading fee concessions...
            </div>
          ) : concessions.filter((c) => c.status === 'pending').length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No pending concession or extension requests.
            </div>
          ) : (
            <div className="space-y-4">
              {concessions
                .filter((c) => c.status === 'pending')
                .map((c) => (
                  <div
                    key={c.id || c._id}
                    className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Student ID: {c.student_id}</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Requesting{' '}
                        {c.type === 'concession'
                          ? `₹${c.discount_amount} Concession / Discount`
                          : `Time Extension until ${new Date(c.extension_date).toLocaleDateString('en-GB')}`}
                      </div>
                      {c.document_url && (
                        <a
                          href={c.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View Written Order / Proof
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateConcessionStatus(c.id || c._id, 'approved')}
                        className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 text-xs font-bold flex items-center gap-1"
                      >
                        <FaCheckCircle /> Approve
                      </button>
                      <button
                        onClick={() => updateConcessionStatus(c.id || c._id, 'rejected')}
                        className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 text-xs font-bold flex items-center gap-1"
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: 1:1 ADMIT CARD PREVIEW */}
      <AdmitCardPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        cardData={previewCardData}
      />

      {/* MODAL 2: MANUAL OVERRIDE DIALOG */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Administrative Manual Override</h3>
            <p className="text-xs text-slate-500 mb-4">
              Overriding admit card status for <strong className="text-slate-800">{overrideModal.studentName}</strong>.
              Audit logs will record this action permanently.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Action</label>
                <select
                  value={overrideModal.action}
                  onChange={(e) => setOverrideModal((prev) => ({ ...prev, action: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                >
                  <option value="force_release">Force Release (Permit Candidate to Exam)</option>
                  <option value="force_withhold">Force Withhold (Revoke Pass & QR Token)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Override <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideModal.reason}
                  onChange={(e) => setOverrideModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="E.g., Principal order, verified bank challan submitted, medical emergency..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setOverrideModal({ isOpen: false, cardId: null, studentName: '', action: 'force_release', reason: '' })
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitOverride}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {actionLoading && <FaSpinner className="animate-spin text-xs" />}
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmitCardPanel;
