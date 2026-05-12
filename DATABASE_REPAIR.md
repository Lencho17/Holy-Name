# 🚨 URGENT: Database Repair Required

The error you are seeing (**"Could not find the 'closing_quote' column"**) is because your database is missing several columns that the new features require.

To fix the **Auto-save errors**, the **Principal Signature**, and the **Intro/Closing quotes**, you **MUST** run the following SQL script in your Supabase Dashboard.

### Step-by-Step Instructions:
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/motxtcpcjaorptpxmneg).
2.  Open the **SQL Editor** from the left sidebar.
3.  Click **"New Query"**.
4.  **Copy and Paste** the entire block of code below.
5.  Click **"Run"**.

---

### SQL REPAIR SCRIPT
```sql
-- 1. Add missing columns to 'messages' table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS intro_quote TEXT,
ADD COLUMN IF NOT EXISTS closing_quote TEXT;

-- 2. Create activity_logs table for the 'Activity' tab
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

-- 3. Enable RLS and public access (if needed for development)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON activity_logs FOR ALL USING (true);

-- 4. Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';
```

---

### What this fixes:
- ✅ **Auto-save Errors**: Fixes the "Could not find column" error.
- ✅ **Principal Desk**: Enables the Signature and Quotes fields.
- ✅ **Activity Log**: Creates the table needed for the new "Activity" tab.

**Please run this script now and refresh your browser. Everything should start working immediately after.**
