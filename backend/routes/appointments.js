const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// Cloudinary storage for appointment documents
const appointmentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const baseName = file.originalname?.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'file';
    return {
      folder: 'school-appointments',
      resource_type: 'auto',
      public_id: `${baseName}_${Date.now()}`
    };
  }
});

const uploadAppointment = multer({
  storage: appointmentStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image (JPG, PNG, WEBP) and PDF files are allowed.'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// @route   POST /api/appointments
// @desc    Book a new appointment (Public)
router.post('/', uploadAppointment.fields([
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

    // Generate appointment number: HNS/APT/YEAR/SEQ
    const year = new Date().getFullYear();
    const catCode = category === 'Parent' ? 'PAR' : 'VIS';
    const count = await Appointment.countDocuments({
      createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });
    const appointmentNumber = `HNS/APT/${catCode}/${year}/${(count + 1).toString().padStart(4, '0')}`;

    const newAppointment = new Appointment({
      appointmentNumber,
      category,
      name,
      phone,
      email,
      purpose,
      studentName: category === 'Parent' ? studentName : undefined,
      studentClass: category === 'Parent' ? studentClass : undefined,
      schoolIdCard: req.files?.schoolIdCard?.[0]?.path || undefined,
      aadhaarNumber: category === 'Visitor' ? aadhaarNumber : undefined,
      aadhaarDocument: req.files?.aadhaarDocument?.[0]?.path || undefined,
      appointmentDate: appointmentDate || undefined
    });

    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully.', appointment: newAppointment });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error while booking appointment.' });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 }).lean();
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/appointments/track/:appointmentNumber
// @desc    Public tracking by appointment number
router.get('/track/:appointmentNumber', async (req, res) => {
  try {
    const num = decodeURIComponent(req.params.appointmentNumber).toUpperCase();
    const apt = await Appointment.findOne({ appointmentNumber: num }).lean();
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' });
    res.json({
      appointmentNumber: apt.appointmentNumber,
      category: apt.category,
      name: apt.name,
      purpose: apt.purpose,
      status: apt.status,
      adminRemark: apt.adminRemark || null,
      appointmentDate: apt.appointmentDate,
      createdAt: apt.createdAt
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
    const update = {};
    if (status) update.status = status;
    if (adminRemark !== undefined) update.adminRemark = adminRemark;

    const apt = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' });
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
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
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
        <td class="text">${a.appointmentNumber || ''}</td><td>${a.category}</td><td>${a.status}</td>
        <td>${a.name}</td><td class="text">${a.phone}</td><td>${a.email || ''}</td><td>${a.purpose}</td>
        <td>${a.studentName || ''}</td><td>${a.studentClass || ''}</td><td class="text">${a.aadhaarNumber || ''}</td>
        <td>${a.adminRemark || ''}</td><td>${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</td>
      </tr>`;
    });
    html += `</table></body></html>`;

    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.set('Cache-Control', 'no-cache');
    res.removeHeader('ETag');
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
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' });
    await Appointment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Appointment deleted.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
