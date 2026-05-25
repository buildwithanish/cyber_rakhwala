import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

export const buildSwaggerSpec = () =>
  swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: env.appName,
        version: '1.0.0',
        description:
          'Production backend for the Cyber Rakhwala frontend, including auth, billing, case management, tool orchestration, admin operations, analytics, and support workflows.'
      },
      servers: [
        {
          url: env.openApiServerUrl
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    apis: []
  });
