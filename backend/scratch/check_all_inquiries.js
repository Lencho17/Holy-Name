require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');

async function checkAllInquiries() {
  const { data, error } = await supabase.from('inquiries').select('id, tracking_number, subject');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total inquiries:', data.length);
  data.forEach(i => {
    console.log(`ID: ${i.id}, Tracking: ${i.tracking_number}, Subject: ${i.subject}`);
  });
}

checkAllInquiries();
