import { Setting } from '../models/Setting.js';

export const getSettingsByGroup = async (group, { isPublic } = {}) => {
  const filter = { group };
  if (typeof isPublic === 'boolean') {
    filter.isPublic = isPublic;
  }

  const settings = await Setting.find(filter).lean();
  return Object.fromEntries(settings.map((item) => [item.key, item.value]));
};

export const upsertSetting = async ({ group, key, value, isPublic = false, description = '' }) =>
  Setting.findOneAndUpdate(
    { group, key },
    {
      $set: {
        value,
        isPublic,
        description
      }
    },
    { new: true, upsert: true }
  );
