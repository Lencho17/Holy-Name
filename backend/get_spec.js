require('dotenv').config();
async function test() {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_ANON_KEY}`, {
    headers: { 'Accept': 'application/openapi+json' }
  });
  const data = await res.json();
  console.log("KEYS:", Object.keys(data));
  console.log("COMPONENTS:", Object.keys(data.components.schemas));
  const req = data.components.schemas.admissions.required;
  console.log("REQUIRED:", req);
}
test();
