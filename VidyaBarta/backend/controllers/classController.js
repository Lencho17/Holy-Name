const supabase = require('../config/supabase');
const { sortClasses } = require('../utils/classOrder');
const { seedDefaultSubjectsForSchool, normalizeClassLevel } = require('../utils/defaultClassSubjects');

// @desc    Get all global classes
// @route   GET /api/classes/global
// @access  Private (Superadmin, Admin)
exports.getGlobalClasses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('global_classes')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(sortClasses(data || [], c => c.name));
  } catch (error) {
    console.error('Error getting global classes:', error);
    res.status(500).json({ message: 'Server error fetching global classes' });
  }
};

// @desc    Create a global class
// @route   POST /api/classes/global
// @access  Private (Superadmin)
exports.createGlobalClass = async (req, res) => {
  try {
    const { name, sections } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required' });

    const secArray = Array.isArray(sections)
      ? sections
      : (sections ? String(sections).split(',').map(s => s.trim()).filter(Boolean) : ['A', 'B', 'C']);

    const { data, error } = await supabase
      .from('global_classes')
      .insert([{ name, sections: secArray }])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Class with this name already exists' });
      }
      throw error;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating global class:', error);
    res.status(500).json({ message: 'Server error creating global class' });
  }
};

// @desc    Update a global class
// @route   PUT /api/classes/global/:id
// @access  Private (Superadmin)
exports.updateGlobalClass = async (req, res) => {
  try {
    const { name, sections } = req.body;
    if (!name && sections === undefined) return res.status(400).json({ message: 'Nothing to update' });

    const updateData = {};
    if (name) updateData.name = name;
    if (sections !== undefined) {
      updateData.sections = Array.isArray(sections)
        ? sections
        : String(sections).split(',').map(s => s.trim()).filter(Boolean);
    }

    const { data, error } = await supabase
      .from('global_classes')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating global class:', error);
    res.status(500).json({ message: 'Server error updating global class' });
  }
};

// @desc    Delete a global class
// @route   DELETE /api/classes/global/:id
// @access  Private (Superadmin)
exports.deleteGlobalClass = async (req, res) => {
  try {
    const { error } = await supabase
      .from('global_classes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Global class deleted successfully' });
  } catch (error) {
    console.error('Error deleting global class:', error);
    res.status(500).json({ message: 'Server error deleting global class' });
  }
};

// @desc    Reorder global classes
// @route   PUT /api/classes/global/reorder
// @access  Private (Superadmin)
exports.reorderGlobalClasses = async (req, res) => {
  try {
    const { classes } = req.body;
    if (!classes || !Array.isArray(classes)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    for (const cls of classes) {
      if (cls.id && cls.order_index !== undefined) {
        await supabase
          .from('global_classes')
          .update({ order_index: cls.order_index })
          .eq('id', cls.id);
      }
    }

    res.json({ message: 'Global classes reordered successfully' });
  } catch (error) {
    console.error('Error reordering global classes:', error);
    res.status(500).json({ message: 'Server error reordering global classes' });
  }
};

// ==================== SCHOOL-SPECIFIC CLASS ENDPOINTS ====================

const resolveSchoolId = async (req) => {
  let school_id = req.user?.school_id || req.query?.school_id || req.body?.school_id;
  if (!school_id && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token !== 'hardcoded-superadmin-token') {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.school_id) school_id = decoded.school_id;
        else if (decoded?.id) {
          const { data: admin } = await supabase.from('admins').select('school_id').eq('id', decoded.id).maybeSingle();
          if (admin?.school_id) school_id = admin.school_id;
        }
      }
    } catch (e) {}
  }
  if (!school_id && req.user?.id) {
    const { data: admin } = await supabase.from('admins').select('school_id').eq('id', req.user.id).maybeSingle();
    if (admin?.school_id) school_id = admin.school_id;
  }
  if (!school_id) {
    const targetDomain = req.query?.target;
    if (targetDomain) {
      const { data: school } = await supabase.from('schools').select('id').or(`subdomain.eq.${targetDomain},custom_domain.eq.${targetDomain}`).maybeSingle();
      if (school) school_id = school.id;
    }
  }
  if (!school_id) {
    const { data: firstSchool } = await supabase.from('schools').select('id').limit(1).maybeSingle();
    if (firstSchool) school_id = firstSchool.id;
  }
  return school_id;
};

