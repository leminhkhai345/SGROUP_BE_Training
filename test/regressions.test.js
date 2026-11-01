import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import express from "express";
import sharp from "sharp";
import { PGlite } from "@electric-sql/pglite";

process.env.ACCESS_TOKEN_SECRET = "regression-test-only";
process.env.REFRESH_TOKEN_SECRET = "regression-refresh-only";
process.env.R2_ACCOUNT_ID = "test-account";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_BUCKET_NAME = "test-bucket";
const { default: app } = await import("../src/app.js");
const { default: pool } = await import("../src/config/db.config.js");
const { default: r2 } = await import("../src/config/r2.config.js");
const { generateToken } = await import("../src/utils/jwtHelper.js");
const { createAuthLimiter } = await import("../src/middleware/rateLimit.middleware.js");
let db, server, baseUrl, afterSubmissionRead;
let commands = [], queries = [];

before(async () => {
  db = await PGlite.create();
  await db.exec(await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"));
  // Exercise the upgrade path from a database created before the version column existed.
  await db.exec(`
    INSERT INTO users (id, name, email, password_hash) VALUES (1, 'Existing', 'existing@example.test', 'unused');
    INSERT INTO classes (id, name, mentor_id) VALUES (1, 'Existing', 1);
    INSERT INTO assignments (id, class_id, title, maximum_score, created_by) VALUES (1, 1, 'Existing', 10, 1);
    INSERT INTO submissions (id, assignment_id, member_id, content) VALUES (1, 1, 1, 'Keep this answer');
    ALTER TABLE submissions DROP COLUMN version;
  `);
  const migration = await readFile(new URL("../database/migrations/001_submission_version.sql", import.meta.url), "utf8");
  await db.exec(migration);
  await db.exec(migration);
  const migrated = (await db.query("SELECT content, version FROM submissions WHERE id = 1")).rows[0];
  assert.equal(migrated.content, "Keep this answer");
  assert.equal(Number(migrated.version), 1);
  pool.query = async (sql, params = []) => {
    queries.push(sql);
    const result = await db.query(sql, params);
    if (afterSubmissionRead && /FROM submissions WHERE id/.test(sql)) {
      const action = afterSubmissionRead;
      afterSubmissionRead = undefined;
      await action();
    }
    return result;
  };
  pool.connect = async () => ({ query: (...args) => pool.query(...args), release() {} });
  r2.send = async (command) => { commands.push(command); return {}; };
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  commands = [];
  queries = [];
  afterSubmissionRead = undefined;
  await db.exec(`
    TRUNCATE users, roles, permissions, classes RESTART IDENTITY CASCADE;
    INSERT INTO users (id, name, email, password_hash, role) VALUES
      (1, 'Admin', 'admin@example.test', 'unused', 'ADMIN'),
      (2, 'Member', 'member@example.test', 'unused', 'MEMBER'),
      (3, 'Mentor', 'mentor@example.test', 'unused', 'MENTOR'),
      (4, 'Other mentor', 'other@example.test', 'unused', 'MENTOR'),
      (5, 'Peer', 'peer@example.test', 'unused', 'MEMBER');
    INSERT INTO classes (id, name, mentor_id) VALUES (10, 'Own', 3), (20, 'Other', 4);
    INSERT INTO class_members (class_id, member_id) VALUES (10, 2), (10, 5);
    INSERT INTO lessons (id, class_id, title, created_by) VALUES (1000, 10, 'Lesson A', 3), (2000, 20, 'Lesson B', 4);
    INSERT INTO assignments (id, class_id, title, maximum_score, created_by) VALUES (100, 10, 'Assignment A', 10, 3), (200, 20, 'Assignment B', 10, 4);
    INSERT INTO submissions (id, assignment_id, member_id, content, status) VALUES
      (500, 100, 2, 'Original answer', 'SUBMITTED'), (501, 100, 5, 'Peer answer', 'SUBMITTED'), (502, 200, 5, 'Other class', 'SUBMITTED');
    INSERT INTO lesson_progress (lesson_id, member_id) VALUES (1000, 2), (1000, 5), (2000, 5);
  `);
  await db.exec(await readFile(new URL("../database/seed-rbac.sql", import.meta.url), "utf8"));
});

after(async () => {
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
  await db?.close();
});

async function request(path, { user = 2, method = "GET", body } = {}) {
  const multipart = body instanceof FormData;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${generateToken({ id: user })}`, ...(!multipart && body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  const raw = await response.text();
  return { status: response.status, body: raw ? JSON.parse(raw) : null };
}
const avatarBody = (buffer, type = "image/png", name = "avatar.png") => {
  const body = new FormData();
  body.append("file", new Blob([buffer], { type }), name);
  return body;
};

test("review rejects a content change with the same status using the real SQL version predicate", async () => {
  afterSubmissionRead = () => db.query("UPDATE submissions SET content = 'Concurrent edit', version = version + 1 WHERE id = 500");
  const response = await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 8, version: 1 } });
  assert.equal(response.status, 409, JSON.stringify(response.body));
  const { rows: [record] } = await db.query("SELECT * FROM submissions WHERE id = 500");
  assert.equal(record.content, "Concurrent edit");
  assert.equal(record.status, "SUBMITTED");
  assert.equal(record.score, null);
});

test("review requires the version the mentor saw and increments it after successful grading", async () => {
  assert.equal((await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 8 } })).status, 400);
  await db.query("UPDATE submissions SET version = 2 WHERE id = 500");
  assert.equal((await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 8, version: 1 } })).status, 409);
  const response = await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 8, version: 2 } });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(Number(response.body.data.version), 3);
  assert.equal(Number(response.body.data.score), 8);
});

test("owner updates reject stale versions and cannot overwrite a concurrent edit", async () => {
  afterSubmissionRead = () => db.query("UPDATE submissions SET content = 'Other edit', version = version + 1 WHERE id = 500");
  assert.equal((await request("/submissions/500", { method: "PATCH", body: { content: "Overwrite", version: 1 } })).status, 409);
  assert.equal((await request("/submissions/500", { method: "PATCH", body: { content: "Still stale", version: 1 } })).status, 409);
  const response = await request("/submissions/500", { method: "PATCH", body: { content: "New answer", version: 2 } });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.content, "New answer");
  assert.equal(Number(response.body.data.version), 3);
});

test("maximumScore cannot fall below existing scores and both writes lock the assignment", async () => {
  assert.equal((await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 8, version: 1 } })).status, 200);
  assert.equal((await request("/assignments/100", { user: 3, method: "PATCH", body: { maximumScore: 5 } })).status, 400);
  const { rows: [assignment] } = await db.query("SELECT maximum_score FROM assignments WHERE id = 100");
  assert.equal(Number(assignment.maximum_score), 10);
  assert.equal((await request("/assignments/100", { user: 3, method: "PATCH", body: { maximumScore: 8 } })).status, 200);
  assert.equal(queries.filter((sql) => /FROM assignments .*FOR UPDATE/.test(sql)).length, 3);
});

test("review validates against the current locked maximumScore rather than an earlier read", async () => {
  assert.equal((await request("/assignments/100", { user: 3, method: "PATCH", body: { maximumScore: 5 } })).status, 200);
  assert.equal((await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 8, version: 1 } })).status, 400);
  assert.equal((await request("/submissions/500/review", { user: 3, method: "PATCH", body: { score: 5, version: 1 } })).status, 200);
});

test("all resource lists execute PostgreSQL with bounded pagination and preserve private fields", async () => {
  for (const path of ["users", "classes", "class-members", "lessons", "assignments", "submissions", "lesson-progress", "roles", "permissions", "user-roles", "role-permissions"]) {
    const response = await request(`/${path}?limit=1`, { user: 1 });
    assert.equal(response.status, 200, `${path}: ${JSON.stringify(response.body)}`);
    assert.ok(response.body.data.length <= 1);
    if (path === "users") assert.equal(response.body.data[0].password_hash, undefined);
  }
  const first = await request("/classes?limit=1", { user: 1 });
  const second = await request("/classes?limit=1&page=2", { user: 1 });
  assert.notEqual(first.body.data[0].id, second.body.data[0].id);
  assert.deepEqual((await request("/classes?limit=1&page=1&order=DESC", { user: 1 })).body.data.map((r) => Number(r.id)), [20]);
});

test("SQL applies class and submission ownership before pagination without per-record queries", async () => {
  await db.exec("INSERT INTO classes (id, name, mentor_id) VALUES (5, 'Hidden first', 4)");
  assert.deepEqual((await request("/classes?limit=1")).body.data.map((r) => Number(r.id)), [10]);
  assert.deepEqual((await request("/lessons?limit=1")).body.data.map((r) => Number(r.id)), [1000]);
  queries = [];
  const own = await request("/submissions?assignmentId=100&memberId=2&limit=1");
  assert.deepEqual(own.body.data.map((r) => Number(r.id)), [500]);
  // Auth (2), explicit filter authorization (3), one bounded list query (1).
  assert.equal(queries.length, 6);
  assert.deepEqual((await request("/submissions?memberId=5")).body.data, []);
  assert.deepEqual((await request("/lesson-progress?memberId=5")).body.data, []);
  assert.equal((await request("/submissions", { user: 3 })).body.data.length, 2);
  assert.equal((await request("/lesson-progress", { user: 3 })).body.data.length, 2);
  await db.exec("UPDATE classes SET is_deleted = TRUE WHERE id = 10");
  assert.deepEqual((await request("/submissions", { user: 1 })).body.data.map((r) => Number(r.id)), [502]);
});

test("pagination rejects excessive, malformed and repeated parameters", async () => {
  for (const query of ["limit=101", "limit=0", "page=-1", "limit=1&limit=2", "page=1.5", "page=999999999999999999", "sortBy=id%3BDROP%20TABLE%20users"]) {
    assert.equal((await request(`/classes?${query}`, { user: 1 })).status, 400, query);
  }
});

test("RBAC list filters combine instead of ignoring the second filter", async () => {
  await db.exec("INSERT INTO user_roles (user_id, role_id) SELECT 2, id FROM roles WHERE code IN ('MENTOR', 'MEMBER')");
  const roles = (await db.query("SELECT id, code FROM roles")).rows;
  const mentor = roles.find((r) => r.code === "MENTOR");
  const response = await request(`/user-roles?userId=2&roleId=${mentor.id}`, { user: 1 });
  assert.equal(response.body.data.length, 1);
  assert.equal(String(response.body.data[0].role_id), String(mentor.id));
});

test("avatar rejects HTML, forged image MIME types and truncated images before storage", async () => {
  for (const [buffer, type, name] of [[Buffer.from("<html>test</html>"), "text/html", "avatar.html"], [Buffer.from("<html>test</html>"), "image/png", "avatar.png"], [Buffer.from([0x89, 0x50, 0x4e, 0x47]), "image/png", "avatar.png"]]) {
    assert.equal((await request("/users/avatar", { method: "POST", body: avatarBody(buffer, type, name) })).status, 400);
  }
  assert.equal(commands.length, 0);
});

test("avatar decodes pixels, returns consistent signed URLs and deletes the old file after saving", async () => {
  const previousKey = "uploads/2/previous.webp";
  await db.query("UPDATE users SET avt_url = $1 WHERE id = 2", [previousKey]);
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer();
  const response = await request("/users/avatar", { method: "POST", body: avatarBody(png) });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const put = commands.find((c) => c.constructor.name === "PutObjectCommand");
  assert.equal(put.input.ContentType, "image/webp");
  assert.match(put.input.Key, /^uploads\/2\/.+\.webp$/);
  assert.equal((await sharp(put.input.Body).metadata()).format, "webp");
  assert.equal(commands.find((c) => c.constructor.name === "DeleteObjectCommand").input.Key, previousKey);
  for (const [path, user] of [["/users/me", 2], ["/users/2", 1], ["/users", 1]]) {
    const result = await request(path, { user });
    const record = Array.isArray(result.body.data) ? result.body.data.find((u) => Number(u.id) === 2) : result.body.data;
    assert.match(record.avt_url, /^https:\/\//);
    assert.ok(record.avt_url.includes("X-Amz-Signature="));
  }
});

test("avatar database failure cleans up the new file and preserves the old one", async () => {
  const previousKey = "uploads/2/previous.webp";
  await db.query("UPDATE users SET avt_url = $1 WHERE id = 2", [previousKey]);
  await db.exec("CREATE FUNCTION fail_avatar_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER test_avatar_failure BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fail_avatar_update()");
  try {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer();
    assert.equal((await request("/users/avatar", { method: "POST", body: avatarBody(png) })).status, 500);
    const deletion = commands.find((c) => c.constructor.name === "DeleteObjectCommand");
    assert.ok(deletion);
    assert.notEqual(deletion.input.Key, previousKey);
    assert.equal((await db.query("SELECT avt_url FROM users WHERE id = 2")).rows[0].avt_url, previousKey);
  } finally {
    await db.exec("DROP TRIGGER test_avatar_failure ON users; DROP FUNCTION fail_avatar_update()");
  }
});

test("concurrent avatar replacement returns 409 and cleans only the losing upload", async () => {
  const previousKey = "uploads/2/previous.webp";
  const winningKey = "uploads/2/winning.webp";
  await db.query("UPDATE users SET avt_url = $1 WHERE id = 2", [previousKey]);
  const originalSend = r2.send;
  r2.send = async (command) => {
    if (command.constructor.name === "PutObjectCommand") {
      await db.query("UPDATE users SET avt_url = $1 WHERE id = 2", [winningKey]);
    }
    return originalSend(command);
  };
  try {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).png().toBuffer();
    assert.equal((await request("/users/avatar", { method: "POST", body: avatarBody(png) })).status, 409);
    assert.equal((await db.query("SELECT avt_url FROM users WHERE id = 2")).rows[0].avt_url, winningKey);
    const put = commands.find((c) => c.constructor.name === "PutObjectCommand");
    const deleted = commands.filter((c) => c.constructor.name === "DeleteObjectCommand").map((c) => c.input.Key);
    assert.deepEqual(deleted, [put.input.Key]);
  } finally {
    r2.send = originalSend;
  }
});

test("file URL renewal is scoped to the uploader and never signs another member's file", async () => {
  const data = new FormData();
  data.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");
  const upload = await request("/upload", { method: "POST", body: data });
  assert.equal(upload.status, 201);
  const key = upload.body.data.key;
  assert.match(key, /^uploads\/2\//);
  const renewal = await request("/upload/url", { method: "POST", body: { key } });
  assert.equal(renewal.status, 200);
  assert.equal(renewal.body.data.expiresIn, 3600);
  assert.match(renewal.body.data.url, /^https:\/\//);
  assert.equal((await request("/upload/url", { user: 5, method: "POST", body: { key } })).status, 403);
  assert.equal((await request("/upload/url", { method: "POST", body: { key: "uploads/2/../private" } })).status, 400);
});

test("auth rate limit responds with JSON 429 and Retry-After without trusting forged proxy headers", async () => {
  const isolated = express();
  isolated.use(createAuthLimiter({ limit: 2 }));
  isolated.post("/auth/login", (req, res) => res.status(401).json({ success: false }));
  const local = isolated.listen(0, "127.0.0.1");
  await once(local, "listening");
  try {
    const url = `http://127.0.0.1:${local.address().port}/auth/login`;
    for (let i = 0; i < 2; i++) assert.equal((await fetch(url, { method: "POST" })).status, 401);
    const blocked = await fetch(url, { method: "POST" });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    assert.equal((await blocked.json()).success, false);
    // req.ip remains the socket address: the app does not enable trust proxy.
    const forged = await fetch(url, { method: "POST", headers: { "x-forwarded-for": "192.0.2.123" } });
    assert.equal(forged.status, 429);
  } finally {
    local.closeAllConnections();
    await new Promise((resolve) => local.close(resolve));
  }
});
