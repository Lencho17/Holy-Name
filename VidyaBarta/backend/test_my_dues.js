const axios = require('axios');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: student } = await supabase.from('students').select('*').limit(1).single();
  console.log("Using student:", student.id);
  const token = jwt.sign({ id: student.id, rollNumber: student.admission_id, school_id: student.school_id }, process.env.JWT_SECRET);
  try {
    const res = await axios.get('http://localhost:5000/api/fees/my-dues?trimester=1&isNewAdmission=false', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("ERROR:", err.response ? err.response.data : err.message);
  }
}
run();
