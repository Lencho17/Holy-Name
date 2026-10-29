import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { StudentAuthContext } from '../context/StudentAuthContext';
import { FaCalendarAlt, FaFilePdf, FaSpinner, FaUtensils, FaCoffee } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentTimetable = () => {
  const { API_URL } = useContext(SiteDataContext);
  const { token, student } = useContext(StudentAuthContext);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [maxPeriod, setMaxPeriod] = useState(7);
  const [periodColumns, setPeriodColumns] = useState([]);
  const [gridData, setGridData] = useState([]);

  // Recess / Tiffin Breaks Configuration (loaded from school setup)
  const [breakConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('school_timetable_break_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      count: 1,
      break1: { afterPeriod: 4, label: 'Recess / Tiffin Break', start: '11:15', end: '11:45' },
      break2: { afterPeriod: 2, label: 'Short Break', start: '10:15', end: '10:30' }
    };
  });

  const getActiveBreaks = (maxP) => {
    if (!breakConfig || breakConfig.count === 0) return [];
    const list = [];
    if (breakConfig.break1 && breakConfig.break1.afterPeriod < maxP) {
      list.push({ ...breakConfig.break1, id: 'break1', defaultLabel: 'Recess / Tiffin Break' });
    }
    if (breakConfig.count === 2 && breakConfig.break2 && breakConfig.break2.afterPeriod < maxP) {
      list.push({ ...breakConfig.break2, id: 'break2', defaultLabel: 'Short Break' });
    }
    return list.sort((a, b) => a.afterPeriod - b.afterPeriod);
  };

  const getParsedClass = () => {
    let grade = student.grade || '';
    let sec = student.section || 'A';
    if (grade.includes(' ')) {
      const parts = grade.split(' ');
      grade = parts[0];
      sec = parts[1];
    }
    return { grade, sec };
  };
  const { grade, sec } = getParsedClass();

  useEffect(() => {
    if (token) fetchTimetable();
  }, [token]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/student-portal/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      const entries = res.data || [];
      setTimetable(entries);
      
      let maxP = 1;
      const loadedPeriods = new Map();
      entries.forEach(e => {
        if (e.period_number > maxP) maxP = e.period_number;
        if (!loadedPeriods.has(e.period_number) && e.start_time) {
           loadedPeriods.set(e.period_number, { 
             start: e.start_time.substring(0,5), 
             end: e.end_time ? e.end_time.substring(0,5) : '' 
           });
        }
      });
      setMaxPeriod(maxP);

      const cols = [];
      for (let i = 1; i <= maxP; i++) {
        cols.push({
          period_number: i,
          start: loadedPeriods.get(i)?.start || '',
          end: loadedPeriods.get(i)?.end || ''
        });
      }
      setPeriodColumns(cols);

      const grid = [];
      days.forEach(day => {
        const row = { day };
        for (let i = 1; i <= maxP; i++) {
          row[`p${i}`] = entries.find(e => e.day_of_week === day && e.period_number === i) || null;
        }
        grid.push(row);
      });
      setGridData(grid);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (timetable.length === 0) return alert("No timetable available to download.");
    
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text(`${student.name} - Class ${grade} (${sec}) Timetable`, 14, 20);
    
    const activeBreaks = getActiveBreaks(maxPeriod);
    const headRow = ['Day'];
    const breakColIndices = [];
    let currentIdx = 0;

    for (let i = 1; i <= maxPeriod; i++) {
      headRow.push(`Period ${i}`);
      currentIdx++;
      const brk = activeBreaks.find(b => b.afterPeriod === i);
      if (brk) {
        const timeStr = brk.start && brk.end ? `\n(${brk.start} - ${brk.end})` : '';
        headRow.push(`${(brk.label || 'RECESS').toUpperCase()}${timeStr}`);
        currentIdx++;
        breakColIndices.push(currentIdx);
      }
    }

    const head = [headRow];
    const body = days.map(day => {
      const row = [day];
      for (let i = 1; i <= maxPeriod; i++) {
        const entry = gridData.find(r => r.day === day)?.[`p${i}`];
        if (entry) {
          const teacherName = entry.staff?.name || '';
          const time = entry.start_time ? `\n(${entry.start_time.substring(0,5)} - ${entry.end_time?.substring(0,5) || ''})` : '';
          row.push(`${entry.subject || '-'}\n${teacherName}${time}`);
        } else {
          row.push('-');
        }

        const brk = activeBreaks.find(b => b.afterPeriod === i);
        if (brk) {
          const timeStr = brk.start && brk.end ? `\n(${brk.start} - ${brk.end})` : '';
          row.push(`RECESS / BREAK${timeStr}`);
        }
      }
      return row;
    });

    const columnStyles = {};
    breakColIndices.forEach(idx => {
      columnStyles[idx] = { fillColor: [254, 243, 199], textColor: [146, 64, 14], fontStyle: 'bold' };
    });

    autoTable(doc, {
      head,
      body,
      startY: 30,
      styles: { fontSize: 8, halign: 'center', cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      columnStyles
    });

    doc.save(`Timetable_${grade}_${sec}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading your timetable...</p>
      </div>
    );
  }

  if (timetable.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaCalendarAlt className="text-3xl text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Timetable Published Yet</h3>
        <p className="text-gray-500">Your school administrator hasn't published the timetable for Class {grade} - {sec} yet. Please check back later!</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <FaCalendarAlt className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Class Timetable</h2>
            <p className="text-sm text-gray-500 mt-1">Class {grade} ({sec})</p>
          </div>
        </div>
        <button 
          onClick={generatePDF}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
        >
          <FaFilePdf /> Download PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-indigo-50 border-b border-indigo-100 text-indigo-900">
                <th className="p-4 font-bold w-24 sticky left-0 bg-indigo-50 z-10 border-r border-indigo-100">Day</th>
                {periodColumns.map((col) => {
                  const activeBreaks = getActiveBreaks(periodColumns.length);
                  const brk = activeBreaks.find(b => b.afterPeriod === col.period_number);
                  return (
                    <React.Fragment key={col.period_number}>
                      <th className="p-4 border-r border-indigo-100 min-w-[160px]">
                        <div className="text-center">
                          <div className="font-bold">Period {col.period_number}</div>
                          {col.start && (
                            <div className="text-xs text-indigo-600/80 font-medium mt-1">
                              {col.start} - {col.end}
                            </div>
                          )}
                        </div>
                      </th>
                      {brk && (
                        <th
                          key={`break-th-${brk.id}-${col.period_number}`}
                          className={`p-3 border-x-2 min-w-[145px] text-center ${
                            brk.id === 'break2'
                              ? 'border-orange-300 bg-orange-100/90 text-orange-950'
                              : 'border-amber-300 bg-amber-100/90 text-amber-950'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                              {brk.id === 'break2' ? <FaCoffee className="text-orange-600" /> : <FaUtensils className="text-amber-600" />}
                              <span>{brk.label || 'Tiffin Break'}</span>
                            </div>
                            {brk.start && brk.end && (
                              <span className="text-[10px] text-amber-800 font-mono font-medium">
                                {brk.start} - {brk.end}
                              </span>
                            )}
                          </div>
                        </th>
                      )}
                    </React.Fragment>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gridData.map((row) => (
                <tr key={row.day} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-700 sticky left-0 bg-white border-r border-gray-100 z-10">
                    {row.day}
                  </td>
                  {periodColumns.map((col) => {
                    const activeBreaks = getActiveBreaks(periodColumns.length);
                    const brk = activeBreaks.find(b => b.afterPeriod === col.period_number);
                    const entry = row[`p${col.period_number}`];
                    return (
                      <React.Fragment key={col.period_number}>
                        <td className="p-3 border-r border-gray-100 align-top">
                          {entry && entry.subject ? (
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 h-full flex flex-col justify-center text-center">
                              <span className="font-bold text-gray-800">{entry.subject}</span>
                              {entry.subject !== 'Recess' && entry.staff?.name && (
                                <span className="text-xs text-indigo-600 font-medium mt-1.5">{entry.staff.name}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-gray-300 text-xs py-4">-</div>
                          )}
                        </td>
                        {brk && (
                          <td
                            key={`break-td-${brk.id}-${col.period_number}`}
                            className={`p-2 border-x-2 text-center align-middle ${
                              brk.id === 'break2'
                                ? 'border-orange-300/80 bg-orange-50/70'
                                : 'border-amber-300/80 bg-amber-50/70'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-white/80 border border-amber-200/80 shadow-2xs">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 ${
                                brk.id === 'break2' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {brk.id === 'break2' ? <FaCoffee size={12} /> : <FaUtensils size={12} />}
                              </div>
                              <span className="text-[11px] font-black tracking-wider text-amber-950 uppercase">
                                {brk.label || 'RECESS'}
                              </span>
                              {brk.start && brk.end && (
                                <span className="text-[10px] text-amber-800 font-mono font-bold mt-0.5">
                                  {brk.start} – {brk.end}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetable;
