-- Migration: Add client_task_assignments table
-- Maps task templates to default assignees for each client

-- ===================
-- CLIENT TASK ASSIGNMENTS TABLE
-- ===================

CREATE TABLE client_task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each template can only have one assignment per client
  UNIQUE(client_id, template_id)
);

-- Enable RLS
ALTER TABLE client_task_assignments ENABLE ROW LEVEL SECURITY;

-- ===================
-- RLS POLICIES
-- ===================

-- All authenticated users can view assignments
CREATE POLICY "Authenticated users can view client task assignments"
  ON client_task_assignments FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage assignments
CREATE POLICY "Admins can insert client task assignments"
  ON client_task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update client task assignments"
  ON client_task_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete client task assignments"
  ON client_task_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===================
-- INDEXES
-- ===================

CREATE INDEX idx_client_task_assignments_client ON client_task_assignments(client_id);
CREATE INDEX idx_client_task_assignments_template ON client_task_assignments(template_id);
CREATE INDEX idx_client_task_assignments_assignee ON client_task_assignments(assignee_id);

-- ===================
-- UPDATED_AT TRIGGER
-- ===================

CREATE TRIGGER update_client_task_assignments_updated_at
  BEFORE UPDATE ON client_task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
