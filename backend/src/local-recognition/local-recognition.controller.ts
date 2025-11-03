// backend/src/localRecognition/local-recognition.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { LocalRecognitionService } from './local-recognition.service';
import { UserEntity } from 'src/user/entity/user.entity';

// Asumiendo que tienes un prefijo global '/api', esto será /api/local-recognition
@Controller('local-recognition')
export class LocalRecognitionController {
  constructor(
    private readonly recognitionService: LocalRecognitionService,
  ) {}

  /**
   * Recibe la imagen de un local, la analiza con Google Vision
   * y la compara con los datos del local asociado al usuario logueado.
   */
  @Post()
  @UseGuards(JwtAuthGuard) // 1. Proteger la ruta
  @UseInterceptors(FileInterceptor('image')) // 2. 'image' es el nombre del campo en el form-data
  async uploadAndRecognize(
    @UploadedFile(
      // 7. Implementar validaciones básicas de archivo
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @User() user: UserEntity, // 3. Obtener el usuario de la sesión (del token JWT)
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }

    // 4. Enviar el buffer de la imagen y el usuario al servicio
    return this.recognitionService.validateBusinessImage(user, file.buffer);
  }
}