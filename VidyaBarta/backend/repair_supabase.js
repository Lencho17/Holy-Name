const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function repair() {
  console.log('🚀 Starting Supabase repair...');

  const principalData = {
    type: 'principal',
    name: "Fr. Hemanta Pegu",
    designation: "Principal",
    content: "Holy Name HS School, Cherekapar Sivasagar, has always aimed at the all-round development of its students. Our goal is to nurture intellectual, physical, spiritual, and emotional growth, preparing students to be responsible global citizens.",
    intro_quote: "Flowers leave part of their fragrance in the hand that bestows them",
    closing_quote: "Aristotle once said, \"Educating the mind without educating the heart is no education at all.\"",
    signature: "/Pictures/assets/principal_signature.png"
  };

  const headMistressData = {
    type: 'headmistress',
    name: "A warm welcome to Holy Name School",
    designation: "Headmistress",
    content: "On behalf of the Management and staff, I extend a loving welcome to you to the new academic year. Holy Name HS School has always aimed at the all-round development of its students.",
    signature: "/Pictures/assets/head_mistress_signature.png"
  };

  console.log('⏳ Restoring Principal & Headmistress messages...');
  
  // Try to update with all fields (may fail if columns don't exist yet)
  try {
    const { error: pErr } = await supabase.from('messages').upsert(principalData, { onConflict: 'type' });
    if (pErr) console.warn('Principal upsert warning (maybe columns missing):', pErr.message);
    else console.log('✅ Principal restored.');

    const { error: hErr } = await supabase.from('messages').upsert(headMistressData, { onConflict: 'type' });
    if (hErr) console.warn('Headmistress upsert warning:', hErr.message);
    else console.log('✅ Headmistress restored.');
  } catch (err) {
    console.error('Upsert failed:', err.message);
  }

  console.log('🏁 Repair script finished.');
}

repair();
