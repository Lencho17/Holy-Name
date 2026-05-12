require('dotenv').config({ path: './.env' });
const supabase = require('../config/supabase');

async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (error) {
    console.log('RPC exec_sql does not exist:', error.message);
  } else {
    console.log('RPC exec_sql EXISTS!');
  }
}

testRpc();
