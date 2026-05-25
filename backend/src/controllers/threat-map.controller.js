import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getAlerts,
  getAttackHistory,
  getAttackTypes,
  getCities,
  getCity,
  getGlobalStats,
  getIocFeed,
  getLiveAttacks,
  getRegionStats,
  getRegions,
  getStatsHistory,
  getThreatActorById,
  getThreatActors,
  getThreatIntel,
  getThreatLevel,
  markAlertRead,
  searchThreatData,
  subscribeToAlerts
} from '../services/threat-map.service.js';

export const cities = asyncHandler(async (req, res) => {
  res.success({
    message: 'Cities loaded',
    data: await getCities(req.query)
  });
});

export const cityById = asyncHandler(async (req, res) => {
  res.success({
    message: 'City loaded',
    data: await getCity(req.params.id)
  });
});

export const liveAttacks = asyncHandler(async (req, res) => {
  res.success({
    message: 'Live attacks loaded',
    data: await getLiveAttacks(req.query)
  });
});

export const globalStats = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Global statistics loaded',
    data: await getGlobalStats()
  });
});

export const threatLevel = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Threat level loaded',
    data: await getThreatLevel()
  });
});

export const attackTypes = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Attack types loaded',
    data: await getAttackTypes()
  });
});

export const intel = asyncHandler(async (req, res) => {
  res.success({
    message: 'Threat intelligence loaded',
    data: await getThreatIntel(req.query)
  });
});

export const actors = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Threat actors loaded',
    data: await getThreatActors()
  });
});

export const actorById = asyncHandler(async (req, res) => {
  res.success({
    message: 'Threat actor loaded',
    data: await getThreatActorById(req.params.id)
  });
});

export const iocFeed = asyncHandler(async (_req, res) => {
  res.success({
    message: 'IOC feed loaded',
    data: await getIocFeed()
  });
});

export const regions = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Regions loaded',
    data: await getRegions()
  });
});

export const regionStats = asyncHandler(async (req, res) => {
  res.success({
    message: 'Region statistics loaded',
    data: await getRegionStats(req.params.region)
  });
});

export const attackHistory = asyncHandler(async (req, res) => {
  res.success({
    message: 'Attack history loaded',
    data: await getAttackHistory(req.query)
  });
});

export const statsHistory = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Statistics history loaded',
    data: await getStatsHistory()
  });
});

export const alerts = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Alerts loaded',
    data: await getAlerts()
  });
});

export const readAlert = asyncHandler(async (req, res) => {
  res.success({
    message: 'Alert updated',
    data: await markAlertRead(req.params.id)
  });
});

export const subscribe = asyncHandler(async (req, res) => {
  res.success({
    message: 'Alert subscription saved',
    data: await subscribeToAlerts(req.body)
  });
});

export const search = asyncHandler(async (req, res) => {
  res.success({
    message: 'Threat search completed',
    data: await searchThreatData(req.body)
  });
});

export const filterAttacks = asyncHandler(async (req, res) => {
  res.success({
    message: 'Filtered attacks loaded',
    data: await getLiveAttacks(req.body)
  });
});
