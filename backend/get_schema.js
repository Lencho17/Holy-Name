require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getSchema() {
  const { data, error } = await supabase.rpc('get_column_info', { table_name: 'admissions' });
  if (error) {
    // If RPC doesn't exist, try querying information_schema directly via a raw query if possible
    // But since we can't do raw SQL easily without an RPC, let's try to inspect a record's structure again
    console.log("RPC Error:", error.message);
    const { data: records } = await supabase.from('admissions').select('*').limit(1);
    console.log("COLUMNS:", Object.keys(records[0] || {}));
  } else {
    console.log("SCHEMA:", data);
  }
}
getSchema();