// Helper to sync class teacher to class_assignments table
const syncClassAssignmentTeacher = async (school_id, className, sectionName, teacherId) => {
  const cleanId = (teacherId && String(teacherId).trim() !== '') ? teacherId : null;
  const targetSec = sectionName || 'A';
  const { data: existing } = await supabase
    .from('class_assignments')
    .select('id')
    .eq('school_id', school_id)
    .eq('class_name', className)
    .ilike('section', targetSec);

  if (existing && existing.length > 0) {
    const ids = existing.map(e => e.id);
    await supabase.from('class_assignments').update({
      class_teacher_id: cleanId,
      updated_at: new Date()
    }).in('id', ids);
  } else {
    await supabase.from('class_assignments').insert({
      school_id,
      class_name: className,
      section: targetSec,
      class_teacher_id: cleanId,
      subject_teachers: []
    });
  }
};

// @desc    Get all imported/configured classes for a school
// @route   GET /api/classes/school
// @access  Public / Optional Protect
exports.getSchoolClasses = async (req, res) => {
  try {
    const school_id = await resolveSchoolId(req);
    if (!school_id) return res.json([]);

    const [configsRes, assignmentsRes] = await Promise.all([
      supabase
        .from('school_class_configs')
        .select('*')
        .eq('school_id', school_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('class_assignments')
        .select('class_name, section, class_teacher_id, staff:class_teacher_id (id, name, email)')
        .eq('school_id', school_id)
    ]);

    if (configsRes.error) throw configsRes.error;

    const assignments = assignmentsRes.data || [];
    const assignmentMap = new Map();
    assignments.forEach(a => {
      const sec = String(a.section || 'A').trim().toLowerCase();
      const rawCls = String(a.class_name || '').trim().toLowerCase();
      const cleanCls = rawCls.replace(/^class\s+/i, '').trim();
      assignmentMap.set(`${rawCls}_${sec}`, a);
      assignmentMap.set(`${cleanCls}_${sec}`, a);
    });

    const enriched = (configsRes.data || []).map(cls => {
      let sectionsData = cls.sections_data;
      if (!sectionsData || !Array.isArray(sectionsData) || sectionsData.length === 0) {
        const rawSecs = cls.sections ? cls.sections.split(',').map(s => s.trim()).filter(Boolean) : ['A'];
        sectionsData = rawSecs.map(s => ({ name: s, capacity: 40 }));
      }

      sectionsData = sectionsData.map(sec => {
        const rawCls = String(cls.class_level || '').trim().toLowerCase();
        const cleanCls = rawCls.replace(/^class\s+/i, '').trim();
        const secName = String(sec.name || 'A').trim().toLowerCase();
        const assn = assignmentMap.get(`${cleanCls}_${secName}`) || assignmentMap.get(`${rawCls}_${secName}`);
        return {
          ...sec,
          class_teacher_id: assn?.class_teacher_id || sec.class_teacher_id || null,
          class_teacher_name: assn?.staff?.name || sec.class_teacher_name || null
        };
      });

      return {
        ...cls,
        sections_data: sectionsData
      };
    });

    res.json(sortClasses(enriched, c => c.class_level));
  } catch (error) {
    console.error('Error fetching school classes:', error);
    res.status(500).json({ message: 'Server error fetching school classes' });
  }
};

// @desc    Bulk import/upsert classes from global list for a school
// @route   POST /api/classes/school/import
// @access  Private (Admin)
exports.importSchoolClasses = async (req, res) => {
  try {
    const school_id = await resolveSchoolId(req);
    if (!school_id) return res.status(400).json({ message: 'School ID required' });

    const { classes } = req.body;
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'No classes provided to import' });
    }

    // 1. Validate no duplicate class teachers within the incoming import payload itself
    const teacherAssignedInPayload = new Map();
    for (const cls of classes) {
      const clsName = cls.class_level || cls.name;
      if (cls.sections_data && Array.isArray(cls.sections_data)) {
        for (const sec of cls.sections_data) {
          if (sec.class_teacher_id) {
            if (teacherAssignedInPayload.has(sec.class_teacher_id)) {
              const prev = teacherAssignedInPayload.get(sec.class_teacher_id);
              return res.status(400).json({
                message: `Validation Error: A teacher cannot be assigned as Class Teacher for multiple classes (${prev.class_level} Sec ${prev.section} and ${clsName} Sec ${sec.name}). One teacher can be class teacher for one class only.`
              });
            }
            teacherAssignedInPayload.set(sec.class_teacher_id, { class_level: clsName, section: sec.name });
          }
        }
      }
    }

    // 2. Validate against existing assignments in other classes of the school
    if (teacherAssignedInPayload.size > 0) {
      const teacherIds = Array.from(teacherAssignedInPayload.keys());
      const { data: existingAssns } = await supabase
        .from('class_assignments')
        .select('class_name, section, class_teacher_id, staff:class_teacher_id (name)')
        .eq('school_id', school_id)
        .in('class_teacher_id', teacherIds);

      for (const ea of (existingAssns || [])) {
        const payloadTarget = teacherAssignedInPayload.get(ea.class_teacher_id);
        const isSameTarget = payloadTarget && 
          String(ea.class_name).trim().toLowerCase() === String(payloadTarget.class_level).trim().toLowerCase() &&
          String(ea.section || 'A').trim().toLowerCase() === String(payloadTarget.section || 'A').trim().toLowerCase();

        if (!isSameTarget) {
          const teacherName = ea.staff?.name || 'This teacher';
          return res.status(400).json({
            message: `Validation Error: ${teacherName} is already assigned as Class Teacher for Class ${ea.class_name} (Section ${ea.section || 'A'}). A single teacher can be the class teacher of only 1 class.`
          });
        }
      }
    }

    const allTeacherIds = [];
    classes.forEach(c => {
      (c.sections_data || []).forEach(s => {
        if (s.class_teacher_id) allTeacherIds.push(s.class_teacher_id);
      });
    });

    let importStaffMap = new Map();
    if (allTeacherIds.length > 0) {
      const { data: staffList } = await supabase.from('staff').select('id, name').in('id', allTeacherIds);
      (staffList || []).forEach(s => importStaffMap.set(String(s.id), s.name));
    }

    const rows = classes.map(cls => {
      const secList = Array.isArray(cls.sections) 
        ? cls.sections 
        : (cls.sections ? String(cls.sections).split(',').map(s => s.trim()).filter(Boolean) : ['A']);
      
      const rawSecData = cls.sections_data && Array.isArray(cls.sections_data) && cls.sections_data.length > 0
        ? cls.sections_data
        : secList.map(s => ({ name: s, capacity: 40, class_teacher_id: null, class_teacher_name: null }));

      const sections_data = rawSecData.map(s => ({
        ...s,
        class_teacher_id: s.class_teacher_id || null,
        class_teacher_name: s.class_teacher_name || (s.class_teacher_id ? importStaffMap.get(String(s.class_teacher_id)) || null : null)
      }));

      return {
        school_id,
        class_level: cls.class_level || cls.name,
        medium: cls.medium || 'English',
        has_semester: cls.has_semester || false,
        has_sections: secList.length > 0,
        sections: secList.join(','),
        sections_data
      };
    });

    const { data, error } = await supabase
      .from('school_class_configs')
      .upsert(rows, { onConflict: 'school_id, class_level' })
      .select();

    if (error) throw error;

    // Synchronize assignments for any assigned class teachers
    for (const cls of rows) {
      for (const sec of cls.sections_data) {
        if (sec.class_teacher_id) {
          await syncClassAssignmentTeacher(school_id, cls.class_level, sec.name, sec.class_teacher_id);
        }
      }
    }

    // Auto-seed default subjects for the imported classes from Holy Name template
    const importedClassNames = rows.map(r => r.class_level);
    try {
      await seedDefaultSubjectsForSchool(supabase, school_id, importedClassNames);
    } catch (seedErr) {
      console.error('Error auto-seeding default subjects during import:', seedErr);
    }

    res.status(200).json({ message: `Successfully imported ${rows.length} classes`, data });
  } catch (error) {
    console.error('Error importing classes for school:', error);
    res.status(500).json({ message: 'Server error importing classes' });
  }
};

