const Student = require('../models/Student');
const Admission = require('../models/Admission');

// @desc    Get all students with search and pagination
// @route   GET /api/students
// @access  Private (Admin)
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const query = {};
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { admissionId: { $regex: search, $options: 'i' } },
        { guardianName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    res.json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export student directory to XLS (HTML Table mode)
// @route   GET /api/students/export
// @access  Private (Admin)
exports.exportStudents = async (req, res) => {
  console.log('Export Students triggered (HTML Table mode)');
  try {
    const students = await Student.find().sort({ studentName: 1 });
    
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
          <td>${s.studentName || ''}</td>
          <td>${(s.grade || '').toUpperCase()}</td>
          <td>${s.guardianName || ''}</td>
          <td class="text">${s.contactNumber || ''}</td>
          <td>${s.email || ''}</td>
          <td class="text">${s.aadharNumber || ''}</td>
          <td class="text">${s.penNumber || ''}</td>
          <td>${s.address || ''}</td>
          <td>${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const fileName = `students_directory_export_${new Date().toISOString().split('T')[0]}.xls`;
    
    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.removeHeader('ETag');

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
    const student = await Student.findById(req.params.id);
    if (!student) {
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
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
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
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student removed from directory' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
