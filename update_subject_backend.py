import re

controller_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/backend/controllers/subjectController.js'
with open(controller_path, 'r', encoding='utf-8') as f:
    controller_content = f.read()

# Replace getClassSubjectMappings
old_get_mapping = """exports.getClassSubjectMappings = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    
    if (!school_id) {
      return res.status(403).json({ message: 'School ID is required' });
    }

    const { data, error } = await supabase
      .from('school_subjects')
      .select('id, class_level, subject_id, subjects(name, code, type)')
      .eq('school_id', school_id)
      .order('class_level');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};"""

new_get_mapping = """exports.getClassSubjectMappings = async (req, res) => {
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
};"""

controller_content = controller_content.replace(old_get_mapping, new_get_mapping)

with open(controller_path, 'w', encoding='utf-8') as f:
    f.write(controller_content)

routes_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/backend/routes/subjectRoutes.js'
with open(routes_path, 'r', encoding='utf-8') as f:
    routes_content = f.read()

# Add POST /config route
routes_content = routes_content.replace(
    "router.get('/mapping', protect, getClassSubjectMappings);",
    "router.get('/mapping', protect, getClassSubjectMappings);\nrouter.post('/mapping/config', protect, subjectController.saveClassSubjectConfig);"
)

with open(routes_path, 'w', encoding='utf-8') as f:
    f.write(routes_content)

print("Backend API updated successfully.")
