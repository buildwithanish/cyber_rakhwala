import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  clearHistory,
  executeOsint,
  exportResults,
  getHistory,
  getResult
} from '../../controllers/tool.controller.js';
import {
  osintActionSchema,
  searchLogListSchema
} from '../../validators/tool.validator.js';

const router = Router();

router.use(authenticate);

router.post('/:action', validate(osintActionSchema), executeOsint);
router.get('/history', validate(searchLogListSchema), getHistory);
router.delete('/history', clearHistory);
router.get('/results/:id', getResult);
router.get('/export', exportResults);

export default router;
