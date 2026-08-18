require('dotenv').config();
const supabase = require('./config/supabase');

async function testInsert() {
  const updateData = {
    first_name: 'NARAYAN',
    last_name: 'PHUKAN',
    email: 'forgameonly156@gmail.com',
    phone: '07002592209',
    name: 'NARAYAN PHUKAN',
    role: 'principal',
    school_id: 'c8088edc-49de-493d-b452-f4728d8ed2a0', // A dummy UUID that might fail if foreign key, but let's test constraints
    is_approved: true,
    password: 'dummy'
  };
  
  // Actually, I can just do a select to see if the user exists or not. Or I can check the exact error message that occurs.
  // Wait, let's just do a dry run inserting with a valid school_id.
  const { data: schools } = await supabase.from('schools').select('id').limit(1);
  if(schools && schools.length > 0) {
    updateData.school_id = schools[0].id;
    const { data, error } = await supabase.from('admins').insert(updateData);
    console.log("INSERT RESULT:", error || data);
  } else {
    console.log("No schools found.");
  }
}
testInsert();
