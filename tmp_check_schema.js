const supabase = require('./backend/config/supabase');

async function checkSchema() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching students:', error);
  } else {
    console.log('Successfully fetched students.');
    if (data && data.length > 0) {
      console.log('Columns in students table:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, but query succeeded. We cannot infer columns without rows easily using just select * limit 1 if empty.');
      
      // Attempt an insert that we expect to fail to see the error
      const { error: insertError } = await supabase.from('students').insert({ test: 'test' });
      console.log('Insert error:', insertError);
    }
  }
}

checkSchema();
