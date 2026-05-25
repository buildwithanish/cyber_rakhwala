import { Router } from 'express';
import { adminLogin } from '../../controllers/auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { loginSchema } from '../../validators/auth.validator.js';

const router = Router();

router.post('/login', validate(loginSchema), adminLogin);

export default router;
