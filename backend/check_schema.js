const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSiteSettings() {
  console.log('🔍 Checking site_settings schema...');
  const { data, error } = await supabase.from('site_settings').select('*').limit(1);
  if (error) {
    console.error('❌ Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('✅ Current columns in site_settings:', Object.keys(data[0]));
  } else {
    console.log('⚠️ site_settings is empty, cannot detect columns via select.');
  }
}

checkSiteSettings();
