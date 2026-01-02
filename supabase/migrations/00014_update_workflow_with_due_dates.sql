-- Migration: Update workflow functions to calculate due dates and create shoots at cycle start

-- ===================
-- HELPER FUNCTION: Get days offset for a template
-- ===================
-- Returns client-specific override if exists, otherwise template default

CREATE OR REPLACE FUNCTION get_days_offset(
  p_template_id UUID,
  p_client_id UUID
)
RETURNS INT AS $$
DECLARE
  v_offset INT;
BEGIN
  -- First try to get client-specific override
  SELECT cta.days_offset_override INTO v_offset
  FROM client_task_assignments cta
  WHERE cta.client_id = p_client_id
    AND cta.template_id = p_template_id
    AND cta.days_offset_override IS NOT NULL;

  -- If no override, get template default
  IF v_offset IS NULL THEN
    SELECT t.days_offset INTO v_offset
    FROM task_templates t
    WHERE t.id = p_template_id;
  END IF;

  RETURN COALESCE(v_offset, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- UPDATED START NEW CYCLE FUNCTION
-- ===================
-- Now creates:
-- 1. Cycle tasks with due dates (based on days from month start)
-- 2. A placeholder shoot (15th of month)
-- 3. Shoot tasks with due dates (based on days from shoot date)

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

-- ===================
-- UPDATED SCHEDULE SHOOT FUNCTION
-- ===================
-- Now checks for existing placeholder shoot and updates it
-- Also recalculates due dates for shoot tasks

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
  v_existing_shoot_id UUID;
  v_template RECORD;
  v_assignee_id UUID;
  v_days_offset INT;
  v_due_date DATE;
BEGIN
  -- Check if there's an existing placeholder shoot for this cycle (no time/location set)
  SELECT id INTO v_existing_shoot_id
  FROM shoots
  WHERE cycle_id = p_cycle_id
    AND type = 'monthly'
    AND shoot_time IS NULL
    AND location IS NULL
  LIMIT 1;

  IF v_existing_shoot_id IS NOT NULL THEN
    -- Update the existing placeholder shoot
    UPDATE shoots
    SET shoot_date = p_shoot_date,
        shoot_time = p_shoot_time,
        location = p_location,
        calendar_link = p_calendar_link,
        status = 'planned',
        updated_at = NOW()
    WHERE id = v_existing_shoot_id;

    v_shoot_id := v_existing_shoot_id;

    -- Recalculate due dates for existing shoot tasks
    FOR v_template IN (
      SELECT DISTINCT ON (t.title) t.id, t.title, t.days_offset
      FROM task_templates t
      WHERE t.parent_type = 'shoot'
        AND t.is_active = true
        AND (t.client_id = p_client_id OR t.client_id IS NULL)
      ORDER BY t.title, t.client_id NULLS LAST
    )
    LOOP
      v_days_offset := get_days_offset(v_template.id, p_client_id);
      v_due_date := p_shoot_date + (v_days_offset || ' days')::INTERVAL;

      UPDATE tasks
      SET due_date = v_due_date,
          updated_at = NOW()
      WHERE parent_id = v_shoot_id
        AND parent_type = 'shoot'
        AND title = v_template.title;
    END LOOP;

    -- Fallback: update tasks without templates
    UPDATE tasks
    SET due_date = CASE title
        WHEN 'Shoot Content & Log' THEN p_shoot_date
        WHEN 'Edit Content Batch' THEN p_shoot_date + INTERVAL '5 days'
        WHEN 'Schedule Content' THEN p_shoot_date + INTERVAL '7 days'
        ELSE due_date
      END,
      updated_at = NOW()
    WHERE parent_id = v_shoot_id
      AND parent_type = 'shoot'
      AND title IN ('Shoot Content & Log', 'Edit Content Batch', 'Schedule Content');

  ELSE
    -- Create a new shoot (for additional shoots beyond the monthly one)
    INSERT INTO shoots (client_id, cycle_id, shoot_date, type, status, shoot_time, location, calendar_link)
    VALUES (p_client_id, p_cycle_id, p_shoot_date, p_type, 'planned', p_shoot_time, p_location, p_calendar_link)
    RETURNING id INTO v_shoot_id;

    -- Generate shoot tasks from templates with due dates
    FOR v_template IN (
      SELECT DISTINCT ON (t.title) t.id, t.title, t.role, t.sort_order, t.days_offset
      FROM task_templates t
      WHERE t.parent_type = 'shoot'
        AND t.is_active = true
        AND (t.client_id = p_client_id OR t.client_id IS NULL)
      ORDER BY t.title, t.client_id NULLS LAST, t.sort_order
    )
    LOOP
      SELECT cta.assignee_id INTO v_assignee_id
      FROM client_task_assignments cta
      WHERE cta.client_id = p_client_id
        AND cta.template_id = v_template.id;

      v_days_offset := get_days_offset(v_template.id, p_client_id);
      v_due_date := p_shoot_date + (v_days_offset || ' days')::INTERVAL;

      INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, assignee_id, due_date)
      VALUES (v_shoot_id, 'shoot', v_template.title, v_template.role, 'todo', v_template.sort_order, v_assignee_id, v_due_date);
    END LOOP;

    -- Fallback for shoot tasks if no templates exist
    IF NOT FOUND THEN
      INSERT INTO tasks (parent_id, parent_type, title, role, status, sort_order, due_date)
      VALUES
        (v_shoot_id, 'shoot', 'Shoot Content & Log', 'shooter', 'todo', 1, p_shoot_date),
        (v_shoot_id, 'shoot', 'Edit Content Batch', 'editor', 'todo', 2, p_shoot_date + INTERVAL '5 days'),
        (v_shoot_id, 'shoot', 'Schedule Content', 'scheduler', 'todo', 3, p_shoot_date + INTERVAL '7 days');
    END IF;
  END IF;

  RETURN v_shoot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- NEW FUNCTION: Recalculate shoot task due dates
-- ===================
-- Called when shoot date is changed

CREATE OR REPLACE FUNCTION recalculate_shoot_due_dates(
  p_shoot_id UUID
)
RETURNS void AS $$
DECLARE
  v_shoot RECORD;
  v_template RECORD;
  v_days_offset INT;
  v_due_date DATE;
BEGIN
  -- Get shoot info
  SELECT id, client_id, shoot_date INTO v_shoot
  FROM shoots
  WHERE id = p_shoot_id;

  IF v_shoot IS NULL THEN
    RETURN;
  END IF;

  -- Update due dates for each shoot task
  FOR v_template IN (
    SELECT DISTINCT ON (t.title) t.id, t.title, t.days_offset
    FROM task_templates t
    WHERE t.parent_type = 'shoot'
      AND t.is_active = true
      AND (t.client_id = v_shoot.client_id OR t.client_id IS NULL)
    ORDER BY t.title, t.client_id NULLS LAST
  )
  LOOP
    v_days_offset := get_days_offset(v_template.id, v_shoot.client_id);
    v_due_date := v_shoot.shoot_date + (v_days_offset || ' days')::INTERVAL;

    UPDATE tasks
    SET due_date = v_due_date,
        updated_at = NOW()
    WHERE parent_id = p_shoot_id
      AND parent_type = 'shoot'
      AND title = v_template.title;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
