-- Migration for SBI ePay Invoices and Payments

CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- We can use the existing transactions table, but let's add specific columns for SBI ePay if they don't exist
-- For example, order_id for tracking before transaction completes

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS sbi_response JSONB;
