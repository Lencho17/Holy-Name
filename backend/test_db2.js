require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const payload = {
    reference_number: "TEST-1234567",
    student_name: "AD",
    date_of_birth: "2017-11-21",
    gender: "MALE",
    grade_applied: "Class 1",
    contact_number: "1234567890",
    email: "test@example.com",
    address: "test",
    selected_subjects: "PHYSICS"
  };
  const { data, error } = await supabase.from('admissions').insert(payload).select().single();
  console.log("ERROR:", error);
}
test();
