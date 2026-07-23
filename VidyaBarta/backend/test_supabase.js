const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: studentData } = await supabase.from('students').select('*').limit(1).single();
  const { data, error } = await supabase
      .from('students')
      .select('*, schools!inner(id, platform_fee, transaction_fee)')
      .eq('id', studentData.id)
      .single();
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
