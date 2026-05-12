require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const { data, error } = await supabase.from('admissions').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0] || {}));
}
test();
