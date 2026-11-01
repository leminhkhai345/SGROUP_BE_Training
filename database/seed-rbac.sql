BEGIN;
INSERT INTO roles (code, name, is_system, is_active) VALUES
    ('ADMIN', 'Administrator', TRUE, TRUE),
    ('MENTOR', 'Mentor', TRUE, TRUE),
    ('MEMBER', 'Member', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code) VALUES
    ('users:read'),
    ('users:write'),
    ('classes:read'),
    ('classes:write'),
    ('classes:members'),
    ('lessons:read'),
    ('lessons:write'),
    ('assignments:read'),
    ('assignments:write'),
    ('submissions:read'),
    ('submissions:write'),
    ('submissions:review'),
    ('progress:read'),
    ('progress:write'),
    ('rbac:manage'),
    ('uploads:write')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code = 'ADMIN' AND p.code IN ('users:read', 'users:write', 'classes:read', 'classes:write', 'classes:members', 'lessons:read', 'lessons:write', 'assignments:read', 'assignments:write', 'submissions:read', 'submissions:write', 'submissions:review', 'progress:read', 'progress:write', 'rbac:manage', 'uploads:write'))
   OR (r.code = 'MENTOR' AND p.code IN ('classes:read', 'classes:write', 'classes:members', 'lessons:read', 'lessons:write', 'assignments:read', 'assignments:write', 'submissions:read', 'submissions:review', 'progress:read', 'uploads:write'))
   OR (r.code = 'MEMBER' AND p.code IN ('classes:read', 'lessons:read', 'assignments:read', 'submissions:read', 'submissions:write', 'progress:read', 'progress:write', 'uploads:write'))
ON CONFLICT (role_id, permission_id) DO NOTHING;
COMMIT;
