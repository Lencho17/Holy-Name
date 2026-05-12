require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const payload = {
    reference_number: "TEST-UNIQUE-5",
    student_name: "AD",
    date_of_birth: "2017-11-21",
    gender: "MALE",
    grade_applied: "Class 1",
    contact_number: "1234567890",
    email: "test@example.com",
    address: "test",
    aadhar_number: "DUPLICATE_AADHAAR",
    pen_number: "DUPLICATE_PEN",
    darpan_id: "DUPLICATE_DARPAN"
  };
  await supabase.from('admissions').insert(payload);
  
  const payload2 = {
    ...payload,
    reference_number: "TEST-UNIQUE-6"
  };
  const { data, error } = await supabase.from('admissions').insert(payload2).select().single();
  console.log("ERROR:", error);
}
test();
