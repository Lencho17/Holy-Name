const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnostic() {
  console.log('🔍 Running Database Diagnostic...');

  // 1. Check Events table
  const { data: events, error: eErr } = await supabase.from('events').select('*').limit(1);
  if (eErr) {
    console.error('❌ Events table error:', eErr.message);
  } else {
    console.log('✅ Events table accessible.');
    if (events && events.length > 0) {
      console.log('Sample Event ID type:', typeof events[0].id, 'Value:', events[0].id);
    }
  }

  // 2. Check Messages table columns
  const { data: msg, error: mErr } = await supabase.from('messages').select('*').limit(1);
  if (mErr) {
    console.error('❌ Messages table error:', mErr.message);
  } else {
    console.log('✅ Messages table accessible.');
    if (msg && msg.length > 0) {
      console.log('Available columns in messages:', Object.keys(msg[0]));
    }
  }

  // 3. Test Deletion logic
  console.log('🧪 Testing deletion logic with neq(id, 0)...');
  const { error: dErr } = await supabase.from('events').delete().neq('id', 0);
  if (dErr) {
    console.warn('⚠️ neq(id, 0) failed:', dErr.message);
    
    console.log('🧪 Testing deletion logic with neq(id, "00000000-0000-0000-0000-000000000000")...');
    const { error: dErr2 } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (dErr2) {
      console.error('❌ Both deletion filters failed:', dErr2.message);
    } else {
      console.log('✅ UUID neq filter worked.');
    }
  } else {
    console.log('✅ Integer neq filter worked.');
  }

  console.log('🏁 Diagnostic finished.');
}

diagnostic();
