-- Preserve existing UUIDs. Map legacy integer IDs and all their foreign keys
-- to the same deterministic UUID, without deleting rows or rebuilding tables.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE TEMP TABLE uuid_id_columns ON COMMIT DROP AS
SELECT c.table_name, c.column_name, c.data_type, m.target_table
FROM (VALUES
    ('users', 'id', 'users'),
    ('roles', 'id', 'roles'),
    ('permissions', 'id', 'permissions'),
    ('classes', 'id', 'classes'),
    ('class_members', 'id', 'class_members'),
    ('lessons', 'id', 'lessons'),
    ('assignments', 'id', 'assignments'),
    ('submissions', 'id', 'submissions'),
    ('lesson_progress', 'id', 'lesson_progress'),
    ('classes', 'mentor_id', 'users'),
    ('class_members', 'class_id', 'classes'),
    ('class_members', 'member_id', 'users'),
    ('lessons', 'class_id', 'classes'),
    ('lessons', 'created_by', 'users'),
    ('assignments', 'class_id', 'classes'),
    ('assignments', 'created_by', 'users'),
    ('submissions', 'assignment_id', 'assignments'),
    ('submissions', 'member_id', 'users'),
    ('submissions', 'reviewed_by', 'users'),
    ('lesson_progress', 'lesson_id', 'lessons'),
    ('lesson_progress', 'member_id', 'users'),
    ('user_roles', 'user_id', 'users'),
    ('user_roles', 'role_id', 'roles'),
    ('user_roles', 'assigned_by', 'users'),
    ('role_permissions', 'role_id', 'roles'),
    ('role_permissions', 'permission_id', 'permissions')
) AS m(table_name, column_name, target_table)
JOIN information_schema.columns c
  ON c.table_schema = current_schema()
 AND c.table_name = m.table_name AND c.column_name = m.column_name;

CREATE TEMP TABLE uuid_foreign_keys ON COMMIT DROP AS
SELECT ns.nspname AS schema_name, rel.relname AS table_name,
       con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE con.contype = 'f' AND ns.nspname = current_schema()
  AND (EXISTS (
      SELECT 1 FROM uuid_id_columns c
      WHERE c.data_type <> 'uuid' AND c.table_name = rel.relname
  ) OR EXISTS (
      SELECT 1 FROM uuid_id_columns c
      JOIN pg_class referenced ON referenced.relname = c.table_name
      JOIN pg_namespace referenced_ns ON referenced_ns.oid = referenced.relnamespace
      WHERE c.data_type <> 'uuid' AND referenced.oid = con.confrelid
        AND referenced_ns.nspname = current_schema()
  ));

DO $$
DECLARE col RECORD; fk RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM uuid_id_columns WHERE data_type NOT IN ('uuid', 'smallint', 'integer', 'bigint')) THEN
        RAISE EXCEPTION 'Unsupported ID type; expected UUID or integer IDs';
    END IF;

    FOR fk IN SELECT * FROM uuid_foreign_keys LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', fk.schema_name, fk.table_name, fk.conname);
    END LOOP;

    FOR col IN SELECT * FROM uuid_id_columns WHERE data_type <> 'uuid' LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT', current_schema(), col.table_name, col.column_name);
        EXECUTE format(
            'ALTER TABLE %I.%I ALTER COLUMN %I TYPE UUID USING md5(%L || %I::text)::uuid',
            current_schema(), col.table_name, col.column_name,
            'basic-be-training:' || col.target_table || ':', col.column_name
        );
    END LOOP;

    FOR col IN SELECT * FROM uuid_id_columns WHERE column_name = 'id' LOOP
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', current_schema(), col.table_name);
    END LOOP;

    FOR fk IN SELECT * FROM uuid_foreign_keys LOOP
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s', fk.schema_name, fk.table_name, fk.conname, fk.definition);
    END LOOP;
END $$;
COMMIT;
