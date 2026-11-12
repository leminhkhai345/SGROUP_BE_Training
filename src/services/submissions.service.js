import { findPage } from "../repository/list.repository.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/error.response.js";
import * as repository from "../repository/submissions.repository.js";
import * as assignments from "../repository/assignments.repository.js";
import { requirePermission, requireClassAccess, isAdmin, sameId, hasPermission } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validatePositiveInteger, validateBody, pick, numberField } from "../utils/serviceHelper.js";
import { transaction } from "../utils/transaction.js";

const expectedVersion = (body, record) => {
  const value = body.version ?? record.version;
  validatePositiveInteger(value, "version");
  if (!sameId(value, record.version)) throw new ConflictError("Submission changed; reload before retrying");
  return value;
};

const load = async (id) => {
  validateId(id);
  const record = requireRecord(await repository.findById(id), "Submission");
  const assignment = requireRecord(await assignments.findById(record.assignment_id), "Assignment");
  return { record, assignment };
};
const canReview = (actor, classroom) => hasPermission(actor, "submissions:review") && sameId(classroom.mentor_id, actor.id);
const requireRead = async (actor, record, assignment) => {
  const classroom = await requireClassAccess(actor, assignment.class_id);
  if (!isAdmin(actor) && !sameId(record.member_id, actor.id) && !canReview(actor, classroom)) throw new ForbiddenError("You cannot access another member's submission");
};
const memberData = (body, existing) => {
  for (const field of ["score", "feedback", "reviewedBy", "reviewedAt", "submittedAt"]) {
    if (body[field] !== undefined) throw new ForbiddenError("Review fields and submission timestamps are managed by the server");
  }
  const data = pick(body, ["content", "repositoryUrl", "status"]);
  if (existing && !Object.keys(data).length) throw new BadRequestError("No submission fields supplied");
  for (const field of ["content", "repositoryUrl"]) if (data[field] !== undefined && typeof data[field] !== "string") throw new BadRequestError(`${field} must be a string`);
  const status = data.status ?? existing?.status ?? "DRAFT";
  if (!["DRAFT", "SUBMITTED"].includes(status)) throw new BadRequestError("status must be DRAFT or SUBMITTED");
  if (status === "SUBMITTED" && !(data.content ?? existing?.content)?.trim() && !(data.repositoryUrl ?? existing?.repository_url)?.trim()) throw new BadRequestError("A submitted answer must contain content or repositoryUrl");
  return { ...data, status, ...(status === "SUBMITTED" ? { submittedAt: new Date().toISOString() } : {}) };
};
const requireUnchanged = (record) => {
  if (!record) throw new ConflictError("Submission changed concurrently; reload before retrying");
  return record;
};
const requireBeforeDeadline = (assignment, status) => {
  if (status === "SUBMITTED" && assignment.deadline && new Date(assignment.deadline) < new Date()) throw new BadRequestError("Assignment deadline has passed");
};

const getAllSubmissions = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "submissions:read");
  if (options.assignmentId !== undefined) {
    validateId(options.assignmentId, "assignmentId");
    const assignment = requireRecord(await assignments.findById(options.assignmentId), "Assignment");
    await requireClassAccess(actor, assignment.class_id);
  }
  if (options.memberId !== undefined) validateId(options.memberId, "memberId");
  return findPage("submissions", options, actor);
});

const getSubmissionById = serviceAction(async (id, actor) => {
  requirePermission(actor, "submissions:read");
  const { record, assignment } = await load(id);
  await requireRead(actor, record, assignment);
  return record;
});

const createSubmission = serviceAction(async (body, actor) => {
  requirePermission(actor, "submissions:write");
  validateBody(body);
  validateId(body.assignmentId, "assignmentId");
  if (body.memberId !== undefined && !sameId(body.memberId, actor.id)) throw new ForbiddenError("You can only submit your own work");
  const assignment = requireRecord(await assignments.findById(body.assignmentId), "Assignment");
  await requireClassAccess(actor, assignment.class_id);
  const data = memberData(body);
  requireBeforeDeadline(assignment, data.status);
  return repository.create({ ...data, assignmentId: body.assignmentId, memberId: actor.id });
});

const updateSubmission = serviceAction(async (id, body, actor) => {
  requirePermission(actor, "submissions:write");
  validateBody(body);
  const { record, assignment } = await load(id);
  await requireRead(actor, record, assignment);
  if (!sameId(record.member_id, actor.id)) throw new ForbiddenError("You can only edit your own submission");
  if (record.status === "REVIEWED") throw new BadRequestError("Reviewed submissions cannot be edited");
  if (body.assignmentId !== undefined || body.memberId !== undefined) throw new BadRequestError("Submission identity cannot be changed");
  const data = memberData(body, record);
  requireBeforeDeadline(assignment, data.status);
  return requireUnchanged(await repository.update({ ...data, id, expectedStatus: record.status, expectedVersion: expectedVersion(body, record) }));
});

const reviewSubmission = serviceAction(async (id, body, actor) => {
  requirePermission(actor, "submissions:review");
  validateBody(body);
  const { record, assignment } = await load(id);
  await requireClassAccess(actor, assignment.class_id, true);
  if (record.status !== "SUBMITTED") throw new BadRequestError("Only submitted work can be reviewed");
  numberField(body.score, "score");
  if (body.feedback !== undefined && typeof body.feedback !== "string") throw new BadRequestError("feedback must be a string");
  validatePositiveInteger(body.version, "version");
  const version = expectedVersion(body, record);
  return transaction(async (db) => {
    const lockedAssignment = requireRecord(await assignments.findByIdForUpdate(assignment.id, db), "Assignment");
    if (body.score > Number(lockedAssignment.maximum_score)) throw new BadRequestError("score exceeds maximumScore");
    return requireUnchanged(await repository.update({ id, expectedStatus: "SUBMITTED", expectedVersion: version, score: body.score, feedback: body.feedback, reviewedBy: actor.id, reviewedAt: new Date().toISOString(), status: "REVIEWED" }, db));
  });
});

const deleteSubmission = serviceAction(async (id, actor) => {
  requirePermission(actor, "submissions:write");
  const { record, assignment } = await load(id);
  await requireRead(actor, record, assignment);
  if (!isAdmin(actor) && !sameId(record.member_id, actor.id)) throw new ForbiddenError("You can only delete your own submission");
  if (!isAdmin(actor) && record.status === "REVIEWED") throw new BadRequestError("Reviewed submissions cannot be deleted");
  return requireUnchanged(await repository.deleteById(id, record.status, record.version));
});

export {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  reviewSubmission,
  deleteSubmission,
};
