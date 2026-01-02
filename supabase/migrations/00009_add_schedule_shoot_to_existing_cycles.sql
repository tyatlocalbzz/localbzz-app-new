-- Migration: Add "Schedule Shoot" task to existing cycles that don't have it

INSERT INTO tasks (parent_id, parent_type, title, role, status)
SELECT
  c.id as parent_id,
  'cycle' as parent_type,
  'Schedule Shoot' as title,
  'scheduler' as role,
  'todo' as status
FROM cycles c
WHERE NOT EXISTS (
  SELECT 1 FROM tasks t
  WHERE t.parent_id = c.id
  AND t.parent_type = 'cycle'
  AND t.title = 'Schedule Shoot'
);
