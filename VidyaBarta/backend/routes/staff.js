const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protectStaff, protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Fetch current logged in staff profile
router.get('/profile', protectStaff, async (req, res) => {
  try {
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', req.staff.id)
      .single();

    if (error) throw error;

    // Do not send password hash
    delete staff.password_hash;
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update staff profile
router.patch('/profile', protectStaff, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id; // Don't allow changing ID
    delete updates.password_hash; // Handle password elsewhere
    delete updates.email; // Usually don't allow email changes easily without verification
    
    const { data: updatedStaff, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', req.staff.id)
      .select()
      .single();

    if (error) throw error;
    
    delete updatedStaff.password_hash;
    res.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// PHASE 2: Information Viewing
// ==========================================

// Get Holidays
router.get('/holidays', protectStaff, async (req, res) => {
  try {
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Payroll
router.get('/payroll', protectStaff, async (req, res) => {
  try {
    const { data: payroll, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('staff_id', req.staff.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) throw error;
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Class Timetable
router.get('/timetable/class', protectStaff, async (req, res) => {
  try {
    const { data: timetable, error } = await supabase
      .from('class_timetable')
      .select('*')
      .eq('staff_id', req.staff.id)
      .order('day_of_week')
      .order('period_number');
    
    if (error) throw error;
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Exam Duties
router.get('/timetable/exam', protectStaff, async (req, res) => {
  try {
    const { data: duties, error } = await supabase
      .from('staff_exam_duties')
      .select('*')
      .eq('staff_id', req.staff.id)
      .order('exam_date', { ascending: false });
    
    if (error) throw error;
    res.json(duties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// PHASE 3: Operations & Logistics
// ==========================================

// Get Leave Applications
router.get('/leave', protectStaff, async (req, res) => {
  try {
    const { data: leaves, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('staff_id', req.staff.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply for Leave
router.post('/leave', protectStaff, async (req, res) => {
  try {
    const { start_date, end_date, leave_type, reason, proof_file_url } = req.body;
    const { data: newLeave, error } = await supabase
      .from('leave_applications')
      .insert({
        staff_id: req.staff.id,
        start_date,
        end_date,
        leave_type: leave_type || 'CL',
        reason,
        proof_file_url,
        status: 'Pending' // Requires admin approval
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(newLeave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Punch Attendance (GPS)
router.post('/attendance/punch', protectStaff, async (req, res) => {
  try {
    const { type, location } = req.body; // type: 'entry' or 'exit', location: {lat, lng}
    
    // In a real app, calculate distance from school coords here.
    // Assuming distance is verified on frontend or acceptable.

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    // Check if record exists for today
    const { data: existing, error: findError } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', req.staff.id)
      .eq('date', today)
      .maybeSingle();

    if (findError) throw findError;

    let result;
    if (!existing) {
      if (type === 'exit') return res.status(400).json({ message: 'Cannot punch exit without entry.' });
      
      const { data, error } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: req.staff.id,
          date: today,
          entry_time: nowTime,
          entry_location: location,
          status: 'Present'
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      if (type === 'entry') return res.status(400).json({ message: 'Entry already punched for today.' });
      
      const { data, error } = await supabase
        .from('staff_attendance')
        .update({
          exit_time: nowTime,
          exit_location: location
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Attendance History
router.get('/attendance', protectStaff, async (req, res) => {
  try {
    const { data: attendance, error } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', req.staff.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Service Requests
router.get('/service-request', protectStaff, async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('staff_id', req.staff.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Service Request
router.post('/service-request', protectStaff, async (req, res) => {
  try {
    const { request_type, details } = req.body;
    const { data: newReq, error } = await supabase
      .from('service_requests')
      .insert({
        staff_id: req.staff.id,
        request_type,
        details,
        status: 'Pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(newReq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// PHASE 4: Academics & Communication
// ==========================================

// Assignments
router.get('/assignments', protectStaff, async (req, res) => {
  try {
    const { data, error } = await supabase.from('assignments').select('*').eq('staff_id', req.staff.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/assignments', protectStaff, async (req, res) => {
  try {
    const { class_level, section, subject, title, description, deadline, file_url } = req.body;
    const { data, error } = await supabase.from('assignments').insert({ staff_id: req.staff.id, class_level, section, subject, title, description, deadline, file_url }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// MCQ
router.get('/mcq', protectStaff, async (req, res) => {
  try {
    const { data, error } = await supabase.from('mcq_exams').select('*').eq('staff_id', req.staff.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/mcq', protectStaff, async (req, res) => {
  try {
    const { class_level, subject, title, duration_minutes, total_marks } = req.body;
    const { data, error } = await supabase.from('mcq_exams').insert({ staff_id: req.staff.id, class_level, subject, title, duration_minutes, total_marks }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.delete('/mcq/:id', protectStaff, async (req, res) => {
  try {
    const { error } = await supabase.from('mcq_exams').delete().eq('id', req.params.id).eq('staff_id', req.staff.id);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Question Papers
router.get('/question-papers', protectStaff, async (req, res) => {
  try {
    const { data, error } = await supabase.from('question_papers').select('*').eq('staff_id', req.staff.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/question-papers', protectStaff, async (req, res) => {
  try {
    const { class_level, subject, title, file_url } = req.body;
    const { data, error } = await supabase.from('question_papers').insert({ staff_id: req.staff.id, class_level, subject, title, file_url }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.delete('/question-papers/:id', protectStaff, async (req, res) => {
  try {
    const { error } = await supabase.from('question_papers').delete().eq('id', req.params.id).eq('staff_id', req.staff.id);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Marks
router.get('/marks', protectStaff, async (req, res) => {
  try {
    const { data, error } = await supabase.from('marks').select('*').eq('staff_id', req.staff.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/marks', protectStaff, async (req, res) => {
  try {
    const { student_id, exam_name, subject, marks_obtained, max_marks } = req.body;
    const { data, error } = await supabase.from('marks').insert({ staff_id: req.staff.id, student_id, exam_name, subject, marks_obtained, max_marks }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.delete('/marks/:id', protectStaff, async (req, res) => {
  try {
    const { error } = await supabase.from('marks').delete().eq('id', req.params.id).eq('staff_id', req.staff.id);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Reports
router.get('/reports', protectStaff, async (req, res) => {
  try {
    const { data, error } = await supabase.from('student_reports').select('*').eq('staff_id', req.staff.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Announcements
router.get('/announcements', protectStaff, async (req, res) => {
  try {
    const { data, error } = await supabase.from('announcements')
      .select('*, staff:staff_id(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.post('/announcements', protectStaff, async (req, res) => {
  try {
    const { target_class, title, message } = req.body;
    const { data, error } = await supabase.from('announcements').insert({ staff_id: req.staff.id, target_class, title, message }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// ==========================================
// ADMIN ROUTES FOR STAFF MANAGEMENT
// ==========================================

// Get All Leaves (Admin)
router.get('/admin/leaves', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leave_applications')
      .select('*, staff:staff_id(name, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Leave Status (Admin)
router.patch('/admin/leaves/:id', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    
    // First update the status
    const { data: updatedLeave, error } = await supabase
      .from('leave_applications')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Recalculate full CL balance to prevent desync
    if (updatedLeave.leave_type === 'CL') {
      const { data: allApprovedLeaves } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('staff_id', updatedLeave.staff_id)
        .eq('status', 'Approved')
        .eq('leave_type', 'CL');
        
      let used = 0;
      if (allApprovedLeaves) {
        used = allApprovedLeaves.length; // 1 Application = 1 CL used, regardless of days
      }
      
      await supabase
        .from('staff')
        .update({ used_cl: used })
        .eq('id', updatedLeave.staff_id);
    }

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Service Requests (Admin)
router.get('/admin/service-requests', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, staff:staff_id(name, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Service Request Status (Admin)
router.patch('/admin/service-requests/:id', protect, async (req, res) => {
  try {
    const { status, response_file_url } = req.body;
    const { data, error } = await supabase
      .from('service_requests')
      .update({ status, response_file_url })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// ADMIN ROUTES FOR TIMETABLE AND EXAM DUTIES
// ==========================================

// Get All Timetables (Admin)
router.get('/admin/timetable', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('class_timetable')
      .select('*, staff:staff_id(name, email)')
      .order('day_of_week')
      .order('period_number');
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Create Timetable Entry (Admin)
router.post('/admin/timetable', protect, async (req, res) => {
  try {
    const { class_level, section, day_of_week, period_number, subject, staff_id, start_time, end_time } = req.body;
    const { data, error } = await supabase
      .from('class_timetable')
      .insert({ class_level, section, day_of_week, period_number, subject, staff_id, start_time, end_time })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Delete Timetable Entry (Admin)
router.delete('/admin/timetable/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('class_timetable').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Get All Exam Duties (Admin)
router.get('/admin/exam-duties', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff_exam_duties')
      .select('*, staff:staff_id(name, email)')
      .order('exam_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Create Exam Duty (Admin)
router.post('/admin/exam-duties', protect, async (req, res) => {
  try {
    const { staff_id, exam_date, start_time, end_time, room_no, role, venue } = req.body;
    const { data, error } = await supabase
      .from('staff_exam_duties')
      .insert({ staff_id, exam_date, start_time, end_time, room_no, role, venue })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Get All Payrolls (Admin)
router.get('/admin/payroll', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*, staff:staff_id(name, email)')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Create Payroll (Admin)
router.post('/admin/payroll', protect, async (req, res) => {
  try {
    const { staff_id, month, year, basic_salary, allowances, pf_deduction, esic_deduction, tax_deduction, net_salary } = req.body;
    const { data, error } = await supabase
      .from('payroll')
      .insert({ staff_id, month, year, basic_salary, allowances, pf_deduction, esic_deduction, tax_deduction, net_salary })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Payroll for this staff member already exists for this month and year' });
      }
      throw error;
    }
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Delete Payroll (Admin)
router.delete('/admin/payroll/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('payroll').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Get All Announcements (Admin)
router.get('/admin/announcements', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, staff:staff_id(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Create Announcement (Admin)
router.post('/admin/announcements', protect, async (req, res) => {
  try {
    const { target_class, title, message } = req.body;
    // For admin announcements, staff_id can be left null if your schema allows it, or we can fetch a specific admin ID if required.
    // Assuming staff_id can be null for school-wide admin announcements.
    const { data, error } = await supabase
      .from('announcements')
      .insert({ target_class, title, message })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Delete Announcement (Admin)
router.delete('/admin/announcements/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});
router.delete('/admin/exam-duties/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('staff_exam_duties').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Get all Staff for dropdowns
router.get('/admin/all-staff', protect, async (req, res) => {
  try {
    const { data, error } = await supabase.from('staff').select('id, name, email, role');
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

// Get all pending staff requests
router.get('/admin/pending-staff', protect, async (req, res) => {
  try {
    const { data, error } = await supabase.from('staff').select('*').eq('is_approved', false);
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
