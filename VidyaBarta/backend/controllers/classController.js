const supabase = require('../config/supabase');
const { sortClasses } = require('../utils/classOrder');

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

// @desc    Get all imported/configured classes for a school
// @route   GET /api/classes/school
// @access  Public / Optional Protect
exports.getSchoolClasses = async (req, res) => {
  try {
    const school_id = await resolveSchoolId(req);
    if (!school_id) return res.json([]);

    const { data, error } = await supabase
      .from('school_class_configs')
      .select('*')
      .eq('school_id', school_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(sortClasses(data || [], c => c.class_level));
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

    const rows = classes.map(cls => {
      const secList = Array.isArray(cls.sections) 
        ? cls.sections 
        : (cls.sections ? String(cls.sections).split(',').map(s => s.trim()).filter(Boolean) : ['A']);
      
      const sections_data = cls.sections_data && Array.isArray(cls.sections_data) && cls.sections_data.length > 0
        ? cls.sections_data
        : secList.map(s => ({ name: s, capacity: 40 }));

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
    res.status(200).json({ message: `Successfully imported ${rows.length} classes`, data });
  } catch (error) {
    console.error('Error importing classes for school:', error);
    res.status(500).json({ message: 'Server error importing classes' });
  }
};

// @desc    Update a school's class config (sections, medium, capacity)
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

    const updateData = {};
    if (medium !== undefined) updateData.medium = medium;
    if (has_semester !== undefined) updateData.has_semester = has_semester;
    if (sections !== undefined) {
      updateData.sections = secList.join(',');
      updateData.has_sections = secList.length > 0;
    }
    if (sections_data !== undefined) {
      updateData.sections_data = sections_data;
    }

    const { data, error } = await supabase
      .from('school_class_configs')
      .update(updateData)
      .eq('school_id', school_id)
      .eq('class_level', className)
      .select();

    if (error) throw error;
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

    // Clean up associated subjects for this class
    await supabase.from('school_subjects').delete().eq('school_id', school_id).eq('class_level', className);
    await supabase.from('school_elective_groups').delete().eq('school_id', school_id).eq('class_level', className);

    res.json({ message: 'Class removed from school successfully' });
  } catch (error) {
    console.error('Error deleting school class:', error);
    res.status(500).json({ message: 'Server error deleting school class' });
  }
};
