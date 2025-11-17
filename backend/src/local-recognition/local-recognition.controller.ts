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

@Controller('local-recognition')
export class LocalRecognitionController {
  constructor(private readonly recognitionService: LocalRecognitionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image')) // 'image' debe coincidir con el frontend
  async uploadAndRecognize(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5 MB
          // CORRECCIÓN: Usar Regex para validar el MimeType es más seguro
          new FileTypeValidator({ fileType: /image\/(jpeg|png|jpg|webp)/ }),
        ],
        fileIsRequired: true, // Asegura que lance 400 si no hay archivo
      }),
    )
    file: Express.Multer.File,
    @User() user: UserEntity,
  ) {
    // Esta validación manual ya no es estrictamente necesaria gracias a fileIsRequired: true,
    // pero no hace daño dejarla como doble seguridad.
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }

    return this.recognitionService.validateBusinessImage(user, file.buffer);
  }
}
