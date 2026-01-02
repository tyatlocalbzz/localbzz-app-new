-- Migration: Create client_context table (The Client Brain)

-- Create custom type
CREATE TYPE context_type AS ENUM ('transcript', 'report', 'note');

-- Create client_context table
CREATE TABLE client_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type context_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE client_context ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_client_context_client_id ON client_context(client_id);
CREATE INDEX idx_client_context_cycle_id ON client_context(cycle_id);
CREATE INDEX idx_client_context_author_id ON client_context(author_id);
CREATE INDEX idx_client_context_type ON client_context(type);
CREATE INDEX idx_client_context_created_at ON client_context(created_at DESC);
