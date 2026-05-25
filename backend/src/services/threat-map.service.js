import { ThreatAlert } from '../models/ThreatAlert.js';
import { ThreatEvent } from '../models/ThreatEvent.js';
import { Setting } from '../models/Setting.js';

const buildCityMap = (events) => {
  const map = new Map();

  for (const event of events) {
    for (const city of [event.sourceCity, event.targetCity]) {
      if (!city?.id) {
        continue;
      }

      const existing = map.get(city.id) || {
        ...city,
        attacks: 0,
        threat: 'low',
        type: 'Monitored City'
      };

      existing.attacks += 1;
      if (event.severity >= 8) {
        existing.threat = 'critical';
      } else if (event.severity >= 6 && existing.threat !== 'critical') {
        existing.threat = 'high';
      } else if (event.severity >= 4 && ['critical', 'high'].includes(existing.threat) === false) {
        existing.threat = 'medium';
      }

      map.set(city.id, existing);
    }
  }

  return Array.from(map.values());
};

const getSettingArray = async (key, fallback = []) => {
  const setting = await Setting.findOne({
    group: 'threat_map',
    key
  }).lean();
  return Array.isArray(setting?.value) ? setting.value : fallback;
};

export const getCities = async (filters = {}) => {
  const events = await ThreatEvent.find().sort({ detectedAt: -1 }).limit(500).lean();
  let cities = buildCityMap(events);

  if (filters.threatLevel) {
    cities = cities.filter((city) => city.threat === filters.threatLevel);
  }
  if (filters.region) {
    cities = cities.filter((city) => city.region === filters.region || city.country === filters.region);
  }

  return cities;
};

export const getCity = async (id) => {
  const cities = await getCities();
  return cities.find((city) => city.id === id) || null;
};

export const getLiveAttacks = async (filters = {}) => {
  const query = {};
  if (filters.type) {
    query.attackType = filters.type;
  }
  if (filters.targetCity) {
    query['targetCity.id'] = filters.targetCity;
  }
  if (filters.sourceCity) {
    query['sourceCity.id'] = filters.sourceCity;
  }

  return ThreatEvent.find(query)
    .sort({ detectedAt: -1 })
    .limit(Number(filters.limit) || 20)
    .lean();
};

export const getGlobalStats = async () => {
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [recent, daily, all] = await Promise.all([
    ThreatEvent.countDocuments({ detectedAt: { $gte: minuteAgo } }),
    ThreatEvent.countDocuments({ detectedAt: { $gte: dayAgo } }),
    ThreatEvent.find().sort({ detectedAt: -1 }).limit(1000).lean()
  ]);

  return {
    attacksPerSec: Math.round(recent / 60),
    activeThreats: recent,
    blockedIPs: all.filter((item) => item.attackType === 'blocked').length,
    dataExfiltrated: Number((daily * 0.003).toFixed(2)),
    botnets: all.filter((item) => item.attackType.toLowerCase().includes('bot')).length,
    compromised: daily
  };
};

export const getThreatLevel = async () => {
  const stats = await getGlobalStats();
  const level = Math.min(100, stats.activeThreats * 2 + stats.botnets * 5);
  return {
    level,
    defcon:
      level >= 80 ? 'DEFCON1' : level >= 60 ? 'DEFCON2' : level >= 40 ? 'DEFCON3' : level >= 20 ? 'DEFCON4' : 'DEFCON5',
    status: level >= 60 ? 'Elevated global threat conditions' : 'Nominal monitoring posture',
    trend: stats.activeThreats > 20 ? 'increasing' : 'stable'
  };
};

export const getAttackTypes = async () => {
  const grouped = await ThreatEvent.aggregate([
    { $group: { _id: '$attackType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const total = grouped.reduce((sum, item) => sum + item.count, 0) || 1;
  return grouped.map((item) => ({
    type: item._id,
    count: item.count,
    percentage: Math.round((item.count / total) * 100),
    trend: 'stable'
  }));
};

export const getThreatIntel = async ({ severity } = {}) => {
  const filter = severity ? { severity } : {};
  return ThreatAlert.find(filter).sort({ createdAt: -1 }).limit(50).lean();
};

export const getThreatActors = async () => getSettingArray('actors', []);

export const getThreatActorById = async (id) => {
  const actors = await getThreatActors();
  return actors.find((actor) => actor.id === id) || null;
};

export const getIocFeed = async () => {
  const feed = await getSettingArray('ioc_feed', []);
  return feed;
};

export const getRegions = async () => {
  const regions = await ThreatEvent.distinct('region');
  return regions.filter(Boolean);
};

export const getRegionStats = async (region) => {
  const events = await ThreatEvent.find({ region }).sort({ detectedAt: -1 }).limit(500).lean();
  return {
    region,
    attackCount: events.length,
    threatLevel: Math.min(100, events.reduce((sum, item) => sum + item.severity, 0)),
    topThreats: [...new Set(events.map((item) => item.attackType))].slice(0, 5),
    hotspots: buildCityMap(events).slice(0, 10)
  };
};

export const getAttackHistory = async (filters = {}) =>
  ThreatEvent.find(filters).sort({ detectedAt: -1 }).limit(Number(filters.limit) || 100).lean();

export const getStatsHistory = async () =>
  ThreatEvent.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$detectedAt' },
          month: { $month: '$detectedAt' },
          day: { $dayOfMonth: '$detectedAt' },
          hour: { $hour: '$detectedAt' }
        },
        count: { $sum: 1 },
        severity: { $avg: '$severity' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.hour': -1 } },
    { $limit: 48 }
  ]);

export const getAlerts = async () => ThreatAlert.find().sort({ createdAt: -1 }).limit(100).lean();

export const markAlertRead = async (id) =>
  ThreatAlert.findByIdAndUpdate(
    id,
    {
      $set: {
        isRead: true
      }
    },
    { new: true }
  );

export const subscribeToAlerts = async (payload) => ({
  success: true,
  subscription: payload
});

export const searchThreatData = async ({ query }) => {
  const [events, alerts] = await Promise.all([
    ThreatEvent.find({
      $or: [
        { attackType: new RegExp(query, 'i') },
        { region: new RegExp(query, 'i') },
        { 'sourceCity.name': new RegExp(query, 'i') },
        { 'targetCity.name': new RegExp(query, 'i') }
      ]
    })
      .sort({ detectedAt: -1 })
      .limit(30)
      .lean(),
    ThreatAlert.find({
      $or: [{ title: new RegExp(query, 'i') }, { message: new RegExp(query, 'i') }]
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()
  ]);

  return {
    events,
    alerts
  };
};
