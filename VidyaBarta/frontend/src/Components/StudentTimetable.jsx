import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { StudentAuthContext } from '../context/StudentAuthContext';
import { FaCalendarAlt, FaFilePdf, FaSpinner } from 'react-icons/fa';
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
    doc.text(`${student.name} - Class ${student.grade} (${student.section || 'A'}) Timetable`, 14, 20);
    
    const head = [['Day', ...Array.from({length: maxPeriod}, (_, i) => `Period ${i+1}`)]];
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
      }
      return row;
    });

    autoTable(doc, {
      head,
      body,
      startY: 30,
      styles: { fontSize: 8, halign: 'center', cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] } // indigo-600
    });

    doc.save(`Timetable_${student.grade}_${student.section || 'A'}.pdf`);
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
        <p className="text-gray-500">Your school administrator hasn't published the timetable for Class {student.grade} - {student.section || 'A'} yet. Please check back later!</p>
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
            <p className="text-sm text-gray-500 mt-1">Class {student.grade} ({student.section || 'A'})</p>
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
                {periodColumns.map((col) => (
                  <th key={col.period_number} className="p-4 border-r border-indigo-100 min-w-[160px]">
                    <div className="text-center">
                      <div className="font-bold">Period {col.period_number}</div>
                      {col.start && (
                        <div className="text-xs text-indigo-600/80 font-medium mt-1">
                          {col.start} - {col.end}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gridData.map((row) => (
                <tr key={row.day} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-700 sticky left-0 bg-white border-r border-gray-100 z-10">
                    {row.day}
                  </td>
                  {periodColumns.map((col) => {
                    const entry = row[`p${col.period_number}`];
                    return (
                      <td key={col.period_number} className="p-3 border-r border-gray-100 align-top">
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
