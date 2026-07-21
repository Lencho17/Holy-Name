import re

controller_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/backend/controllers/subjectController.js'
with open(controller_path, 'r', encoding='utf-8') as f:
    controller_content = f.read()

# 1. Update getGlobalSubjects to support sorting and filtering
old_get = """exports.getGlobalSubjects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, code, type')
      .order('name');
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};"""

new_get = """exports.getGlobalSubjects = async (req, res) => {
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
};"""

controller_content = controller_content.replace(old_get, new_get)

# 2. Update createGlobalSubject and add update/finalize
old_create = """// @desc    Create a global subject
// @route   POST /api/subjects/global
// @access  Private (Superadmin)
exports.createGlobalSubject = async (req, res) => {
  try {
    const { name, class_level, type } = req.body;
    
    // Superadmin check
    if (req.user && req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only superadmin can create global subjects' });
    }

    if (!name || !class_level) {
      return res.status(400).json({ message: 'Name and class level are required' });
    }

    // Auto-generate code: VB + First 4 letters (or less) of name + - + class_level
    // e.g., Mathematics, Class V -> VBMATH-V
    const subjectPrefix = name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
    const generatedCode = `VB-${subjectPrefix}-${class_level.toUpperCase()}`;

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code: generatedCode, type: type || 'Core', class_level })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Subject code already exists' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};"""

new_create_update_finalize = """// @desc    Create a draft global subject
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

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, marking_system, is_finalized: false })
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

    // Generate base code
    const subjectPrefix = subject.name.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase();
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
      .update({ code: finalCode, is_finalized: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};"""

controller_content = controller_content.replace(old_create, new_create_update_finalize)

with open(controller_path, 'w', encoding='utf-8') as f:
    f.write(controller_content)

print("subjectController.js updated.")

