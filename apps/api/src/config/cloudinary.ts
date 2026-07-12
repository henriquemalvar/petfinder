import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Guarda o arquivo em memória; o envio ao Cloudinary é feito no UploadService.
// Antes usávamos multer-storage-cloudinary, que prendia o cloudinary v1
// (vulnerável) e ainda causava upload duplicado.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export { cloudinary };
