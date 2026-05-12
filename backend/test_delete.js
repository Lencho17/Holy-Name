const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDelete() {
  console.log('🗑️ Testing global delete on events...');
  
  // 1. Get count before
  const { count: before, error: cErr } = await supabase.from('events').select('*', { count: 'exact', head: true });
  console.log('Count before:', before);

  // 2. Perform delete
  const { error: dErr } = await supabase.from('events').delete().not('id', 'is', null);
  if (dErr) {
    console.error('❌ Delete failed:', dErr.message);
  } else {
    console.log('✅ Delete returned success.');
  }

  // 3. Get count after
  const { count: after, error: cErr2 } = await supabase.from('events').select('*', { count: 'exact', head: true });
  console.log('Count after:', after);

  if (before > 0 && after === before) {
    console.warn('⚠️ Delete successful but count remains the same! (RLS or Silent Failure)');
  }

  console.log('🏁 Test finished.');
}

testDelete();
