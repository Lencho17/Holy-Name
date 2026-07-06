const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// @route   GET /api/appointments/slots
// @desc    Get available time slots for a specific date (Public)
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    // Fetch site settings for appointment settings
    const { data: settingsData } = await supabase.from('site_settings').select('appointment_settings').single();
    const settings = settingsData?.appointment_settings || { isSchoolOpen: true, isPrincipalAvailable: true, schoolTiming: "08:30 AM - 03:00 PM" };
    
    if (!settings.isSchoolOpen || !settings.isPrincipalAvailable) {
      return res.json([]); // No slots if school is closed or principal unavailable
    }

    // Default slots 9:00 AM to 2:00 PM
    const allSlots = [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", 
      "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM"
    ];

    // Fetch booked slots for the date (limit to e.g., 2 appointments per slot, or 1)
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('appointment_date', date)
      .not('status', 'eq', 'Cancelled');

    if (error) throw error;

    const slotCounts = appointments.reduce((acc, apt) => {
      acc[apt.time_slot] = (acc[apt.time_slot] || 0) + 1;
      return acc;
    }, {});

    // Assuming max 2 appointments per slot
    const availableSlots = allSlots.filter(slot => (slotCounts[slot] || 0) < 2);
    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Server error while fetching slots.' });
  }
});

// @route   POST /api/appointments
// @desc    Book a new appointment (Public)
router.post('/', upload.fields([
  { name: 'schoolIdCard', maxCount: 1 },
  { name: 'aadhaarDocument', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      category, name, phone, email, purpose, studentName, studentClass, 
      aadhaarNumber, appointmentDate, address, po_ps, state, country, 
      gr_number, persons_count, time_slot, overrideAdvance 
    } = req.body;

    // Time block check: 10:00 PM to 5:30 AM IST
    // Get current time in India (or server timezone)
    const now = new Date();
    // For safety, converting to IST (UTC+5:30) roughly
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const istTime = new Date(now.getTime() + istOffset);
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    
    // Check if time is between 22:00 and 05:30
    if (hours >= 22 || (hours < 5) || (hours === 5 && minutes <= 30)) {
      return res.status(403).json({ message: 'Appointment booking is closed from 10:00 PM to 5:30 AM.' });
    }

    // 1-Day Advance rule unless admin override
    if (appointmentDate && overrideAdvance !== 'true') {
      const today = new Date().toISOString().split('T')[0];
      if (appointmentDate <= today) {
        return res.status(400).json({ message: 'Appointments must be booked at least 1 day in advance.' });
      }
    }

    if (!category || !name || !phone || !purpose || !appointmentDate || !time_slot) {
      return res.status(400).json({ message: 'Required fields missing (Name, Phone, Purpose, Date, Time).' });
    }

    if (persons_count > 2) {
      return res.status(400).json({ message: 'Only up to 2 persons are allowed per appointment.' });
    }

    let status = 'Pending';
    let isAutoAccepted = false;

    // Check GR number for parents to auto-accept
    if (category === 'Parent' && gr_number) {
      const { data: studentMatch } = await supabase
        .from('students')
        .select('*')
        .eq('admission_id', gr_number)
        .maybeSingle();
      
      if (studentMatch) {
        status = 'Approved';
        isAutoAccepted = true;
      }
    }

    const crypto = require('crypto');
    const catCode = category === 'Parent' ? 'PAR' : 'VIS';
    const appointmentNumber = `HNS/APT/${catCode}/${new Date().getFullYear()}/${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Handle file uploads to Supabase (Cloudinary proxy)
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
      time_slot: time_slot || null,
      address, po_ps, state, country, gr_number,
      persons_count: parseInt(persons_count) || 1,
      is_auto_accepted: isAutoAccepted,
      status
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
      adminCancelReason: apt.admin_cancel_reason || null,
      appointmentDate: apt.appointment_date,
      timeSlot: apt.time_slot,
      personsCount: apt.persons_count,
      grNumber: apt.gr_number,
      studentName: apt.student_name,
      studentClass: apt.student_class,
      schoolIdCard: apt.school_id_card,
      aadhaarNumber: apt.aadhaar_number,
      aadhaarDocument: apt.aadhaar_document,
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
    const { status, adminRemark, adminCancelReason } = req.body;
    const update = { updated_at: new Date() };
    if (status) update.status = status;
    if (adminRemark !== undefined) update.admin_remark = adminRemark;
    if (adminCancelReason !== undefined) update.admin_cancel_reason = adminCancelReason;

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
