-- The original UUID database used GRADED/RETURNED. Keep those rows valid
-- while accepting REVIEWED, which is written by the current review API.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS chk_submissions_status;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED', 'GRADED', 'RETURNED'));
COMMIT;
