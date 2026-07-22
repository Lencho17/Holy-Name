import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SiteDataContext } from '../context/SiteDataContext';
import { StudentAuthContext } from '../context/StudentAuthContext';
import { FaBook, FaChalkboardTeacher, FaGraduationCap, FaSpinner } from 'react-icons/fa';

const StudentCourses = () => {
  const { API_URL } = useContext(SiteDataContext);
  const { token } = useContext(StudentAuthContext);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/student-portal/courses`, { headers: { Authorization: `Bearer ${token}` } });
      setCourseData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading course information...</p>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto mt-10">
        <FaBook className="text-4xl text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Course Data Available</h3>
        <p className="text-gray-500">We couldn't retrieve your course information at this time.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -z-0"></div>
          <div className="relative z-10 flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FaGraduationCap className="text-2xl" />
            </div>
            <div>
              <p className="text-indigo-100 text-sm font-bold tracking-wider uppercase">Class & Section</p>
              <h3 className="text-2xl font-black">Class {courseData.currentClass} ({courseData.section})</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Academic Session</p>
              <h4 className="text-xl font-black text-gray-800">{courseData.session}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <FaChalkboardTeacher className="text-xl" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Class Teacher</p>
              <h4 className="text-xl font-black text-gray-800">{courseData.classTeacher}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <FaBook className="text-indigo-600 text-xl" />
          <h3 className="text-xl font-bold text-gray-900">My Subjects</h3>
        </div>
        
        {courseData.subjects && courseData.subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {courseData.subjects.map((sub, idx) => (
              <div key={idx} className="group border border-gray-100 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                
                <h4 className="font-bold text-gray-900 text-lg mb-4">{sub.name}</h4>
                
                <div className="flex items-center gap-3 mt-auto bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Subject Teacher</p>
                    <p className="text-sm font-semibold text-gray-800">{sub.teacher}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">auto_stories</span>
            <p className="text-gray-500">No subjects assigned yet. Once your timetable is published, your subjects and teachers will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
