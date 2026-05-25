import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  addCorrelation,
  addTag,
  bulkDelete,
  bulkVerify,
  create,
  exportList,
  getOne,
  list,
  remove,
  removeCorrelation,
  removeTag,
  statistics,
  unverify,
  update,
  verify
} from '../../controllers/evidence.controller.js';
import {
  bulkIdsSchema,
  correlationDeleteSchema,
  correlationSchema,
  createEvidenceSchema,
  evidenceIdParamSchema,
  exportEvidenceSchema,
  listEvidenceSchema,
  tagDeleteSchema,
  tagSchema,
  updateEvidenceSchema,
  verifyEvidenceSchema
} from '../../validators/evidence.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listEvidenceSchema), list);
router.get('/statistics', statistics);
router.get('/export', validate(exportEvidenceSchema), exportList);
router.get('/:id', validate(evidenceIdParamSchema), getOne);
router.post('/', validate(createEvidenceSchema), create);
router.put('/:id', validate(updateEvidenceSchema), update);
router.delete('/:id', validate(evidenceIdParamSchema), remove);
router.post('/:id/verify', validate(verifyEvidenceSchema), verify);
router.post('/:id/unverify', validate(evidenceIdParamSchema), unverify);
router.post('/:id/tags', validate(tagSchema), addTag);
router.delete('/:id/tags/:tag', validate(tagDeleteSchema), removeTag);
router.post('/:id/correlations', validate(correlationSchema), addCorrelation);
router.delete('/:id/correlations/:correlatedId', validate(correlationDeleteSchema), removeCorrelation);
router.post('/bulk-delete', validate(bulkIdsSchema), bulkDelete);
router.post('/bulk-verify', validate(bulkIdsSchema), bulkVerify);

export default router;
