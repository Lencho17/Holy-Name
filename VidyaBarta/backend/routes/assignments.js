const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, protectAnyStaff } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

// Get all class assignments for a school
router.get('/', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    let query = supabase
      .from('class_assignments')
      .select(`
        *,
        class_teacher:staff!class_teacher_id (id, name, email)
      `);
      
    if (school_id) {
      query = query.eq('school_id', school_id);
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error fetching assignments' });
  }
});

// Create or update a class assignment
router.post('/', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { class_name, section, class_teacher_id, subject_teachers } = req.body;

    if (!class_name) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    // Upsert assignment
    const { data, error } = await supabase
      .from('class_assignments')
      .upsert({
        school_id,
        class_name,
        section: section || 'A',
        class_teacher_id,
        subject_teachers, // Array of { subject, teacher_id }
        updated_at: new Date()
      }, { onConflict: 'school_id,class_name,section' })
      .select()
      .single();

    if (error) {
      // If composite key doesn't exist, we fallback to deleting and inserting
      const { data: existing } = await supabase
        .from('class_assignments')
        .select('id')
        .eq('school_id', school_id)
        .eq('class_name', class_name)
        .eq('section', section || 'A')
        .single();
        
      if (existing) {
        await supabase.from('class_assignments').update({
          class_teacher_id,
          subject_teachers,
          updated_at: new Date()
        }).eq('id', existing.id);
      } else {
        await supabase.from('class_assignments').insert({
          school_id,
          class_name,
          section: section || 'A',
          class_teacher_id,
          subject_teachers
        });
      }
    }

    // Notify Class Teacher
    if (class_teacher_id) {
      const { data: teacher } = await supabase.from('staff').select('email, name').eq('id', class_teacher_id).single();
      if (teacher && teacher.email) {
        await sendEmail({
          to: teacher.email,
          subject: 'Class Teacher Assignment Update',
          html: `<p>Dear ${teacher.name},</p><p>You have been assigned as the Class Teacher for <strong>Class ${class_name} ${section || 'A'}</strong>.</p><p>Please log in to the Teacher Portal to review your assigned class.</p>`
        });
      }
    }

    // Notify Subject Teachers (Group by teacher to send one email)
    if (subject_teachers && subject_teachers.length > 0) {
      const teacherMap = {};
      subject_teachers.forEach(st => {
        if (!teacherMap[st.teacher_id]) teacherMap[st.teacher_id] = [];
        teacherMap[st.teacher_id].push(st.subject);
      });

      for (const [tId, subjects] of Object.entries(teacherMap)) {
        const { data: teacher } = await supabase.from('staff').select('email, name').eq('id', tId).single();
        if (teacher && teacher.email) {
          await sendEmail({
            to: teacher.email,
            subject: 'Subject Teacher Assignment Update',
            html: `<p>Dear ${teacher.name},</p><p>You have been assigned to teach the following subjects for <strong>Class ${class_name} ${section || 'A'}</strong>:</p><ul>${subjects.map(s => `<li>${s}</li>`).join('')}</ul><p>Please log in to the Teacher Portal to enter marks when examinations begin.</p>`
          });
        }
      }
    }

    res.json({ message: 'Assignment saved and notifications sent successfully!' });
  } catch (error) {
    console.error('Error saving assignment:', error);
    res.status(500).json({ message: 'Server error saving assignment' });
  }
});

module.exports = router;
