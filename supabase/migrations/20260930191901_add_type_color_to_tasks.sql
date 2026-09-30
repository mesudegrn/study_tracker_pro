/*
# Add type and color columns to tasks table

1. Modified Tables
   - tasks: added `item_type` (text, default 'task') and `color` (text, nullable) columns.
   - item_type values: 'task', 'exam', 'quiz', 'event'
   - color is used for calendar rendering (exam=red, quiz=orange, task=blue, event=purple)
2. Security
   - No policy changes needed; existing RLS policies already cover these columns.
3. Notes
   - Existing rows get item_type='task' by default, preserving backward compatibility.
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'task';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color text;
