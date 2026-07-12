const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// --- STUDENT ATTENDANCE ---

// @desc    Get student attendance by date and class/section
// @route   GET /api/attendance/students
// @access  Private (Admin)
router.get('/students', protect, async (req, res) => {
  try {
    const { date, grade } = req.query; // we assume 'grade' maps to class_level in students table
    
    // First, fetch students in the grade
    let studentsQuery = supabase.from('students').select('id, student_name, admission_id, grade');
    if (grade) {
      studentsQuery = studentsQuery.eq('grade', grade);
    }
    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) throw studentsError;

    // Then, fetch attendance for those students on that date
    let attQuery = supabase.from('student_attendance').select('*').eq('date', date);
    const { data: attendanceData, error: attError } = await attQuery;
    if (attError) throw attError;

    // Merge them
    const result = students.map(st => {
      const att = attendanceData.find(a => a.student_id === st.id);
      return {
        ...st,
        attendance_status: att ? att.status : 'Not Marked',
        attendance_id: att ? att.id : null
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Mark/Update student attendance
// @route   POST /api/attendance/students
// @access  Private (Admin)
router.post('/students', protect, async (req, res) => {
  try {
    const { date, attendance } = req.body; 
    // attendance: array of { student_id, status }
    
    // In Supabase we can do upsert if there's a unique constraint on (student_id, date)
    const upsertData = attendance.map(a => ({
      student_id: a.student_id,
      date,
      status: a.status
    }));
    
    const { data, error } = await supabase
      .from('student_attendance')
      .upsert(upsertData, { onConflict: 'student_id,date' })
      .select();

    if (error) throw error;
    res.json({ message: 'Attendance saved successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// --- STAFF ATTENDANCE ---

// @desc    Get staff attendance by date
// @route   GET /api/attendance/staff
// @access  Private (Admin)
router.get('/staff', protect, async (req, res) => {
  try {
    const { date } = req.query;
    
    // Fetch all staff
    const { data: staffList, error: staffError } = await supabase.from('staff').select('id, name, department, role');
    if (staffError) throw staffError;

    // Fetch attendance for the date
    const { data: attendanceData, error: attError } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('date', date);
    if (attError) throw attError;

    // Merge them
    const result = staffList.map(st => {
      const att = attendanceData.find(a => a.staff_id === st.id);
      return {
        ...st,
        attendance_status: att ? att.status : 'Not Marked',
        entry_time: att ? att.entry_time : null,
        exit_time: att ? att.exit_time : null,
        attendance_id: att ? att.id : null
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Mark/Update staff attendance
// @route   POST /api/attendance/staff
// @access  Private (Admin)
router.post('/staff', protect, async (req, res) => {
  try {
    const { date, attendance } = req.body; 
    // attendance: array of { staff_id, status, entry_time, exit_time }
    
    const { data: existingAtt, error: exError } = await supabase.from('staff_attendance').select('*').eq('date', date);
    
    // Upsert equivalent since we don't know if staff_id+date is unique in the original schema
    // Delete existing for these staff on this date, then insert
    const staffIds = attendance.map(a => a.staff_id);
    await supabase.from('staff_attendance').delete().eq('date', date).in('staff_id', staffIds);
    
    const insertData = attendance.map(a => ({
      staff_id: a.staff_id,
      date,
      status: a.status,
      entry_time: a.entry_time || null,
      exit_time: a.exit_time || null
    }));
    
    const { data, error } = await supabase
      .from('staff_attendance')
      .insert(insertData)
      .select();

    if (error) throw error;
    res.json({ message: 'Staff Attendance saved', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

module.exports = router;
