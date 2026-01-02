-- Migration: Add shoot details columns

ALTER TABLE shoots
ADD COLUMN shoot_time TIME,
ADD COLUMN location TEXT,
ADD COLUMN calendar_link TEXT;
