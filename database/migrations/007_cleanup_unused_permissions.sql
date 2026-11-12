-- Preserve effective grants before removing obsolete permission names.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE permissions, role_permissions IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE permission_alias_cleanup (old_code TEXT, new_code TEXT) ON COMMIT DROP;
INSERT INTO permission_alias_cleanup VALUES
    ('user.manage', 'users:read'),
    ('user.manage', 'users:write'),
    ('class.read.assigned', 'classes:read'),
    ('class.read.enrolled', 'classes:read'),
    ('class.manage', 'classes:write'),
    ('class.update.assigned', 'classes:write'),
    ('class_member.manage.assigned', 'classes:members'),
    ('lesson.read.enrolled', 'lessons:read'),
    ('lesson.manage', 'lessons:write'),
    ('lesson.manage.assigned', 'lessons:write'),
    ('assignment.read.enrolled', 'assignments:read'),
    ('assignment.manage', 'assignments:write'),
    ('assignment.manage.assigned', 'assignments:write'),
    ('submission.read.assigned', 'submissions:read'),
    ('submission.manage.self', 'submissions:write'),
    ('submission.grade.assigned', 'submissions:review'),
    ('lesson_progress.read.assigned', 'progress:read'),
    ('lesson_progress.update.self', 'progress:write');

INSERT INTO permissions (code)
SELECT DISTINCT m.new_code
FROM permission_alias_cleanup m
JOIN permissions old_permission ON old_permission.code = m.old_code
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT rp.role_id, new_permission.id, MIN(rp.granted_at)
FROM permission_alias_cleanup m
JOIN permissions old_permission ON old_permission.code = m.old_code
JOIN role_permissions rp ON rp.permission_id = old_permission.id
JOIN permissions new_permission ON new_permission.code = m.new_code
GROUP BY rp.role_id, new_permission.id
ON CONFLICT (role_id, permission_id) DO NOTHING;

DELETE FROM permissions
WHERE code IN (SELECT old_code FROM permission_alias_cleanup)
   OR code IN (
       'rbac.manage', 'rbac:manage',
       'profile.read.self', 'profile.update.self',
       'class_member.read.assigned',
       'postman_fixture:read', 'postman_fixture:write',
       'classes:mentor', 'submissions:manage', 'admin:all'
   );
-- role_permissions.permission_id uses ON DELETE CASCADE.
COMMIT;
