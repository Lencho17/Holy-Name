const supabase = require('../config/supabase');

// @desc    Get all global subjects
// @route   GET /api/subjects/global
// @access  Private (Admin/Superadmin)
exports.getGlobalSubjects = async (req, res) => {
  try {
    const { sortBy, filterBy } = req.query;
    let query = supabase.from('subjects').select('id, name, code, marking_system, is_finalized, created_at');

    if (filterBy && filterBy !== 'All') {
      query = query.eq('marking_system', filterBy);
    }

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'Z-A') query = query.order('name', { ascending: false });
    else query = query.order('name', { ascending: true }); // default A-Z

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
    res.json({ message: 'Global subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
      .select('*, subjects(name, code, type)')
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
    const school_id = req.user.school_id;
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
      .select('id, class_level, subject_id, is_core, elective_group_id, subjects(name, code, type)')
      .eq('school_id', school_id);
    if (subjError) throw subjError;

    // Combine them into a structured format
    const classesMap = {};
    
    // Initialize all standard classes
    const standardClasses = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    standardClasses.forEach(c => {
      classesMap[c] = { class_level: c, medium: '', has_semester: false, sections: '', core_subjects: [], elective_groups: [] };
    });

    configs.forEach(c => {
      if (classesMap[c.class_level]) {
        classesMap[c.class_level] = { ...classesMap[c.class_level], ...c, core_subjects: [], elective_groups: [] };
      } else {
        classesMap[c.class_level] = { ...c, core_subjects: [], elective_groups: [] };
      }
    });

    const groupsMap = {};
    groups.forEach(g => {
      g.subjects = [];
      groupsMap[g.id] = g;
      if (classesMap[g.class_level]) {
        classesMap[g.class_level].elective_groups.push(g);
      }
    });

    subjects.forEach(s => {
      const cls = classesMap[s.class_level];
      if (!cls) return;
      if (s.is_core) {
        cls.core_subjects.push(s);
      } else if (s.elective_group_id && groupsMap[s.elective_group_id]) {
        groupsMap[s.elective_group_id].subjects.push(s);
      }
    });

    res.json(Object.values(classesMap));
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

    const { class_level, medium, has_semester, sections, core_subjects, elective_groups } = req.body;
    
    // Upsert config
    const { data: configData, error: configError } = await supabase
      .from('school_class_configs')
      .upsert({ school_id, class_level, medium, has_semester, sections }, { onConflict: 'school_id, class_level' })
      .select()
      .single();
    if (configError) throw configError;

    // Delete existing subjects and groups for this class
    await supabase.from('school_subjects').delete().eq('school_id', school_id).eq('class_level', class_level);
    await supabase.from('school_elective_groups').delete().eq('school_id', school_id).eq('class_level', class_level);

    // Insert new core subjects
    if (core_subjects && core_subjects.length > 0) {
      const coreInserts = core_subjects.map(sub_id => ({
        school_id, class_level, subject_id: sub_id, is_core: true
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
          const eleInserts = grp.subjects.map(sub_id => ({
            school_id, class_level, subject_id: sub_id, is_core: false, elective_group_id: newGrp.id
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
