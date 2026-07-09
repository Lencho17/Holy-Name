import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClock, FaBookOpen } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StaffTimetable = () => {
  const [classTimetable, setClassTimetable] = useState([]);
  const [examDuties, setExamDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('class'); // 'class' | 'exam'

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      const [classRes, examRes] = await Promise.all([
        axios.get(`${API_URL}/staff/timetable/class`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/staff/timetable/exam`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setClassTimetable(classRes.data);
      setExamDuties(examRes.data);
    } catch (err) {
      console.error('Failed to fetch timetables', err);
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading timetables...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex gap-2">
        <button
          onClick={() => setActiveTab('class')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'class' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <div className="flex items-center justify-center gap-2"><FaClock /> Class Timetable</div>
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'exam' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <div className="flex items-center justify-center gap-2"><FaBookOpen /> Exam Duties</div>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'class' && (
          <div>
            {classTimetable.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No class timetable assigned.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {daysOfWeek.map(day => {
                  const dayClasses = classTimetable.filter(c => c.day_of_week === day);
                  if (dayClasses.length === 0) return null;
                  
                  return (
                    <div key={day} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h4 className="font-bold text-gray-800">{day}</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {dayClasses.map((cls, idx) => (
                          <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div>
                              <p className="text-xs font-bold text-blue-600">Period {cls.period_number}</p>
                              <p className="text-sm font-bold text-gray-800">{cls.subject}</p>
                              <p className="text-xs text-gray-500">Class: {cls.class_level} {cls.section}</p>
                            </div>
                            <div className="text-right text-xs text-gray-500 font-medium">
                              <p>{cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'exam' && (
          <div>
            {examDuties.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exam duties assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {examDuties.map((duty, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm font-bold text-gray-800">
                          {new Date(duty.exam_date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-gray-700">
                          {duty.start_time?.slice(0,5)} - {duty.end_time?.slice(0,5)}
                        </td>
                        <td className="p-4 text-sm font-bold text-blue-600">{duty.room_no}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${duty.role === 'Main Examiner' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {duty.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTimetable;
