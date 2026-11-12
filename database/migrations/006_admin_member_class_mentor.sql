-- Keep only ADMIN and MEMBER roles. Class mentors are MEMBER users assigned
-- per class through classes.mentor_id and must also belong to class_members.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE classes ALTER COLUMN mentor_id DROP NOT NULL;

INSERT INTO roles (code, name, is_system, is_active)
VALUES ('ADMIN', 'Administrator', TRUE, TRUE), ('MEMBER', 'Member', TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET is_active = TRUE;

-- Convert every non-admin legacy role assignment to MEMBER, retaining its
-- assignment period and audit metadata where possible.
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, expires_at)
SELECT ur.user_id, member_role.id, ur.assigned_by, ur.assigned_at, ur.expires_at
FROM user_roles ur
JOIN roles old_role ON old_role.id = ur.role_id
JOIN roles member_role ON member_role.code = 'MEMBER'
WHERE old_role.code <> 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Ensure each account has one of the two supported roles. ADMIN takes
-- precedence if both legacy role assignments existed.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, CASE WHEN UPPER(u.role) = 'ADMIN' THEN admin_role.id ELSE member_role.id END
FROM users u
CROSS JOIN roles admin_role
CROSS JOIN roles member_role
WHERE admin_role.code = 'ADMIN' AND member_role.code = 'MEMBER'
  AND u.is_deleted = FALSE
ON CONFLICT (user_id, role_id) DO NOTHING;

DELETE FROM user_roles ur
USING roles r
WHERE r.id = ur.role_id
  AND (r.code NOT IN ('ADMIN', 'MEMBER')
       OR (r.code = 'MEMBER' AND EXISTS (
         SELECT 1 FROM user_roles admin_assignment
         JOIN roles admin_role ON admin_role.id = admin_assignment.role_id AND admin_role.code = 'ADMIN'
         WHERE admin_assignment.user_id = ur.user_id
       )));

UPDATE users u
SET role = CASE WHEN EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = u.id AND r.code = 'ADMIN'
) THEN 'ADMIN' ELSE 'MEMBER' END;

-- Preserve valid existing mentor assignments by making the MEMBER mentor an
-- active member of that class. Existing admin/non-member assignments are unset.
INSERT INTO class_members (class_id, member_id)
SELECT c.id, c.mentor_id
FROM classes c
JOIN user_roles ur ON ur.user_id = c.mentor_id
JOIN roles r ON r.id = ur.role_id AND r.code = 'MEMBER'
WHERE c.mentor_id IS NOT NULL AND c.is_deleted = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM class_members cm
    WHERE cm.class_id = c.id AND cm.member_id = c.mentor_id AND cm.is_deleted = FALSE
  );

UPDATE classes c
SET mentor_id = NULL, updated_at = NOW()
WHERE c.mentor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id AND r.code = 'MEMBER'
    WHERE ur.user_id = c.mentor_id
  );

DELETE FROM roles WHERE code NOT IN ('ADMIN', 'MEMBER');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'roles_code_allowed'
      AND conrelid = 'roles'::regclass
  ) THEN
    ALTER TABLE roles ADD CONSTRAINT roles_code_allowed CHECK (code IN ('ADMIN', 'MEMBER'));
  END IF;
END $$;

-- This database runs migrations in filename order on every invocation.
-- Remove obsolete legacy role grants so ADMIN/MEMBER stay the only role policy.
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id AND rp.permission_id = p.id
  AND p.code IN ('classes:mentor', 'submissions:manage', 'admin:all');
DELETE FROM permissions WHERE code IN ('classes:mentor', 'submissions:manage', 'admin:all');

COMMIT;
