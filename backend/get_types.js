require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const { data, error } = await supabase.rpc('get_schema_types');
  // alternative hack
  const { data: cols, error: err2 } = await supabase.from('admissions').select('*').limit(1);
  if (cols) {
    for (const key in cols[0]) {
      console.log(key, typeof cols[0][key], cols[0][key]);
    }
  }
}
test();
