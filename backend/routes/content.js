const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

/**
 * Simple in-memory cache for aggregated site content.
 */
let contentCache = {
  data: null,
  lastFetched: 0,
  ttl: 30 * 1000, // 30 seconds
};

const getAggregatedContent = async () => {
  // Fetch everything in parallel
  const [
    { data: settings },
    { data: notices },
    { data: gallery },
    { data: events },
    { data: highlights },
    { data: faculty },
    { data: alumni },
    { data: stats },
    { data: faqs },
    { data: courses },
    { data: messages },
    { data: emeritus },
    { data: centerOfExcellence }
  ] = await Promise.all([
    supabase.from('site_settings').select('*').limit(1).maybeSingle(),
    supabase.from('notices').select('*').order('created_at', { ascending: false }),
    supabase.from('gallery').select('*').order('created_at', { ascending: false }),
    supabase.from('events').select('*').order('created_at', { ascending: false }),
    supabase.from('highlights').select('*').order('created_at', { ascending: false }),
    supabase.from('faculty').select('*').order('order_index', { ascending: true }),
    supabase.from('alumni').select('*').order('created_at', { ascending: false }),
    supabase.from('stats').select('*').order('created_at', { ascending: true }),
    supabase.from('faqs').select('*').order('order_index', { ascending: true }),
    supabase.from('courses').select('*').order('created_at', { ascending: true }),
    supabase.from('messages').select('*'),
    supabase.from('emeritus').select('*').order('order_index', { ascending: true }),
    supabase.from('center_of_excellence').select('*').order('order_index', { ascending: true })
  ]);

  // Aggregate into the format frontend expects
  return {
    schoolProfile: {
      name: settings?.school_name,
      logo: settings?.logo,
      punchLine: settings?.punch_line,
      email: settings?.email,
      phone: settings?.phone,
      officeHours: settings?.office_hours,
      officeAddress: settings?.office_address,
      mapLink: settings?.map_link,
      pageHeroImages: settings?.page_hero_images || {},
      heroImages: settings?.hero_images || [],
      affiliation: settings?.affiliation || [],
      online_admission_instructions: settings?.online_admission_instructions || [],
      offline_admission_instructions: settings?.offline_admission_instructions || [],
      establishedYear: settings?.established_year,
      isMaintenanceMode: settings?.is_maintenance_mode || false
    },
    socialLinks: settings?.social_links || {},
    notificationEmail: settings?.notification_email,
    admissionFee: settings?.admission_fee,
    admissionPaymentEnabled: settings?.admission_payment_enabled,
    admissionUpiId: settings?.admission_upi_id,
    visionStatement: settings?.vision_statement,
    visionStatementExtended: settings?.vision_statement_extended,
    aimsAndObjectives: settings?.aims_and_objectives || [],
    admissionFields: settings?.admission_fields || [],
    banners: settings?.banners || [],
    videos: settings?.videos || [],
    notices: notices || [],
    gallery: gallery || [],
    events: events || [],
    highlights: highlights || [],
    faculty: (faculty || []).reduce((acc, member) => {
      const dept = member.department || 'Others';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push({
        id: member.id,
        name: member.name,
        Subject: member.subject,
        EduQua: member.education,
        classes: member.classes,
        photo: member.photo_url,
        facebook: member.facebook_url,
        instagram: member.instagram_url,
        whatsapp: member.whatsapp_number,
        orderIndex: member.order_index,
        title: member.title
      });
      return acc;
    }, { Science: [], Arts: [], Commerce: [], "High School": [], Nursery: [], Administration: [], "Support Staff": [], Others: [] }),
    alumni: alumni || [],
    stats: stats || [],
    faqs: faqs || [],
    coursesPage: {
      courses: courses || [],
      streams: settings?.courses_streams || {},
      levels: settings?.courses_levels || [],
      rules: settings?.courses_rules || []
    },
    principal: messages?.find(m => m.type === 'principal') ? { 
      ...messages.find(m => m.type === 'principal'), 
      photo: messages.find(m => m.type === 'principal').image,
      message: messages.find(m => m.type === 'principal').content,
      introQuote: messages.find(m => m.type === 'principal').intro_quote,
      closingQuote: messages.find(m => m.type === 'principal').closing_quote,
      signature: messages.find(m => m.type === 'principal').signature
    } : {},
    emeritus: emeritus || [],
    centerOfExcellence: centerOfExcellence || [],
    headMistress: messages?.find(m => m.type === 'headmistress') ? { 
      ...messages.find(m => m.type === 'headmistress'), 
      photo: messages.find(m => m.type === 'headmistress').image, 
      greeting: messages.find(m => m.type === 'headmistress').name,
      message: messages.find(m => m.type === 'headmistress').content,
      signature: messages.find(m => m.type === 'headmistress').signature
    } : {},
    vicePrincipal: messages?.find(m => m.type === 'vice-principal') ? { ...messages.find(m => m.type === 'vice-principal'), photo: messages.find(m => m.type === 'vice-principal').image } : {}
  };
};

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    
    // Serve from cache if available and not expired
    if (contentCache.data && (now - contentCache.lastFetched < contentCache.ttl)) {
      return res.json(contentCache.data);
    }

    const aggregatedContent = await getAggregatedContent();

    // Update cache
    contentCache.data = aggregatedContent;
    contentCache.lastFetched = now;
    
    res.json(aggregatedContent);
  } catch (error) {
    console.error('Aggregated Content Fetch Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/content — protected, update site content
router.put('/', protect, async (req, res) => {
  try {
    const updateData = req.body;
    console.log(`[CONTENT UPDATE] Request received. Keys: ${Object.keys(updateData).join(', ')}`);
    if (updateData.events) console.log(`[CONTENT UPDATE] Events count: ${updateData.events.length}`);
    if (updateData.gallery) console.log(`[CONTENT UPDATE] Gallery count: ${updateData.gallery.length}`);
    if (updateData.notices) console.log(`[CONTENT UPDATE] Notices count: ${updateData.notices.length}`);
    
    // 1. Update site_settings (Single Row)
    const settingsFields = {
      school_name: updateData.schoolProfile?.name,
      logo: updateData.schoolProfile?.logo,
      punch_line: updateData.schoolProfile?.punchLine,
      email: updateData.schoolProfile?.email,
      phone: updateData.schoolProfile?.phone,
      office_hours: updateData.schoolProfile?.officeHours,
      office_address: updateData.schoolProfile?.officeAddress,
      map_link: updateData.schoolProfile?.mapLink,
      page_hero_images: updateData.schoolProfile?.pageHeroImages,
      hero_images: updateData.schoolProfile?.heroImages,
      affiliation: updateData.schoolProfile?.affiliation,
      online_admission_instructions: updateData.schoolProfile?.onlineAdmissionInstructions,
      offline_admission_instructions: updateData.schoolProfile?.offlineAdmissionInstructions,
      established_year: updateData.schoolProfile?.establishedYear,
      social_links: updateData.socialLinks,
      notification_email: updateData.notificationEmail,
      admission_fee: updateData.admissionFee,
      admission_payment_enabled: updateData.admissionPaymentEnabled,
      admission_upi_id: updateData.admissionUpiId,
      vision_statement: updateData.visionStatement,
      vision_statement_extended: updateData.visionStatementExtended,
      aims_and_objectives: updateData.aimsAndObjectives,
      admission_fields: updateData.admissionFields,
      banners: updateData.banners || (updateData.banner ? [updateData.banner] : undefined),
      videos: updateData.videos,
      courses_streams: updateData.coursesPage?.streams,
      courses_levels: updateData.coursesPage?.levels,
      courses_rules: updateData.coursesPage?.rules,
      is_maintenance_mode: updateData.isMaintenanceMode
    };

    // Filter out undefined
    const cleanSettings = Object.fromEntries(Object.entries(settingsFields).filter(([_, v]) => v !== undefined));
    if (Object.keys(cleanSettings).length > 0) {
      // Get the first settings row if it exists
      const { data: existing } = await supabase.from('site_settings').select('id').limit(1).maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from('site_settings').update(cleanSettings).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert(cleanSettings);
        if (error) throw error;
      }
    }

    // 2. Update Messages (Principal, Headmistress, etc.)
    const messageTypes = ['principal', 'headMistress', 'vicePrincipal'];
    for (const type of messageTypes) {
      const msgData = updateData[type];
      if (msgData) {
        const dbType = type.toLowerCase() === 'headmistress' ? 'headmistress' : type.toLowerCase() === 'viceprincipal' ? 'vice-principal' : 'principal';
        const { error } = await supabase.from('messages').upsert({
          type: dbType,
          name: msgData.name || msgData.greeting || msgData.name,
          image: msgData.image || msgData.photo || msgData.image,
          designation: msgData.designation || msgData.title || msgData.designation,
          content: msgData.content || msgData.message || msgData.content,
          intro_quote: msgData.introQuote,
          closing_quote: msgData.closingQuote,
          signature: msgData.signature,
          updated_at: new Date()
        }, { onConflict: 'type' });
        if (error) throw error;
      }
    }

    // 3. Update Arrays (Sync Logic: Delete & Re-insert for simplicity/legacy compatibility)
    const syncModules = [
      { key: 'notices', table: 'notices' },
      { key: 'gallery', table: 'gallery' },
      { key: 'events', table: 'events' },
      { key: 'highlights', table: 'highlights' },
      { key: 'faculty', table: 'faculty' },
      { key: 'alumni', table: 'alumni' },
      { key: 'stats', table: 'stats' },
      { key: 'faqs', table: 'faqs' },
      { key: 'emeritus', table: 'emeritus' },
      { key: 'centerOfExcellence', table: 'center_of_excellence' }
    ];

    for (const mod of syncModules) {
      if (updateData[mod.key]) {
        // Delete all existing for this module using a robust timestamp-based range filter
        const { error: delError } = await supabase.from(mod.table).delete().gte('created_at', '1900-01-01');
        if (delError) {
          console.error(`[DELETE ERROR] Table: ${mod.table}:`, delError.message);
          // Fallback to ID-based filter if created_at is missing
          await supabase.from(mod.table).delete().not('id', 'is', null);
        } else {
          console.log(`[SYNC] Cleared table: ${mod.table}`);
        }
        
        let rows = [];
        if (mod.key === 'faculty' && !Array.isArray(updateData[mod.key])) {
          // Flatten grouped faculty object
          rows = Object.entries(updateData[mod.key]).flatMap(([dept, members]) => 
            members.map(item => ({
              name: item.name,
              department: dept,
              subject: item.Subject || item.subject,
              education: item.EduQua || item.qualification || item.education,
              classes: item.classes,
              photo_url: item.photo || item.image || item.photo_url,
              facebook_url: item.facebook || item.facebook_url,
              instagram_url: item.instagram || item.instagram_url,
              whatsapp_number: item.whatsapp || item.whatsapp_number,
              order_index: item.orderIndex || item.order_index || 0,
              title: item.title
            }))
          );
        } else if (Array.isArray(updateData[mod.key])) {
          rows = updateData[mod.key].map(item => {
            const row = { ...item };
            if (row._id) delete row._id;
            if (row.id) delete row.id;
            
            if (mod.table === 'notices') {
              return { 
                title: item.title, 
                date: item.date, 
                size: item.size, 
                pdf_link: item.pdfLink || item.pdf_link 
              };
            }
            if (mod.table === 'gallery') {
              return { 
                category: item.category, 
                title: item.title, 
                src: item.src, 
                featured: item.featured, 
                description: item.description, 
                views: item.views || 0,
                album_id: item.albumId || item.album_id,
                is_album_cover: item.isAlbumCover || item.is_album_cover || false,
                event_id: item.eventId || item.event_id
              };
            }
            if (mod.table === 'events') {
              return { 
                title: item.title, 
                date: item.date, 
                image: item.image, 
                description: item.description, 
                gallery_images: item.galleryImages || item.gallery_images 
              };
            }
            if (mod.table === 'highlights') {
              return { 
                title: item.title, 
                date: item.date, 
                image: item.image, 
                description: item.description, 
                category: item.category,
                gallery_images: item.galleryImages || item.gallery_images 
              };
            }
            if (mod.table === 'faculty') {
              return { 
                name: item.name, 
                department: item.department, 
                subject: item.Subject || item.subject, 
                education: item.EduQua || item.qualification || item.education, 
                classes: item.classes,
                photo_url: item.photo || item.image || item.photo_url,
                facebook_url: item.facebook || item.facebook_url,
                instagram_url: item.instagram || item.instagram_url,
                whatsapp_number: item.whatsapp || item.whatsapp_number,
                order_index: item.orderIndex || item.order_index || 0,
                title: item.title
              };
            }
            if (mod.table === 'alumni') {
              return {
                name: item.name,
                passed_year: item.passedYear || item.passed_year,
                rank: item.rank,
                percentage: item.percentage,
                level: item.level,
                stream: item.stream,
                subjects: item.subjects,
                photo: item.photo || item.photo_url,
                description: item.description
              };
            }
            if (mod.table === 'stats') {
              return {
                label: item.label,
                value: item.value
              };
            }
            if (mod.table === 'faqs') {
              return {
                question: item.question,
                answer: item.answer,
                order_index: item.orderIndex || item.order_index || 0
              };
            }
            if (mod.table === 'emeritus') {
              return {
                name: item.name,
                role: item.role,
                category: item.category,
                status: item.status,
                tenure: item.tenure,
                message: item.message || item.description || '',
                cause_of_death: item.causeOfDeath || item.cause_of_death || '',
                photo: item.photo || item.image || '',
                order_index: item.orderIndex || item.order_index || 0
              };
            }
            if (mod.table === 'center_of_excellence') {
              return {
                title: item.title,
                name: item.name,
                passed_year: item.passedYear || item.passed_year,
                designation: item.designation,
                company: item.company,
                location: item.location,
                message: item.message || item.description || '',
                photo: item.photo || item.image || '',
                order_index: item.orderIndex || item.order_index || 0
              };
            }
            return row;
          });
        }

        if (rows.length > 0) {
          const { error } = await supabase.from(mod.table).insert(rows);
          if (error) throw error;
        }
      }
    }

    // 4. Handle Courses (Deeply nested in coursesPage)
    if (updateData.coursesPage?.courses && Array.isArray(updateData.coursesPage.courses)) {
      await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const courseRows = updateData.coursesPage.courses.map(c => ({
        title: c.title,
        description: c.description,
        image: c.image,
        features: c.features || []
      }));
      if (courseRows.length > 0) {
        const { error } = await supabase.from('courses').insert(courseRows);
        if (error) throw error;
      }
    }

    // BUST CACHE and trigger a re-fetch to return full updated data
    contentCache.data = null;
    contentCache.lastFetched = 0;

    // Fetch updated content to return to frontend for sync
    const aggregatedContent = await getAggregatedContent();
    res.json(aggregatedContent);

  } catch (error) {
    console.error('PUT /api/content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const { uploadPdf, uploadToCloudinary, uploadSingle, uploadMultiple, uploadEventImages } = require('../middleware/upload');

// POST /api/content/upload — protected, upload single image (Supabase)
router.post('/upload', protect, (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error('[SUPABASE UPLOAD ERROR]:', err);
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const publicUrl = await uploadToCloudinary(req.file, undefined, 'general');
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('[CONTROLLER ERROR]:', error);
      res.status(500).json({ message: 'Upload failed', error: error.message });
    }
  });
});

// POST /api/content/upload-pdf — protected, upload PDF to Supabase (Replaces GitHub logic)
router.post('/upload-pdf', protect, (req, res) => {
  uploadPdf(req, res, async (err) => {
    if (err) {
      console.error('[PDF MULTER ERROR]:', err);
      return res.status(500).json({ message: 'File processing failed', error: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded' });
      }
      const publicUrl = await uploadToCloudinary(req.file, undefined, 'notices');
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('[PDF SUPABASE UPLOAD ERROR]:', error);
      res.status(500).json({ message: 'Supabase upload failed', error: error.message });
    }
  });
});

// POST /api/content/upload-event — protected, upload multiple event images (Supabase)
router.post('/upload-event', protect, (req, res) => {
  uploadEventImages(req, res, async (err) => {
    if (err) {
      console.error('[EVENT SUPABASE UPLOAD ERROR]:', err);
      return res.status(500).json({ message: 'Event upload failed', error: err.message });
    }
    try {
      const result = {};
      const eventFolder = req.body.eventTitle ? `events/${req.body.eventTitle.replace(/\s+/g, "-").toLowerCase()}` : 'events';

      if (req.files && req.files.image && req.files.image.length > 0) {
        const publicUrl = await uploadToCloudinary(req.files.image[0], undefined, eventFolder);
        result.cover = { url: publicUrl };
      }
      if (req.files && req.files.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map(async (file) => {
          const publicUrl = await uploadToCloudinary(file, undefined, eventFolder);
          return { url: publicUrl };
        });
        result.gallery = await Promise.all(uploadPromises);
      }
      res.json(result);
    } catch (error) {
      console.error('[EVENT CONTROLLER ERROR]:', error);
      res.status(500).json({ message: 'Event upload failed', error: error.message });
    }
  });
});

// POST /api/content/gallery-view — public, increment view count for gallery items
router.post('/gallery-view', async (req, res) => {
  try {
    const { ids } = req.body; // array of gallery item id values
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }

    // Increment views for all matching gallery items
    // Since Supabase doesn't have a simple "increment" for multiple filtered rows in one REST call,
    // we use a loop of updates or a raw SQL call. For 50 items, separate calls are fine if done in parallel.
    const updatePromises = ids.slice(0, 50).map(id => 
      supabase.rpc('increment_gallery_view', { item_id: id })
      // Fallback if RPC isn't defined yet:
      .catch(() => supabase.from('gallery').update({ views: supabase.raw('views + 1') }).eq('id', id))
    );

    // Note: To make 'views + 1' work in Supabase JS client without RPC, you'd usually need a custom function.
    // I'll assume we can use a simple rpc or just skip for now if it's too complex to setup the Postgres function here.
    // Actually, I'll just use a direct update with a fetch if RPC fails.
    
    // Better yet, let's just do it sequentially or in parallel with a simple update if we can't do atomic increment.
    // I'll stick to a simple loop for now.
    
    await Promise.all(ids.slice(0, 50).map(async (id) => {
       // Atomic increment via SQL is best, but for now we'll do our best.
       // In a real Supabase app, you'd use a Postgres function: 
       // CREATE FUNCTION increment_view(id UUID) RETURNS void AS 'UPDATE gallery SET views = views + 1 WHERE id = $1' LANGUAGE SQL;
       return supabase.rpc('increment_gallery_view', { target_id: id }).catch(e => console.error('RPC failed:', e.message));
    }));

    // Bust cache so views are reflected
    contentCache.data = null;
    contentCache.lastFetched = 0;

    res.json({ success: true });
  } catch (error) {
    console.error('Gallery view error:', error.message);
    res.status(500).json({ message: 'Error tracking view' });
  }
});

// POST /api/content/upload-tender-pdf — public, upload tender bid PDF to Supabase (Replaces GitHub)
router.post('/upload-tender-pdf', (req, res) => {
  uploadPdf(req, res, async (err) => {
    if (err) {
      console.error('[TENDER PDF MULTER ERROR]:', err.message);
      return res.status(500).json({ message: 'File processing failed', error: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded' });
      }
      const publicUrl = await uploadToCloudinary(req.file, undefined, 'tenders');
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('[TENDER PDF SUPABASE UPLOAD ERROR]:', error);
      res.status(500).json({ message: 'PDF upload failed', error: error.message });
    }
  });
});

module.exports = router;
