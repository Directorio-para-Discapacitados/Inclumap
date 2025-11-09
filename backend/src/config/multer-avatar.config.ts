import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const avatarMulterConfig: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    // Validar tipo MIME
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)'
        ),
        false
      );
    }

    // Validar extensión del archivo
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!allowedExtensions.test(file.originalname)) {
      return callback(
        new BadRequestException(
          'Extensión de archivo no válida. Use JPG, PNG, GIF o WebP'
        ),
        false
      );
    }

    callback(null, true);
  },
};