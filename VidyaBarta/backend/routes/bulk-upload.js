const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

/**
 * Helper to normalize row keys and values from spreadsheet/CSV
 */
function normalizeRow(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    normalized[cleanKey] = typeof value === 'string' ? value.trim() : (value !== null && value !== undefined ? String(value) : '');
  }
  return normalized;
}

// GET /api/bulk-upload/teachers/template
router.get('/teachers/template', (req, res) => {
  const sampleData = [
    {
      'Full Name': 'Dr. Anita Sharma',
      'Email': 'anita.sharma@school.edu',
      'Phone': '9876543210',
      'Designation': 'Senior Mathematics Teacher',
      'Role': 'Teacher',
      'Gender': 'Female',
      'Joining Date': '2024-01-15'
    },
    {
      'Full Name': 'Rajesh Verma',
      'Email': 'rajesh.verma@school.edu',
      'Phone': '9876543211',
      'Designation': 'Physics Teacher',
      'Role': 'Teacher',
      'Gender': 'Male',
      'Joining Date': '2024-02-01'
    },
    {
      'Full Name': 'Sunita Roy',
      'Email': 'sunita.roy@school.edu',
      'Phone': '9876543212',
      'Designation': 'English Teacher',
      'Role': 'Teacher',
      'Gender': 'Female',
      'Joining Date': '2024-03-01'
    }
  ];

  const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(sampleData);
  xlsx.utils.book_append_sheet(wb, ws, 'Teachers Template');

  if (format === 'xlsx') {
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="teachers_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } else {
    const csvContent = xlsx.utils.sheet_to_csv(ws);
    res.setHeader('Content-Disposition', 'attachment; filename="teachers_template.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csvContent);
  }
});

// GET /api/bulk-upload/students/template
router.get('/students/template', (req, res) => {
  const sampleData = [
    {
      'Full Name': 'Aarav Sharma',
      'Roll Number': '2024001',
      'Class Level': 'Class 1',
      'Section': 'A',
      'Email': 'aarav.parent@example.com',
      'Phone': '9876543210',
      'Parents Name': 'Ramesh Sharma',
      'Address': '123 Main Street, Guwahati'
    },
    {
      'Full Name': 'Diya Patel',
      'Roll Number': '2024002',
      'Class Level': 'Class 1',
      'Section': 'A',
      'Email': 'diya.parent@example.com',
      'Phone': '9876543211',
      'Parents Name': 'Suresh Patel',
      'Address': '456 Park Avenue, Dibrugarh'
    }
  ];

  const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(sampleData);
  xlsx.utils.book_append_sheet(wb, ws, 'Students Template');

  if (format === 'xlsx') {
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="students_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } else {
    const csvContent = xlsx.utils.sheet_to_csv(ws);
    res.setHeader('Content-Disposition', 'attachment; filename="students_template.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csvContent);
  }
});

// POST /api/bulk-upload/students
router.post('/students', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Uploaded file is empty or contains no records.' });
    }

    const insertData = [];
    const skipped = [];

    rawRows.forEach((row, index) => {
      const n = normalizeRow(row);
      const student_name = n.student_name || n.name || n.full_name || '';
      const admission_id = n.admission_id || n.roll_number || n.roll_no || n.admission_no || '';
      const class_level = n.class_level || n.class || n.grade || '';
      const section = n.section || '';
      const email = n.email || n.email_address || null;
      const phone = (n.contact_number || n.phone || n.mobile || '').replace(/[^0-9+]/g, '') || null;
      const guardian_name = n.guardian_name || n.parents_name || n.father_name || n.mother_name || null;
      const address = n.address || null;

      // Skip row if completely empty
      if (!student_name && !admission_id && !class_level) return;

      if (!student_name) {
        skipped.push({ row: index + 2, reason: 'Missing student name' });
        return;
      }

      insertData.push({
        student_name,
        admission_id: admission_id || null,
        grade: section ? `${class_level} ${section}`.trim() : class_level,
        email,
        contact_number: phone,
        guardian_name,
        address
      });
    });

    if (insertData.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'No valid student records found in file.',
        skipped
      });
    }

    const { data, error } = await supabase
      .from('students')
      .insert(insertData);

    fs.unlinkSync(req.file.path);

    if (error) throw error;

    res.json({
      success: true,
      message: `Successfully uploaded ${insertData.length} students.${skipped.length > 0 ? ` (${skipped.length} skipped)` : ''}`,
      totalProcessed: insertData.length,
      skippedCount: skipped.length,
      skipped
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[BULK UPLOAD STUDENTS ERROR]:', err);
    res.status(500).json({ message: 'Error inserting students to database', error: err.message });
  }
});

