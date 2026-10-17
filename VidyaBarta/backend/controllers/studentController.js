const supabase = require('../config/supabase');
const { getEquivalentClasses } = require('../utils/classMapping');

// @desc    Get all students with search and pagination
// @route   GET /api/students
// @access  Private (Admin)
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = 10000;
    if (req.query.limit && req.query.limit !== 'all') {
      limit = parseInt(req.query.limit) || 10000;
    }
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const status = req.query.status;
    const section = req.query.section;
    const sortBy = req.query.sortBy || 'name_asc';

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    if (req.user && req.user.school_id) {
      query = query.or(`school_id.eq.${req.user.school_id},school_id.is.null`);
    }

    if (status && status !== 'all') {
      query = query.eq('enrollment_status', status);
    } else if (!status) {
      // Default to active for backward compatibility
      query = query.eq('enrollment_status', 'active');
    }

    if (search) {
      query = query.or(`student_name.ilike.%${search}%,admission_id.ilike.%${search}%,guardian_name.ilike.%${search}%,email.ilike.%${search}%,contact_number.ilike.%${search}%,pen_number.ilike.%${search}%`);
    }
    
    const classLevel = req.query.class_level;
    
    if (classLevel && section) {
      const classLevelVariants = getEquivalentClasses(classLevel);
      const combinedVariants = classLevelVariants.map(v => `${v} ${section}`);
      
      const gradeIn = classLevelVariants.map(v => `"${v}"`).join(',');
      const combinedIn = combinedVariants.map(v => `"${v}"`).join(',');
      
      query = query.or(`grade.in.(${combinedIn}),and(grade.in.(${gradeIn}),section.eq.${section})`);
    } else if (classLevel) {
      const classLevelVariants = getEquivalentClasses(classLevel);
      const orConditions = [];
      classLevelVariants.forEach(v => {
        orConditions.push(`grade.eq."${v}"`);
        orConditions.push(`grade.ilike."${v} %"`);
      });
      query = query.or(orConditions.join(','));
    } else if (section) {
      query = query.eq('section', section);
    }

    if (sortBy === 'name_asc') {
      query = query.order('student_name', { ascending: true });
    } else if (sortBy === 'name_desc') {
      query = query.order('student_name', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: students, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      data: students,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get aggregated student directory stats (total, boys, girls, transgender, incomplete, class/section breakdown)
// @route   GET /api/students/stats
// @access  Private (Staff/Admin)
exports.getStudentStats = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    let query = supabase
      .from('students')
      .select('grade, section, gender, pen_number, aadhar_number, father_name, enrollment_status');

    if (schoolId) {
      query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
    }

    query = query.eq('enrollment_status', 'active');

    const { data: students, error } = await query;
    if (error) throw error;

    const stats = {
      total: (students || []).length,
      boys: 0,
      girls: 0,
      transgender: 0,
      incomplete: 0,
      classes: {}
    };

    const normClassStr = (val) => {
      if (!val) return '';
      const clean = String(val).replace(/^Class\s*/i, '').trim().toUpperCase();
      const romanMap = {
        '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
        '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
        '11': 'XI', '12': 'XII'
      };
      return romanMap[clean] || clean;
    };

    (students || []).forEach(student => {
      let gender = (student.gender || '').toLowerCase().trim();
      let rawGrade = (student.grade || 'I').trim();
      let parts = rawGrade.split(/\s+/);
      let studentClass = parts[0] || 'I';
      let studentSec = student.section || parts[1] || 'A';
      studentSec = studentSec.toUpperCase().trim();

      const normalizedClass = normClassStr(studentClass);

      let isBoy = gender === 'male' || gender === 'boy';
      let isGirl = gender === 'female' || gender === 'girl';
      let isTrans = gender === 'transgender';
      let isIncomplete = !student.pen_number || !student.aadhar_number || !student.father_name;

      if (isBoy) stats.boys++;
      if (isGirl) stats.girls++;
      if (isTrans) stats.transgender++;
      if (isIncomplete) stats.incomplete++;

      if (!stats.classes[normalizedClass]) {
        stats.classes[normalizedClass] = {
          boys: 0,
          girls: 0,
          transgender: 0,
          total: 0,
          incomplete: 0,
          sections: {}
        };
      }

      if (!stats.classes[normalizedClass].sections[studentSec]) {
        stats.classes[normalizedClass].sections[studentSec] = {
          boys: 0,
          girls: 0,
          transgender: 0,
          total: 0,
          incomplete: 0
        };
      }

      stats.classes[normalizedClass].total++;
      stats.classes[normalizedClass].sections[studentSec].total++;

      if (isBoy) {
        stats.classes[normalizedClass].boys++;
        stats.classes[normalizedClass].sections[studentSec].boys++;
      }
      if (isGirl) {
        stats.classes[normalizedClass].girls++;
        stats.classes[normalizedClass].sections[studentSec].girls++;
      }
      if (isTrans) {
        stats.classes[normalizedClass].transgender++;
        stats.classes[normalizedClass].sections[studentSec].transgender++;
      }
      if (isIncomplete) {
        stats.classes[normalizedClass].incomplete++;
        stats.classes[normalizedClass].sections[studentSec].incomplete++;
      }
    });

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export student directory to XLS
// @route   GET /api/students/export
// @access  Private (Admin)
exports.exportStudents = async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('student_name', { ascending: true });
    
    if (error) throw error;
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          .text { mso-number-format:"\\@"; }
          th { background-color: #1e3a8a; color: white; font-weight: bold; }
          td, th { border: 0.5pt solid #ccc; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th>Student Name</th>
            <th>Grade/Class</th>
            <th>Guardian Name</th>
            <th>Contact Number</th>
            <th>Email</th>
            <th>Aadhar Number</th>
            <th>PEN Number</th>
            <th>Address</th>
            <th>Enrollment Date</th>
          </tr>
    `;

    students.forEach(s => {
      html += `
        <tr>
          <td>${s.student_name || ''}</td>
          <td>${(s.grade || '').toUpperCase()}</td>
          <td>${s.guardian_name || ''}</td>
          <td class="text">${s.contact_number || ''}</td>
          <td>${s.email || ''}</td>
          <td class="text">${s.aadhar_number || ''}</td>
          <td class="text">${s.pen_number || ''}</td>
          <td>${s.address || ''}</td>
          <td>${s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const fileName = `students_directory_export_${new Date().toISOString().split('T')[0]}.xls`;
    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(html);
  } catch (error) {
    console.error('Export Students Error:', error.message);
    res.status(500).json({ message: 'Failed to export students', error: error.message });
  }
};

// @desc    Get single student details
// @route   GET /api/students/:id
// @access  Private (Admin)
exports.getStudentById = async (req, res) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin)
exports.updateStudent = async (req, res) => {
  try {
    const updateData = {
      student_name: req.body.name || req.body.studentName || req.body.student_name,
      admission_id: req.body.admissionId || req.body.admission_id,
      roll_number: req.body.rollNumber || req.body.roll_number,
      grade: req.body.grade || req.body.classLevel,
      section: req.body.section,
      blood_group: req.body.bloodGroup || req.body.blood_group,
      gender: req.body.gender,
      guardian_name: req.body.parentsName || req.body.guardianName || req.body.parents_name || req.body.guardian_name,
      father_name: req.body.father_name || req.body.fatherName,
      mother_name: req.body.mother_name || req.body.motherName,
      contact_number: req.body.phone || req.body.contactNumber || req.body.contact_number,
      email: req.body.email,
      address: req.body.address,
      date_of_birth: req.body.dob || req.body.date_of_birth,
      mil_subject: req.body.mil_subject,
      elective_subject: req.body.elective_subject,
      enrollment_status: req.body.enrollment_status,
      updated_at: new Date()
    };

    // Remove undefined
    const cleanUpdate = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));

    const { data: student, error } = await supabase
      .from('students')
      .update(cleanUpdate)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
exports.deleteStudent = async (req, res) => {
  try {
    const { error } = await supabase.from('students').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Student removed from directory' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a new student manually
// @route   POST /api/students
// @access  Private (Admin)
exports.createStudent = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const phone = req.body.phone || req.body.contactNumber || req.body.contact_number;
    let passwordHash = null;
    if (phone) {
      const digits = String(phone).replace(/[^0-9]/g, '');
      passwordHash = await bcrypt.hash(digits.slice(-10) || 'Student@123', 10);
    } else {
      passwordHash = await bcrypt.hash('Student@123', 10);
    }

    const studentData = {
      student_name: (req.body.name || req.body.studentName || req.body.student_name || '').trim(),
      admission_id: (req.body.admissionId || req.body.admission_id || req.body.rollNumber || `ADM-${Date.now().toString().slice(-6)}`).trim(),
      roll_number: req.body.rollNumber || req.body.roll_number || null,
      grade: req.body.grade || req.body.classLevel || 'I',
      section: (req.body.section || 'A').toUpperCase().trim(),
      gender: req.body.gender || null,
      date_of_birth: req.body.dob || req.body.date_of_birth || null,
      blood_group: req.body.bloodGroup || req.body.blood_group || null,
      father_name: req.body.fatherName || req.body.father_name || null,
      mother_name: req.body.motherName || req.body.mother_name || null,
      guardian_name: req.body.guardianName || req.body.guardian_name || req.body.parentsName || req.body.fatherName || null,
      contact_number: phone ? String(phone).trim() : null,
      email: req.body.email ? String(req.body.email).trim() : null,
      pen_number: req.body.penNumber || req.body.pen_number || null,
      aadhar_number: req.body.aadharNumber || req.body.aadhar_number || req.body.aadhaarNumber || null,
      address: req.body.address ? String(req.body.address).trim() : null,
      password: passwordHash,
      school_id: req.user ? req.user.school_id : null,
      enrollment_status: 'active'
    };

    const { data: student, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update student enrollment status
// @route   PUT /api/students/:id/status
// @access  Private (Admin)
exports.updateStudentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'not_progressed', 'dropbox', 'prev_session'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { data: student, error } = await supabase
      .from('students')
      .update({ enrollment_status: status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search for a dropbox student globally by PEN or Aadhaar
// @route   GET /api/students/global-search
// @access  Private (Admin)
exports.globalSearchStudents = async (req, res) => {
  try {
    const { pen_number } = req.query;
    if (!pen_number) {
      return res.status(400).json({ message: 'Search parameter (pen_number) is required' });
    }

    // Search globally across all schools, but ONLY if they are dropboxed
    const { data: students, error } = await supabase
      .from('students')
      .select('id, student_name, grade, section, father_name, mother_name, guardian_name, date_of_birth, gender, pen_number, school_id')
      .eq('enrollment_status', 'dropbox')
      .eq('pen_number', pen_number);

    if (error) throw error;

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Import a dropboxed student into current school
// @route   POST /api/students/:id/import
// @access  Private (Admin)
exports.importStudent = async (req, res) => {
  try {
    if (!req.user || !req.user.school_id) {
      return res.status(403).json({ message: 'School ID required for import' });
    }

    // First ensure the student is currently dropboxed
    const { data: studentCheck, error: checkError } = await supabase
      .from('students')
      .select('id, enrollment_status')
      .eq('id', req.params.id)
      .single();

    if (checkError || !studentCheck) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (studentCheck.enrollment_status !== 'dropbox') {
      return res.status(400).json({ message: 'Only dropboxed students can be imported' });
    }

    const { data: student, error } = await supabase
      .from('students')
      .update({ 
        school_id: req.user.school_id, 
        enrollment_status: 'active',
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Student successfully imported', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.issueReadmission = async (req, res) => {
  try {
    const { classes, deadline } = req.body;
    if (!classes || !deadline) {
      return res.status(400).json({ message: 'Classes and deadline are required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let query = supabase
      .from('students')
      .update({ 
        admission_fee_paid: false, 
        readmission_deadline: deadline 
      })
      .eq('school_id', req.user.school_id)
      .eq('enrollment_status', 'active');

    if (!classes.includes('ALL')) {
      const orConditions = [];
      classes.forEach(cls => {
        const variants = getEquivalentClasses(cls);
        variants.forEach(v => {
          orConditions.push(`grade.ilike."${v}"`);
          orConditions.push(`grade.ilike."${v} %"`);
          orConditions.push(`grade.ilike."Class ${v}"`);
        });
      });
      query = query.or(orConditions.join(','));
    }

    const { data, error } = await query.select();

    if (error) throw error;
    res.json({ message: 'Readmission issued successfully', updatedCount: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
