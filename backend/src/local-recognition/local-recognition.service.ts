// backend/src/local-recognition/local-recognition.service.ts
import {
  Injectable,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { GOOGLE_VISION_CLIENT } from './google-vision.provider';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'; 

export interface RecognitionResponse {
  local_id: string; 
  confidence: number; 
  details: string[]; 
  match: boolean; 
  verification_url?: string; 
}

@Injectable()
export class LocalRecognitionService {
  constructor(
    // 3. Conectar con API externa
    @Inject(GOOGLE_VISION_CLIENT)
    private readonly visionClient: ImageAnnotatorClient,

    // 5. Comparar con registros existentes
    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,

    // --- SERVICIO AÑADIDO ---
    private readonly cloudinaryService: CloudinaryService,
    // --- FIN ---
  ) {}

  async validateBusinessImage(
    user: UserEntity,
    imageBuffer: Buffer,
  ): Promise<RecognitionResponse> {
    // 5.1. Encontrar el local asociado al usuario
    const business = await this.businessRepository.findOne({
      where: { user: { user_id: user.user_id } },
    });

    if (!business) {
      throw new NotFoundException(
        'No se encontró un local asociado a este usuario.',
      );
    }

    try {
      // 4. Procesar resultados (Pedimos detección de Logo y Texto)
      const [logoResult] = await this.visionClient.logoDetection(imageBuffer);
      const [textResult] = await this.visionClient.textDetection(imageBuffer);

      const logos = logoResult.logoAnnotations ?? [];
      const texts = textResult.textAnnotations ?? [];
      const details: string[] = [];

      let confidence = 0.0;
      let match = false;
      let verification_url: string | undefined = undefined; // <-- AÑADIDO

      // 5.2. Preparar datos para comparar
      const businessName = (business.business_name || '').toLowerCase().trim();
      const keywordsToCompare = [
        businessName,
        ...businessName.split(' ').filter((w) => w.length > 2),
      ];

      // 5.3. Comparar Logos
      if (logos.length > 0) {
        logos.forEach((logo) => {
          const desc = (logo.description ?? '').toLowerCase();
          const score = logo.score ?? 0;
          details.push(
            `Logo detectado: ${
              logo.description ?? 'N/A'
            } (Confianza: ${score.toFixed(2)})`,
          );

          if (keywordsToCompare.some((keyword) => desc.includes(keyword))) {
            confidence = Math.max(confidence, score);
            match = true;
          }
        });
      }

      // 5.4. Comparar Textos
      if (texts.length > 0) {
        const fullText = (texts[0].description ?? '').toLowerCase();
        details.push(`Texto detectado: ${fullText.replace(/\n/g, ' ')}`);

        if (keywordsToCompare.some((keyword) => fullText.includes(keyword))) {
          confidence = Math.max(confidence, 0.9);
          match = true;
        }
      }

      // 7. Manejo de errores (si no se encontró nada)
      if (!match && logos.length === 0 && texts.length === 0) {
        details.push('No se detectaron logos ni texto relevante.');
      }

      if (!match) {
        details.push(
          `La imagen no parece coincidir con el nombre del local: "${business.business_name}"`,
        );
      }

      if (match) {
        try {
          const uploadResult = await this.cloudinaryService.uploadImage(
            imageBuffer,
            'business_verifications', // Carpeta en Cloudinary
          );

          verification_url = uploadResult.secure_url;

          business.verification_image_url = verification_url;
          await this.businessRepository.save(business);

          details.push(`Imagen de verificación guardada: ${verification_url}`);
        } catch (uploadError) {
          console.error('Error al subir imagen a Cloudinary:', uploadError);
          details.push(
            'La verificación fue exitosa, pero hubo un error al guardar la imagen de prueba.',
          );
        }
      }

      return {
        local_id: String(business.business_id),
        confidence: parseFloat(confidence.toFixed(2)),
        details,
        match,
        verification_url, 
      };
    } catch (error) {
      console.error('Error en Google Vision Service:', error);
      throw new InternalServerErrorException(
        'Error al analizar la imagen.',
        error.message,
      );
    }
  }
}