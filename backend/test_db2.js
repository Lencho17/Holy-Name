require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const payload = {
    reference_number: "TEST-REAL-1",
    student_name: "AD",
    date_of_birth: "2017-11-21",
    place_of_birth: "DULIAJAN",
    gender: "MALE",
    religion: "HINDU",
    blood_group: "A+",
    caste: "GENERAL",
    previous_school: "XYZ SCHOOL",
    prev_marks_obtained: "500",
    last_attended_exam: "HSLC",
    prev_percentage: "85",
    father_name: "FATHER",
    father_occupation: "BUSINESS",
    mother_name: "MOTHER",
    mother_occupation: "HOUSEWIFE",
    contact_number: "1234567890",
    email: "test@example.com",
    address: "TEST ADDRESS",
    po: "TEST PO",
    ps: "TEST PS",
    pincode: "786602",
    aadhar_number: "231275881882",
    pen_number: "12345678901",
    grade_applied: "CLASS11",
    stream: "SCIENCE",
    selected_subjects: ["PHYSICS", "CHEMISTRY", "BIOLOGY", "MATHEMATICS"],
    darpan_id: "1234567",
    board_marks: "500",
    board_percentage: "85",
    ncc_interest: true,
    sports_active: false,
    status: "pending"
  };
  const { data, error } = await supabase.from('admissions').insert(payload).select().single();
  console.log("ERROR:", error);
}
test();
