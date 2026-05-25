import { Router } from 'express';
import {
  actorById,
  actors,
  alerts,
  attackHistory,
  attackTypes,
  cities,
  cityById,
  filterAttacks,
  globalStats,
  intel,
  iocFeed,
  liveAttacks,
  readAlert,
  regionStats,
  regions,
  search,
  statsHistory,
  subscribe,
  threatLevel
} from '../../controllers/threat-map.controller.js';

const router = Router();

router.get('/cities', cities);
router.get('/cities/:id', cityById);
router.get('/attacks/live', liveAttacks);
router.post('/attacks/filter', filterAttacks);
router.get('/attacks/history', attackHistory);
router.get('/stats/global', globalStats);
router.get('/stats/global/attack-types', attackTypes);
router.get('/stats/history', statsHistory);
router.get('/threat-level', threatLevel);
router.get('/intel', intel);
router.get('/actors', actors);
router.get('/actors/:id', actorById);
router.get('/ioc', iocFeed);
router.get('/regions', regions);
router.get('/regions/:region/stats', regionStats);
router.get('/alerts', alerts);
router.patch('/alerts/:id', readAlert);
router.post('/alerts/subscribe', subscribe);
router.post('/search', search);

export default router;
