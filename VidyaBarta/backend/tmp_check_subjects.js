const supabase = require('./config/supabase');
async function test() {
  const { data, error } = await supabase
      .from('school_subjects')
      .select('subjects(name)')
      .eq('class_level', 'IV');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data));
}
test();
