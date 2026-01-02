-- Migration: Create shoots table

-- Create custom types
CREATE TYPE shoot_type AS ENUM ('monthly', 'adhoc');
CREATE TYPE shoot_status AS ENUM ('planned', 'shot', 'edited', 'delivered');

-- Create shoots table
CREATE TABLE shoots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  shoot_date DATE NOT NULL,
  type shoot_type NOT NULL DEFAULT 'monthly',
  status shoot_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shoots ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_shoots_updated_at
  BEFORE UPDATE ON shoots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_shoots_client_id ON shoots(client_id);
CREATE INDEX idx_shoots_cycle_id ON shoots(cycle_id);
CREATE INDEX idx_shoots_shoot_date ON shoots(shoot_date);
CREATE INDEX idx_shoots_status ON shoots(status);
