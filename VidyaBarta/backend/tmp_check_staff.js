require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data } = await supabase.from('staff').select('*').eq('school_id', 'b0fbd2ff-17c1-4b04-8a0d-0167cce6020a');
  console.log(data);
}
check();
