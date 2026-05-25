import path from 'node:path';
import multer from 'multer';
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { createRateLimiters } from '../../middleware/rateLimit.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  clearHistory,
  executeOsint,
  executeTool,
  getHistory,
  removeHistoryItem,
  updateBookmark
} from '../../controllers/tool.controller.js';
import {
  osintActionSchema,
  searchLogBookmarkSchema,
  searchLogIdParamSchema,
  searchLogListSchema,
  toolActionSchema
} from '../../validators/tool.validator.js';

const upload = multer({
  dest: path.resolve('src', 'uploads', 'tmp')
});

const router = Router();
const rateLimiters = createRateLimiters();

router.use(authenticate);
router.use(rateLimiters.search);

router.post('/osint/:action', validate(osintActionSchema), executeOsint);
router.get('/osint/history', validate(searchLogListSchema), getHistory);
router.delete('/osint/history', validate(searchLogListSchema), clearHistory);
router.get('/search-history', validate(searchLogListSchema), getHistory);
router.delete('/search-history', validate(searchLogListSchema), clearHistory);
router.delete('/search-history/:id', validate(searchLogIdParamSchema), removeHistoryItem);
router.patch('/search-history/:id/bookmark', validate(searchLogBookmarkSchema), updateBookmark);
router.get('/:category/:action', validate(toolActionSchema), executeTool);
router.get('/:category/:action/:entityId', validate(toolActionSchema), executeTool);
router.post('/:category/:action', upload.any(), validate(toolActionSchema), executeTool);
router.post('/:category/:action/:entityId', upload.any(), validate(toolActionSchema), executeTool);

export default router;
