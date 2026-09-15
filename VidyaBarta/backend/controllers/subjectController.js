const supabase = require('../config/supabase');
const { 
  CANONICAL_CLASSES, 
  normalizeClassLevel, 
  getHolyNameDefaultSubjects, 
  seedDefaultSubjectsForSchool 
} = require('../utils/defaultClassSubjects');
const { sortClasses } = require('../utils/classOrder');

// Helper to resolve school_id from request
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

// @desc    Get all global subjects
// @route   GET /api/subjects/global
// @access  Private (Admin/Superadmin)
exports.getGlobalSubjects = async (req, res) => {
  try {
    const { sortBy, filterBy } = req.query;
    let query = supabase.from('subjects').select('id, name, code, marking_system, is_finalized, created_at, order_index');

    if (filterBy && filterBy !== 'All') {
      query = query.eq('marking_system', filterBy);
    }

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'Z-A') query = query.order('name', { ascending: false });
    else if (sortBy === 'A-Z') query = query.order('name', { ascending: true });
    else query = query.order('order_index', { ascending: true }).order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a draft global subject
// @route   POST /api/subjects/global
// @access  Private (Superadmin)
exports.createGlobalSubject = async (req, res) => {
  try {
    const { name, marking_system } = req.body;
    
    if (req.user && req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only superadmin can create global subjects' });
    }

    if (!name || !marking_system) {
      return res.status(400).json({ message: 'Name and marking system are required' });
    }

    // Generate base code immediately
    const subjectPrefix = name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
    let baseCode = `VB-${subjectPrefix}`;
    let finalCode = baseCode;
    
    // Conflict resolution auto-append logic
    let suffix = 0;
    while(true) {
       const { data: existing, error: checkErr } = await supabase.from('subjects').select('id').eq('code', finalCode).maybeSingle();
       if (checkErr) throw checkErr;
       if (!existing) break; // Code is unique
       suffix++;
       finalCode = `${baseCode}-${suffix}`;
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code: finalCode, marking_system, is_finalized: false })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a draft global subject
// @route   PUT /api/subjects/global/:id
// @access  Private (Superadmin)
exports.updateGlobalSubject = async (req, res) => {
  try {
    const { name, marking_system } = req.body;
    const { id } = req.params;

    if (req.user && req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only superadmin can update global subjects' });
    }

    // Check if finalized
    const { data: existing, error: errExist } = await supabase.from('subjects').select('is_finalized').eq('id', id).single();
    if (errExist) throw errExist;
    if (existing.is_finalized) return res.status(400).json({ message: 'Cannot edit a finalized subject' });

    const { data, error } = await supabase
      .from('subjects')
      .update({ name, marking_system })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Finalize a global subject and generate code
// @route   PATCH /api/subjects/global/:id/finalize
// @access  Private (Superadmin)
exports.finalizeGlobalSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only superadmin can finalize global subjects' });
    }

    // Get subject details
    const { data: subject, error: fetchErr } = await supabase.from('subjects').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;
    
    if (subject.is_finalized) return res.status(400).json({ message: 'Subject is already finalized' });

    const { data, error } = await supabase
      .from('subjects')
      .update({ is_finalized: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a global subject
// @route   DELETE /api/subjects/global/:id
// @access  Private (Superadmin)
exports.deleteGlobalSubject = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only superadmin can delete global subjects' });
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reorderGlobalSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    for (const sub of subjects) {
      if (sub.id && sub.order_index !== undefined) {
        await supabase
          .from('subjects')
          .update({ order_index: sub.order_index })
          .eq('id', sub.id);
      }
    }

    res.json({ message: 'Global subjects reordered successfully' });
  } catch (error) {
    console.error('Error reordering global subjects:', error);
    res.status(500).json({ message: 'Server error reordering global subjects' });
  }
};

// @desc    Map a global subject to a class for the current school
// @route   POST /api/subjects/mapping
// @access  Private (Admin)
exports.createClassSubjectMapping = async (req, res) => {
  try {
    const { class_level, subject_id } = req.body;
    const school_id = req.user.school_id;

    if (!school_id) {
      return res.status(403).json({ message: 'School ID is required' });
    }

    if (!class_level || !subject_id) {
      return res.status(400).json({ message: 'Class level and subject ID are required' });
    }

    const { data, error } = await supabase
      .from('school_subjects')
      .insert({ school_id, class_level, subject_id })
      .select('*, subjects(name, code, marking_system)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'This subject is already assigned to this class' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get mapped subjects for the current school
// @route   GET /api/subjects/mapping
// @access  Private (Admin)
exports.getClassSubjectMappings = async (req, res) => {
  try {
    const school_id = await resolveSchoolId(req);
    if (!school_id) return res.status(403).json({ message: 'School ID is required' });

    // 1. Fetch class configs
    const { data: configs, error: configError } = await supabase
      .from('school_class_configs')
      .select('*')
      .eq('school_id', school_id);
    if (configError) throw configError;

    // 2. Fetch elective groups
    const { data: groups, error: groupError } = await supabase
      .from('school_elective_groups')
      .select('*')
      .eq('school_id', school_id);
    if (groupError) throw groupError;

    // 3. Fetch subjects mapping
    const { data: subjects, error: subjError } = await supabase
      .from('school_subjects')
      .select('id, class_level, subject_id, is_core, elective_group_id, is_divided, parts, subjects(name, code, marking_system)')
      .eq('school_id', school_id);
    if (subjError) throw subjError;

    // Combine them into a structured format
    const classesMap = {};
    
    // Initialize all canonical standard classes
    CANONICAL_CLASSES.forEach(c => {
      classesMap[c] = { class_level: c, medium: '', has_semester: false, sections: '', core_subjects: [], elective_groups: [] };
    });

    (configs || []).forEach(c => {
      const normClass = normalizeClassLevel(c.class_level);
      if (classesMap[normClass]) {
        classesMap[normClass] = { ...classesMap[normClass], ...c, class_level: normClass, core_subjects: [], elective_groups: [] };
      } else {
        classesMap[c.class_level] = { ...c, core_subjects: [], elective_groups: [] };
      }
    });

    const groupsMap = {};
    (groups || []).forEach(g => {
      g.subjects = [];
      groupsMap[g.id] = g;
      const normClass = normalizeClassLevel(g.class_level);
      if (classesMap[normClass]) {
        classesMap[normClass].elective_groups.push(g);
      } else if (classesMap[g.class_level]) {
        classesMap[g.class_level].elective_groups.push(g);
      }
    });

    (subjects || []).forEach(s => {
      const normClass = normalizeClassLevel(s.class_level);
      const cls = classesMap[normClass] || classesMap[s.class_level];
      if (!cls) return;
      if (s.is_core) {
        cls.core_subjects.push(s);
      } else if (s.elective_group_id && groupsMap[s.elective_group_id]) {
        groupsMap[s.elective_group_id].subjects.push(s);
      }
    });

    // Check for any classes that have no subjects configured:
    // If not configured, populate default subjects from Holy Name template
    const defaultTemplate = await getHolyNameDefaultSubjects(supabase);
    const classesNeedingSeed = [];

    Object.keys(classesMap).forEach(clsKey => {
      const clsObj = classesMap[clsKey];
      const hasConfiguredSubjects = (clsObj.core_subjects && clsObj.core_subjects.length > 0) ||
        (clsObj.elective_groups && clsObj.elective_groups.some(g => g.subjects && g.subjects.length > 0));

      if (!hasConfiguredSubjects) {
        const normKey = normalizeClassLevel(clsKey);
        const def = defaultTemplate[normKey];
        if (def && (def.core_subjects.length > 0 || def.elective_groups.length > 0)) {
          clsObj.core_subjects = def.core_subjects;
          clsObj.elective_groups = def.elective_groups;
          classesNeedingSeed.push(normKey);
        }
      }
    });

    // Asynchronously persist defaults for classes that needed them so DB is seeded
    if (classesNeedingSeed.length > 0) {
      seedDefaultSubjectsForSchool(supabase, school_id, classesNeedingSeed).catch(e => {
        console.error('Background seeding default subjects error:', e);
      });
    }

    const result = sortClasses(Object.values(classesMap), c => c.class_level);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Save complete class subject config
// @route   POST /api/subjects/mapping/config
// @access  Private (Admin)
exports.saveClassSubjectConfig = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) return res.status(403).json({ message: 'School ID is required' });

    const { class_level, medium, has_semester, sections, core_subjects, elective_groups, has_sections, sections_data } = req.body;
    
    // Upsert config
    const { data: configData, error: configError } = await supabase
      .from('school_class_configs')
      .upsert({ school_id, class_level, medium, has_semester, sections, has_sections: has_sections || false, sections_data: sections_data || [] }, { onConflict: 'school_id, class_level' })
      .select()
      .single();
    if (configError) throw configError;

    // Delete existing subjects and groups for this class
    await supabase.from('school_subjects').delete().eq('school_id', school_id).eq('class_level', class_level);
    await supabase.from('school_elective_groups').delete().eq('school_id', school_id).eq('class_level', class_level);

    // Insert new core subjects
    if (core_subjects && core_subjects.length > 0) {
      const coreInserts = core_subjects.map(sub => ({
        school_id, class_level, subject_id: sub.subject_id, is_core: true,
        is_divided: sub.is_divided || false, parts: sub.parts || []
      }));
      await supabase.from('school_subjects').insert(coreInserts);
    }

    // Insert elective groups and their subjects
    if (elective_groups && elective_groups.length > 0) {
      for (const grp of elective_groups) {
        const { data: newGrp, error: grpError } = await supabase
          .from('school_elective_groups')
          .insert({ school_id, class_level, group_name: grp.group_name, selectable_count: grp.selectable_count })
          .select()
          .single();
        if (grpError) throw grpError;

        if (grp.subjects && grp.subjects.length > 0) {
          const eleInserts = grp.subjects.map(sub => ({
            school_id, class_level, subject_id: sub.subject_id, is_core: false, elective_group_id: newGrp.id,
            is_divided: sub.is_divided || false, parts: sub.parts || []
          }));
          await supabase.from('school_subjects').insert(eleInserts);
        }
      }
    }

    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a class subject mapping
// @route   DELETE /api/subjects/mapping/:id
// @access  Private (Admin)
exports.deleteClassSubjectMapping = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    
    if (!school_id) {
      return res.status(403).json({ message: 'School ID is required' });
    }

    const { error } = await supabase
      .from('school_subjects')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', school_id);

    if (error) throw error;
    res.json({ message: 'Subject mapping removed from class' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an entire class configuration
// @route   DELETE /api/subjects/mapping/class/:className
// @access  Private (Admin)
exports.deleteClassConfig = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { className } = req.params;
    
    if (!school_id) {
      return res.status(403).json({ message: 'School ID is required' });
    }

    // Delete existing subjects and groups for this class
    await supabase.from('school_subjects').delete().eq('school_id', school_id).eq('class_level', className);
    await supabase.from('school_elective_groups').delete().eq('school_id', school_id).eq('class_level', className);
    
    // Delete the class config itself
    const { error } = await supabase.from('school_class_configs').delete().eq('school_id', school_id).eq('class_level', className);

    if (error) throw error;
    res.json({ message: 'Class configuration deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
