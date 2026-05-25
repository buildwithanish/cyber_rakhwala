import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addCaseNote,
  addCaseTeamMember,
  addCaseTimelineEvent,
  createCaseRecord,
  deleteCaseTimelineEvent,
  deleteCaseRecord,
  exportCases,
  getCaseById,
  getCaseStatistics,
  linkEvidenceToCase,
  listCases,
  removeCaseTeamMember,
  unlinkEvidenceFromCase,
  updateCaseTimelineEvent,
  updateCaseTeamMemberRole,
  updateCaseRecord
} from '../services/case.service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await listCases({
    query: req.validated?.query || req.query,
    user: req.user
  });
  res.success({
    message: 'Cases loaded',
    data: result.items,
    meta: result.meta
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await getCaseById({
    id: req.validated.params.id,
    user: req.user
  });
  res.success({
    message: 'Case loaded',
    data: item
  });
});

export const create = asyncHandler(async (req, res) => {
  const item = await createCaseRecord({
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    statusCode: 201,
    message: 'Case created',
    data: item
  });
});

export const update = asyncHandler(async (req, res) => {
  const item = await updateCaseRecord({
    id: req.validated.params.id,
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    message: 'Case updated',
    data: item
  });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteCaseRecord({
    id: req.validated.params.id,
    user: req.user,
    req
  });
  res.success({
    message: 'Case deleted'
  });
});

export const addEvidence = asyncHandler(async (req, res) => {
  const item = await linkEvidenceToCase({
    caseId: req.validated.params.id,
    evidenceId: req.validated.body.evidenceId,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence linked to case',
    data: item
  });
});

export const removeEvidence = asyncHandler(async (req, res) => {
  const item = await unlinkEvidenceFromCase({
    caseId: req.validated.params.id,
    evidenceId: req.validated.params.evidenceId,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence removed from case',
    data: item
  });
});

export const addNote = asyncHandler(async (req, res) => {
  const item = await addCaseNote({
    caseId: req.validated.params.id,
    content: req.validated.body.content,
    user: req.user,
    req
  });
  res.success({
    message: 'Note added',
    data: item
  });
});

export const addTeamMember = asyncHandler(async (req, res) => {
  const item = await addCaseTeamMember({
    caseId: req.validated.params.id,
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    message: 'Team member added',
    data: item
  });
});

export const addTimelineEvent = asyncHandler(async (req, res) => {
  const item = await addCaseTimelineEvent({
    caseId: req.validated.params.id,
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    message: 'Timeline event added',
    data: item
  });
});

export const updateTimelineEvent = asyncHandler(async (req, res) => {
  const item = await updateCaseTimelineEvent({
    caseId: req.validated.params.id,
    timelineId: req.validated.params.timelineId,
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    message: 'Timeline event updated',
    data: item
  });
});

export const removeTimelineEvent = asyncHandler(async (req, res) => {
  const item = await deleteCaseTimelineEvent({
    caseId: req.validated.params.id,
    timelineId: req.validated.params.timelineId,
    user: req.user,
    req
  });
  res.success({
    message: 'Timeline event removed',
    data: item
  });
});

export const removeTeamMember = asyncHandler(async (req, res) => {
  const item = await removeCaseTeamMember({
    caseId: req.validated.params.id,
    memberId: req.validated.params.memberId,
    user: req.user,
    req
  });
  res.success({
    message: 'Team member removed',
    data: item
  });
});

export const updateTeamMemberRole = asyncHandler(async (req, res) => {
  const item = await updateCaseTeamMemberRole({
    caseId: req.validated.params.id,
    memberId: req.validated.params.memberId,
    role: req.validated.body.role,
    user: req.user,
    req
  });
  res.success({
    message: 'Team member role updated',
    data: item
  });
});

export const statistics = asyncHandler(async (req, res) => {
  const stats = await getCaseStatistics(req.user);
  res.success({
    message: 'Case statistics loaded',
    data: stats
  });
});

export const exportCaseList = asyncHandler(async (req, res) => {
  const data = await exportCases({
    user: req.user,
    format: req.validated.query.format
  });
  res.success({
    message: 'Cases exported',
    data
  });
});
