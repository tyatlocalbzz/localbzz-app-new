-- Migration: Add due date support to task templates and tasks

-- ===================
-- ADD DAYS_OFFSET TO TASK TEMPLATES
-- ===================
-- For cycle tasks: days from the 1st of the cycle month
-- For shoot tasks: days from the shoot date

ALTER TABLE task_templates
ADD COLUMN days_offset INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN task_templates.days_offset IS 'Days offset for due date calculation. Cycle tasks: days from month start. Shoot tasks: days from shoot date.';

-- Set default offsets for existing templates based on title
-- Cycle tasks (relative to 1st of month)
UPDATE task_templates SET days_offset = 3 WHERE title = 'Confirm Check-in Call' AND parent_type = 'cycle';
UPDATE task_templates SET days_offset = 7 WHERE title = 'Conduct Check-in Call' AND parent_type = 'cycle';
UPDATE task_templates SET days_offset = 10 WHERE title = 'Create Capture List' AND parent_type = 'cycle';
UPDATE task_templates SET days_offset = 12 WHERE title = 'Schedule Shoot' AND parent_type = 'cycle';
UPDATE task_templates SET days_offset = 28 WHERE title = 'Send Monthly Report' AND parent_type = 'cycle';

-- Shoot tasks (relative to shoot date)
UPDATE task_templates SET days_offset = 0 WHERE title = 'Shoot Content & Log' AND parent_type = 'shoot';
UPDATE task_templates SET days_offset = 5 WHERE title = 'Edit Content Batch' AND parent_type = 'shoot';
UPDATE task_templates SET days_offset = 7 WHERE title = 'Schedule Content' AND parent_type = 'shoot';

-- ===================
-- ADD DUE_DATE TO TASKS
-- ===================

ALTER TABLE tasks
ADD COLUMN due_date DATE;

COMMENT ON COLUMN tasks.due_date IS 'Calculated due date for the task';

-- ===================
-- ADD DAYS_OFFSET_OVERRIDE TO CLIENT_TASK_ASSIGNMENTS
-- ===================
-- Allows clients to have custom due date offsets per template

ALTER TABLE client_task_assignments
ADD COLUMN days_offset_override INT DEFAULT NULL;

COMMENT ON COLUMN client_task_assignments.days_offset_override IS 'Optional client-specific override for days_offset. NULL means use template default.';
