// Run this script once to add the admission_fee_paid column to the students table
// Usage: node add_admission_fee_column.js

require('dotenv').config();
const supabase = require('./config/supabase');

async function migrate() {
  console.log('Adding admission_fee_paid column to students table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_fee_paid BOOLEAN DEFAULT FALSE;`
  });

  if (error) {
    // Try direct SQL if RPC isn't available
    console.log('RPC not available, trying direct query...');
    const { error: error2 } = await supabase
      .from('students')
      .select('admission_fee_paid')
      .limit(1);
    
    if (error2 && error2.message.includes('admission_fee_paid')) {
      console.error('Column does not exist. Please run the following SQL in Supabase Dashboard:');
      console.log('\n  ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_fee_paid BOOLEAN DEFAULT FALSE;\n');
    } else {
      console.log('Column admission_fee_paid already exists or was added successfully.');
    }
  } else {
    console.log('Migration complete!');
  }
  
  process.exit(0);
}

migrate();
