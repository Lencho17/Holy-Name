const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

/**
 * Helper to clean and format Indian / international phone numbers
 */
function cleanPhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return null;
  // If 12 digits starting with 91 (India country code), strip 91
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  // If 11 digits starting with 0, strip 0
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  // If 10 or more digits, take last 10
  if (digits.length >= 10) return digits.slice(-10);
  return digits.length >= 7 ? digits : null;
}

/**
 * Robust date parser supporting Excel numeric serial codes, ISO strings,
 * DD/MM/YYYY, DD-MM-YYYY, and various standard formats.
 * Always returns a valid YYYY-MM-DD string or null.
 */
function parseDateValue(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str) return null;

  // Handle Excel serial date codes (numbers e.g. 31803 or strings like "42370")
  if (/^\d{4,6}$/.test(str)) {
    const num = parseInt(str, 10);
    if (num > 1000 && num < 100000) {
      try {
        const parsed = xlsx.SSF.parse_date_code(num);
        if (parsed && parsed.y && parsed.m && parsed.d) {
          let y = parsed.y;
          if (y < 100) y += 1900;
          const m = String(parsed.m).padStart(2, '0');
          const d = String(parsed.d).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch (e) {}
    }
  }

  // Already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY or D/M/YY or DD/MM/00YY (e.g. 1/3/0078)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    let y = parseInt(dmyMatch[3], 10);
    if (y < 100) {
      y = y > 30 ? 1900 + y : 2000 + y;
    }
    return `${y}-${m}-${d}`;
  }

  // Fallback to Date.parse
  const parsedTs = Date.parse(str);
  if (!isNaN(parsedTs)) {
    const d = new Date(parsedTs);
    let y = d.getFullYear();
    if (y < 100) y += 1900;
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return null;
}

/**
 * Clean blood group string (e.g. '0+' -> 'O+', 'O+ve' -> 'O+', 'A (positive)' -> 'A+')
 */
function cleanBloodGroup(bg) {
  if (!bg) return null;
  let str = String(bg).trim().toUpperCase();
  str = str.replace(/^0([+-])/i, 'O$1');
  str = str.replace(/\+VE/i, '+').replace(/\-VE/i, '-');
  str = str.replace(/\s*\(\s*POSITIVE\s*\)/i, '+').replace(/\s*\(\s*NEGATIVE\s*\)/i, '-');
  str = str.replace(/\s+POSITIVE/i, '+').replace(/\s+NEGATIVE/i, '-');
  return str.slice(0, 10);
}

/**
 * Flexible field extractor that inspects keys and normalized keys
 */
function extractFlexibleField(row, patterns) {
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    for (const pat of patterns) {
      if (typeof pat === 'string' && (cleanKey === pat || cleanKey.includes(pat))) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      } else if (pat instanceof RegExp && pat.test(cleanKey)) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }
  return null;
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
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Uploaded file is empty or contains no records.' });
    }

    const insertData = [];
    const skipped = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const student_name = extractFlexibleField(row, [/^name/, 'student_name', 'full_name']) || '';
      const admission_id = extractFlexibleField(row, ['admission_id', 'roll_number', 'roll_no', 'admission_no']) || '';
      const class_level = extractFlexibleField(row, ['class_level', 'class', 'grade']) || '';
      const section = extractFlexibleField(row, ['section', 'sec']) || '';
      const email = extractFlexibleField(row, ['email', 'email_address']) || null;
      const phone = cleanPhoneNumber(extractFlexibleField(row, ['phone', 'mobile', 'contact', 'contact_number']));
      const guardian_name = extractFlexibleField(row, ['guardian', 'guardian_name', 'parents_name', 'father_name', 'mother_name']) || null;
      const address = extractFlexibleField(row, ['address', 'residence']) || null;

      // Skip row if completely empty
      if (!student_name && !admission_id && !class_level) return;

      if (!student_name) {
        skipped.push({ row: rowNum, reason: 'Missing student name' });
        return;
      }

      insertData.push({
        student_name: student_name.trim(),
        admission_id: admission_id ? admission_id.trim() : null,
        grade: section ? `${class_level} ${section}`.trim() : class_level.trim(),
        email: email ? email.toLowerCase().trim() : null,
        contact_number: phone,
        guardian_name: guardian_name ? guardian_name.trim() : null,
        address
      });
    });

    if (insertData.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'No valid student records found in file.',
        skipped
      });
    }

    const { data, error } = await supabase
      .from('students')
      .insert(insertData);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

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
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Uploaded file is empty or has no rows.' });
    }

    const validRows = [];
    const skipped = [];
    const seenEmails = new Map();
    const seenPhones = new Map();

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;

      const name = extractFlexibleField(row, [/^name/, 'full_name', 'teacher_name', 'staff_name', 'faculty_name']) || '';
      const emailRaw = extractFlexibleField(row, ['email', 'email_address', 'email_id', 'mail']) || '';
      const email = emailRaw.toLowerCase().trim();
      const rawPhone = extractFlexibleField(row, ['phone', 'mobile', 'contact']);
      const phone = cleanPhoneNumber(rawPhone);

      const rawFaculty = extractFlexibleField(row, ['faculty', 'subject', 'core_subject', 'designation', 'position', 'job_profile', 'department']);
      const rawRole = extractFlexibleField(row, ['role', 'job_role']) || 'Teacher';
      const role = rawRole.toLowerCase().includes('teacher') ? 'Teacher' : (rawRole.charAt(0).toUpperCase() + rawRole.slice(1));
      const designation = rawFaculty || rawRole || 'Teacher';

      const rawSalary = extractFlexibleField(row, ['salary', 'pay', 'stipend']);
      const salary = rawSalary ? parseFloat(String(rawSalary).replace(/[^0-9.]/g, '')) : null;

      const gender = extractFlexibleField(row, ['gender', 'sex']) || null;
      const dob = parseDateValue(extractFlexibleField(row, ['dob', 'date_of_birth', 'birth']));
      const date_of_joining = parseDateValue(extractFlexibleField(row, ['joining', 'date_of_joining', 'date_of_joining_the_institute', 'doj']));
      const address = extractFlexibleField(row, ['address', 'residence']) || null;
      const blood_group = cleanBloodGroup(extractFlexibleField(row, ['blood', 'blood_group', 'bloodgroup']));

      // Skip completely empty rows
      if (!name && !email && !phone && !rawFaculty) return;

      if (!name) {
        skipped.push({ row: rowNum, reason: 'Missing teacher name' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        skipped.push({ row: rowNum, name, email: emailRaw, reason: 'Invalid or missing email address' });
        return;
      }

      // Check duplicates within this file
      if (seenEmails.has(email)) {
        skipped.push({
          row: rowNum,
          name,
          email,
          reason: `Duplicate email within file (already in row ${seenEmails.get(email)})`
        });
        return;
      }
      seenEmails.set(email, rowNum);

      // Handle duplicate phone within file to avoid unique constraint crash
      let safePhone = phone;
      if (phone && seenPhones.has(phone)) {
        console.warn(`[BULK UPLOAD] Row ${rowNum} (${name}) duplicate phone ${phone} (row ${seenPhones.get(phone)}). Cleared to prevent collision.`);
        safePhone = null;
      } else if (phone) {
        seenPhones.set(phone, rowNum);
      }

      validRows.push({
        rowNum,
        name: name.trim(),
        email,
        phone: safePhone,
        designation: designation.trim(),
        role,
        salary: isNaN(salary) ? null : salary,
        gender,
        dob,
        date_of_joining,
        address,
        blood_group
      });
    });

    if (validRows.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'No valid teacher records found. Ensure full name and a valid email address are present in each row.',
        skipped
      });
    }

    // Check which staff members already exist
    const emails = validRows.map(r => r.email);
    const { data: existingStaff, error: checkErr } = await supabase
      .from('staff')
      .select('id, email, phone, password_hash')
      .in('email', emails);

    if (checkErr) {
      console.warn('[BULK UPLOAD] Note checking existing staff:', checkErr.message);
    }

    const existingMap = new Map((existingStaff || []).map(s => [s.email.toLowerCase(), s]));

    // Check which phone numbers are already taken in DB by other staff members
    const validPhones = validRows.map(r => r.phone).filter(Boolean);
    const existingPhonesMap = new Map();
    if (validPhones.length > 0) {
      const { data: existingPhoneRows } = await supabase
        .from('staff')
        .select('id, email, phone')
        .in('phone', validPhones);

      (existingPhoneRows || []).forEach(p => {
        if (p.phone) existingPhonesMap.set(p.phone, p.email.toLowerCase());
      });
    }

    const defaultPasswordHash = await bcrypt.hash('Staff@123', 10);
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

      let rowPhone = r.phone;
      if (rowPhone && existingPhonesMap.has(rowPhone)) {
        const registeredEmail = existingPhonesMap.get(rowPhone);
        if (registeredEmail !== r.email) {
          rowPhone = null; // Prevent unique phone collision with another user
        }
      }

      return {
        name: r.name,
        email: r.email,
        phone: rowPhone,
        role: r.role || 'Teacher',
        job_profile: r.designation || r.role || 'Teacher',
        gender: r.gender,
        dob: r.dob,
        date_of_joining: r.date_of_joining,
        address: r.address,
        blood_group: r.blood_group,
        password_hash: existing?.password_hash || defaultPasswordHash,
        is_approved: true,
        total_cl: 12,
        used_cl: 0
      };
    });

    // 1. Upsert into staff table
    let staffSuccessData = [];
    const { data: batchData, error: staffError } = await supabase
      .from('staff')
      .upsert(staffPayload, { onConflict: 'email' })
      .select('id, email, name, role');

    if (staffError) {
      console.warn('[BULK UPLOAD] Batch upsert encountered issue, falling back to per-row upsert:', staffError.message);
      for (let i = 0; i < staffPayload.length; i++) {
        const record = staffPayload[i];
        const originalRow = validRows[i];
        const { data: singleData, error: singleErr } = await supabase
          .from('staff')
          .upsert([record], { onConflict: 'email' })
          .select('id, email, name, role');

        if (singleErr) {
          skipped.push({
            row: originalRow.rowNum,
            name: record.name,
            email: record.email,
            reason: singleErr.message
          });
          if (existingMap.get(record.email)) updatedCount--; else insertedCount--;
        } else if (singleData && singleData.length > 0) {
          staffSuccessData.push(singleData[0]);
        }
      }
    } else {
      staffSuccessData = batchData || [];
    }

    // 2. Also upsert into teachers table to maintain dual-table sync
    const successfulEmails = new Set(staffSuccessData.map(s => s.email.toLowerCase()));
    const teachersPayload = validRows
      .filter(r => successfulEmails.has(r.email.toLowerCase()))
      .map(r => ({
        name: r.name,
        email: r.email,
        phone: r.phone,
        designation: r.designation,
        salary: r.salary,
        status: 'Active'
      }));

    if (teachersPayload.length > 0) {
      const { error: teacherError } = await supabase
        .from('teachers')
        .upsert(teachersPayload, { onConflict: 'email' });

      if (teacherError) {
        console.warn('[BULK UPLOAD] Note: sync to teachers table had issue:', teacherError.message);
      }
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const actualProcessed = insertedCount + updatedCount;
    res.json({
      success: true,
      message: `Bulk upload completed successfully. Processed ${actualProcessed} teachers (${insertedCount} new, ${updatedCount} updated).${skipped.length > 0 ? ` (${skipped.length} skipped)` : ''}`,
      totalProcessed: actualProcessed,
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
