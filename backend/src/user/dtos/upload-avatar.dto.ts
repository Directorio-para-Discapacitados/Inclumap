import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo de imagen para el avatar (JPG, PNG, GIF, WebP máximo 5MB)',
  })
  avatar: any;
}