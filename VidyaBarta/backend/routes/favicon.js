const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    let domain = req.headers['x-forwarded-host'] || req.headers.host || req.query.domain;
    if (domain) {
      domain = domain.split(',')[0].trim();
    }
    
    if (!domain) {
      return res.redirect('https://www.vidyabarta.com/vidyabarta-favicon.png');
    }

    // Clean domain of www. for flexible matching
    const cleanDomain = domain.replace(/^www\./, '');
    const wwwDomain = `www.${cleanDomain}`;
    
    // Find school by subdomain or custom_domain
    const { data: school } = await supabase
      .from('schools')
      .select('logo_url')
      .or(`subdomain.eq.${cleanDomain},custom_domain.eq.${cleanDomain},custom_domain.eq.${wwwDomain}`)
      .single();
    
    if (school && school.logo_url) {
      return res.redirect(school.logo_url);
    }
    
    // Fallback to default Vidyabarta favicon
    return res.redirect('https://www.vidyabarta.com/vidyabarta-favicon.png');
  } catch (error) {
    console.error('Error serving favicon:', error);
    return res.redirect('https://www.vidyabarta.com/vidyabarta-favicon.png');
  }
});

module.exports = router;
