-- Run before starting the updated application against an existing database.
BEGIN;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0);
COMMIT;
