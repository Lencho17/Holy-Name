const supabase = require('../config/supabase');

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
    res.json(data);
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
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required' });

    const { data, error } = await supabase
      .from('global_classes')
      .insert([{ name }])
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
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required' });

    const { data, error } = await supabase
      .from('global_classes')
      .update({ name })
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

    // Process updates sequentially to avoid race conditions or use a bulk RPC if available.
    // For simplicity, updating one by one.
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
