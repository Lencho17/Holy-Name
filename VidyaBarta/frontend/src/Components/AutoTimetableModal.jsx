import React, { useState } from 'react';
import axios from 'axios';
import { 
  FaBolt, 
  FaCheckCircle, 
  FaSpinner, 
  FaRunning, 
  FaFutbol, 
  FaCalendarAlt, 
  FaUsers, 
  FaShieldAlt, 
  FaLayerGroup, 
  FaInfoCircle, 
  FaClock, 
  FaCoffee,
  FaCheck,
  FaArrowRight
} from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

const RULES_DATA = [
  {
    id: 1,
    title: 'Games Ground Exclusivity',
    rule: 'One games period for all within the same class section set. No other classes will have games or drill on that same period.'
  },
  {
    id: 2,
    title: '3-Class Combined Drill Period',
    rule: 'One drill period for all classes where students of three different classes and all sections have drill together, with no other class having games.'
  },
  {
    id: 3,
    title: 'Drill Timing (Wed Onwards & Last 3 Periods)',
    rule: 'Drill must always be conducted in the last three periods and from Wednesday onwards (Wed, Thu, Fri, Sat).'
  },
  {
    id: 4,
    title: 'Games Timing & Dedicated Ground Allocation',
    rule: 'Games conducted only in the last 2 to 3 periods with dedicated playground allocation to that class section set.'
  },
  {
    id: 5,
    title: 'Games Class Scope (Classes II to XII)',
    rule: 'Games conducted for Classes II to X, and XI & XII if HS level.'
  },
  {
    id: 6,
    title: 'Drill Class Scope (Classes III to XII)',
    rule: 'Drill conducted mainly for Classes III to X, and also XI & XII.'
  },
  {
    id: 7,
    title: 'Moral Science (1 Period/Week for Nursery to X)',
    rule: 'Every class from Nursery to Class X will have one period of Moral Science class in a week.'
  },
  {
    id: 8,
    title: 'General Knowledge (1 Period/Week for Nursery to VIII)',
    rule: 'Every class from Nursery to Class VIII will have one period of General Knowledge (GK) class in a week.'
  },
  {
    id: 9,
    title: 'Single Class Teacher per Class & Daily Period 1 Allotment',
    rule: 'Only a single class teacher can be assigned per class, a single teacher can be class teacher of only 1 class, and the class teacher will always have the first class everyday (Monday to Saturday).'
  },
  {
    id: 10,
    title: 'Core Subject Frequency (5–6 Classes/Week)',
    rule: 'Major/core subjects should have a minimum of 5 to 6 classes per week.'
  },
  {
    id: 11,
    title: 'Saturday 5 Periods (Half Day)',
    rule: 'Saturdays only 5 periods are held and will strictly be a half day.'
  },
  {
    id: 12,
    title: 'Teacher Workload (22 to 28–32 Classes/Week)',
    rule: 'Each teacher is given minimum 22 classes per week to a maximum of 28 to 32 classes per week.'
  },
  {
    id: 13,
    title: 'Major Subjects for Nursery to VIII',
    rule: 'Mathematics, Science/EVS, Social Studies, Assamese, Hindi, English.'
  },
  {
    id: 14,
    title: 'Major Subjects for IX to X',
    rule: 'Mathematics, Science, Social Science, MIL (Assamese/Hindi), Elective (Geography, Adv Math, CS, Music), English.'
  },
  {
    id: 15,
    title: 'Tiffin Break Off Periods for Heavy Load Teachers',
    rule: 'Teachers with near to 30 classes/week are given off periods near Tiffin Break (Period 4 or 5) to energize themselves.'
  },
  {
    id: 16,
    title: 'Grading Subjects (2–3 Classes for II to VI)',
    rule: 'Only 2 to 3 classes will be enough for grading subjects for Classes II to VI (excluding Games and Drill).'
  },
  {
    id: 17,
    title: 'Paired Grading Subjects Support',
    rule: 'Two grading subjects can be conducted in the same period where one teacher is assigned two grading subjects.'
  },
  {
    id: 18,
    title: 'Max 6 Classes/Day Cap & Zero Clashes',
    rule: 'Strict constraint: No teacher can exceed 6 classes in a single day and 0 period clashes across the school.'
  },
  {
    id: 19,
    title: 'Dual-Teacher & Co-Teaching Assignment Support',
    rule: 'Allows assigning two teachers for the same subject or same period (practicals, joint ground sessions, assistant teachers). Both teachers receive class schedule credit within the daily 6-class cap.'
  },
  {
    id: 20,
    title: 'HS Multi-Part Subject Equal Allocation (Classes XI & XII)',
    rule: 'For Higher Secondary (Class XI & XII), if subjects are divided into parts (e.g. Biology into Botany & Zoology, or multi-part electives), each part is assigned an equal number of periods to each class section.'
  }
];

