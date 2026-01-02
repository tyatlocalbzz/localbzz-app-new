-- Migration: Fix shoot_status enum bug in start_new_cycle function
-- The function was using 'planning' (a cycle_status) instead of 'planned' (a shoot_status)

CREATE OR REPLACE FUNCTION start_new_cycle(
  p_client_id UUID,
  p_month DATE
)
RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
  v_shoot_id UUID;
  v_normalized_month DATE;
  v_placeholder_shoot_date DATE;
  v_template RECORD;
  v_assignee_id UUID;
  v_days_offset INT;
  v_due_date DATE;
BEGIN
  -- Normalize to first of month
  v_normalized_month := DATE_TRUNC('month', p_month)::DATE;

  -- Placeholder shoot date is 15th of the month
  v_placeholder_shoot_date := v_normalized_month + INTERVAL '14 days';

  -- Create the cycle
  INSERT INTO cycles (client_id, month, status)
  VALUES (p_client_id, v_normalized_month, 'planning')
  RETURNING id INTO v_cycle_id;

  -- Generate CYCLE tasks from templates with due dates
  FOR v_template IN (
    SELECT DISTINCT ON (t.title) t.id, t.title, t.role, t.sort_order, t.days_offset
    FROM task_templates t
    WHERE t.parent_type = 'cycle'
      AND t.is_active = true
      AND (t.client_id = p_client_id OR t.client_id IS NULL)
    ORDER BY t.title, t.client_id NULLS LAST, t.sort_order
  )
  LOOP
    -- Look up default assignee
    SELECT cta.assignee_id INTO v_assignee_id
    FROM client_task_assignments cta
    WHERE cta.client_id = p_client_id
      AND cta.template_id = v_template.id;

    -- Get days offset (with client override support)
    v_days_offset := get_days_offset(v_template.id, p_client_id);

    -- Calculate due date from month start
    v_due_date := v_normalized_month + (v_days_offset || ' days')::INTERVAL;

    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, assignee_id, due_date)
    VALUES (v_cycle_id, 'cycle', v_template.title, v_template.role, 'todo', v_template.sort_order, v_assignee_id, v_due_date);
  END LOOP;

  -- Fallback for cycle tasks if no templates exist
  IF NOT FOUND THEN
    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, due_date)
    VALUES
      (v_cycle_id, 'cycle', 'Confirm Check-in Call', 'scheduler', 'todo', 1, v_normalized_month + INTERVAL '3 days'),
      (v_cycle_id, 'cycle', 'Conduct Check-in Call', 'strategist', 'todo', 2, v_normalized_month + INTERVAL '7 days'),
      (v_cycle_id, 'cycle', 'Create Capture List', 'strategist', 'todo', 3, v_normalized_month + INTERVAL '10 days'),
      (v_cycle_id, 'cycle', 'Schedule Shoot', 'scheduler', 'todo', 4, v_normalized_month + INTERVAL '12 days'),
      (v_cycle_id, 'cycle', 'Send Monthly Report', 'strategist', 'todo', 5, v_normalized_month + INTERVAL '28 days');
  END IF;

  -- Create placeholder shoot for this cycle (will be updated when actually scheduled)
  -- FIX: Using 'planned' (shoot_status) instead of 'planning' (cycle_status)
  INSERT INTO shoots (client_id, cycle_id, shoot_date, type, status)
  VALUES (p_client_id, v_cycle_id, v_placeholder_shoot_date, 'monthly', 'planned')
  RETURNING id INTO v_shoot_id;

  -- Generate SHOOT tasks from templates with due dates
  FOR v_template IN (
    SELECT DISTINCT ON (t.title) t.id, t.title, t.role, t.sort_order, t.days_offset
    FROM task_templates t
    WHERE t.parent_type = 'shoot'
      AND t.is_active = true
      AND (t.client_id = p_client_id OR t.client_id IS NULL)
    ORDER BY t.title, t.client_id NULLS LAST, t.sort_order
  )
  LOOP
    -- Look up default assignee
    SELECT cta.assignee_id INTO v_assignee_id
    FROM client_task_assignments cta
    WHERE cta.client_id = p_client_id
      AND cta.template_id = v_template.id;

    -- Get days offset (with client override support)
    v_days_offset := get_days_offset(v_template.id, p_client_id);

    -- Calculate due date from placeholder shoot date
    v_due_date := v_placeholder_shoot_date + (v_days_offset || ' days')::INTERVAL;

    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, assignee_id, due_date)
    VALUES (v_shoot_id, 'shoot', v_template.title, v_template.role, 'todo', v_template.sort_order, v_assignee_id, v_due_date);
  END LOOP;

  -- Fallback for shoot tasks if no templates exist
  IF NOT FOUND THEN
    INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, due_date)
    VALUES
      (v_shoot_id, 'shoot', 'Shoot Content & Log', 'shooter', 'todo', 1, v_placeholder_shoot_date),
      (v_shoot_id, 'shoot', 'Edit Content Batch', 'editor', 'todo', 2, v_placeholder_shoot_date + INTERVAL '5 days'),
      (v_shoot_id, 'shoot', 'Schedule Content', 'scheduler', 'todo', 3, v_placeholder_shoot_date + INTERVAL '7 days');
  END IF;

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
