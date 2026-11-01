import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';

// Deliberately share secrets: tokenType must still prevent cross-use.
process.env.ACCESS_TOKEN_SECRET = 'test-secret-only';
process.env.REFRESH_TOKEN_SECRET = 'test-secret-only';
process.env.R2_ACCOUNT_ID = 'test-account';
process.env.R2_ACCESS_KEY_ID = 'test-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
process.env.R2_BUCKET_NAME = 'test-bucket';
const { default: app } = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.config.js');
const tokens = await import('../src/utils/jwtHelper.js');
const { hashPassword, comparePassword } = await import('../src/utils/passwordHelper.js');
const { default: r2 } = await import('../src/config/r2.config.js');
const uploads = await import('../src/services/upload.service.js');
let server, baseUrl, passwordHash;
before(async () => {
  passwordHash = await hashPassword(' training password ');
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

const stateForTest = () => ({
  users: [
    { id: 1, name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
    { id: 2, name: 'Member', email: 'member@example.com', role: 'MEMBER', password_hash: passwordHash },
    { id: 3, name: 'Mentor', email: 'mentor@example.com', role: 'MENTOR' },
    { id: 4, name: 'Other mentor', email: 'other@example.com', role: 'MENTOR' },
    { id: 5, name: 'Other member', email: 'other-member@example.com', role: 'MEMBER' },
  ],
  access: {},
  classes: [{ id: 10, name: 'Class A', mentor_id: 3 }, { id: 20, name: 'Class B', mentor_id: 4 }],
  members: [{ id: 11, class_id: 10, member_id: 2 }, { id: 12, class_id: 10, member_id: 5 }],
  assignments: [{ id: 100, class_id: 10, maximum_score: 10, deadline: '2099-01-01T00:00:00Z' }, { id: 200, class_id: 20, maximum_score: 10 }],
  lessons: [{ id: 1000, class_id: 10, title: 'Lesson A' }, { id: 2000, class_id: 20, title: 'Lesson B' }],
  submissions: [{ id: 500, version: 1, assignment_id: 100, member_id: 2, status: 'SUBMITTED', content: 'My work' }, { id: 501, version: 1, assignment_id: 100, member_id: 5, status: 'SUBMITTED' }, { id: 502, version: 1, assignment_id: 200, member_id: 5, status: 'SUBMITTED' }],
  progress: [{ id: 700, lesson_id: 1000, member_id: 2 }, { id: 701, lesson_id: 1000, member_id: 5 }],
  roles: [{ id: 7, code: 'MENTOR', is_active: true, is_system: true }],
  userRoles: [],
  writes: [],
});
const same = (a, b) => String(a) === String(b);
const safeUser = ({ password_hash, ...user }) => user;

function installDb(t, state = stateForTest(), intercept) {
  t.mock.method(pool, 'connect', async () => ({ query: (...args) => pool.query(...args), release() {} }));
  t.mock.method(pool, 'query', async (sql, params = []) => {
    sql = sql.replace(/\s+/g, ' ').trim();
    if (intercept) {
      const overridden = await intercept(sql, params);
      if (overridden !== undefined) return overridden;
    }
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
    let rows;
    if (/^SELECT .* FROM (users|classes|class_members|lessons|assignments|submissions|lesson_progress) r\b/.test(sql)) {
      const resource = / FROM (\w+) r\b/.exec(sql)[1];
      const collections = { users: state.users.map(safeUser), classes: state.classes, class_members: state.members, lessons: state.lessons, assignments: state.assignments, submissions: state.submissions, lesson_progress: state.progress };
      rows = collections[resource];
      if (sql.includes('cm.member_id = $1')) {
        const uid = params[0];
        rows = rows.filter((row) => {
          const classId = resource === 'classes' ? row.id : row.class_id ?? (resource === 'submissions' ? state.assignments.find(a => same(a.id,row.assignment_id))?.class_id : state.lessons.find(l => same(l.id,row.lesson_id))?.class_id);
          const classroom = state.classes.find(c => same(c.id, classId));
          if (!classroom || !(same(classroom.mentor_id, uid) || state.members.some(m => same(m.class_id,classId) && same(m.member_id,uid)))) return false;
          return !['submissions','lesson_progress'].includes(resource) || same(row.member_id,uid) || (sql.includes('OR c.mentor_id') && same(classroom.mentor_id,uid));
        });
      }
      for (const m of sql.matchAll(/r\.(class_id|assignment_id|lesson_id|member_id) = \$(\d+)/g)) rows = rows.filter(row => same(row[m[1]], params[Number(m[2])-1]));
      const limit = Number(params.at(-2)), offset = Number(params.at(-1));
      rows = rows.slice(offset, offset + limit);
    }
    else if (sql.includes('FROM roles r')) rows = state.access[params[0]] ?? [];
    else if (sql.startsWith('SELECT') && sql.includes('FROM users WHERE LOWER(email)')) rows = state.users.filter((u) => u.email.toLowerCase() === params[0].toLowerCase());
    else if (sql.startsWith('SELECT') && sql.includes('FROM users WHERE id')) rows = state.users.filter((u) => same(u.id, params[0])).map(safeUser);
    else if (sql.startsWith('SELECT') && sql.includes('FROM users')) rows = state.users.map(safeUser);
    else if (sql.startsWith('SELECT') && sql.includes('FROM classes')) rows = sql.includes('WHERE id =') ? state.classes.filter((c) => same(c.id, params[0])) : state.classes;
    else if (sql.startsWith('SELECT') && sql.includes('FROM class_members')) rows = state.members.filter((m) => {
      if (sql.includes('class_id = $1 AND member_id = $2')) return same(m.class_id, params[0]) && same(m.member_id, params[1]);
      if (sql.includes('WHERE id =')) return same(m.id, params[0]);
      if (sql.includes('WHERE class_id =')) return same(m.class_id, params[0]);
      return true;
    });
    else if (sql.startsWith('SELECT') && sql.includes('FROM assignments')) rows = sql.includes('WHERE id =') ? state.assignments.filter((a) => same(a.id, params[0])) : state.assignments;
    else if (sql.startsWith('SELECT') && sql.includes('FROM lessons')) rows = state.lessons.filter((l) => sql.includes('WHERE id =') ? same(l.id, params[0]) : sql.includes('WHERE class_id =') ? same(l.class_id, params[0]) : true);
    else if (sql.startsWith('SELECT') && sql.includes('FROM submissions')) rows = state.submissions.filter((s) => sql.includes('WHERE id =') ? same(s.id, params[0]) : sql.includes('WHERE assignment_id =') ? same(s.assignment_id, params[0]) : true);
    else if (sql.startsWith('SELECT') && sql.includes('FROM lesson_progress')) rows = state.progress.filter((p) => {
      if (sql.includes('lesson_id = $1 AND member_id = $2')) return same(p.lesson_id, params[0]) && same(p.member_id, params[1]);
      if (sql.includes('WHERE id =')) return same(p.id, params[0]);
      if (sql.includes('WHERE lesson_id =')) return same(p.lesson_id, params[0]);
      return true;
    });
    else if (sql.startsWith('SELECT') && sql.includes('FROM roles')) rows = state.roles.filter((r) => sql.includes('WHERE id =') ? same(r.id, params[0]) : sql.includes('WHERE code =') ? r.code === params[0] : true);
    else if (sql.startsWith('SELECT') && sql.includes('FROM user_roles')) rows = state.userRoles.filter((r) => same(r.user_id, params[0]) && (params[1] === undefined || same(r.role_id, params[1])));
    else if (sql.startsWith('INSERT INTO users')) {
      const [name, email, hash, role] = params;
      const user = { id: 8, name, email, password_hash: hash, role };
      state.users.push(user);
      rows = [safeUser(user)];
    } else if (sql.startsWith('INSERT INTO lessons')) {
      const [class_id, title, content, created_by] = params;
      const lesson = { id: 3000, class_id, title, content, created_by };
      state.lessons.push(lesson);
      rows = [lesson];
    } else if (sql.startsWith('INSERT INTO submissions')) {
      const [assignment_id, member_id, content, repository_url, submitted_at, score, feedback, reviewed_at, reviewed_by, status] = params;
      rows = [{ id: 600, assignment_id, member_id, content, repository_url, submitted_at, score, feedback, reviewed_at, reviewed_by, status }];
    } else if (sql.startsWith('UPDATE submissions')) {
      const submission = state.submissions.find((s) => same(s.id, params[10]));
      if (submission && (submission.status !== params[11] || !same(submission.version,params[12]))) return {rows: []};
      if (submission) {
        submission.version += 1;
        const fields = ['assignment_id', 'member_id', 'content', 'repository_url', 'submitted_at', 'score', 'feedback', 'reviewed_at', 'reviewed_by', 'status'];
        fields.forEach((field, i) => { if (params[i] != null) submission[field] = params[i]; });
      }
      rows = submission ? [submission] : [];
    } else if (sql.startsWith('UPDATE users SET name')) {
      const user = state.users.find((u) => same(u.id, params[4]));
      ['name', 'email', 'phone', 'dob'].forEach((field, i) => { if (params[i] != null) user[field] = params[i]; });
      rows = [safeUser(user)];
    } else if (sql.startsWith('UPDATE users SET is_deleted')) {
      const index = state.users.findIndex((u) => same(u.id, params[0]));
      rows = index < 0 ? [] : [safeUser(state.users.splice(index, 1)[0])];
    } else if (sql.startsWith('UPDATE user_roles')) {
      const entry = state.userRoles.find((r) => same(r.user_id, params[4]) && same(r.role_id, params[5]));
      if (entry && params[3]) entry.expires_at = params[2];
      rows = entry ? [entry] : [];
    } else throw new Error(`Unexpected test query: ${sql}`);
    if (!sql.startsWith('SELECT')) state.writes.push({ sql, params });
    return { rows: structuredClone(rows) };
  });
  return state;
}

async function request(path, { user, token, method = 'GET', body, rawBody } = {}) {
  const headers = {};
  if (token || user) headers.authorization = `Bearer ${token ?? tokens.generateToken({ id: user })}`;
  if (body !== undefined || rawBody !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const raw = await response.text();
  return { status: response.status, body: raw ? JSON.parse(raw) : null };
}
async function expectStatus(path, options, status) {
  const response = await request(path, options);
  assert.equal(response.status, status, JSON.stringify(response.body));
  if (status >= 400) assert.equal(response.body.success, false);
  return response.body;
}

test('all resource APIs and uploads require authentication', async () => {
  for (const path of ['/users', '/classes', '/class-members', '/lessons', '/assignments', '/submissions', '/lesson-progress', '/roles', '/permissions', '/user-roles', '/role-permissions']) await expectStatus(path, {}, 401);
  await expectStatus('/upload', { method: 'POST' }, 401);
});
test('invalid, expired and refresh tokens cannot authenticate, even with the same secret', async () => {
  for (const token of ['bad-token', jwt.sign({ id: 2, tokenType: 'access' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -1 }), tokens.generateRefreshToken({ id: 2 })]) await expectStatus('/users/me', { token }, 401);
});
test('deleted accounts cannot authenticate or refresh', async (t) => {
  const state = installDb(t);
  state.users = state.users.filter((u) => u.id !== 2);
  await expectStatus('/users/me', { user: 2 }, 401);
  await expectStatus('/auth/refresh', { method: 'POST', body: { refreshToken: tokens.generateRefreshToken({ id: 2 }) } }, 401);
});
test('database failures during authentication remain 500 and do not leak SQL', async (t) => {
  installDb(t, stateForTest(), () => { throw new Error('private database details'); });
  const body = await expectStatus('/users/me', { user: 2 }, 500);
  assert.equal(body.message, 'Internal server error');
});
test('register ignores supplied role, hashes password and never returns the hash', async (t) => {
  const state = installDb(t);
  const body = await expectStatus('/auth/register', { method: 'POST', body: { name: 'New user', email: 'NEW@example.com', password: ' training password ', role: 'ADMIN' } }, 201);
  assert.equal(body.data.role, 'MEMBER');
  assert.equal(body.data.email, 'new@example.com');
  assert.equal(body.data.password_hash, undefined);
  assert.equal(await comparePassword(' training password ', state.users.at(-1).password_hash), true);
});
test('duplicate email registration is a conflict', async (t) => {
  installDb(t);
  await expectStatus('/auth/register', { method: 'POST', body: { name: 'Member', email: 'MEMBER@example.com', password: '123456' } }, 409);
});
test('unique constraint races in service become 409', async (t) => {
  installDb(t, stateForTest(), (sql) => { if (sql.startsWith('INSERT INTO users')) throw Object.assign(new Error('private constraint'), { code: '23505' }); });
  await expectStatus('/auth/register', { method: 'POST', body: { name: 'New user', email: 'new@example.com', password: '123456' } }, 409);
});
test('login preserves password whitespace and uses the same error for unknown email and wrong password', async (t) => {
  installDb(t);
  const successful = await expectStatus('/auth/login', { method: 'POST', body: { email: 'MEMBER@example.com', password: ' training password ' } }, 200);
  assert.ok(successful.data.accessToken && successful.data.refreshToken);
  const wrongPassword = await expectStatus('/auth/login', { method: 'POST', body: { email: 'member@example.com', password: 'training password' } }, 401);
  const wrongEmail = await expectStatus('/auth/login', { method: 'POST', body: { email: 'missing@example.com', password: ' training password ' } }, 401);
  assert.equal(wrongPassword.message, wrongEmail.message);
});
test('refresh accepts only refresh tokens', async (t) => {
  installDb(t);
  await expectStatus('/auth/refresh', { method: 'POST', body: { refreshToken: tokens.generateToken({ id: 2 }) } }, 401);
  const body = await expectStatus('/auth/refresh', { method: 'POST', body: { refreshToken: tokens.generateRefreshToken({ id: 2 }) } }, 200);
  assert.equal(tokens.verifyToken(body.data.accessToken).id, 2);
});
test('role claims in a signed token do not override current database roles', async (t) => {
  installDb(t);
  const token = jwt.sign({ id: 2, tokenType: 'access', role: 'ADMIN', roles: ['ADMIN'] }, process.env.ACCESS_TOKEN_SECRET);
  await expectStatus('/users', { token }, 403);
  await expectStatus('/roles', { token }, 403);
});
test('inactive catalogue roles do not regain legacy default permissions', async (t) => {
  const state = installDb(t);
  state.access[3] = [{ code: 'MENTOR', is_active: false, permission_code: 'lessons:write' }];
  await expectStatus('/lessons', { user: 3, method: 'POST', body: { classId: 10, title: 'Lesson' } }, 403);
});
test('explicit role permissions are authoritative and reloaded on every request', async (t) => {
  const state = installDb(t);
  state.access[3] = [{ code: 'MENTOR', is_active: true, permission_code: 'lessons:read' }];
  await expectStatus('/lessons', { user: 3, method: 'POST', body: { classId: 10, title: 'Lesson' } }, 403);
  state.access[3].push({ code: 'MENTOR', is_active: true, permission_code: 'lessons:write' });
  await expectStatus('/lessons', { user: 3, method: 'POST', body: { classId: 10, title: 'Lesson' } }, 201);
});
test('members can read only enrolled classes and their lessons', async (t) => {
  installDb(t);
  const body = await expectStatus('/classes', { user: 2 }, 200);
  assert.deepEqual(body.data.map((c) => c.id), [10]);
  await expectStatus('/classes/20', { user: 2 }, 403);
  const lessons = await expectStatus('/lessons', { user: 2 }, 200);
  assert.deepEqual(lessons.data.map((l) => l.id), [1000]);
  await expectStatus('/lessons?classId=20', { user: 2 }, 403);
});
test('member cannot create lessons and mentor cannot change another class', async (t) => {
  const state = installDb(t);
  await expectStatus('/lessons', { user: 2, method: 'POST', body: { classId: 10, title: 'Lesson' } }, 403);
  await expectStatus('/lessons/2000', { user: 3, method: 'PATCH', body: { title: 'Change' } }, 403);
  assert.equal(state.writes.length, 0);
});
test('mentor creates lesson for own class with server-controlled creator', async (t) => {
  installDb(t);
  const body = await expectStatus('/lessons', { user: 3, method: 'POST', body: { classId: 10, title: 'New lesson', createdBy: 1 } }, 201);
  assert.equal(body.data.created_by, 3);
});
test('missing resources, bad identifiers and sort injection receive client errors', async (t) => {
  installDb(t);
  await expectStatus('/classes/999', { user: 1 }, 404);
  await expectStatus('/classes/no-id', { user: 1 }, 400);
  await expectStatus('/users?sortBy=id%3BDROP%20TABLE%20users', { user: 1 }, 400);
  await expectStatus('/classes?order=invalid', { user: 1 }, 400);
});
test('foreign key errors from services become 400', async (t) => {
  installDb(t, stateForTest(), (sql) => { if (sql.startsWith('INSERT INTO lessons')) throw Object.assign(new Error('private fk'), { code: '23503' }); });
  await expectStatus('/lessons', { user: 3, method: 'POST', body: { classId: 10, title: 'Lesson' } }, 400);
});
test('members cannot read peers submissions or progress; mentor can read own class', async (t) => {
  installDb(t);
  await expectStatus('/submissions/501', { user: 2 }, 403);
  const own = await expectStatus('/submissions', { user: 2 }, 200);
  assert.deepEqual(own.data.map((s) => s.id), [500]);
  await expectStatus('/lesson-progress/701', { user: 2 }, 403);
  const progress = await expectStatus('/lesson-progress', { user: 2 }, 200);
  assert.deepEqual(progress.data.map((p) => p.id), [700]);
  await expectStatus('/submissions/501', { user: 3 }, 200);
  await expectStatus('/lesson-progress/701', { user: 3 }, 200);
  await expectStatus('/submissions/502', { user: 3 }, 403);
});
test('members cannot forge owner or score and cannot edit peers submissions', async (t) => {
  const state = installDb(t);
  await expectStatus('/submissions', { user: 2, method: 'POST', body: { assignmentId: 100, memberId: 5, content: 'Work' } }, 403);
  await expectStatus('/submissions/500', { user: 2, method: 'PATCH', body: { score: 10 } }, 403);
  await expectStatus('/submissions/501', { user: 2, method: 'PATCH', body: { content: 'Forged' } }, 403);
  await expectStatus('/submissions/500/review', { user: 2, method: 'PATCH', body: { version: 1, score: 10 } }, 403);
  assert.equal(state.writes.length, 0);
});
test('submitting records owner and timestamp on the server', async (t) => {
  installDb(t);
  const body = await expectStatus('/submissions', { user: 2, method: 'POST', body: { assignmentId: 100, content: 'Work', status: 'SUBMITTED' } }, 201);
  assert.equal(body.data.member_id, 2);
  assert.ok(Date.parse(body.data.submitted_at));
  assert.equal(body.data.score, null);
});
test('expired assignments reject submissions', async (t) => {
  const state = installDb(t);
  state.assignments[0].deadline = '2000-01-01T00:00:00Z';
  await expectStatus('/submissions', { user: 2, method: 'POST', body: { assignmentId: 100, content: 'Late', status: 'SUBMITTED' } }, 400);
});
test('reviews validate class ownership, score and submitted status, then preserve reviewer identity', async (t) => {
  installDb(t);
  await expectStatus('/submissions/500/review', { user: 4, method: 'PATCH', body: { version: 1, score: 8 } }, 403);
  await expectStatus('/submissions/500/review', { user: 3, method: 'PATCH', body: { version: 1, score: 11 } }, 400);
  const result = await expectStatus('/submissions/500/review', { user: 3, method: 'PATCH', body: { version: 1, score: 0, feedback: 'Needs work', reviewedBy: 1 } }, 200);
  assert.equal(result.data.reviewed_by, 3);
  assert.equal(result.data.score, 0);
  assert.equal(result.data.status, 'REVIEWED');
  await expectStatus('/submissions/500', { user: 2, method: 'PATCH', body: { content: 'New work' } }, 400);
  await expectStatus('/submissions/500/review', { user: 3, method: 'PATCH', body: { version: 1, score: 9 } }, 400);
});
test('duplicate progress and class membership are conflicts', async (t) => {
  installDb(t);
  await expectStatus('/lesson-progress', { user: 2, method: 'POST', body: { lessonId: 1000 } }, 409);
  await expectStatus('/class-members', { user: 3, method: 'POST', body: { classId: 10, memberId: 2 } }, 409);
});
test('profile update is partial and cannot elevate role or modify another account', async (t) => {
  installDb(t);
  const body = await expectStatus('/users/2', { user: 2, method: 'PATCH', body: { name: 'Updated name' } }, 200);
  assert.equal(body.data.email, 'member@example.com');
  assert.equal(body.data.name, 'Updated name');
  await expectStatus('/users/2', { user: 2, method: 'PATCH', body: { role: 'ADMIN' } }, 403);
  await expectStatus('/users/5', { user: 2, method: 'PATCH', body: { name: 'Changed' } }, 403);
  await expectStatus('/users/2', { user: 2, method: 'PATCH', body: { email: 'admin@example.com' } }, 409);
});
test('RBAC management forbids members and protects system roles', async (t) => {
  installDb(t);
  await expectStatus('/user-roles', { user: 2, method: 'POST', body: { userId: 2, roleId: 7 } }, 403);
  await expectStatus('/roles/7', { user: 1, method: 'DELETE' }, 403);
});
test('user-role expiry can be cleared explicitly', async (t) => {
  const state = installDb(t);
  state.userRoles.push({ user_id: 2, role_id: 7, expires_at: '2099-01-01T00:00:00Z' });
  const body = await expectStatus('/user-roles/2/7', { user: 1, method: 'PATCH', body: { expiresAt: null } }, 200);
  assert.equal(body.data.expires_at, null);
});
test('deletion returns 204 and subsequent authentication fails', async (t) => {
  installDb(t);
  const result = await request('/users/2', { user: 1, method: 'DELETE' });
  assert.equal(result.status, 204);
  assert.equal(result.body, null);
  await expectStatus('/users/me', { user: 2 }, 401);
});
test('JSON parse errors and unknown routes use the common error response', async () => {
  await expectStatus('/auth/register', { method: 'POST', rawBody: '{oops' }, 400);
  await expectStatus('/unknown-route', {}, 404);
});
test('single upload accepts req.file, and missing file returns 400', async (t) => {
  installDb(t);
  t.mock.method(r2, 'send', async () => ({}));
  await expectStatus('/upload', { user: 2, method: 'POST' }, 400);
  const data = new FormData();
  data.append('file', new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', headers: { authorization: `Bearer ${tokens.generateToken({ id: 2 })}` }, body: data });
  assert.equal(response.status, 201, JSON.stringify(await response.json()));
});
test('failed multi-upload removes files already stored and returns 503', async (t) => {
  const deleted = [];
  t.mock.method(r2, 'send', async (command) => {
    if (command.constructor.name === 'PutObjectCommand' && command.input.Body.toString() === 'fail') throw new Error('storage failure');
    if (command.constructor.name === 'DeleteObjectCommand') deleted.push(command.input.Key);
    return {};
  });
  await assert.rejects(uploads.uploadMultiFiles(['ok', 'fail'].map((content) => ({ originalname: 'file.txt', mimetype: 'text/plain', buffer: Buffer.from(content) }))), { statusCode: 503 });
  assert.equal(deleted.length, 1);
});
test('a concurrent review cannot be overwritten by an owner edit or a second review', async (t) => {
  installDb(t, stateForTest(), (sql) => {
    // Simulate a status change after the service reads the record.
    if (sql.startsWith('UPDATE submissions')) return { rows: [] };
  });
  await expectStatus('/submissions/500', { user: 2, method: 'PATCH', body: { content: 'Changed' } }, 409);
  await expectStatus('/submissions/500/review', { user: 3, method: 'PATCH', body: { version: 1, score: 8 } }, 409);
});
