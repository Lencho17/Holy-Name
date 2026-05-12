require('dotenv').config();
async function test() {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': process.env.SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.definitions.admissions.properties, null, 2));
}
test();
