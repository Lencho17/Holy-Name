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
    const cleanClassTeacherId = (class_teacher_id && String(class_teacher_id).trim() !== '') ? class_teacher_id : null;

    if (!class_name) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    // Validation: A single teacher can be class teacher of only 1 class
    if (cleanClassTeacherId) {
      let existingQuery = supabase
        .from('class_assignments')
        .select('class_name, section, class_teacher_id')
        .eq('class_teacher_id', cleanClassTeacherId);

      if (school_id) {
        existingQuery = existingQuery.eq('school_id', school_id);
      }

      const { data: existingAssignments } = await existingQuery;
      const targetClassNorm = String(class_name).replace(/^Class\s*/i, '').trim().toLowerCase();
      const targetSecNorm = String(section || 'A').trim().toLowerCase();

      const clash = (existingAssignments || []).find(a => {
        const aClassNorm = String(a.class_name).replace(/^Class\s*/i, '').trim().toLowerCase();
        const aSecNorm = String(a.section || 'A').trim().toLowerCase();
        return !(aClassNorm === targetClassNorm && aSecNorm === targetSecNorm);
      });

      if (clash) {
        const { data: teacher } = await supabase.from('staff').select('name').eq('id', cleanClassTeacherId).single();
        const teacherName = teacher?.name || 'Staff member';
        return res.status(400).json({
          message: `Validation Error: ${teacherName} is already assigned as Class Teacher for Class ${clash.class_name} (Section ${clash.section || 'A'}). A single teacher can be the class teacher of only 1 class.`
        });
      }
    }

    // Upsert assignment
    const { data, error } = await supabase
      .from('class_assignments')
      .upsert({
        school_id,
        class_name,
        section: section || 'A',
        class_teacher_id: cleanClassTeacherId,
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
          class_teacher_id: cleanClassTeacherId,
          subject_teachers,
          updated_at: new Date()
        }).eq('id', existing.id);
      } else {
        await supabase.from('class_assignments').insert({
          school_id,
          class_name,
          section: section || 'A',
          class_teacher_id: cleanClassTeacherId,
          subject_teachers
        });
      }
    }

    // Notify Class Teacher
    if (cleanClassTeacherId) {
      const { data: teacher } = await supabase.from('staff').select('email, name').eq('id', cleanClassTeacherId).single();
      if (teacher && teacher.email) {
        try {
          await sendEmail({
            to: teacher.email,
            subject: 'Class Teacher Assignment Update',
            html: `<p>Dear ${teacher.name},</p><p>You have been assigned as the Class Teacher for <strong>Class ${class_name} ${section || 'A'}</strong>.</p><p>Please log in to the Teacher Portal to review your assigned class.</p>`
          });
        } catch (emailErr) {
          console.error('Failed to send class teacher notification:', emailErr.message);
        }
      }
    }

    // Notify Subject Teachers & Co-Teachers (Group by teacher to send one email)
    if (subject_teachers && subject_teachers.length > 0) {
      const primaryTeacherMap = {};
      const secondaryTeacherMap = {};

      subject_teachers.forEach(st => {
        if (st.teacher_id) {
          if (!primaryTeacherMap[st.teacher_id]) primaryTeacherMap[st.teacher_id] = [];
          primaryTeacherMap[st.teacher_id].push(st.subject);
        }
        if (st.secondary_teacher_id && st.secondary_teacher_id !== st.teacher_id) {
          if (!secondaryTeacherMap[st.secondary_teacher_id]) secondaryTeacherMap[st.secondary_teacher_id] = [];
          secondaryTeacherMap[st.secondary_teacher_id].push(st.subject);
        }
      });

      // Send primary teacher notices
      for (const [tId, subjects] of Object.entries(primaryTeacherMap)) {
        const { data: teacher } = await supabase.from('staff').select('email, name').eq('id', tId).single();
        if (teacher && teacher.email) {
          try {
            await sendEmail({
              to: teacher.email,
              subject: 'Subject Teacher Assignment Update',
              html: `<p>Dear ${teacher.name},</p><p>You have been assigned as the <strong>Primary Teacher</strong> for the following subjects in <strong>Class ${class_name} ${section || 'A'}</strong>:</p><ul>${subjects.map(s => `<li>${s}</li>`).join('')}</ul><p>Please log in to the Teacher Portal to view your timetable schedule and records.</p>`
            });
          } catch (emailErr) {
            console.error('Failed to send subject teacher notification:', emailErr.message);
          }
        }
      }

      // Send secondary/co-teacher notices
      for (const [tId, subjects] of Object.entries(secondaryTeacherMap)) {
        const { data: teacher } = await supabase.from('staff').select('email, name').eq('id', tId).single();
        if (teacher && teacher.email) {
          try {
            await sendEmail({
              to: teacher.email,
              subject: 'Co-Teacher Assignment Update',
              html: `<p>Dear ${teacher.name},</p><p>You have been assigned as the <strong>Co-Teacher / 2nd Teacher</strong> for the following subjects in <strong>Class ${class_name} ${section || 'A'}</strong>:</p><ul>${subjects.map(s => `<li>${s}</li>`).join('')}</ul><p>Please log in to the Teacher Portal to view your scheduled co-teaching sessions.</p>`
            });
          } catch (emailErr) {
            console.error('Failed to send co-teacher notification:', emailErr.message);
          }
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
