import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

export const connectDatabase = async () => {
  if (env.dnsServers.length > 0) {
    dns.setServers(env.dnsServers);
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      autoIndex: env.nodeEnv !== 'production'
    });

    logger.info(
      {
        mongoHost: mongoose.connection.host,
        dnsServers: env.dnsServers
      },
      'MongoDB connected'
    );
  } catch (error) {
    if (error?.syscall === 'querySrv' || error?.code === 'ECONNREFUSED') {
      logger.error(
        {
          err: error,
          dnsServers: env.dnsServers,
          hint:
            'Atlas SRV lookup failed. Try changing DNS_SERVERS, allowing DNS on your network, or use the standard non-SRV MongoDB connection string from Atlas.'
        },
        'MongoDB SRV lookup failed'
      );
    }

    throw error;
  }
};
