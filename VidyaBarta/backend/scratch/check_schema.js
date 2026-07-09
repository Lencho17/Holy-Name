require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'inquiries' });
  if (error) {
    // If RPC doesn't exist, try another way
    const { data: cols, error: colError } = await supabase.from('inquiries').select('*').limit(1);
    if (colError) {
      console.error('Error:', colError);
      return;
    }
    console.log('Columns:', Object.keys(cols[0]));
  } else {
    console.log('Schema:', data);
  }
}

checkSchema();
