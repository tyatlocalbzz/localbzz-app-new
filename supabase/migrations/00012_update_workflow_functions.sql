-- Migration: Update workflow functions to use templates and apply default assignments

-- ===================
-- UPDATED START NEW CYCLE FUNCTION
-- ===================
-- Now uses task_templates and applies default assignments from client_task_assignments

CREATE OR REPLACE FUNCTION start_new_cycle(
  p_client_id UUID,
  p_month DATE
)
RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
  v_normalized_month DATE;
  v_template RECORD;
  v_assignee_id UUID;
  v_sort_order INT := 1;
BEGIN
  -- Normalize to first of month
  v_normalized_month := DATE_TRUNC('month', p_month)::DATE;

  -- Create the cycle
  INSERT INTO cycles (client_id, month, status)
  VALUES (p_client_id, v_normalized_month, 'planning')
  RETURNING id INTO v_cycle_id;

  -- Generate tasks from templates
  -- First check for client-specific templates, then fall back to global templates
  FOR v_template IN (
    SELECT DISTINCT ON (t.title) t.id, t.title, t.role, t.sort_order
    FROM task_templates t
    WHERE t.parent_type = 'cycle'
      AND t.is_active = true
      AND (t.client_id = p_client_id OR t.client_id IS NULL)
    ORDER BY t.title, t.client_id NULLS LAST, t.sort_order
  )
  LOOP
    -- Look up default assignee for this template + client
    SELECT cta.assignee_id INTO v_assignee_id
    FROM client_task_assignments cta
    WHERE cta.client_id = p_client_id
      AND cta.template_id = v_template.id;

    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, assignee_id)
    VALUES (v_cycle_id, 'cycle', v_template.title, v_template.role, 'todo', v_template.sort_order, v_assignee_id);
  END LOOP;

  -- If no templates exist, fall back to hardcoded defaults (for backwards compatibility)
  IF NOT FOUND THEN
    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order)
    VALUES
      (v_cycle_id, 'cycle', 'Confirm Check-in Call', 'scheduler', 'todo', 1),
      (v_cycle_id, 'cycle', 'Conduct Check-in Call', 'strategist', 'todo', 2),
      (v_cycle_id, 'cycle', 'Create Capture List', 'strategist', 'todo', 3),
      (v_cycle_id, 'cycle', 'Schedule Shoot', 'scheduler', 'todo', 4),
      (v_cycle_id, 'cycle', 'Send Monthly Report', 'strategist', 'todo', 5);
  END IF;

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- UPDATED SCHEDULE SHOOT FUNCTION
-- ===================
-- Now uses task_templates and applies default assignments from client_task_assignments

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
  v_template RECORD;
  v_assignee_id UUID;
BEGIN
  -- Create the shoot
  INSERT INTO shoots (client_id, cycle_id, shoot_date, type, status, shoot_time, location, calendar_link)
  VALUES (p_client_id, p_cycle_id, p_shoot_date, p_type, 'planned', p_shoot_time, p_location, p_calendar_link)
  RETURNING id INTO v_shoot_id;

  -- Generate tasks from templates
  -- First check for client-specific templates, then fall back to global templates
  FOR v_template IN (
    SELECT DISTINCT ON (t.title) t.id, t.title, t.role, t.sort_order
    FROM task_templates t
    WHERE t.parent_type = 'shoot'
      AND t.is_active = true
      AND (t.client_id = p_client_id OR t.client_id IS NULL)
    ORDER BY t.title, t.client_id NULLS LAST, t.sort_order
  )
  LOOP
    -- Look up default assignee for this template + client
    SELECT cta.assignee_id INTO v_assignee_id
    FROM client_task_assignments cta
    WHERE cta.client_id = p_client_id
      AND cta.template_id = v_template.id;

    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, assignee_id)
    VALUES (v_shoot_id, 'shoot', v_template.title, v_template.role, 'todo', v_template.sort_order, v_assignee_id);
  END LOOP;

  -- If no templates exist, fall back to hardcoded defaults (for backwards compatibility)
  -- IMPORTANT: These titles must match exactly for the silent handoff triggers to work
  IF NOT FOUND THEN
    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order)
    VALUES
      (v_shoot_id, 'shoot', 'Shoot Content & Log', 'shooter', 'todo', 1),
      (v_shoot_id, 'shoot', 'Edit Content Batch', 'editor', 'todo', 2),
      (v_shoot_id, 'shoot', 'Schedule Content', 'scheduler', 'todo', 3);
  END IF;

  RETURN v_shoot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
