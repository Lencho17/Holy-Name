const express = require('express');
const router = express.Router();
const { protect, protectAnyStaff, protectAnyUser } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Get all exams (scoped by school_id)
router.get('/', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    let query = supabase.from('exams').select('*, exam_timetable(is_finalized)');
    
    if (school_id) {
      query = query.eq('school_id', school_id);
    }
    
    query = query.order('id', { ascending: false });
    
    const { data: exams, error } = await query;
      
    if (error) throw error;
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all available default exam templates (with their routine subjects) for schools to use
router.get('/default-templates', protectAnyStaff, async (req, res) => {
  try {
    const { data: templates, error } = await supabase
      .from('default_exams')
      .select('*, default_exam_timetables(*)')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(templates || []);
  } catch (err) {
    console.error('[GET DEFAULT TEMPLATES ERROR]:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Helper to generate working dates (skipping Sundays)
const getWorkingDates = (startDateStr, endDateStr) => {
  const dates = [];
  if (!startDateStr) return dates;
  let curr = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  
  if (isNaN(curr.getTime())) return dates;

  while (curr <= end) {
    if (curr.getDay() !== 0) { // Skip Sundays
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Create a new exam (admin only, attaches school_id)
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, class_levels, class_level, start_date, end_date, default_exam_id } = req.body;
    const { school_id } = req.user;
    
    const classes = class_levels || (class_level ? [class_level] : []);
    if (classes.length === 0) {
      return res.status(400).json({ message: 'At least one class level is required' });
    }
    
    const inserts = classes.map(c => ({
      name, 
      type: type || 'Offline', 
      class_level: c, 
      start_date: start_date || null, 
      end_date: end_date || null, 
      school_id,
      default_exam_id: default_exam_id || null
    }));
    
    const { data: createdExams, error } = await supabase
      .from('exams')
      .insert(inserts)
      .select();

    if (error) throw error;

    // If a default exam template was selected, pre-generate the routine into exam_timetable
    if (default_exam_id && createdExams && createdExams.length > 0) {
      const { data: defaultTimetable, error: ttError } = await supabase
        .from('default_exam_timetables')
        .select('*')
        .eq('default_exam_id', default_exam_id)
        .order('order_index', { ascending: true });

      if (!ttError && defaultTimetable && defaultTimetable.length > 0) {
        const workingDates = getWorkingDates(start_date, end_date);
        const timetableInserts = [];

        for (const exam of createdExams) {
          defaultTimetable.forEach((item, idx) => {
            // Assign date from available dates or fallback to start_date or last available date
            let assignedDate = null;
            if (workingDates.length > 0) {
              assignedDate = workingDates[idx] || workingDates[workingDates.length - 1];
            } else if (start_date) {
              assignedDate = start_date;
            }

            timetableInserts.push({
              exam_id: exam.id,
              school_id,
              class_level: exam.class_level,
              subject: item.subject,
              sub_subject: item.sub_subject || null,
              exam_date: assignedDate,
              start_time: item.start_time || '09:00',
              end_time: item.end_time || '12:00',
              total_marks: item.total_marks || 100,
              passing_marks: item.passing_marks || 40,
              has_practical: item.has_practical || false,
              theory_marks: item.theory_marks || null,
              theory_passing_marks: item.theory_passing_marks || null,
              practical_marks: item.practical_marks || null,
              practical_passing_marks: item.practical_passing_marks || null,
              is_finalized: false
            });
          });
        }

        if (timetableInserts.length > 0) {
          const { error: insertTtError } = await supabase
            .from('exam_timetable')
            .insert(timetableInserts);

          if (insertTtError) {
            console.error('[AUTO PRESET TIMETABLE ERROR]:', insertTtError);
          }
        }
      }
    }

    res.status(201).json(createdExams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error', details: err });
  }
});

// Delete an exam group (all classes with the same name)
router.delete('/group/:name', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('name', req.params.name)
      .eq('school_id', school_id);

    if (error) throw error;
    res.json({ message: 'Exam group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a single exam
router.delete('/:id', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', school_id);

    if (error) throw error;
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get marks for an exam
router.get('/:id/marks', protectAnyStaff, async (req, res) => {
  try {
    const { data: marks, error } = await supabase
      .from('marks')
      .select('*')
      .eq('exam_id', req.params.id);
      
    if (error) throw error;
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Subject Teacher marks entry
router.post('/:id/marks/subject-teacher', protectAnyStaff, async (req, res) => {
  try {
    const { marks } = req.body; // Array of { student_id, subject, marks_obtained, max_marks }
    const staff_id = req.user.id;

    // Fetch exam name for the required exam_name column in marks table
    const { data: exam } = await supabase
      .from('exams')
      .select('name')
      .eq('id', req.params.id)
      .single();
    
    const exam_name = exam ? exam.name : 'Unknown';

    // We process each mark
    for (let mark of marks) {
      // Build the query to find existing mark
      let query = supabase
        .from('marks')
        .select('*')
        .eq('exam_id', req.params.id)
        .eq('student_id', mark.student_id)
        .eq('subject', mark.subject);
        
      if (mark.sub_subject) {
        query = query.eq('sub_subject', mark.sub_subject);
      } else {
        query = query.is('sub_subject', null);
      }
      
      const { data: existingMark } = await query.maybeSingle();
        
      if (existingMark) {
        // Only update if not finalized
        if (existingMark.status !== 'finalized') {
           await supabase.from('marks').update({
             marks_obtained: mark.marks_obtained,
             practical_marks_obtained: mark.practical_marks_obtained || null,
             max_marks: mark.max_marks,
             status: 'submitted_by_subject_teacher'
           }).eq('id', existingMark.id);
        }
      } else {
        const { error: insertErr } = await supabase.from('marks').insert({
          exam_id: req.params.id,
          exam_name,
          student_id: mark.student_id,
          subject: mark.subject,
          sub_subject: mark.sub_subject || null,
          marks_obtained: mark.marks_obtained,
          practical_marks_obtained: mark.practical_marks_obtained || null,
          max_marks: mark.max_marks,
          staff_id,
          status: 'submitted_by_subject_teacher'
        });
        if (insertErr) {
          console.error('Mark insert error:', insertErr);
        }
      }
    }

    // Update exam workflow status to indicate subject entries are in progress
    await supabase.from('exams').update({ workflow_status: 'SubjectEntry' }).eq('id', req.params.id);

    res.json({ message: 'Marks submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Class Teacher review marks
router.post('/:id/marks/class-teacher-review', protectAnyStaff, async (req, res) => {
  try {
    // modifications is array of { mark_id, marks_obtained, reason }
    const { modifications } = req.body; 
    const staff_id = req.user.id;

    for (let mod of modifications) {
      const { data: existingMark } = await supabase
        .from('marks')
        .select('*')
        .eq('id', mod.mark_id)
        .single();
        
      if (existingMark) {
        if (String(existingMark.marks_obtained) !== String(mod.marks_obtained)) {
          if (!mod.reason) {
            return res.status(400).json({ message: 'Reason is required for modification' });
          }
          
          const auditEntry = {
            previous_mark: existingMark.marks_obtained,
            new_mark: mod.marks_obtained,
            modified_by: staff_id,
            reason: mod.reason,
            timestamp: new Date().toISOString()
          };
          
          let auditLog = Array.isArray(existingMark.audit_log) ? existingMark.audit_log : [];
          auditLog.push(auditEntry);
          
          await supabase.from('marks').update({
            marks_obtained: mod.marks_obtained,
            class_teacher_id: staff_id,
            status: 'reviewed_by_class_teacher',
            audit_log: auditLog
          }).eq('id', mod.mark_id);
        } else {
          await supabase.from('marks').update({
            class_teacher_id: staff_id,
            status: 'reviewed_by_class_teacher'
          }).eq('id', mod.mark_id);
        }
      }
    }
    
    // Update exam status
    await supabase.from('exams').update({ workflow_status: 'ClassReview' }).eq('id', req.params.id);

    res.json({ message: 'Marks reviewed and updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Publish Results
router.post('/:id/publish', protect, async (req, res) => {
  try {
    const published_date = new Date();
    const grievance_deadline = new Date();
    grievance_deadline.setDate(grievance_deadline.getDate() + 7);

    const { data, error } = await supabase
      .from('exams')
      .update({
        workflow_status: 'Published',
        published_date,
        grievance_deadline
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Results published successfully', exam: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Finalize Results
router.post('/:id/finalize', protect, async (req, res) => {
  try {
    const { data: exam, error: examError } = await supabase.from('exams').select('grievance_deadline').eq('id', req.params.id).single();
    if (examError) throw examError;

    if (exam.grievance_deadline && new Date() < new Date(exam.grievance_deadline)) {
      return res.status(400).json({ message: 'Cannot finalize until 7-day grievance window has passed.' });
    }

    const { error } = await supabase
      .from('exams')
      .update({ workflow_status: 'Finalized' })
      .eq('id', req.params.id);

    if (error) throw error;

    // Lock marks
    await supabase.from('marks').update({ status: 'finalized' }).eq('exam_id', req.params.id);

    res.json({ message: 'Results finalized successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Get exam timetable
router.get('/:id/timetable', protectAnyUser, async (req, res) => {
  try {
    const { data: timetable, error } = await supabase
      .from('exam_timetable')
      .select('*')
      .eq('exam_id', req.params.id)
      .order('exam_date', { ascending: true });
      
    if (error) throw error;
    res.json(timetable || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Save exam timetable (Bulk)
router.post('/:id/timetable', protect, async (req, res) => {
  try {
    const { timetableData } = req.body;
    const { school_id } = req.user;
    
    // First, delete existing timetable for this exam
    await supabase.from('exam_timetable').delete().eq('exam_id', req.params.id);
    
    if (timetableData && timetableData.length > 0) {
      const inserts = timetableData.map(t => ({
        exam_id: req.params.id,
        school_id,
        class_level: t.class_level,
        subject: t.subject,
        sub_subject: t.sub_subject || null,
        exam_date: t.exam_date || null,
        start_time: t.start_time || null,
        end_time: t.end_time || null,
        total_marks: t.total_marks || 100,
        passing_marks: t.passing_marks || 30,
        has_practical: t.has_practical || false,
        theory_marks: t.theory_marks || null,
        theory_passing_marks: t.theory_passing_marks || null,
        practical_marks: t.practical_marks || null,
        practical_passing_marks: t.practical_passing_marks || null,
        room_number: t.room_number || null,
        is_finalized: t.is_finalized || false
      }));
      
      const { error } = await supabase.from('exam_timetable').insert(inserts);
      if (error) throw error;
    }
    
    res.json({ message: 'Timetable saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Finalize exam timetable for a specific class
router.put('/:id/timetable/finalize', protect, async (req, res) => {
  try {
    const { class_level } = req.body;
    const { error } = await supabase
      .from('exam_timetable')
      .update({ is_finalized: true })
      .eq('exam_id', req.params.id)
      .eq('class_level', class_level);

    if (error) throw error;
    res.json({ message: 'Timetable finalized' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
