require('dotenv').config();
const supabase = require('../config/supabase');

async function testSupabase() {
  console.log('--- Supabase Connection Test ---');
  console.log('URL:', process.env.SUPABASE_URL);
  
  try {
    // 1. Test basic connection by listing tables (or a simple query)
    console.log('\n1. Testing query on "admins" table...');
    const { data: admins, error: pError } = await supabase
      .from('admins')
      .select('*')
      .limit(1);

    if (pError) {
      console.error('❌ Admins query failed:', pError.message);
      if (pError.message.includes('relation "public.admins" does not exist')) {
        console.log('💡 Tip: Make sure you have run the SQL schema from implementation_plan.md in your Supabase SQL Editor.');
      }
    } else {
      console.log('✅ Admins query successful (found ' + (admins?.length || 0) + ' records)');
    }

    // 2. Test Site Settings
    console.log('\n2. Testing query on "site_settings" table...');
    const { data: settings, error: sError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);

    if (sError) {
      console.error('❌ Site settings query failed:', sError.message);
    } else {
      console.log('✅ Site settings query successful');
    }

    // 3. Test Storage
    console.log('\n3. Testing Storage Bucket...');
    const { data: buckets, error: bError } = await supabase
      .storage
      .listBuckets();

    if (bError) {
      console.error('❌ Bucket listing failed:', bError.message);
    } else {
      const bucketName = process.env.SUPABASE_BUCKET || 'holy-name';
      const exists = buckets.find(b => b.name === bucketName);
      if (exists) {
        console.log(`✅ Bucket "${bucketName}" exists.`);
      } else {
        console.warn(`⚠️ Bucket "${bucketName}" not found in listing.`);
        console.log('Available buckets:', buckets.map(b => b.name).join(', '));
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error during test:', err.message);
  }
}

testSupabase();