// @desc    Update a school's class config (sections, medium, capacity, class teachers)
// @route   PUT /api/classes/school/:className
// @access  Private (Admin)
exports.updateSchoolClass = async (req, res) => {
  try {
    const school_id = await resolveSchoolId(req);
    if (!school_id) return res.status(400).json({ message: 'School ID required' });

    const className = decodeURIComponent(req.params.className);
    const { medium, has_semester, sections, sections_data } = req.body;

    const secList = Array.isArray(sections)
      ? sections
      : (sections ? String(sections).split(',').map(s => s.trim()).filter(Boolean) : []);

    // 1. Validate no duplicate class teachers within this class's active sections
    if (sections_data && Array.isArray(sections_data)) {
      const localTeachersSeen = new Map();
      for (const sec of sections_data) {
        if (sec.class_teacher_id) {
          if (localTeachersSeen.has(sec.class_teacher_id)) {
            const prevSec = localTeachersSeen.get(sec.class_teacher_id);
            return res.status(400).json({
              message: `Validation Error: Cannot assign the same teacher as Class Teacher to multiple sections (Section ${prevSec} and Section ${sec.name}). One teacher can be class teacher for one class only.`
            });
          }
          localTeachersSeen.set(sec.class_teacher_id, sec.name);
        }
      }

      // 2. Validate against ALL other classes in class_assignments
      const teacherIds = Array.from(localTeachersSeen.keys());
      if (teacherIds.length > 0) {
        const { data: existingAssns } = await supabase
          .from('class_assignments')
          .select('class_name, section, class_teacher_id, staff:class_teacher_id (name)')
          .eq('school_id', school_id)
          .in('class_teacher_id', teacherIds);

        for (const ea of (existingAssns || [])) {
          const isCurrentClass = String(ea.class_name).trim().toLowerCase() === String(className).trim().toLowerCase();
          const targetSec = localTeachersSeen.get(ea.class_teacher_id);
          const isSameSection = isCurrentClass && String(ea.section || 'A').trim().toLowerCase() === String(targetSec || 'A').trim().toLowerCase();

          if (!isSameSection) {
            const teacherName = ea.staff?.name || 'This teacher';
            return res.status(400).json({
              message: `Validation Error: ${teacherName} is already assigned as Class Teacher for Class ${ea.class_name} (Section ${ea.section || 'A'}). A single teacher can be the class teacher of only 1 class.`
            });
          }
        }
      }
    }

    const updateData = {};
    if (medium !== undefined) updateData.medium = medium;
    if (has_semester !== undefined) updateData.has_semester = has_semester;
    if (sections !== undefined) {
      updateData.sections = secList.join(',');
      updateData.has_sections = secList.length > 0;
    }
    if (sections_data !== undefined) {
      const teacherIds = sections_data.filter(s => s.class_teacher_id).map(s => s.class_teacher_id);
      let staffNameMap = new Map();
      if (teacherIds.length > 0) {
        const { data: staffList } = await supabase.from('staff').select('id, name').in('id', teacherIds);
        (staffList || []).forEach(s => staffNameMap.set(String(s.id), s.name));
      }
      updateData.sections_data = sections_data.map(s => ({
        ...s,
        class_teacher_id: s.class_teacher_id || null,
        class_teacher_name: s.class_teacher_name || (s.class_teacher_id ? staffNameMap.get(String(s.class_teacher_id)) || null : null)
      }));
    }

    const { data, error } = await supabase
      .from('school_class_configs')
      .update(updateData)
      .eq('school_id', school_id)
      .eq('class_level', className)
      .select();

    if (error) throw error;

    // 3. Synchronize class_assignments
    if (sections_data && Array.isArray(sections_data)) {
      const activeSectionNames = new Set(sections_data.map(s => String(s.name).trim().toLowerCase()));

      for (const sec of sections_data) {
        await syncClassAssignmentTeacher(school_id, className, sec.name, sec.class_teacher_id);
      }

      // If any section was removed, unlink its class_teacher_id in class_assignments
      const { data: existingForClass } = await supabase
        .from('class_assignments')
        .select('id, section')
        .eq('school_id', school_id)
        .eq('class_name', className);

      for (const ef of (existingForClass || [])) {
        if (!activeSectionNames.has(String(ef.section).trim().toLowerCase())) {
          await supabase.from('class_assignments').update({
            class_teacher_id: null,
            updated_at: new Date()
          }).eq('id', ef.id);
        }
      }
    }

    res.json(data && data[0] ? data[0] : { message: 'Updated successfully' });
  } catch (error) {
    console.error('Error updating school class:', error);
    res.status(500).json({ message: 'Server error updating school class' });
  }
};

// @desc    Delete an imported class from school configuration
// @route   DELETE /api/classes/school/:className
// @access  Private (Admin)
exports.deleteSchoolClass = async (req, res) => {
  try {
    const school_id = await resolveSchoolId(req);
    if (!school_id) return res.status(400).json({ message: 'School ID required' });

    const className = decodeURIComponent(req.params.className);

    const { error } = await supabase
      .from('school_class_configs')
      .delete()
      .eq('school_id', school_id)
      .eq('class_level', className);

    if (error) throw error;

    // Unlink or clean up class_assignments for this class so assigned teachers are freed
    await supabase
      .from('class_assignments')
      .delete()
      .eq('school_id', school_id)
      .eq('class_name', className);

    // Clean up associated subjects for this class
    const normClass = normalizeClassLevel(className);
    await supabase.from('school_subjects').delete().eq('school_id', school_id).in('class_level', [className, normClass]);
    await supabase.from('school_elective_groups').delete().eq('school_id', school_id).in('class_level', [className, normClass]);

    res.json({ message: 'Class removed from school successfully' });
  } catch (error) {
    console.error('Error deleting school class:', error);
    res.status(500).json({ message: 'Server error deleting school class' });
  }
};
