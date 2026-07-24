const supabase = require('../config/supabase');
const { getEquivalentClasses } = require('../utils/classMapping');

// @desc    Get all students with search and pagination
// @route   GET /api/students
// @access  Private (Admin)
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const status = req.query.status;
    const section = req.query.section;
    const sortBy = req.query.sortBy || 'name_asc';

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    if (req.user && req.user.school_id) {
      query = query.eq('school_id', req.user.school_id);
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
    const studentData = {
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
