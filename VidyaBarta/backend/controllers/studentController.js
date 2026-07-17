const supabase = require('../config/supabase');

// @desc    Get all students with search and pagination
// @route   GET /api/students
// @access  Private (Admin)
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`student_name.ilike.%${search}%,admission_id.ilike.%${search}%,guardian_name.ilike.%${search}%,email.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }
    
    if (req.query.class_level) {
      query = query.eq('class', req.query.class_level);
    }
    
    if (req.query.section) {
      query = query.eq('section', req.query.section);
    }

    const { data: students, count, error } = await query
      .order('created_at', { ascending: false })
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
      name: req.body.name || req.body.studentName,
      roll_number: req.body.rollNumber || req.body.admissionId,
      class_level: req.body.classLevel || req.body.grade,
      section: req.body.section,
      parents_name: req.body.parentsName || req.body.guardianName,
      phone: req.body.phone || req.body.contactNumber,
      email: req.body.email,
      address: req.body.address,
      status: req.body.status,
      mil_subject: req.body.mil_subject,
      elective_subject: req.body.elective_subject,
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
      name: req.body.name || req.body.studentName,
      roll_number: req.body.rollNumber || req.body.admissionId,
      class_level: req.body.classLevel || req.body.grade,
      section: req.body.section,
      parents_name: req.body.parentsName || req.body.guardianName,
      phone: req.body.phone || req.body.contactNumber,
      email: req.body.email,
      address: req.body.address,
      status: req.body.status || 'Active'
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
