require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const { data, error } = await supabase.from('schools').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
test();
