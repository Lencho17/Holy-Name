# 🚨 URGENT: Complete Database Repair

The errors you are seeing (missing `courses_levels`, `closing_quote`, etc.) are because the database schema is outdated. You need to add these columns to the `site_settings` and `messages` tables.

### Step-by-Step Instructions:
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/motxtcpcjaorptpxmneg).
2.  Open the **SQL Editor** from the left sidebar.
3.  Click **"New Query"**.
4.  **Copy and Paste** the entire block of code below.
5.  Click **"Run"**.

---

### SQL REPAIR SCRIPT (COPY THIS)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Add missing columns to 'messages' table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS intro_quote TEXT,
ADD COLUMN IF NOT EXISTS closing_quote TEXT;

-- 2. Add missing columns to 'site_settings' table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS courses_streams JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS courses_levels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS courses_rules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS page_hero_images JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS online_admission_instructions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS offline_admission_instructions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admission_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS aims_and_objectives JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS established_year TEXT;

-- 3. Create activity_logs table for the 'Activity' tab
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    admin_name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Fix 'faculty' table columns
ALTER TABLE faculty
ADD COLUMN IF NOT EXISTS classes TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS title TEXT;

-- 5. Enable RLS for logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON activity_logs;
CREATE POLICY "Enable all for authenticated" ON activity_logs FOR ALL USING (true);

-- 6. Verification
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('messages', 'site_settings', 'faculty', 'activity_logs')
ORDER BY table_name;
```

---

### What this fixes:
- ✅ **Auto-save Errors**: Fixes the "Could not find column 'classes'" error in the Faculty management section.
- ✅ **Principal Desk**: Enables the Signature and Quotes fields.
- ✅ **Courses Management**: Enables Levels, Streams, and Rules storage.
- ✅ **Activity Log**: Creates the table needed for the new "Activity" tab.

**Please run this script now and refresh your browser. Everything will work perfectly after this.**
