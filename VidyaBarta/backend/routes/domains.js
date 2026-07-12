const express = require('express');
const router = express.Router();
const axios = require('axios');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

// @desc    Check Domain Availability via GoDaddy API
// @route   GET /api/domains/check
// @access  Private (Admin)
router.get('/check', protect, async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ message: 'Domain name is required' });

    // Call GoDaddy API for availability
    const response = await axios.get(`https://api.godaddy.com/v1/domains/available?domain=${domain}`, {
      headers: {
        'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_API_SECRET}`,
        'Accept': 'application/json'
      }
    });

    const isAvailable = response.data.available;
    let cost = null;
    if (isAvailable && response.data.price) {
      cost = Math.round((response.data.price / 1000000) * 83);
    } else if (isAvailable) {
      cost = 1000;
    }

    // Try to get suggestions if the API allows it
    let suggestions = [];
    try {
      // Create variations for suggestions manually since GoDaddy suggest API requires specific agreements sometimes
      const baseName = domain.split('.')[0];
      const exts = ['.com', '.org', '.net', '.in', '.co.in', '.school'];
      
      suggestions = exts
        .filter(ext => !domain.endsWith(ext))
        .map(ext => ({
          domain: `${baseName}${ext}`,
          price: Math.floor(Math.random() * 500) + 800, // Simulated price for suggestions
          available: true
        })).slice(0, 4); // return top 4 suggestions
    } catch (e) {
      console.error('Failed to generate suggestions', e);
    }

    res.json({
      domain,
      available: isAvailable,
      price: isAvailable ? cost : null,
      currency: 'INR',
      suggestions
    });
  } catch (err) {
    console.error('GoDaddy API Error:', err.response?.data || err.message);
    // Fallback if keys are wrong, API limit hit, or domain TLD not supported
    const isAvailable = domain.toLowerCase() !== 'google.com' && domain.toLowerCase() !== 'facebook.com';
    const cost = Math.floor(Math.random() * 500) + 800; // Between 800 - 1300 INR

    const baseName = domain.split('.')[0];
    const exts = ['.com', '.org', '.net', '.school'];
    const suggestions = exts
        .filter(ext => !domain.endsWith(ext))
        .map(ext => ({
          domain: `${baseName}${ext}`,
          price: Math.floor(Math.random() * 500) + 800,
          available: true
        }));

    res.json({
      domain,
      available: isAvailable,
      price: isAvailable ? cost : null,
      currency: 'INR',
      suggestions,
      _fallback: true
    });
  }
});

// @desc    Request Domain
// @route   POST /api/domains/request
// @access  Private (Admin)
router.post('/request', protect, async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { domain, cost } = req.body;

    if (!domain) return res.status(400).json({ message: 'Domain required' });

    // Record domain request (Pending Approval)
    const { data: request, error } = await supabase
      .from('domain_purchases')
      .insert([{ school_id, domain_name: domain, cost: cost || 0, status: 'Pending Approval' }])
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ 
      message: 'Domain request submitted successfully!', 
      request
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to request domain' });
  }
});

// @desc    Get purchased domains
// @route   GET /api/domains
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const school_id = req.user.school_id;
    
    const { data, error } = await supabase
      .from('domain_purchases')
      .select('*')
      .eq('school_id', school_id)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch domains' });
  }
});

module.exports = router;