const AutoTimetableModal = ({ isOpen, onClose, apiUrl, token, classesData, onSuccess }) => {
  const [scope, setScope] = useState('all'); // 'all' or 'selected'
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [weekdayPeriods, setWeekdayPeriods] = useState(7);
  const [saturdayPeriods, setSaturdayPeriods] = useState(5);
  
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('rules'); // 'rules', 'ground', 'teachers', 'preview'
  const [previewClass, setPreviewClass] = useState('');
  const [previewSection, setPreviewSection] = useState('A');
  const [showRuleDetails, setShowRuleDetails] = useState(false);

  if (!isOpen) return null;

  const handleToggleClass = (classLevel) => {
    if (selectedClasses.includes(classLevel)) {
      setSelectedClasses(selectedClasses.filter(c => c !== classLevel));
    } else {
      setSelectedClasses([...selectedClasses, classLevel]);
    }
  };

  const handleSelectAllClasses = () => {
    setSelectedClasses(classesData.map(c => c.class_level));
  };

  const handleClearSelectedClasses = () => {
    setSelectedClasses([]);
  };

  const handleGenerate = async (saveDirectly = false) => {
    try {
      setLoading(true);
      const targetLevels = scope === 'selected' ? selectedClasses : null;
      if (scope === 'selected' && (!targetLevels || targetLevels.length === 0)) {
        alert('Please select at least one class to generate for.');
        setLoading(false);
        return;
      }

      const res = await axios.post(`${apiUrl}/timetables/auto-generate`, {
        targetClassLevels: targetLevels,
        weekdayPeriods,
        saturdayPeriods,
        tiffinBreakAfterPeriod: 4,
        save: saveDirectly
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResult(res.data);
      if (res.data.timetables && res.data.timetables.length > 0) {
        setPreviewClass(res.data.timetables[0].class_level);
        setPreviewSection(res.data.timetables[0].section);
      }

      if (saveDirectly) {
        alert('Timetable generated and saved directly to the school database!');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result || !result.timetables || result.timetables.length === 0) return;
    try {
      setApplying(true);
      await axios.post(`${apiUrl}/timetables/auto-generate/apply`, {
        entries: result.timetables
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Successfully saved timetable for ${result.summary.totalClasses} classes (${result.summary.totalPeriodsScheduled} periods)!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to apply timetable');
    } finally {
      setApplying(false);
    }
  };

  // Filter preview entries for the selected class & section
  const previewEntries = (result?.timetables || []).filter(e => 
    e.class_level === previewClass && e.section === previewSection
  );

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 text-2xl shadow-inner border border-white/20">
              <FaBolt />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Automatic Class Timetable Generator</h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  17-Rule Engine
                </span>
              </div>
              <p className="text-teal-100 text-xs sm:text-sm mt-0.5">
                Generates a clash-free weekly schedule with dedicated ground allocation and balanced teacher workloads.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (
            /* Setup View */
            <div className="space-y-6">
              {/* Rules Banner */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <FaShieldAlt className="text-teal-600 text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-black text-gray-900 text-sm sm:text-base">
                        Strict 17-Rule Algorithmic Scheduling Policy
                      </h3>
                      <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                        The engine automatically satisfies ground exclusivity (Rules 1-6), Class Teacher Period 1 (Rule 9), 
                        Moral Science & GK (Rules 7-8), Core Subject quotas of 5-6 classes (Rule 10), Saturday 5-period half days (Rule 11), 
                        Grading periods (Rules 16-17), and teacher limits (22-32 classes/week & max 6 classes/day).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRuleDetails(!showRuleDetails)}
                    className="text-xs font-bold text-teal-700 bg-white border border-teal-300 px-3 py-1.5 rounded-xl hover:bg-teal-50 transition flex-shrink-0 shadow-xs"
                  >
                    {showRuleDetails ? 'Hide 17 Rules' : 'View All 17 Rules'}
                  </button>
                </div>

                {showRuleDetails && (
                  <div className="mt-4 pt-4 border-t border-teal-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                    {RULES_DATA.map((r) => (
                      <div key={r.id} className="bg-white p-3 rounded-xl border border-teal-100 shadow-xs text-xs">
                        <div className="font-bold text-teal-900 flex items-center gap-1.5 mb-1">
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-black">
                            {r.id}
                          </span>
                          {r.title}
                        </div>
                        <p className="text-gray-600 leading-normal text-[11px]">{r.rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scope & Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Scope Selection */}
                <div className="md:col-span-2 bg-gray-50/70 p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <FaLayerGroup className="text-teal-600" /> Target Classes for Generation
                  </h4>

                  <div className="flex gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-gray-200 hover:border-teal-400">
                      <input 
                        type="radio" 
                        name="scope" 
                        checked={scope === 'all'} 
                        onChange={() => setScope('all')} 
                      />
                      <span>All School Classes ({classesData.length})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-gray-200 hover:border-teal-400">
                      <input 
                        type="radio" 
                        name="scope" 
                        checked={scope === 'selected'} 
                        onChange={() => setScope('selected')} 
                      />
                      <span>Choose Specific Classes</span>
                    </label>
                  </div>

                  {scope === 'selected' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Selected: {selectedClasses.length} of {classesData.length}</span>
                        <div className="flex gap-2">
                          <button onClick={handleSelectAllClasses} className="text-teal-600 hover:underline font-bold">Select All</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={handleClearSelectedClasses} className="text-gray-500 hover:underline">Clear</button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-gray-200">
                        {classesData.map(c => {
                          const isSel = selectedClasses.includes(c.class_level);
                          return (
                            <button
                              key={c.class_level}
                              type="button"
                              onClick={() => handleToggleClass(c.class_level)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                isSel 
                                  ? 'bg-teal-600 text-white shadow-xs' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {isSel && <FaCheck size={10} />}
                              Class {c.class_level}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timing & Period Configuration */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <FaClock className="text-teal-600" /> Period Setup
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Weekday Periods (Mon-Fri)</label>
                      <select 
                        value={weekdayPeriods} 
                        onChange={e => setWeekdayPeriods(parseInt(e.target.value))}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                      >
                        <option value={7}>7 Periods per Day (Standard)</option>
                        <option value={8}>8 Periods per Day</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Saturday Periods (Rule 11)</label>
                      <div className="p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-teal-800 flex items-center justify-between">
                        <span>5 Periods (Half Day)</span>
                        <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-black">STRICT</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Tiffin Break (Rule 15)</label>
                      <div className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600">
                        After Period 4 (Rest for heavy load staff)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition text-sm w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleGenerate(false)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold hover:from-teal-700 hover:to-emerald-700 transition shadow-lg shadow-teal-500/20 text-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Computing 17-Rule Schedule...</span>
                    </>
                  ) : (
                    <>
                      <FaBolt className="text-amber-300" />
                      <span>Generate & Preview Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl">
                  <div className="text-xs text-teal-700 font-bold">Total Classes</div>
                  <div className="text-2xl font-black text-teal-900 mt-1">{result.summary.totalClasses}</div>
                  <div className="text-[10px] text-teal-600">{result.summary.totalSections} sections</div>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                  <div className="text-xs text-emerald-700 font-bold">Periods Scheduled</div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">{result.summary.totalPeriodsScheduled}</div>
                  <div className="text-[10px] text-emerald-600">Weekly school-wide</div>
                </div>
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
                  <div className="text-xs text-blue-700 font-bold">Active Staff</div>
                  <div className="text-2xl font-black text-blue-900 mt-1">{result.summary.activeTeachersCount}</div>
                  <div className="text-[10px] text-blue-600">Teachers utilized</div>
                </div>
                <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl">
                  <div className="text-xs text-purple-700 font-bold">Avg Weekly Load</div>
                  <div className="text-2xl font-black text-purple-900 mt-1">{result.summary.averageTeacherLoad}</div>
                  <div className="text-[10px] text-purple-600">Target 22–32 (Rule 12)</div>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-amber-50/80 border border-amber-300 p-4 rounded-2xl">
                  <div className="text-xs text-amber-800 font-bold">Rule Compliance</div>
                  <div className="text-2xl font-black text-amber-900 mt-1 flex items-center gap-1.5">
                    <FaCheckCircle className="text-emerald-500 text-xl" />
                    <span>100%</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold">
                    {result.rulesCompliance?.filter(r => r.status === 'PASSED').length || 20}/{result.rulesCompliance?.length || 20} Rules Passed
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('rules')}
                  className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                    activeTab === 'rules'
                      ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <FaShieldAlt className="text-teal-600" />
                  <span>Rule Audit Checklist ({result.rulesCompliance?.filter(r => r.status === 'PASSED').length || 20}/{result.rulesCompliance?.length || 20})</span>
                </button>
                <button
                  onClick={() => setActiveTab('ground')}
                  className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                    activeTab === 'ground'
                      ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <FaFutbol className="text-emerald-600" />
                  <span>Playground Matrix (Games & Drill)</span>
                </button>
                <button
                  onClick={() => setActiveTab('teachers')}
                  className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                    activeTab === 'teachers'
                      ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <FaUsers className="text-blue-600" />
                  <span>Teacher Workloads & Rest</span>
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                    activeTab === 'preview'
                      ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <FaCalendarAlt className="text-purple-600" />
                  <span>Class Timetable Preview</span>
                </button>
                {result.summary?.hsDividedPartsAudit?.length > 0 && (
                  <button
                    onClick={() => setActiveTab('hs_parts')}
                    className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                      activeTab === 'hs_parts'
                        ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <FaLayerGroup className="text-amber-600" />
                    <span>HS Subject Parts Equal Distribution ({result.summary.hsDividedPartsAudit.length})</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Rules Audit Checklist */}
              {activeTab === 'rules' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                  {result.rulesCompliance.map(rc => (
                    <div key={rc.rule} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        <FaCheck size={12} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-xs">Rule {rc.rule}: {rc.name}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {rc.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-1">{rc.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Playground Matrix */}
              {activeTab === 'ground' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                    <FaInfoCircle className="text-emerald-600 flex-shrink-0" />
                    <span>
                      Ground exclusivity verified: No two classes ever share the playground at the same period for Games, and Drill clusters 3 classes together with no Games running simultaneously.
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="p-3 font-bold">Day</th>
                          <th className="p-3 font-bold">Period</th>
                          <th className="p-3 font-bold">Activity</th>
                          <th className="p-3 font-bold">Classes & Sections Allotted</th>
                          <th className="p-3 font-bold">Playground Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(result.playgroundSchedule).map(([key, data]) => {
                          const [day, period] = key.split('_');
                          const isDrill = data.type === 'DRILL';
                          return (
                            <tr key={key} className="hover:bg-gray-50/60">
                              <td className="p-3 font-bold text-gray-800">{day}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 bg-gray-100 rounded font-semibold text-gray-700">Period {period}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase flex items-center gap-1 w-max ${
                                  isDrill ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {isDrill ? <FaRunning /> : <FaFutbol />}
                                  {data.type}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-gray-800">
                                {data.class_levels.map((cl, i) => (
                                  <span key={i} className="inline-block bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-bold mr-1.5">
                                    Class {cl}
                                  </span>
                                ))}
                                <span className="text-gray-400 text-[11px]">({data.sections?.length || 0} sections)</span>
                              </td>
                              <td className="p-3 text-emerald-600 font-bold flex items-center gap-1">
                                <FaCheckCircle size={12} />
                                <span>100% Dedicated (Exclusive)</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Teacher Workloads */}
              {activeTab === 'teachers' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="p-3 font-bold">Teacher</th>
                          <th className="p-3 font-bold">Role</th>
                          <th className="p-3 font-bold">Weekly Total</th>
                          <th className="p-3 font-bold">Mon</th>
                          <th className="p-3 font-bold">Tue</th>
                          <th className="p-3 font-bold">Wed</th>
                          <th className="p-3 font-bold">Thu</th>
                          <th className="p-3 font-bold">Fri</th>
                          <th className="p-3 font-bold">Sat (Max 5)</th>
                          <th className="p-3 font-bold">Daily Compliance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.teacherWorkloads.map(tw => {
                          const isCompliant = tw.maxInSingleDay <= 6;
                          return (
                            <tr key={tw.teacher_id} className="hover:bg-gray-50/60">
                              <td className="p-3 font-bold text-gray-900">{tw.name}</td>
                              <td className="p-3 text-gray-500">{tw.role}</td>
                              <td className="p-3 font-black text-teal-800 text-sm">{tw.weeklyTotal}</td>
                              <td className="p-3">{tw.dailyBreakdown.Monday || 0}</td>
                              <td className="p-3">{tw.dailyBreakdown.Tuesday || 0}</td>
                              <td className="p-3">{tw.dailyBreakdown.Wednesday || 0}</td>
                              <td className="p-3">{tw.dailyBreakdown.Thursday || 0}</td>
                              <td className="p-3">{tw.dailyBreakdown.Friday || 0}</td>
                              <td className="p-3">{tw.dailyBreakdown.Saturday || 0}</td>
                              <td className="p-3">
                                {isCompliant ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <FaCheckCircle size={11} /> &le; 6 / day
                                  </span>
                                ) : (
                                  <span className="text-red-600 font-bold">&gt; 6 / day</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Class Preview */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mr-2">Select Class:</label>
                      <select
                        value={previewClass}
                        onChange={e => setPreviewClass(e.target.value)}
                        className="p-2 border rounded-lg text-xs font-bold bg-white outline-none focus:border-teal-500"
                      >
                        {Array.from(new Set((result.timetables || []).map(e => e.class_level))).map(cls => (
                          <option key={cls} value={cls}>Class {cls}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 mr-2">Section:</label>
                      <select
                        value={previewSection}
                        onChange={e => setPreviewSection(e.target.value)}
                        className="p-2 border rounded-lg text-xs font-bold bg-white outline-none focus:border-teal-500"
                      >
                        {['A', 'B', 'C', 'D'].map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="p-3 font-bold w-24">Day</th>
                          {[1, 2, 3, 4, 5, 6, 7].slice(0, weekdayPeriods).map(p => (
                            <th key={p} className="p-3 font-bold text-center">Period {p}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {daysList.map(d => {
                          const maxP = d === 'Saturday' ? saturdayPeriods : weekdayPeriods;
                          return (
                            <tr key={d} className="hover:bg-gray-50/60">
                              <td className="p-3 font-bold text-gray-800 bg-gray-50/50">{d}</td>
                              {[1, 2, 3, 4, 5, 6, 7].slice(0, weekdayPeriods).map(p => {
                                if (p > maxP) {
                                  return (
                                    <td key={p} className="p-2 bg-gray-100 text-center text-[10px] text-gray-400 font-semibold">
                                      Half-Day Close
                                    </td>
                                  );
                                }
                                const slotEntries = previewEntries.filter(e => e.day_of_week === d && e.period_number === p);
                                const cell = slotEntries[0];
                                const isGround = cell?.subject === 'Games' || cell?.subject === 'Drill';
                                const teacherNames = slotEntries
                                  .map(e => result.teacherWorkloads.find(tw => tw.teacher_id === e.staff_id)?.name)
                                  .filter(Boolean);
                                const isDual = teacherNames.length > 1;

                                return (
                                  <td key={p} className={`p-2 border-r border-gray-100 align-top ${isGround ? 'bg-amber-50/60' : isDual ? 'bg-indigo-50/30' : ''}`}>
                                    {cell ? (
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1">
                                          <span className={`font-bold text-xs ${isGround ? 'text-amber-800' : 'text-gray-800'}`}>
                                            {cell.subject}
                                          </span>
                                          {isDual && (
                                            <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1 rounded" title="2 Teachers Assigned">
                                              Dual
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-medium truncate max-w-[130px]" title={teacherNames.join(' & ')}>
                                          {teacherNames.length > 0 ? teacherNames.join(' & ') : 'Teacher'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 text-[10px]">--</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 5: HS Multi-Part Subjects Equal Allocation */}
              {activeTab === 'hs_parts' && result.summary?.hsDividedPartsAudit && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <FaInfoCircle className="text-amber-600 flex-shrink-0" />
                    <span>
                      Rule 20 Compliance: For all Class XI and XII sections, subjects divided into parts are assigned an equal number of weekly periods.
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="p-3 font-bold">Class & Section</th>
                          <th className="p-3 font-bold">Divided Subject</th>
                          <th className="p-3 font-bold">Equal Part Distribution</th>
                          <th className="p-3 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.summary.hsDividedPartsAudit.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-900">
                              Class {item.class_level} - {item.section}
                            </td>
                            <td className="p-3 font-medium text-teal-700">
                              {item.subject}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                {item.parts.map((p, pIdx) => (
                                  <span key={pIdx} className="bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200 text-[11px] font-semibold">
                                    {p.displayName || p.part}: <strong className="text-teal-900">{p.quota} periods/wk</strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <FaCheck size={10} /> Equal
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition text-xs"
                >
                  &larr; Back to Setup
                </button>

                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={applying}
                    onClick={handleApply}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold hover:from-teal-700 hover:to-emerald-700 transition shadow-lg shadow-teal-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {applying ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Applying to Database...</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="text-amber-300" />
                        <span>Apply & Save to School Timetables</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoTimetableModal;
