require('dotenv').config();
const supabase = require('./backend/config/supabase');

async function testQuery() {
  const email = 'narayanphukan30@gmail.com';
  
  // Test simple query
  const { data: d1, error: e1 } = await supabase
    .from('students')
    .select('*')
    .ilike('email', email);
    
  console.log('Simple ilike email query:', d1 ? d1.length : 0, e1);

  // Test the .or query with quotes
  const { data: d2, error: e2 } = await supabase
    .from('students')
    .select('*')
    .or(`email.ilike."${email}",admission_id.eq."${email}"`);
    
  console.log('.or query with quotes:', d2 ? d2.length : 0, e2);

  // Test the .or query without quotes
  const { data: d3, error: e3 } = await supabase
    .from('students')
    .select('*')
    .or(`email.ilike.${email},admission_id.eq.${email}`);
    
  console.log('.or query without quotes:', d3 ? d3.length : 0, e3);
  
  if (d1 && d1.length > 0) {
    console.log('Student details:', d1[0].email, d1[0].school_id, d1[0].date_of_birth, d1[0].password ? 'Has password' : 'No password');
  }
}

testQuery();
