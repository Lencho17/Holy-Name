const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('🔍 Checking site_settings schema...');
  const { data: sData, error: sErr } = await supabase.from('site_settings').select('*').limit(1);
  if (sErr) console.error('❌ site_settings error:', sErr.message);
  else if (sData && sData.length > 0) console.log('✅ Current columns in site_settings:', Object.keys(sData[0]));

  console.log('\n🔍 Checking job_applications columns from database metadata...');
  const { data: cols, error: cErr } = await supabase.rpc('get_table_columns', { table_name_param: 'job_applications' });
  if (cErr) {
    // If RPC doesn't exist, try running raw query or use standard select on empty table if it has default data, or just check information_schema
    const { data: cols2, error: cErr2 } = await supabase.from('job_applications').select('*').limit(0);
    if (cErr2) console.error('❌ job_applications column error:', cErr2.message);
    else console.log('✅ Columns in job_applications:', cErr2 ? 'Error' : 'Detected via select limit 0');
  } else {
    console.log('✅ Columns:', cols);
  }
}

checkSchema();
