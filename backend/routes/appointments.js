const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// @route   POST /api/appointments
// @desc    Book a new appointment (Public)
router.post('/', upload.fields([
  { name: 'schoolIdCard', maxCount: 1 },
  { name: 'aadhaarDocument', maxCount: 1 }
]), async (req, res) => {
  try {
    const { category, name, phone, email, purpose, studentName, studentClass, aadhaarNumber, appointmentDate } = req.body;

    if (!category || !name || !phone || !purpose) {
      return res.status(400).json({ message: 'Category, name, phone, and purpose are required.' });
    }

    if (category === 'Parent' && (!studentName || !studentClass)) {
      return res.status(400).json({ message: 'Student name and class are required for parents.' });
    }

    if (category === 'Visitor' && !aadhaarNumber) {
      return res.status(400).json({ message: 'Aadhaar number is required for visitors.' });
    }

    const crypto = require('crypto');
    const catCode = category === 'Parent' ? 'PAR' : 'VIS';
    const appointmentNumber = `HNS/APT/${catCode}/${new Date().getFullYear()}/${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Handle file uploads to Supabase
    let schoolIdCardUrl = null;
    let aadhaarDocumentUrl = null;

    if (req.files?.schoolIdCard?.[0]) {
      schoolIdCardUrl = await uploadToCloudinary(req.files.schoolIdCard[0], undefined, 'appointments');
    }
    if (req.files?.aadhaarDocument?.[0]) {
      aadhaarDocumentUrl = await uploadToCloudinary(req.files.aadhaarDocument[0], undefined, 'appointments');
    }

    const appointmentData = {
      appointment_number: appointmentNumber,
      category,
      name,
      phone,
      email,
      purpose,
      student_name: category === 'Parent' ? studentName : null,
      student_class: category === 'Parent' ? studentClass : null,
      school_id_card: schoolIdCardUrl,
      aadhaar_number: category === 'Visitor' ? aadhaarNumber : null,
      aadhaar_document: aadhaarDocumentUrl,
      appointment_date: appointmentDate || null,
      status: 'Pending'
    };

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ 
      message: 'Appointment booked successfully.', 
      appointment: {
        ...appointment,
        appointmentNumber: appointment.appointment_number
      } 
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error while booking appointment.', error: error.message });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/appointments/track/:appointmentNumber
// @desc    Public tracking
router.get('/track/:appointmentNumber', async (req, res) => {
  try {
    const num = decodeURIComponent(req.params.appointmentNumber).toUpperCase();
    const { data: apt, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_number', num)
      .maybeSingle();

    if (error || !apt) return res.status(404).json({ message: 'Appointment not found.' });
    
    res.json({
      appointmentNumber: apt.appointment_number,
      category: apt.category,
      name: apt.name,
      purpose: apt.purpose,
      status: apt.status,
      adminRemark: apt.admin_remark || null,
      appointmentDate: apt.appointment_date,
      createdAt: apt.created_at
    });
  } catch (error) {
    console.error('Track appointment error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PATCH /api/appointments/:id/status
// @desc    Update appointment status (Protected)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    const update = { updated_at: new Date() };
    if (status) update.status = status;
    if (adminRemark !== undefined) update.admin_remark = adminRemark;

    const { data: apt, error } = await supabase
      .from('appointments')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !apt) return res.status(404).json({ message: 'Appointment not found.' });
    res.json({ message: 'Appointment updated.', appointment: apt });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/appointments/export
// @desc    Export appointments to Excel (Protected)
router.get('/export', protect, async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = supabase.from('appointments').select('*').order('created_at', { ascending: false });
    
    if (category && category !== 'All') query = query.eq('category', category);
    if (status && status !== 'All') query = query.eq('status', status);

    const { data: appointments, error } = await query;
    if (error) throw error;

    const fileName = `appointments_${new Date().toISOString().split('T')[0]}.xls`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>.text{mso-number-format:"\\@";}th{background-color:#1e3a8a;color:white;font-weight:bold;}td,th{border:0.5pt solid #ccc;}</style>
      </head><body><table>
        <tr><th>Appointment No</th><th>Category</th><th>Status</th><th>Name</th><th>Phone</th><th>Email</th><th>Purpose</th><th>Student Name</th><th>Student Class</th><th>Aadhaar</th><th>Admin Remark</th><th>Date</th></tr>
    `;
    appointments.forEach(a => {
      html += `<tr>
        <td class="text">${a.appointment_number || ''}</td><td>${a.category}</td><td>${a.status}</td>
        <td>${a.name}</td><td class="text">${a.phone}</td><td>${a.email || ''}</td><td>${a.purpose}</td>
        <td>${a.student_name || ''}</td><td>${a.student_class || ''}</td><td class="text">${a.aadhaar_number || ''}</td>
        <td>${a.admin_remark || ''}</td><td>${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</td>
      </tr>`;
    });
    html += `</table></body></html>`;

    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(html);
  } catch (error) {
    console.error('Export appointments error:', error);
    res.status(500).json({ message: 'Export failed.' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete an appointment (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Appointment deleted.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
