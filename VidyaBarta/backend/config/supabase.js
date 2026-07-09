const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Service Role Key for backend if available to bypass RLS
const useKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !useKey) {
  console.warn('Supabase credentials missing. Storage and Database will not work.');
}

const supabase = createClient(supabaseUrl, useKey);

module.exports = supabase;
