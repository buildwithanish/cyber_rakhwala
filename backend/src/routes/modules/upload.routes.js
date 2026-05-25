import path from 'node:path';
import multer from 'multer';
import { Router } from 'express';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { importDataset } from '../../controllers/dataset.controller.js';
import { uploadFile } from '../../controllers/upload.controller.js';

const upload = multer({
  dest: path.resolve('src', 'uploads', 'tmp')
});

const router = Router();

router.post('/uploads/file', authenticate, upload.single('file'), uploadFile);
router.post('/uploads/image', authenticate, upload.single('image'), uploadFile);
router.post(
  `/${env.admin.panelPath}/datasets/:id/import`,
  authenticate,
  authorizeRoles('admin', 'super_admin'),
  upload.single('file'),
  importDataset
);

export default router;
