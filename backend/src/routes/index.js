import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { env } from '../config/env.js';
import accountRoutes from './modules/account.routes.js';
import adminAuthRoutes from './modules/admin-auth.routes.js';
import adminRoutes from './modules/admin.routes.js';
import authRoutes from './modules/auth.routes.js';
import billingRoutes from './modules/billing.routes.js';
import caseRoutes from './modules/case.routes.js';
import evidenceRoutes from './modules/evidence.routes.js';
import osintRoutes from './modules/osint.routes.js';
import publicRoutes from './modules/public.routes.js';
import threatMapRoutes from './modules/threat-map.routes.js';
import toolRoutes from './modules/tool.routes.js';
import uploadRoutes from './modules/upload.routes.js';

export const registerRoutes = (app, { swaggerSpec }) => {
  const router = Router();
  const adminApiBase = `/api/${env.admin.panelPath}`;

  router.get('/', (_req, res) => {
    res.success({
      message: 'Cyber Rakhwala API',
      data: {
        version: '1.0.0',
        docs: '/docs'
      }
    });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/auth', authRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api/evidence', evidenceRoutes);
  app.use('/api/account', accountRoutes);
  app.use(`${adminApiBase}/auth`, adminAuthRoutes);
  app.use(adminApiBase, adminRoutes);
  if (env.admin.allowLegacyRoute) {
    app.use('/api/admin', adminRoutes);
  }
  app.use('/api/osint', osintRoutes);
  app.use('/api/tools', toolRoutes);
  app.use('/api/threat-map', threatMapRoutes);
  app.use('/api', billingRoutes);
  app.use('/api', uploadRoutes);
  app.use('/api', publicRoutes);
  app.use('/api', router);
};
