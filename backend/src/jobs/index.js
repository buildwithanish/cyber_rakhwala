import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ThreatEvent } from '../models/ThreatEvent.js';
import { emitThreatEvent } from '../sockets/index.js';

const sampleCities = [
  { id: 'mumbai', name: 'Mumbai', country: 'India', coords: [72.8777, 19.076], region: 'APAC' },
  { id: 'delhi', name: 'Delhi', country: 'India', coords: [77.1025, 28.7041], region: 'APAC' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', coords: [103.8198, 1.3521], region: 'APAC' },
  { id: 'london', name: 'London', country: 'United Kingdom', coords: [-0.1276, 51.5072], region: 'EMEA' },
  { id: 'new-york', name: 'New York', country: 'United States', coords: [-74.006, 40.7128], region: 'AMER' }
];

const attackTypes = ['DDoS', 'Phishing', 'APT', 'Botnet', 'Ransomware', 'Credential Stuffing'];

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

const createSimulatedThreat = async () => {
  const sourceCity = randomItem(sampleCities);
  const targetCity = randomItem(sampleCities.filter((item) => item.id !== sourceCity.id));
  const event = await ThreatEvent.create({
    sourceCity,
    targetCity,
    attackType: randomItem(attackTypes),
    severity: Math.ceil(Math.random() * 10),
    packets: Math.floor(Math.random() * 100000),
    protocol: randomItem(['TCP', 'UDP', 'HTTPS']),
    region: targetCity.region,
    source: 'simulator'
  });
  emitThreatEvent(event.toObject());
};

export const startJobs = () => {
  if (env.features.threatSimulator) {
    cron.schedule('*/2 * * * *', async () => {
      try {
        await createSimulatedThreat();
      } catch (error) {
        logger.error({ err: error }, 'Threat simulation job failed');
      }
    });
  }

  logger.info('Background jobs initialized');
};
