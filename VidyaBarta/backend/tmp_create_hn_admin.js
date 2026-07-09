require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const { data, error } = await supabase
    .from('admins')
    .insert({
      name: 'Holy Name Admin',
      email: 'admin@holynameschool.edu',
      phone: '1234567890',
      password: hashedPassword,
      role: 'admin',
      is_approved: true,
      school_id: 'b0fbd2ff-17c1-4b04-8a0d-0167cce6020a'
    })
    .select();
    
  if (error) {
    console.error(error);
  } else {
    console.log('Created Admin:', data);
  }
}

createAdmin();
