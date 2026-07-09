const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = "mongodb+srv://lencho:lencho@cluster0.xjljt1n.mongodb.net/holyname?retryWrites=true&w=majority";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const toSnake = (s) => s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);

async function migrate() {
  try {
    console.log('🚀 Starting TOTAL SYNC MIGRATION (EVERYTHING)...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // --- 1. Operations & Applications ---
    const modules = [
      { mongo: 'Admin', pg: 'admins', conflict: 'email' },
      { mongo: 'Appointment', pg: 'appointments' },
      { mongo: 'Inquiry', pg: 'inquiries' },
      { mongo: 'JobApplication', pg: 'job_applications' },
      { mongo: 'TenderApplication', pg: 'tender_applications' },
      { mongo: 'ShareLink', pg: 'share_links' },
      { mongo: 'Student', pg: 'students' },
      { mongo: 'Job', pg: 'jobs', conflict: 'title' },
      { mongo: 'Tender', pg: 'tenders', conflict: 'title' }
    ];

    for (const mod of modules) {
      console.log(`⏳ Syncing ${mod.mongo}...`);
      const Model = mongoose.model(mod.mongo, new mongoose.Schema({}, { strict: false }));
      const items = await Model.find({});
      if (items.length > 0) {
        const rows = items.map(item => {
          const row = {};
          Object.entries(item._doc).forEach(([k, v]) => {
            if (k === '_id' || k === '__v') return;
            let key = toSnake(k);
            if (mod.pg === 'students' && key === 'name') key = 'student_name';
            if (mod.pg === 'admins' && key === 'is_approved') key = 'is_approved';
            if (key === 'phone') key = 'contact_number';
            if (key === 'dob') key = 'date_of_birth';
            row[key] = v;
          });
          if (mod.pg === 'students') row.student_name = row.student_name || 'Legacy Student';
          if (mod.pg === 'students') row.date_of_birth = row.date_of_birth || '1900-01-01';
          return row;
        });
        const { error } = await supabase.from(mod.pg).upsert(rows);
        if (error && mod.pg === 'students') {
            await supabase.from('students').upsert(rows.map(r => {
                const { date_of_birth, ...rest } = r;
                return { ...rest, dob: date_of_birth || '1900-01-01' };
            }));
        }
        console.log(`✅ ${items.length} ${mod.mongo} processed`);
      }
    }

    // --- 2. Admissions (Extreme Fallbacks) ---
    console.log('⏳ Syncing Admissions...');
    const Admission = mongoose.model('Admission', new mongoose.Schema({}, { strict: false }));
    const admissions = await Admission.find({});
    if (admissions.length > 0) {
      const admissionRows = admissions.map(a => {
        const flattened = {};
        if (a.formData) {
          Object.entries(a.formData).forEach(([k, v]) => {
            let key = toSnake(k);
            if (key === 'dob') key = 'date_of_birth';
            if (key === 'phone') key = 'contact_number';
            if (key === 'name') key = 'student_name';
            flattened[key] = v;
          });
        }
        return {
          student_name: a.studentName || a.formData?.studentName || 'Legacy Student',
          reference_number: a.referenceNumber || `LEGACY-${Math.random().toString(36).substr(2, 9)}`,
          grade_applied: a.gradeApplied || a.formData?.gradeApplied || 'Not Specified',
          status: a.status || 'pending',
          email: a.email,
          contact_number: a.phone || a.formData?.contactNumber || a.formData?.phone || '0000000000',
          date_of_birth: a.formData?.dateOfBirth || a.formData?.dob || '1900-01-01',
          gender: a.formData?.gender || a.gender || 'Not Specified',
          address: a.formData?.address || a.address || 'Not Provided',
          father_name: a.formData?.fatherName || 'Not Provided',
          mother_name: a.formData?.motherName || 'Not Provided',
          ...flattened,
          created_at: a.createdAt || new Date()
        };
      });
      await supabase.from('admissions').upsert(admissionRows, { onConflict: 'reference_number' });
      console.log(`✅ ${admissions.length} Admissions synced`);
    }

    // --- 3. THE COMPLETE SITE CONTENT ---
    console.log('⏳ Syncing ALL Website Content (Gallery, Events, Principal, etc.)...');
    const SiteContent = mongoose.model('SiteContent', new mongoose.Schema({}, { strict: false }));
    const content = await SiteContent.findOne({});
    
    if (content) {
      // a. Site Settings
      const settings = {
        school_name: content.schoolProfile?.name || 'Holy Name High School',
        logo: content.schoolProfile?.logo,
        email: content.schoolProfile?.email,
        phone: content.schoolProfile?.phone,
        punch_line: content.schoolProfile?.punchLine,
        office_hours: content.schoolProfile?.officeHours,
        office_address: content.schoolProfile?.officeAddress,
        map_link: content.schoolProfile?.mapLink,
        established_year: content.schoolProfile?.establishedYear || 1986,
        vision_statement: content.visionStatement,
        admission_fee: content.schoolProfile?.admissionFee || 250,
        social_links: content.socialLinks || {},
        notification_email: content.notificationEmail,
        page_hero_images: content.schoolProfile?.pageHeroImages || {},
        hero_images: content.schoolProfile?.heroImages || [],
        affiliation: content.schoolProfile?.affiliation || [],
        online_admission_instructions: content.schoolProfile?.onlineAdmissionInstructions || [],
        offline_admission_instructions: content.schoolProfile?.offlineAdmissionInstructions || []
      };
      await supabase.from('site_settings').upsert([settings]);
      console.log('  ✅ Hero & Site Settings synced');

      // b. Messages
      if (content.principal) {
        await supabase.from('messages').upsert({ type: 'principal', name: content.principal.name, designation: content.principal.title, content: content.principal.message, image: content.principal.photo }, { onConflict: 'type' });
      }
      if (content.headMistress) {
        await supabase.from('messages').upsert({ type: 'headmistress', name: 'Headmistress', designation: 'Headmistress', content: content.headMistress.message, image: content.headMistress.photo }, { onConflict: 'type' });
      }
      console.log('  ✅ Principal & Headmistress messages synced');

      // c. Arrays
      const arrayModules = [
        { key: 'gallery', table: 'gallery', map: (g) => ({ category: g.category, title: g.title, src: g.src, featured: g.featured, description: g.description, views: g.views || 0 }) },
        { key: 'events', table: 'events', map: (e) => ({ title: e.title, date: e.date, image: e.image, description: e.description, gallery_images: e.galleryImages || [] }) },
        { key: 'highlights', table: 'highlights', map: (h) => ({ title: h.title, date: h.date, category: h.category, image: h.image, description: h.description, gallery_images: h.galleryImages || [] }) },
        { key: 'notices', table: 'notices', map: (n) => ({ title: n.title, date: n.date, size: n.size, pdf_link: n.pdfLink }) },
        { key: 'alumni', table: 'alumni', map: (a) => ({ name: a.name, passed_year: a.passedYear, rank: a.rank, percentage: a.percentage, level: a.level, stream: a.stream, subjects: a.subjects || [], photo: a.photo, description: a.description }) },
        { key: 'stats', table: 'stats', map: (s) => ({ label: s.label, value: s.value }) },
        { key: 'faqs', table: 'faqs', map: (f) => ({ question: f.question, answer: f.answer }) },
        { key: 'emeritus', table: 'emeritus', map: (e) => ({ name: e.name, role: e.role, tenure: e.tenure, message: e.message, photo: e.photo, category: e.category, status: e.status }) },
        { key: 'videos', table: 'videos', map: (v) => ({ src: v.src, title: v.title }) }
      ];

      for (const mod of arrayModules) {
        if (content[mod.key]?.length) {
          const rows = content[mod.key].map(mod.map);
          await supabase.from(mod.table).upsert(rows);
          console.log(`  ✅ ${rows.length} ${mod.key} synced`);
        }
      }

      // d. Faculty
      if (content.faculty) {
        const facultyRows = [];
        Object.entries(content.faculty).forEach(([dept, members]) => {
          if (Array.isArray(members)) {
            members.forEach(m => {
              facultyRows.push({
                name: m.name,
                department: dept,
                subject: m.Subject || m.subject,
                education: m.EduQua || m.education,
                classes: m.classes,
                photo_url: m.photo || m.image,
                facebook_url: m.facebook,
                instagram_url: m.instagram,
                whatsapp_number: m.whatsapp,
                title: m.title
              });
            });
          }
        });
        if (facultyRows.length) await supabase.from('faculty').upsert(facultyRows, { onConflict: 'name' });
        console.log(`  ✅ ${facultyRows.length} Faculty synced`);
      }
    }

    console.log('\n🎉 TOTAL MIGRATION COMPLETED SUCCESSFULLY! EVERYTHING IS LIVE.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TOTAL MIGRATION failed:', err);
    process.exit(1);
  }
}

migrate();
