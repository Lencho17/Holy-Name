const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings/school-status
// Publicly accessible to know if the school is open or closed
router.get('/school-status', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('school_settings')
      .select('is_open, status_message, last_updated_at')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    
    // If no record exists, default to open
    if (!settings) {
      return res.json({ is_open: true, status_message: 'School is open.' });
    }

    res.json(settings);
  } catch (error) {
    console.error('[GET SCHOOL STATUS ERROR]:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings/school-status
// Protected: Only admins can change the status
router.put('/school-status', protect, async (req, res) => {
  try {
    const { isOpen, statusMessage } = req.body;
    
    // Validate
    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ message: 'isOpen must be a boolean' });
    }

    // Check if a record exists
    const { data: existing } = await supabase
      .from('school_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const updateData = {
      is_open: isOpen,
      status_message: statusMessage || (isOpen ? 'School is open.' : 'School is closed.'),
      last_updated_by: req.user.id,
      last_updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      result = await supabase
        .from('school_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('school_settings')
        .insert(updateData)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.json(result.data);
  } catch (error) {
    console.error('[UPDATE SCHOOL STATUS ERROR]:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings/svg-templates
// Protected: Only admins can upload templates
router.put('/svg-templates', protect, async (req, res) => {
  try {
    const { report_card_svg, admission_receipt_svg } = req.body;
    
    // Check if a record exists
    const { data: existing } = await supabase
      .from('school_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const updateData = {
      last_updated_by: req.user.id,
      last_updated_at: new Date().toISOString()
    };
    if (report_card_svg !== undefined) updateData.report_card_svg = report_card_svg;
    if (admission_receipt_svg !== undefined) updateData.admission_receipt_svg = admission_receipt_svg;

    let result;
    if (existing) {
      result = await supabase
        .from('school_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('school_settings')
        .insert(updateData)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    res.json({ message: 'Templates saved successfully!' });
  } catch (error) {
    console.error('[UPDATE SVG TEMPLATES ERROR]:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
