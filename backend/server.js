import http from 'node:http';
import { env } from './src/config/env.js';
import { connectDatabase } from './src/config/database.js';
import { logger } from './src/config/logger.js';
import { createApp } from './src/app.js';
import { initializeSockets } from './src/sockets/index.js';
import { startJobs } from './src/jobs/index.js';

const startServer = async () => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  initializeSockets(server);
  startJobs();

  server.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        environment: env.nodeEnv
      },
      `${env.appName} started`
    );
  });
};

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
