const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function audit() {
  console.log('📊 Database Audit...');
  const tables = ['admins', 'appointments', 'inquiries', 'job_applications', 'tender_applications', 'students', 'jobs', 'tenders', 'admissions', 'notices', 'gallery', 'events', 'highlights', 'faculty', 'alumni', 'stats', 'faqs', 'messages', 'site_settings'];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table ${t}: ${error.message}`);
    } else {
      console.log(`✅ Table ${t}: ${count} rows`);
    }
  }
}

audit();
