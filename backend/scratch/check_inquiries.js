require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');

async function checkInquiries() {
  const { data, error } = await supabase.from('inquiries').select('id, tracking_number, subject');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Inquiries:', JSON.stringify(data, null, 2));
}

checkInquiries();
