import { asyncHandler } from '../utils/asyncHandler.js';
import { storeUploadedFile } from '../services/upload.service.js';

export const uploadFile = asyncHandler(async (req, res) => {
  const file = await storeUploadedFile(req.file);
  res.success({
    statusCode: 201,
    message: 'File uploaded',
    data: file
  });
});
