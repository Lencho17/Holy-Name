import sys

controller_path = '/home/zerosync/Documents/Holy-Name/VidyaBarta/backend/controllers/subjectController.js'
with open(controller_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update createGlobalSubject to generate code immediately
old_create = """exports.createGlobalSubject = async (req, res) => {
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
};"""

new_create = """exports.createGlobalSubject = async (req, res) => {
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
};"""

content = content.replace(old_create, new_create)


# 2. Update finalizeGlobalSubject to ONLY flip is_finalized
old_finalize = """exports.finalizeGlobalSubject = async (req, res) => {
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

new_finalize = """exports.finalizeGlobalSubject = async (req, res) => {
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
};"""

content = content.replace(old_finalize, new_finalize)

with open(controller_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated subjectController.js")
