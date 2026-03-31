const Student = require('../models/Student');

// GET all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET single student
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE student (Admin manual add)
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create student', error: error.message });
  }
};

// UPDATE student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// EXPORT students to CSV
exports.exportStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ grade: 1, studentName: 1 });
    
    // Define CSV headers
    const headers = [
      'Student Name',
      'Roll Number',
      'Section',
      'Grade/Class',
      'Gender',
      'Date of Birth',
      'Guardian Name',
      'Contact Number',
      'Email',
      'Address',
      'Status',
      'PEN Number',
      'Aadhar Number',
      'Admission Date'
    ];

    // Map students to CSV rows
    const rows = students.map(s => [
      `"${s.studentName || ''}"`,
      `"${s.rollNumber || ''}"`,
      `"${s.section || ''}"`,
      `"${(s.grade || '').toUpperCase()}"`,
      `"${s.gender || ''}"`,
      `"${s.dateOfBirth || ''}"`,
      `"${s.guardianName || ''}"`,
      `"=""${s.contactNumber || ''}"""`,
      `"${s.email || ''}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${s.status || ''}"`,
      `"=""${s.penNumber || ''}"""`,
      `"=""${s.aadharNumber || ''}"""`,
      `"${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}"`
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Set response headers for file download
    const fileName = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    res.send(csvContent);
  } catch (error) {
    console.error('Export Students Error:', error.message);
    res.status(500).json({ message: 'Failed to export students', error: error.message });
  }
};