// POST /api/bulk-upload/teachers
router.post('/teachers', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Uploaded file is empty or has no rows.' });
    }

    const validRows = [];
    const skipped = [];
    const seenEmails = new Set();

    rawRows.forEach((row, index) => {
      const n = normalizeRow(row);

      const name = n.name || n.full_name || n.teacher_name || n.staff_name || '';
      const email = (n.email || n.email_address || n.email_id || n.mail || '').toLowerCase().trim();
      const phone = (n.phone || n.mobile || n.phone_number || n.contact || n.contact_number || n.mobile_no || '').replace(/[^0-9+]/g, '').trim();
      const designation = n.designation || n.job_profile || n.position || n.subject || n.department || 'Teacher';
      const role = n.role || 'Teacher';
      const salary = n.salary ? parseFloat(n.salary) : null;
      const gender = n.gender || n.sex || null;
      const dob = n.dob || n.date_of_birth || null;
      const date_of_joining = n.date_of_joining || n.joining_date || n.doj || null;
      const address = n.address || null;
      const blood_group = n.blood_group || n.bloodgroup || null;

      // Skip empty row
      if (!name && !email && !phone) return;

      if (!name) {
        skipped.push({ row: index + 2, reason: 'Missing teacher name' });
        return;
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        skipped.push({ row: index + 2, name, reason: 'Invalid or missing email address' });
        return;
      }

      // Check duplicates within this file
      if (seenEmails.has(email)) {
        skipped.push({ row: index + 2, name, email, reason: 'Duplicate email within uploaded file' });
        return;
      }
      seenEmails.add(email);

      validRows.push({
        name,
        email,
        phone: phone || null,
        designation,
        role: role.charAt(0).toUpperCase() + role.slice(1), // e.g. Teacher
        salary,
        gender,
        dob,
        date_of_joining,
        address,
        blood_group
      });
    });

    if (validRows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'No valid teacher records found. Ensure full name and valid email are present in each row.',
        skipped
      });
    }

    // Check which staff members already exist
    const emails = validRows.map(r => r.email);
    const { data: existingStaff, error: checkErr } = await supabase
      .from('staff')
      .select('id, email, password_hash')
      .in('email', emails);

    if (checkErr) {
      console.warn('Could not query existing staff:', checkErr.message);
    }

    const existingMap = new Map((existingStaff || []).map(s => [s.email.toLowerCase(), s]));

    let insertedCount = 0;
    let updatedCount = 0;

    // Prepare staff records for upsert
    const staffPayload = validRows.map(r => {
      const existing = existingMap.get(r.email);
      if (existing) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      return {
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role || 'Teacher',
        job_profile: r.designation || r.role || 'Teacher',
        gender: r.gender,
        dob: r.dob,
        date_of_joining: r.date_of_joining,
        address: r.address,
        blood_group: r.blood_group,
        is_approved: true,
        // Preserve or assign initial leave balance
        total_cl: 12,
        used_cl: 0
      };
    });

    // 1. Upsert into staff table
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .upsert(staffPayload, { onConflict: 'email' })
      .select('id, email, name, role');

    if (staffError) throw staffError;

    // 2. Also upsert into teachers table to maintain dual-table sync
    const teachersPayload = validRows.map(r => ({
      name: r.name,
      email: r.email,
      phone: r.phone,
      designation: r.designation,
      salary: r.salary,
      status: 'Active'
    }));

    const { error: teacherError } = await supabase
      .from('teachers')
      .upsert(teachersPayload, { onConflict: 'email' });

    if (teacherError) {
      console.warn('[BULK UPLOAD] Note: sync to teachers table had issue:', teacherError.message);
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk upload completed successfully. Processed ${validRows.length} teachers (${insertedCount} new, ${updatedCount} updated).`,
      totalProcessed: validRows.length,
      insertedCount,
      updatedCount,
      skippedCount: skipped.length,
      skipped
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[BULK UPLOAD TEACHERS ERROR]:', err);
    res.status(500).json({ message: 'Error processing teachers upload', error: err.message });
  }
});

module.exports = router;
