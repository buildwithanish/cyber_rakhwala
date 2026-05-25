import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  addEvidence,
  addNote,
  addTeamMember,
  addTimelineEvent,
  create,
  exportCaseList,
  getOne,
  list,
  remove,
  removeEvidence,
  removeTeamMember,
  removeTimelineEvent,
  statistics,
  updateTimelineEvent,
  updateTeamMemberRole,
  update
} from '../../controllers/case.controller.js';
import {
  caseEvidenceDeleteSchema,
  caseEvidenceSchema,
  caseIdParamSchema,
  caseNoteSchema,
  caseTimelineSchema,
  caseTeamMemberParamSchema,
  caseTeamMemberUpdateSchema,
  caseTeamSchema,
  caseTimelineParamSchema,
  createCaseSchema,
  exportCasesSchema,
  listCasesSchema,
  caseTimelineUpdateSchema,
  updateCaseSchema
} from '../../validators/case.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listCasesSchema), list);
router.get('/statistics', statistics);
router.get('/export', validate(exportCasesSchema), exportCaseList);
router.get('/:id', validate(caseIdParamSchema), getOne);
router.post('/', validate(createCaseSchema), create);
router.put('/:id', validate(updateCaseSchema), update);
router.delete('/:id', validate(caseIdParamSchema), remove);
router.post('/:id/evidence', validate(caseEvidenceSchema), addEvidence);
router.delete('/:id/evidence/:evidenceId', validate(caseEvidenceDeleteSchema), removeEvidence);
router.post('/:id/notes', validate(caseNoteSchema), addNote);
router.post('/:id/timeline', validate(caseTimelineSchema), addTimelineEvent);
router.patch('/:id/timeline/:timelineId', validate(caseTimelineUpdateSchema), updateTimelineEvent);
router.delete('/:id/timeline/:timelineId', validate(caseTimelineParamSchema), removeTimelineEvent);
router.post('/:id/team', validate(caseTeamSchema), addTeamMember);
router.patch('/:id/team/:memberId', validate(caseTeamMemberUpdateSchema), updateTeamMemberRole);
router.delete('/:id/team/:memberId', validate(caseTeamMemberParamSchema), removeTeamMember);

export default router;
