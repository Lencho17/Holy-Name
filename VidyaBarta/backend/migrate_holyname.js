require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log('Starting migration for Holy Name...');

  // 1. Insert into schools
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .insert({
      name: 'Holy Name High School',
      subdomain: 'holyname.vidyabarta.in',
      custom_domain: 'holynamehsschool.in',
      package: 'Premium',
      status: 'Active'
    })
    .select('id')
    .single();

  if (schoolErr) {
    console.error('Error creating school:', schoolErr.message);
    return;
  }

  const schoolId = school.id;
  console.log('Created school with ID:', schoolId);

  // 2. Update content tables
  const tables = [
    'site_settings',
    'notices',
    'gallery',
    'events',
    'highlights',
    'faculty',
    'alumni',
    'stats',
    'faqs',
    'courses',
    'messages',
    'emeritus',
    'center_of_excellence'
  ];

  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .update({ school_id: schoolId })
      .is('school_id', null);
    
    if (error) {
      console.error(`Error updating ${table}:`, error.message);
    } else {
      console.log(`Updated ${table} to point to new school_id.`);
    }
  }
  
  console.log('Migration complete!');
}

migrate();
