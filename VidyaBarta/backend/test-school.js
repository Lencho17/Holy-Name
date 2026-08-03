require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
  const cleanDomain = 'holynamehsschool.in';
  const wwwDomain = 'www.holynamehsschool.in';
  const { data: school, error } = await supabase
    .from('schools')
    .select('logo')
    .or(`subdomain.eq.${cleanDomain},custom_domain.eq.${cleanDomain},custom_domain.eq.${wwwDomain}`)
    .single();
  
  console.log('Error:', error);
  console.log('School logo:', school?.logo);
}
test();
