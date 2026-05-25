import { asyncHandler } from '../utils/asyncHandler.js';
import { Dataset } from '../models/Dataset.js';
import { importDatasetRecords } from '../services/dataset.service.js';

export const importDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findById(req.params.id);
  const count = await importDatasetRecords({
    dataset,
    filePath: req.file.path,
    mapping: dataset.mapping
  });
  res.success({
    message: 'Dataset imported',
    data: {
      imported: count
    }
  });
});
