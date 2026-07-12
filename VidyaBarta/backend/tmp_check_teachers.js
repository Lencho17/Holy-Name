require('dotenv').config();
const supabase = require('./config/supabase');

async function checkTables() {
  console.log("Checking staff table...");
  const { data: staff, error: staffErr } = await supabase.from('staff').select('*').limit(1);
  console.log("Staff error:", staffErr ? staffErr.message : "None", "Count:", staff ? staff.length : 0);

  console.log("Checking teachers table...");
  const { data: teachers, error: tErr } = await supabase.from('teachers').select('*').limit(1);
  console.log("Teachers error:", tErr ? tErr.message : "None", "Count:", teachers ? teachers.length : 0);
}

checkTables();
