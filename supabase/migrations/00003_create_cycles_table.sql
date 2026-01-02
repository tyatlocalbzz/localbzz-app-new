-- Migration: Create cycles table

-- Create custom type
CREATE TYPE cycle_status AS ENUM ('planning', 'active', 'completed');

-- Create cycles table
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  status cycle_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_cycles_updated_at
  BEFORE UPDATE ON cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Unique constraint: one cycle per client per month
CREATE UNIQUE INDEX idx_cycles_client_month ON cycles(client_id, month);

-- Enforce first of month constraint
ALTER TABLE cycles ADD CONSTRAINT cycles_month_first_of_month
  CHECK (EXTRACT(DAY FROM month) = 1);

-- Create indexes
CREATE INDEX idx_cycles_client_id ON cycles(client_id);
CREATE INDEX idx_cycles_month ON cycles(month);
CREATE INDEX idx_cycles_status ON cycles(status);
