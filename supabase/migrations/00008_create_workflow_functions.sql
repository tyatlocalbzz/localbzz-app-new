-- Migration: Create workflow automation functions

-- ===================
-- START NEW CYCLE FUNCTION
-- ===================
-- Creates a cycle for a client and auto-generates the 4 standard admin tasks

CREATE OR REPLACE FUNCTION start_new_cycle(
  p_client_id UUID,
  p_month DATE
)
RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
  v_normalized_month DATE;
BEGIN
  -- Normalize to first of month
  v_normalized_month := DATE_TRUNC('month', p_month)::DATE;

  -- Create the cycle
  INSERT INTO cycles (client_id, month, status)
  VALUES (p_client_id, v_normalized_month, 'planning')
  RETURNING id INTO v_cycle_id;

  -- Generate default cycle tasks
  INSERT INTO tasks (parent_id, parent_type, title, role, status)
  VALUES
    (v_cycle_id, 'cycle', 'Confirm Check-in Call', 'scheduler', 'todo'),
    (v_cycle_id, 'cycle', 'Conduct Check-in Call', 'strategist', 'todo'),
    (v_cycle_id, 'cycle', 'Create Capture List', 'strategist', 'todo'),
    (v_cycle_id, 'cycle', 'Schedule Shoot', 'scheduler', 'todo'),
    (v_cycle_id, 'cycle', 'Send Monthly Report', 'strategist', 'todo');

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- SCHEDULE SHOOT FUNCTION
-- ===================
-- Creates a shoot and auto-generates the 3 production tasks

CREATE OR REPLACE FUNCTION schedule_shoot(
  p_client_id UUID,
  p_cycle_id UUID,
  p_shoot_date DATE,
  p_type shoot_type DEFAULT 'monthly',
  p_shoot_time TIME DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_calendar_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_shoot_id UUID;
BEGIN
  -- Create the shoot
  INSERT INTO shoots (client_id, cycle_id, shoot_date, type, status, shoot_time, location, calendar_link)
  VALUES (p_client_id, p_cycle_id, p_shoot_date, p_type, 'planned', p_shoot_time, p_location, p_calendar_link)
  RETURNING id INTO v_shoot_id;

  -- Generate default shoot tasks (exact titles for handoff triggers)
  -- IMPORTANT: These titles must match exactly for the silent handoff to work
  INSERT INTO tasks (parent_id, parent_type, title, role, status)
  VALUES
    (v_shoot_id, 'shoot', 'Shoot Content & Log', 'shooter', 'todo'),
    (v_shoot_id, 'shoot', 'Edit Content Batch', 'editor', 'todo'),
    (v_shoot_id, 'shoot', 'Schedule Content', 'scheduler', 'todo');

  RETURN v_shoot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- SILENT HANDOFF TRIGGER
-- ===================
-- Automatically updates shoot status when specific tasks are completed
-- CRITICAL: Task titles must match exactly - do not allow users to edit these titles

CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process shoot tasks that are being marked as done
  IF NEW.parent_type != 'shoot' OR NEW.status != 'done' THEN
    RETURN NEW;
  END IF;

  -- Shoot Content & Log done -> status = 'shot'
  IF NEW.title = 'Shoot Content & Log' THEN
    UPDATE shoots
    SET status = 'shot', updated_at = NOW()
    WHERE id = NEW.parent_id AND status = 'planned';

  -- Edit Content Batch done -> status = 'edited'
  ELSIF NEW.title = 'Edit Content Batch' THEN
    UPDATE shoots
    SET status = 'edited', updated_at = NOW()
    WHERE id = NEW.parent_id AND status = 'shot';

  -- Schedule Content done -> status = 'delivered'
  ELSIF NEW.title = 'Schedule Content' THEN
    UPDATE shoots
    SET status = 'delivered', updated_at = NOW()
    WHERE id = NEW.parent_id AND status = 'edited';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for task completion
CREATE TRIGGER on_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status = 'todo' AND NEW.status = 'done')
  EXECUTE FUNCTION handle_task_completion();

-- ===================
-- HELPER FUNCTION: Get client with active cycle
-- ===================

CREATE OR REPLACE FUNCTION get_client_with_current_cycle(p_client_id UUID)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  client_status client_status,
  cycle_id UUID,
  cycle_month DATE,
  cycle_status cycle_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as client_id,
    c.name as client_name,
    c.status as client_status,
    cy.id as cycle_id,
    cy.month as cycle_month,
    cy.status as cycle_status
  FROM clients c
  LEFT JOIN cycles cy ON cy.client_id = c.id
    AND cy.month = DATE_TRUNC('month', CURRENT_DATE)::DATE
  WHERE c.id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
