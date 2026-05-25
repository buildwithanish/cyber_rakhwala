import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '..', '..', env.uploads.localPath.replace(/^\.\//, ''));

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret
});

export const storeUploadedFile = async (file) => {
  if (!file) {
    return null;
  }

  if (env.uploads.storage === 'cloudinary' && env.cloudinary.cloudName) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'cyber-rakhwala'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      mimeType: file.mimetype,
      originalName: file.originalname
    };
  }

  await fs.mkdir(uploadsRoot, { recursive: true });
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const finalPath = path.join(uploadsRoot, fileName);
  await fs.copyFile(file.path, finalPath);

  return {
    url: `/uploads/${fileName}`,
    path: finalPath,
    bytes: file.size,
    mimeType: file.mimetype,
    originalName: file.originalname
  };
};
