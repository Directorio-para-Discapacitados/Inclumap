// backend/src/cloudinary/cloudinary.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  uploadImage(
    fileBuffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          // <--- CAMBIO CRÍTICO: Esto permite sobrescribir la imagen anterior sin errores
          unique_filename: !publicId, // Si hay publicId, NO usar nombre único (para sobrescribir)
          overwrite: true, // Permitir reemplazar el archivo existente
          resource_type: 'auto',
          // ---------------------------------------------------------------------
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { format: 'webp' },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                `Error de Cloudinary: ${error.message || 'Error desconocido'}`,
              ),
            );
          }
          if (!result) {
            return reject(
              new InternalServerErrorException(
                'No se recibió respuesta de Cloudinary.',
              ),
            );
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al eliminar imagen: ${error.message}`,
      );
    }
  }

  extractPublicIdFromUrl(url: string): string | null {
    if (!url) return null;

    const match = url.match(/\/([^/]+.[^/]+.[^.]+)\.[^.]+$/);
    return match ? match[1] : null;
  }
}
