-- Migration: Create tasks table

-- Create custom types
CREATE TYPE parent_type AS ENUM ('cycle', 'shoot');
CREATE TYPE task_role AS ENUM ('strategist', 'scheduler', 'shooter', 'editor');
CREATE TYPE task_status AS ENUM ('todo', 'done');

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  parent_type parent_type NOT NULL,
  title TEXT NOT NULL,
  role task_role NOT NULL,
  status task_status NOT NULL DEFAULT 'todo',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_tasks_parent ON tasks(parent_id, parent_type);
CREATE INDEX idx_tasks_role ON tasks(role);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
