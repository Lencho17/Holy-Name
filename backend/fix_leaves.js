const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function fixLeaves() {
  const { data: staff, error: staffError } = await supabase.from('staff').select('id');
  
  for (const person of staff) {
    const { data: leaves } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('staff_id', person.id)
      .eq('status', 'Approved')
      .eq('leave_type', 'CL');
      
    let used = leaves.length; // 1 application = 1 CL
    
    await supabase.from('staff').update({ used_cl: used }).eq('id', person.id);
  }
  
  console.log("Done fixing leaves!");
}

fixLeaves();
