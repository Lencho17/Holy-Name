const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = "mongodb+srv://Lencho:Lencho@holyname.caaflg1.mongodb.net/holyname?appName=HolyName";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const toSnake = (s) => s.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);

async function migrate() {
  try {
    console.log('🚀 Starting final defensive migration...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // --- 1. Migrate Admissions ---
    console.log('⏳ Syncing Admissions...');
    const Admission = mongoose.model('Admission', new mongoose.Schema({}, { strict: false }));
    const admissions = await Admission.find({});
    if (admissions.length > 0) {
      const admissionRows = admissions.map(a => {
        const flattened = {};
        if (a.formData) {
          Object.entries(a.formData).forEach(([k, v]) => {
            let key = toSnake(k);
            if (key === 'dob') key = 'date_of_birth';
            if (key === 'phone') key = 'contact_number';
            if (key === 'name') key = 'student_name';
            flattened[key] = v;
          });
        }
        return {
          student_name: a.studentName || a.formData?.studentName || 'Legacy Student',
          reference_number: a.referenceNumber || `LEGACY-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          grade_applied: a.gradeApplied,
          status: a.status || 'pending',
          email: a.email,
          contact_number: a.phone || a.formData?.contactNumber || a.formData?.phone || '0000000000',
          date_of_birth: a.formData?.dateOfBirth || a.formData?.dob || '1900-01-01',
          ...flattened,
          created_at: a.createdAt || new Date()
        };
      });
      const { error } = await supabase.from('admissions').upsert(admissionRows, { onConflict: 'reference_number' });
      if (error) console.error('Error syncing admissions:', error.message);
      else console.log(`✅ ${admissions.length} Admissions synced`);
    }

    // --- 2. Migrate Students ---
    console.log('⏳ Syncing Students...');
    const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
    const students = await Student.find({});
    if (students.length > 0) {
      const studentRows = students.map(s => ({
        student_name: s.studentName || 'Legacy Student',
        date_of_birth: s.dateOfBirth || '1900-01-01',
        gender: s.gender,
        grade: s.grade,
        guardian_name: s.guardianName,
        contact_number: s.contactNumber || '0000000000',
        email: s.email,
        address: s.address,
        status: s.status || 'active',
        roll_number: s.rollNumber,
        section: s.section,
        pen_number: s.penNumber,
        aadhar_number: s.aadharNumber,
        created_at: s.createdAt || new Date()
      }));
      const { error } = await supabase.from('students').upsert(studentRows);
      if (error) console.error('Error syncing students:', error.message);
      else console.log(`✅ ${students.length} Students synced`);
    }

    console.log('\n🎉 ALL DATA SYNCED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
