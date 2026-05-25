import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { Dataset } from '../models/Dataset.js';
import { DatasetRecord } from '../models/DatasetRecord.js';
import { normalizeSearchValue, toArray } from '../utils/helpers.js';

export const importDatasetRecords = async ({ dataset, filePath, mapping = {} }) => {
  const raw = await fs.readFile(filePath, 'utf8');
  let records = [];

  if (dataset.format === 'csv') {
    records = parse(raw, {
      columns: true,
      skip_empty_lines: true
    });
  } else if (dataset.format === 'jsonl') {
    records = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } else {
    records = JSON.parse(raw);
  }

  const primaryField = mapping.primaryField || 'primaryValue';
  const secondaryFields = toArray(mapping.secondaryFields);
  const searchableFields = toArray(mapping.searchableFields);

  await DatasetRecord.deleteMany({ dataset: dataset._id });

  const docs = records
    .map((record) => {
      const primaryValue = record[primaryField];
      if (!primaryValue) {
        return null;
      }

      const secondaryValues = secondaryFields.map((field) => record[field]).filter(Boolean);
      const searchableText = searchableFields
        .map((field) => record[field])
        .filter(Boolean)
        .join(' ');

      return {
        dataset: dataset._id,
        toolIds: dataset.toolIds,
        primaryValue: String(primaryValue),
        normalizedValue: normalizeSearchValue(primaryValue),
        secondaryValues: secondaryValues.map(String),
        searchableText,
        data: record
      };
    })
    .filter(Boolean);

  if (docs.length) {
    await DatasetRecord.insertMany(docs, { ordered: false });
  }

  dataset.recordCount = docs.length;
  dataset.lastSyncedAt = new Date();
  await dataset.save();

  return docs.length;
};

export const searchDatasets = async ({ toolId, query, limit = 20 }) => {
  const normalized = normalizeSearchValue(query);
  const enabledDatasetIds = await Dataset.find({
    enabled: true,
    toolIds: toolId
  })
    .select('_id')
    .lean();

  if (!enabledDatasetIds.length) {
    return [];
  }

  const records = await DatasetRecord.find({
    dataset: {
      $in: enabledDatasetIds.map((item) => item._id)
    },
    toolIds: toolId,
    $or: [
      { normalizedValue: normalized },
      { secondaryValues: query },
      { searchableText: new RegExp(query, 'i') }
    ]
  })
    .populate('dataset')
    .limit(limit)
    .lean();

  return records.map((record) => ({
    datasetId: record.dataset?._id,
    datasetName: record.dataset?.name,
    confidence: record.confidence,
    primaryValue: record.primaryValue,
    secondaryValues: record.secondaryValues,
    data: record.data
  }));
};
