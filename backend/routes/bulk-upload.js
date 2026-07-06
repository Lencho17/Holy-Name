const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'tmp/' }); // Temporary storage for CSV files

// POST /api/bulk-upload/students
router.post('/students', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const insertData = results.map(row => ({
          student_name: row.name,
          admission_id: row.roll_number,
          grade: row.section ? `${row.class_level} ${row.section}` : row.class_level,
          email: row.email || null,
          contact_number: row.phone || null,
          guardian_name: row.parents_name || null,
          address: row.address || null
        }));

        const { data, error } = await supabase
          .from('students')
          .insert(insertData);

        if (error) throw error;
        
        fs.unlinkSync(req.file.path); // Clean up
        res.json({ message: `Successfully uploaded ${results.length} students.` });
      } catch (err) {
        fs.unlinkSync(req.file.path);
        console.error('[BULK UPLOAD STUDENTS ERROR]:', err);
        res.status(500).json({ message: 'Error inserting students to database', error: err.message });
      }
    });
});

// POST /api/bulk-upload/teachers
router.post('/teachers', protect, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const insertData = results.map(row => ({
          name: row.name,
          email: row.email,
          phone: row.phone,
          designation: row.designation || null,
          salary: row.salary ? parseFloat(row.salary) : null,
          pf_details: row.pf_details || null,
          allowances: row.allowances ? parseFloat(row.allowances) : null,
          status: row.status || 'Active'
        }));

        const { data, error } = await supabase
          .from('teachers')
          .insert(insertData);

        if (error) throw error;
        
        fs.unlinkSync(req.file.path);
        res.json({ message: `Successfully uploaded ${results.length} teachers.` });
      } catch (err) {
        fs.unlinkSync(req.file.path);
        console.error('[BULK UPLOAD TEACHERS ERROR]:', err);
        res.status(500).json({ message: 'Error inserting teachers to database', error: err.message });
      }
    });
});

module.exports = router;
