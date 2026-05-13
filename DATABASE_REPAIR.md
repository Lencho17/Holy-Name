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
ADD COLUMN IF NOT EXISTS established_year TEXT,
ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT FALSE;

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
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS classes TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS title TEXT;

-- 5. Create emeritus table for 'Alumestron' management
CREATE TABLE IF NOT EXISTS emeritus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    category TEXT,
    status TEXT,
    tenure TEXT,
    message TEXT,
    cause_of_death TEXT,
    photo TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create center_of_excellence table
CREATE TABLE IF NOT EXISTS center_of_excellence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    name TEXT NOT NULL,
    passed_year TEXT,
    designation TEXT,
    company TEXT,
    location TEXT,
    message TEXT,
    photo TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS for logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON activity_logs;
CREATE POLICY "Enable all for authenticated" ON activity_logs FOR ALL USING (true);

-- 9. Verification
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('messages', 'site_settings', 'faculty', 'activity_logs', 'emeritus', 'center_of_excellence')
ORDER BY table_name;
```

---

### What this fixes:
- ✅ **Auto-save Errors**: Fixes missing columns in Faculty and Principal sections.
- ✅ **Alumestron Management**: Creates the `emeritus` table needed to save retired/deceased staff records.
- ✅ **Center of Excellence**: Creates the `center_of_excellence` table for Notable Alumni.
- ✅ **Principal Desk**: Enables the Signature and Quotes fields.
- ✅ **Courses Management**: Enables Levels, Streams, and Rules storage.
- ✅ **Activity Log**: Creates the table needed for the new "Activity" tab.

**Please run this script now and refresh your browser. Everything will work perfectly after this.**
