-- Schema for a NEW training database. CREATE IF NOT EXISTS does not migrate existing tables.
BEGIN;
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    phone TEXT,
    dob DATE,
    avt_url TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id),
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, role_id),
    CHECK (expires_at IS NULL OR expires_at > assigned_at)
);
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    mentor_id BIGINT NOT NULL REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE TABLE IF NOT EXISTS class_members (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id),
    member_id BIGINT NOT NULL REFERENCES users(id),
    join_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS class_members_active_unique ON class_members (class_id, member_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS lessons (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id),
    title TEXT NOT NULL,
    content TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(id),
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    maximum_score NUMERIC NOT NULL CHECK (maximum_score > 0),
    created_by BIGINT NOT NULL REFERENCES users(id),
    image_url TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    assignment_id BIGINT NOT NULL REFERENCES assignments(id),
    member_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT,
    repository_url TEXT,
    submitted_at TIMESTAMPTZ,
    score NUMERIC CHECK (score >= 0),
    feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by BIGINT REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWED')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    member_id BIGINT NOT NULL REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_active_unique ON lesson_progress (lesson_id, member_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS user_roles_role_id_index ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS classes_mentor_id_index ON classes (mentor_id);
CREATE INDEX IF NOT EXISTS class_members_member_id_index ON class_members (member_id);
CREATE INDEX IF NOT EXISTS lessons_class_id_index ON lessons (class_id);
CREATE INDEX IF NOT EXISTS assignments_class_id_index ON assignments (class_id);
CREATE INDEX IF NOT EXISTS submissions_assignment_id_index ON submissions (assignment_id);
CREATE INDEX IF NOT EXISTS lesson_progress_lesson_id_index ON lesson_progress (lesson_id);
COMMIT;
