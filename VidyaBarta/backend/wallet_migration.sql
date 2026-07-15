-- Wallet System Migration SQL
-- Run in Supabase SQL Editor

-- 1. school_wallets - holds each school's escrow balance
CREATE TABLE IF NOT EXISTS school_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(12,2) DEFAULT 0 CHECK (balance >= 0),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. payout_requests - tracks cash-out requests from school admins
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Processed')),
  admin_note TEXT,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. wallet_ledger - full audit trail of wallet credits and debits
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(12,2) NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('fee_payment', 'payout', 'manual_adjustment')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_school_id ON wallet_ledger(school_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_school_id ON payout_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_school_wallets_school_id ON school_wallets(school_id);
