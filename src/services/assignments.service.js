import { BadRequestError } from "../core/error.response.js";
import * as repository from "../repository/assignments.repository.js";
import { classResourceService } from "../utils/classResourceService.js";
import { serviceAction, validateId, validateBody, requireRecord, pick, textField, dateField, numberField } from "../utils/serviceHelper.js";
import { requirePermission, requireClassAccess } from "./authorization.service.js";
import { transaction } from "../utils/transaction.js";

const prepare = (body, existing) => {
  const data = pick(body, ["title", "description", "deadline", "maximumScore", "imageUrl"]);
  if (!Object.keys(data).length) throw new BadRequestError("No assignment fields supplied");
  data.title = textField(data.title, "title", !existing);
  for (const field of ["description", "imageUrl"]) if (data[field] !== undefined && typeof data[field] !== "string") throw new BadRequestError(`${field} must be a string`);
  dateField(data.deadline, "deadline");
  if (!existing || data.maximumScore !== undefined) numberField(data.maximumScore, "maximumScore", 0.01);
  return data;
};

const service = classResourceService({
  repository, resource: "assignments", label: "Assignment",
  prepare,
});
const getAllAssignments = service.getAll;
const getAssignmentById = service.getById;
const createAssignment = service.create;
const updateAssignment = serviceAction(async (id, body, actor) => {
  requirePermission(actor, "assignments:write");
  validateId(id);
  validateBody(body);
  if (body.classId !== undefined || body.createdBy !== undefined) throw new BadRequestError("Class and creator cannot be changed");
  const existing = requireRecord(await repository.findById(id), "Assignment");
  await requireClassAccess(actor, existing.class_id, true);
  const data = prepare(body, existing);
  return transaction(async (db) => {
    requireRecord(await repository.findByIdForUpdate(id, db), "Assignment");
    if (data.maximumScore !== undefined && await repository.hasScoreAbove(id, data.maximumScore, db)) {
      throw new BadRequestError("maximumScore cannot be lower than an existing submission score");
    }
    return requireRecord(await repository.update({ ...data, id }, db), "Assignment");
  });
});
const deleteAssignment = service.delete;

export {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
