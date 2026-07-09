const postgres = require('postgres');
require('dotenv').config({ path: './.env' });

async function fixSchema() {
  const sql = postgres('postgres://postgres:Lencho@db.motxtcpcjaorptpxmneg.supabase.co:5432/postgres');
  
  try {
    console.log('Adding columns to inquiries table...');
    await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE`;
    console.log('✅ Columns added successfully!');
  } catch (error) {
    console.error('❌ Failed to add columns:', error.message);
  } finally {
    await sql.end();
  }
}

fixSchema();
