const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protectStudent } = require('../middleware/auth');


function getRoman(numStr) {
  const map = {
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
    '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
    '11': 'XI', '12': 'XII'
  };
  return map[numStr] || numStr;
}

function parseStudentClass(student) {
  let classLevel = student.grade;
  let section = student.section || 'A';
  
  if (classLevel && classLevel.includes(' ')) {
    const parts = classLevel.split(' ');
    classLevel = parts[0];
    section = parts[1];
  }
  
  return { classLevel, section };
}


// @route   GET /api/student-portal/grades
// @desc    Get grades for the logged in student
// @access  Private (Student)
router.get('/grades', protectStudent, async (req, res) => {
  try {
    // Assuming we fetch from exam_results or subject_marks
    // Using exam_results as the likely table based on Supabase schema
    const { data: grades, error } = await supabase
      .from('exam_results')
      .select('*, exams(*)')
      .eq('student_id', req.student.id)
      .eq('withheld', false);

    if (error && error.code !== '42P01') { 
      // Ignore table not found if it's not setup yet
      console.error('Supabase query error:', error);
    }
    
    res.json(grades || []);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student-portal/notices
// @desc    Get notices
// @access  Private (Student)
router.get('/notices', protectStudent, async (req, res) => {
  try {
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    
    res.json(notices || []);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student-portal/courses
// @desc    Get courses/subjects for the logged in student
// @access  Private (Student)
router.get('/courses', protectStudent, async (req, res) => {
  try {
    const student = req.student;
    const parsed = parseStudentClass(student);
    
    // 1. Get Class Teacher
    let classTeacher = 'Not Assigned';
    const { data: assignmentData } = await supabase
      .from('class_assignments')
      .select('class_teacher_id, staff:class_teacher_id(name)')
      .in('class_name', [parsed.classLevel, getRoman(parsed.classLevel)])
      .eq('section', parsed.section)
      .single();
      
    if (assignmentData && assignmentData.staff) {
      classTeacher = assignmentData.staff.name;
    }
    
    // 2. Get Subjects configured by admin for this class
    const { data: configuredSubjects } = await supabase
      .from('school_subjects')
      .select('subjects(name)')
      .in('class_level', [parsed.classLevel, getRoman(parsed.classLevel)]);
      
    // 3. Get Unique Subjects and their Teachers from Timetable
    const { data: timetableData } = await supabase
      .from('class_timetable')
      .select('subject, staff:staff_id(name)')
      .in('class_level', [parsed.classLevel, getRoman(parsed.classLevel)])
      .eq('section', parsed.section)
      .eq('is_published', true);
      
    const subjectsMap = new Map();
    
    // First, populate all configured subjects with "Not Assigned"
    if (configuredSubjects) {
      configuredSubjects.forEach(entry => {
        if (entry.subjects && entry.subjects.name) {
          subjectsMap.set(entry.subjects.name, 'Not Assigned');
        }
      });
    }

    // Then, overlay teachers from timetable
    if (timetableData) {
      timetableData.forEach(entry => {
        if (entry.subject && entry.subject !== 'Recess') {
          subjectsMap.set(entry.subject, entry.staff ? entry.staff.name : 'Not Assigned');
        }
      });
    }
    
    const subjectsList = Array.from(subjectsMap, ([name, teacher]) => ({ name, teacher }));
    
    res.json({
      currentClass: parsed.classLevel,
      section: parsed.section,
      session: '2024-2025',
      classTeacher,
      subjects: subjectsList
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student-portal/assignments
// @desc    Get assignments
// @access  Private (Student)
router.get('/assignments', protectStudent, async (req, res) => {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error && error.code !== '42P01') {
      console.error('Supabase query error:', error);
    }
    
    res.json(assignments || []);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student-portal/fees
// @desc    Get fee records for the logged in student
// @access  Private (Student)
router.get('/fees', protectStudent, async (req, res) => {
  try {
    const { data: fees, error } = await supabase
      .from('fee_records')
      .select('*')
      .eq('student_id', req.student.id);
      
    if (error && error.code !== '42P01') {
      console.error('Supabase query error:', error);
    }
    
    res.json(fees || []);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student-portal/transactions
// @desc    Get transaction history
// @access  Private (Student)
router.get('/transactions', protectStudent, async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('student_id', req.student.id)
      .order('created_at', { ascending: false });
      
    if (error && error.code !== '42P01') {
      console.error('Supabase query error:', error);
    }
    
    res.json(transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/student-portal/timetable
// @desc    Get student's class timetable
// @access  Private (Student)
router.get('/timetable', protectStudent, async (req, res) => {
  try {
    const student = req.student;
    const parsed = parseStudentClass(student);
    const { data: timetable, error } = await supabase
      .from('class_timetable')
      .select('*, staff:staff_id(name)')
      .in('class_level', [parsed.classLevel, getRoman(parsed.classLevel)])
      .eq('section', parsed.section)
      .eq('is_published', true)
      .order('day_of_week', { ascending: true })
      .order('period_number', { ascending: true });

    if (error && error.code !== '42P01') {
      console.error('Supabase query error:', error);
    }
    
    res.json(timetable || []);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student-portal/upcoming-exams
// @desc    Get upcoming scheduled exams
// @access  Private (Student)
router.get('/upcoming-exams', protectStudent, async (req, res) => {
  try {
    const student = req.student;
    const parsed = parseStudentClass(student);
    
    const { data: upcomingExams, error } = await supabase
      .from('exam_timetable')
      .select('*, exams(name)')
      .in('class_level', [parsed.classLevel, getRoman(parsed.classLevel)])
      .eq('is_finalized', true)
      .gte('exam_date', new Date().toISOString().split('T')[0])
      .order('exam_date', { ascending: true });
      
    if (error && error.code !== '42P01') {
      console.error('Supabase query error:', error);
    }
    
    // Format the response for the frontend
    const formattedExams = (upcomingExams || []).map(et => ({
      ...et,
      exam_name: et.exams ? et.exams.name : 'Unknown Exam'
    }));
    
    res.json(formattedExams);
  } catch (error) {
    console.error('Error fetching upcoming exams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
