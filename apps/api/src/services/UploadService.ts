import { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';

export class UploadService {
  async uploadImage(file: Express.Multer.File): Promise<string | null> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'petfinder',
            resource_type: 'image',
            transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
          },
          (error, uploaded) => {
            if (error || !uploaded) {
              reject(error ?? new Error('Upload sem resposta do Cloudinary'));
              return;
            }
            resolve(uploaded);
          }
        );
        stream.end(file.buffer);
      });

      return result.secure_url;
    } catch (error) {
      console.error('Erro durante o processo de upload:', error);
      return null;
    }
  }
}
