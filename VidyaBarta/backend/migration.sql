-- Holy Name School - Career Page Database Migration SQL
-- Run these statements in your Supabase project SQL Editor:

-- 1. Add career_page JSONB column to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS career_page JSONB DEFAULT '{"eligibility": [], "qualification": [], "documents": [], "offline_process": [], "online_process": []}'::jsonb;

-- 2. Add extra fields to job_applications table to support online/offline flows and status tracking
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS application_type TEXT DEFAULT 'online',
ADD COLUMN IF NOT EXISTS parents_name TEXT,
ADD COLUMN IF NOT EXISTS mother_tongue TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS post_office TEXT,
ADD COLUMN IF NOT EXISTS police_station TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS interview_date TEXT,
ADD COLUMN IF NOT EXISTS interview_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS interview_result_date TEXT,
ADD COLUMN IF NOT EXISTS admin_message TEXT,
ADD COLUMN IF NOT EXISTS preliminary_appointment_letter JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS aadhar_doc TEXT,
ADD COLUMN IF NOT EXISTS employment_exchange_cert TEXT,
ADD COLUMN IF NOT EXISTS other_doc TEXT;
