require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
  const cleanDomain = 'vidyabarta.com';
  const wwwDomain = 'www.vidyabarta.com';
  const { data: school, error } = await supabase
    .from('schools')
    .select('logo_url')
    .or(`subdomain.eq.${cleanDomain},custom_domain.eq.${cleanDomain},custom_domain.eq.${wwwDomain}`)
    .single();
  
  console.log('Error:', error);
  console.log('School logo:', school?.logo_url);
}
test();
