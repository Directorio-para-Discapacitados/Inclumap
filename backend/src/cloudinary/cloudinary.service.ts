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
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder },
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
              new InternalServerErrorException('No se recibió respuesta de Cloudinary.'),
            );
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
}