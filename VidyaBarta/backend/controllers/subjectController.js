const supabase = require('../config/supabase');

// @desc    Get all global subjects
// @route   GET /api/subjects/global
// @access  Private (Admin/Superadmin)
exports.getGlobalSubjects = async (req, res) => {
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
};

// @desc    Create a global subject
// @route   POST /api/subjects/global
// @access  Private (Superadmin)
exports.createGlobalSubject = async (req, res) => {
  try {
    const { name, code, type } = req.body;
    
    // Superadmin check
    if (req.user && req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only superadmin can create global subjects' });
    }

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and 6-digit code are required' });
    }

    if (code.length !== 6) {
      return res.status(400).json({ message: 'Code must be exactly 6 alphanumeric characters' });
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code: code.toUpperCase(), type: type || 'Theory' })
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
