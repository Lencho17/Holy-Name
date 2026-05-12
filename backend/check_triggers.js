require('dotenv').config();
const supabase = require('./config/supabase');
async function test() {
  const { data, error } = await supabase.rpc('get_triggers');
  console.log(error);
}
test();
