const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTimesheetsTable() {
  console.log("Setting up vidyabarta_employee_timesheets table...");

  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS vidyabarta_employee_timesheets (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        employee_id UUID REFERENCES vidyabarta_employees(id) ON DELETE CASCADE,
        clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        clock_out TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status VARCHAR(20) DEFAULT 'online', -- online, offline
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Add index for fast lookups by employee
      CREATE INDEX IF NOT EXISTS idx_employee_timesheets_employee_id ON vidyabarta_employee_timesheets(employee_id);
      CREATE INDEX IF NOT EXISTS idx_employee_timesheets_status ON vidyabarta_employee_timesheets(status);
    `
  });

  if (error) {
    // If 'execute_sql' RPC is not available, try doing it via standard API (which can't create tables easily without admin/service role and REST API)
    // Supabase JS client doesn't support executing arbitrary DDL directly unless using an RPC.
    console.error("Error creating table via RPC:", error.message);
    console.log("Please create the table manually in the Supabase SQL editor using the following SQL:");
    console.log(`
      CREATE TABLE IF NOT EXISTS vidyabarta_employee_timesheets (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        employee_id UUID REFERENCES vidyabarta_employees(id) ON DELETE CASCADE,
        clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        clock_out TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status VARCHAR(20) DEFAULT 'online',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } else {
    console.log("Table vidyabarta_employee_timesheets created successfully!");
  }
}

setupTimesheetsTable();
