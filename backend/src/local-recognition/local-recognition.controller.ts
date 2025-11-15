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
  @UseInterceptors(FileInterceptor('image'))
  async uploadAndRecognize(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @User() user: UserEntity,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }

    return this.recognitionService.validateBusinessImage(user, file.buffer);
  }
}
