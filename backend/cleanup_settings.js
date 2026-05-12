const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  console.log('🧹 Cleaning up site_settings duplicates...');
  
  const { data, error } = await supabase.from('site_settings').select('id, updated_at').order('updated_at', { ascending: false });
  
  if (error) {
    console.error('❌ Fetch failed:', error.message);
    return;
  }

  if (data.length <= 1) {
    console.log('✅ Only one row found. No cleanup needed.');
    return;
  }

  const keepId = data[0].id;
  const deleteIds = data.slice(1).map(row => row.id);

  console.log(`Keeping: ${keepId} (Latest: ${data[0].updated_at})`);
  console.log(`Deleting ${deleteIds.length} old rows...`);

  const { error: dErr } = await supabase.from('site_settings').delete().in('id', deleteIds);
  
  if (dErr) {
    console.error('❌ Delete failed:', dErr.message);
  } else {
    console.log('✅ Cleanup successful.');
  }
}

cleanup();
