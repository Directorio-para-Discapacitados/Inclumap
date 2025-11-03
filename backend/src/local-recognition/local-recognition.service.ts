// backend/src/localRecognition/local-recognition.service.ts
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

// Interfaz para la respuesta estructurada (Checklist #6)
export interface RecognitionResponse {
  local_id: string; // ID del local verificado
  confidence: number; // Nivel de confianza (0.0 a 1.0)
  details: string[]; // Detalles de lo que se encontró (logos, texto)
  match: boolean; // ¿Hubo coincidencia?
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
  ) {}

  async validateBusinessImage(
    user: UserEntity,
    imageBuffer: Buffer,
  ): Promise<RecognitionResponse> {
    // 5.1. Encontrar el local asociado al usuario
    // (Basado en tu 'user.entity.ts', la relación User -> Business existe)
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
      const details: string[] = []; // Para la respuesta

      let confidence = 0.0;
      let match = false;

      // 5.2. Preparar datos para comparar
      const businessName = (business.business_name || '').toLowerCase().trim();
      // Palabras clave: el nombre completo y cada palabra por separado
      const keywordsToCompare = [
        businessName,
        ...businessName.split(' ').filter((w) => w.length > 2), // Ignorar palabras cortas
      ];

      // 5.3. Comparar Logos
      if (logos.length > 0) {
        logos.forEach((logo) => {
          const desc = (logo.description ?? '').toLowerCase();
          const score = logo.score ?? 0;
          details.push(`Logo detectado: ${logo.description ?? 'N/A'} (Confianza: ${score.toFixed(2)})`);
          
          if (keywordsToCompare.some((keyword) => desc.includes(keyword))) {
            confidence = Math.max(confidence, score);
            match = true;
          }
        });
      }

      if (texts.length > 0) {
        // El primer resultado (texts[0]) suele ser el texto completo
        const fullText = (texts[0].description ?? '').toLowerCase();
        details.push(`Texto detectado: ${fullText.replace(/\n/g, ' ')}`);

        if (keywordsToCompare.some((keyword) => fullText.includes(keyword))) {
          // Si el texto coincide, asignamos una confianza alta (ej. 0.9)
          confidence = Math.max(confidence, 0.9);
          match = true;
        }
      }

      // 7. Manejo de errores (si no se encontró nada)
      if (!match && logos.length === 0 && texts.length === 0) {
        details.push('No se detectaron logos ni texto relevante.');
      }
      
      if (!match) {
         details.push(`La imagen no parece coincidir con el nombre del local: "${business.business_name}"`);
         // Opcional: lanzar error si no hay match
         // throw new BadRequestException('La imagen no coincide con el local.');
      }

      return {
        local_id: String(business.business_id),
        confidence: parseFloat(confidence.toFixed(2)),
        details,
        match,
      };
    } catch (error) {
      // 7. Manejo de errores (Checklist #7)
      console.error('Error en Google Vision Service:', error);
      throw new InternalServerErrorException(
        'Error al analizar la imagen.',
        error.message,
      );
    }
  }
}