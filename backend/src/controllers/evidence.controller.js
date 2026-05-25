import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addEvidenceCorrelation,
  addEvidenceTag,
  bulkDeleteEvidence,
  bulkVerifyEvidence,
  createEvidenceRecord,
  deleteEvidenceRecord,
  exportEvidence,
  getEvidenceById,
  getEvidenceStatistics,
  listEvidence,
  removeEvidenceCorrelation,
  removeEvidenceTag,
  unverifyEvidenceRecord,
  updateEvidenceRecord,
  verifyEvidenceRecord
} from '../services/evidence.service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await listEvidence({
    query: req.validated?.query || req.query,
    user: req.user
  });
  res.success({
    message: 'Evidence loaded',
    data: result.items,
    meta: result.meta
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const item = await getEvidenceById({
    id: req.validated.params.id,
    user: req.user
  });
  res.success({
    message: 'Evidence loaded',
    data: item
  });
});

export const create = asyncHandler(async (req, res) => {
  const item = await createEvidenceRecord({
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    statusCode: 201,
    message: 'Evidence created',
    data: item
  });
});

export const update = asyncHandler(async (req, res) => {
  const item = await updateEvidenceRecord({
    id: req.validated.params.id,
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence updated',
    data: item
  });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteEvidenceRecord({
    id: req.validated.params.id,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence deleted'
  });
});

export const verify = asyncHandler(async (req, res) => {
  const item = await verifyEvidenceRecord({
    id: req.validated.params.id,
    notes: req.validated.body.notes,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence verified',
    data: item
  });
});

export const unverify = asyncHandler(async (req, res) => {
  const item = await unverifyEvidenceRecord({
    id: req.validated.params.id,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence unverified',
    data: item
  });
});

export const addTag = asyncHandler(async (req, res) => {
  const item = await addEvidenceTag({
    id: req.validated.params.id,
    tag: req.validated.body.tag,
    user: req.user,
    req
  });
  res.success({
    message: 'Tag added',
    data: item
  });
});

export const removeTag = asyncHandler(async (req, res) => {
  const item = await removeEvidenceTag({
    id: req.validated.params.id,
    tag: decodeURIComponent(req.validated.params.tag),
    user: req.user,
    req
  });
  res.success({
    message: 'Tag removed',
    data: item
  });
});

export const addCorrelation = asyncHandler(async (req, res) => {
  const item = await addEvidenceCorrelation({
    id: req.validated.params.id,
    correlatedId: req.validated.body.correlatedId,
    correlationType: req.validated.body.correlationType,
    user: req.user,
    req
  });
  res.success({
    message: 'Correlation added',
    data: item
  });
});

export const removeCorrelation = asyncHandler(async (req, res) => {
  const item = await removeEvidenceCorrelation({
    id: req.validated.params.id,
    correlatedId: req.validated.params.correlatedId,
    user: req.user,
    req
  });
  res.success({
    message: 'Correlation removed',
    data: item
  });
});

export const statistics = asyncHandler(async (req, res) => {
  const data = await getEvidenceStatistics(req.user);
  res.success({
    message: 'Evidence statistics loaded',
    data
  });
});

export const exportList = asyncHandler(async (req, res) => {
  const ids = req.validated.query.ids ? req.validated.query.ids.split(',') : [];
  const data = await exportEvidence({
    user: req.user,
    format: req.validated.query.format,
    ids
  });
  res.success({
    message: 'Evidence exported',
    data
  });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const count = await bulkDeleteEvidence({
    ids: req.validated.body.ids,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence deleted',
    data: {
      deletedCount: count
    }
  });
});

export const bulkVerify = asyncHandler(async (req, res) => {
  const count = await bulkVerifyEvidence({
    ids: req.validated.body.ids,
    user: req.user,
    req
  });
  res.success({
    message: 'Evidence verified',
    data: {
      verifiedCount: count
    }
  });
});
