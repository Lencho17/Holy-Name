import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaChalkboardTeacher, FaTrash } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminStaffAssignments = () => {
  const [activeTab, setActiveTab] = useState('timetable');
  const [staffList, setStaffList] = useState([]);
  
  const [timetables, setTimetables] = useState([]);
  const [examDuties, setExamDuties] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [subjectsList] = useState(['Math', 'Science', 'English', 'History', 'Geography', 'Computer']); // Mock static list or fetch

  // Form states
  const [ttForm, setTtForm] = useState({ class_level: '', section: '', day_of_week: 'Monday', period_number: '', subject: '', staff_id: '', start_time: '', end_time: '' });
  const [examForm, setExamForm] = useState({ staff_id: '', exam_date: '', start_time: '', end_time: '', room_no: '', role: 'Main Examiner', venue: 'Own School' });
  const [assignForm, setAssignForm] = useState({ class_name: '', section: '', class_teacher_id: '', subject_teachers: [] });
  const [tempSubject, setTempSubject] = useState({ subject: '', teacher_id: '' });

  useEffect(() => {
    fetchStaff();
    fetchTimetables();
    fetchExamDuties();
    fetchClassAssignments();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/staff/admin/all-staff`, { headers: { Authorization: `Bearer ${token}` } });
      setStaffList(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchTimetables = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/staff/admin/timetable`, { headers: { Authorization: `Bearer ${token}` } });
      setTimetables(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchExamDuties = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/staff/admin/exam-duties`, { headers: { Authorization: `Bearer ${token}` } });
      setExamDuties(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchClassAssignments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      setClassAssignments(res.data);
    } catch (e) { console.error(e); }
  };

  const handleTtSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/staff/admin/timetable`, ttForm, { headers: { Authorization: `Bearer ${token}` } });
      alert('Timetable assigned!');
      fetchTimetables();
      setTtForm({ class_level: '', section: '', day_of_week: 'Monday', period_number: '', subject: '', staff_id: '', start_time: '', end_time: '' });
    } catch (e) { alert('Failed to assign timetable'); }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/staff/admin/exam-duties`, examForm, { headers: { Authorization: `Bearer ${token}` } });
      alert('Exam duty assigned!');
      fetchExamDuties();
      setExamForm({ staff_id: '', exam_date: '', start_time: '', end_time: '', room_no: '', role: 'Main Examiner', venue: 'Own School' });
    } catch (e) { alert('Failed to assign exam duty'); }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/assignments`, assignForm, { headers: { Authorization: `Bearer ${token}` } });
      alert('Class Teachers & Subjects Assigned! Email notifications sent.');
      fetchClassAssignments();
      setAssignForm({ class_name: '', section: '', class_teacher_id: '', subject_teachers: [] });
    } catch (e) { alert('Failed to assign class/subjects'); }
  };

  const deleteTt = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/staff/admin/timetable/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTimetables();
    } catch (e) { alert('Failed to delete'); }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam duty?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/staff/admin/exam-duties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchExamDuties();
    } catch (e) { alert('Failed to delete'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button 
          onClick={() => setActiveTab('timetable')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'timetable' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FaCalendarAlt /> Class Timetable
        </button>
        <button 
          onClick={() => setActiveTab('exams')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'exams' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FaChalkboardTeacher /> Exam Duties
        </button>
        <button 
          onClick={() => setActiveTab('class-assignments')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'class-assignments' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment_ind</span> Teacher Mapping
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'timetable' && (
          <div className="space-y-8">
            <form onSubmit={handleTtSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <h4 className="md:col-span-3 font-bold text-gray-800">Assign New Class Timetable</h4>
              <select required className="p-2 border rounded" value={ttForm.staff_id} onChange={e => setTtForm({...ttForm, staff_id: e.target.value})}>
                <option value="">Select Staff Member</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
              </select>
              <input required type="text" placeholder="Class (e.g. 10)" className="p-2 border rounded" value={ttForm.class_level} onChange={e => setTtForm({...ttForm, class_level: e.target.value})} />
              <input required type="text" placeholder="Section (e.g. A)" className="p-2 border rounded" value={ttForm.section} onChange={e => setTtForm({...ttForm, section: e.target.value})} />
              <select required className="p-2 border rounded" value={ttForm.day_of_week} onChange={e => setTtForm({...ttForm, day_of_week: e.target.value})}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d}>{d}</option>)}
              </select>
              <input required type="number" placeholder="Period Number" className="p-2 border rounded" value={ttForm.period_number} onChange={e => setTtForm({...ttForm, period_number: e.target.value})} />
              <input required type="text" placeholder="Subject" className="p-2 border rounded" value={ttForm.subject} onChange={e => setTtForm({...ttForm, subject: e.target.value})} />
              <input required type="time" className="p-2 border rounded" value={ttForm.start_time} onChange={e => setTtForm({...ttForm, start_time: e.target.value})} />
              <input required type="time" className="p-2 border rounded" value={ttForm.end_time} onChange={e => setTtForm({...ttForm, end_time: e.target.value})} />
              <button type="submit" className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700">Assign Class</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Staff</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Class & Subject</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Time</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timetables.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-bold">{t.staff?.name}</td>
                      <td className="p-3 text-sm">{t.class_level}-{t.section} | {t.subject}</td>
                      <td className="p-3 text-sm">{t.day_of_week} | Period {t.period_number} | {t.start_time} - {t.end_time}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => deleteTt(t.id)} className="text-red-500 hover:text-red-700"><FaTrash/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-8">
            <form onSubmit={handleExamSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <h4 className="md:col-span-3 font-bold text-gray-800">Assign Exam Duty</h4>
              <select required className="p-2 border rounded" value={examForm.staff_id} onChange={e => setExamForm({...examForm, staff_id: e.target.value})}>
                <option value="">Select Staff Member</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
              </select>
              <input required type="date" className="p-2 border rounded" value={examForm.exam_date} onChange={e => setExamForm({...examForm, exam_date: e.target.value})} />
              <input required type="text" placeholder="Room No" className="p-2 border rounded" value={examForm.room_no} onChange={e => setExamForm({...examForm, room_no: e.target.value})} />
              <input required type="time" className="p-2 border rounded" value={examForm.start_time} onChange={e => setExamForm({...examForm, start_time: e.target.value})} />
              <input required type="time" className="p-2 border rounded" value={examForm.end_time} onChange={e => setExamForm({...examForm, end_time: e.target.value})} />
              <select required className="p-2 border rounded" value={examForm.role} onChange={e => setExamForm({...examForm, role: e.target.value})}>
                <option>Main Examiner</option>
                <option>Reliever</option>
                <option>Assistant</option>
              </select>
              <input type="text" placeholder="Venue" className="p-2 border rounded" value={examForm.venue} onChange={e => setExamForm({...examForm, venue: e.target.value})} />
              <button type="submit" className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700 md:col-span-2">Assign Exam Duty</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Staff</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Date & Time</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Room & Role</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examDuties.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm font-bold">{e.staff?.name}</td>
                      <td className="p-3 text-sm">{new Date(e.exam_date).toLocaleDateString('en-GB').replace(/\//g, '-').replace(/\//g, '-')} | {e.start_time} - {e.end_time}</td>
                      <td className="p-3 text-sm">Room: {e.room_no} | {e.role}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => deleteExam(e.id)} className="text-red-500 hover:text-red-700"><FaTrash/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'class-assignments' && (
          <div className="space-y-8">
            <form onSubmit={handleAssignSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <h4 className="md:col-span-2 font-bold text-gray-800">Map Teachers to Classes & Subjects</h4>
              
              <input required type="text" placeholder="Class (e.g. 10)" className="p-2 border rounded" value={assignForm.class_name} onChange={e => setAssignForm({...assignForm, class_name: e.target.value})} />
              <input required type="text" placeholder="Section (e.g. A)" className="p-2 border rounded" value={assignForm.section} onChange={e => setAssignForm({...assignForm, section: e.target.value})} />
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-600">Assign Class Teacher:</label>
                <select required className="p-2 border rounded w-full" value={assignForm.class_teacher_id} onChange={e => setAssignForm({...assignForm, class_teacher_id: e.target.value})}>
                  <option value="">Select Class Teacher</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 border-t border-gray-200 pt-4 space-y-3">
                <label className="text-sm font-bold text-gray-600">Assign Subject Teachers:</label>
                
                <div className="flex gap-2">
                  <select className="p-2 border rounded flex-1" value={tempSubject.subject} onChange={e => setTempSubject({...tempSubject, subject: e.target.value})}>
                    <option value="">Select Subject</option>
                    {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="p-2 border rounded flex-1" value={tempSubject.teacher_id} onChange={e => setTempSubject({...tempSubject, teacher_id: e.target.value})}>
                    <option value="">Select Subject Teacher</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button 
                    type="button" 
                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 font-bold"
                    onClick={() => {
                      if(tempSubject.subject && tempSubject.teacher_id) {
                        setAssignForm({...assignForm, subject_teachers: [...assignForm.subject_teachers, tempSubject]});
                        setTempSubject({ subject: '', teacher_id: '' });
                      }
                    }}
                  >Add</button>
                </div>

                {assignForm.subject_teachers.length > 0 && (
                  <ul className="bg-white border rounded p-3 space-y-2">
                    {assignForm.subject_teachers.map((st, i) => {
                      const teacher = staffList.find(s => s.id === st.teacher_id);
                      return (
                        <li key={i} className="flex justify-between items-center text-sm border-b pb-1 last:border-0 last:pb-0">
                          <span><strong>{st.subject}</strong>: {teacher?.name}</span>
                          <button type="button" onClick={() => {
                            const filtered = assignForm.subject_teachers.filter((_, idx) => idx !== i);
                            setAssignForm({...assignForm, subject_teachers: filtered});
                          }} className="text-red-500 text-xs">Remove</button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <button type="submit" className="bg-blue-600 text-white font-bold p-2 rounded hover:bg-blue-700 md:col-span-2 mt-4">Save Mapping & Notify Teachers</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Class Teacher</th>
                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Subject Teachers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classAssignments.map(ca => {
                    const ct = staffList.find(s => s.id === ca.class_teacher_id);
                    return (
                      <tr key={ca.id} className="hover:bg-gray-50">
                        <td className="p-3 text-sm font-bold">{ca.class_name} - {ca.section}</td>
                        <td className="p-3 text-sm text-blue-600 font-medium">{ct?.name || ca.class_teacher_id}</td>
                        <td className="p-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {ca.subject_teachers?.map((st, i) => {
                              const stt = staffList.find(s => s.id === st.teacher_id);
                              return (
                                <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {st.subject}: {stt?.name}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStaffAssignments;
