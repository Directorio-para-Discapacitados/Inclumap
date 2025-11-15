import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { AccessibilityEntity } from 'src/accessibility/entity/accesibility.entity';
import { Repository, Like } from 'typeorm';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(AccessibilityEntity)
    private readonly accessibilityRepo: Repository<AccessibilityEntity>,
  ) {}

  async generateResponse(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const message = dto.message.toLowerCase().trim();

    try {
      if (this.esSaludo(message)) {
        return {
          response:
            '¡Hola! Soy IncluBot. ¿Cómo puedo ayudarte hoy? Puedes preguntarme sobre lugares accesibles (ej. "restaurantes con rampa") o sobre tipos de accesibilidad (ej. "¿qué es braille?").',
        };
      }

      if (
        message.includes('lugares') ||
        message.includes('negocios') ||
        message.includes('restaurantes') ||
        message.includes('tiendas')
      ) {
        return this.findBusinessesByAccessibility(message);
      }

      if (message.includes('qué es') || message.includes('información sobre')) {
        return this.findAccessibilityInfo(message);
      }

      return {
        response:
          'Lo siento, no entendí tu pregunta. Intenta preguntarme por "lugares con rampa" o "información sobre accesibilidad auditiva".',
      };
    } catch (error) {
      console.error('Error en ChatbotService:', error);
      throw new InternalServerErrorException(
        'No se pudo generar una respuesta.',
      );
    }
  }

  private esSaludo(message: string): boolean {
    const saludos = [
      'hola',
      'buenos días',
      'buenas tardes',
      'buenas noches',
      'saludos',
    ];
    return saludos.some((saludo) => message.startsWith(saludo));
  }

  private async findBusinessesByAccessibility(
    message: string,
  ): Promise<ChatResponseDto> {
    const allAccessibilities = await this.accessibilityRepo.find();
    const keywords = allAccessibilities.map((a) =>
      a.accessibility_name.toLowerCase(),
    );

    const foundKeyword = keywords.find((k) => message.includes(k));

    if (!foundKeyword) {
      return {
        response:
          'No pude identificar qué tipo de accesibilidad buscas. Intenta ser más específico, por ejemplo: "lugares con rampa" o "negocios con braille".',
      };
    }

    const businesses = await this.businessRepo
      .createQueryBuilder('business')
      .innerJoin('business.business_accessibility', 'business_accessibility')
      .innerJoin('business_accessibility.accessibility', 'accessibility')
      .where('accessibility.accessibility_name ILIKE :keyword', {
        keyword: `%${foundKeyword}%`,
      })
      .select([
        'business.business_id',
        'business.business_name',
        'business.address',
      ])
      .getMany();

    if (businesses.length === 0) {
      return {
        response: `Lo siento, no encontré negocios registrados con "${foundKeyword}".`,
      };
    }

    const suggestions = businesses.map(
      (b) => `${b.business_name} (Ubicado en: ${b.address})`,
    );

    return {
      response: `¡Buenas noticias! Encontré ${
        businesses.length
      } ${businesses.length === 1 ? 'lugar' : 'lugares'} con "${foundKeyword}":`,
      suggestions: suggestions,
    };
  }

  private async findAccessibilityInfo(
    message: string,
  ): Promise<ChatResponseDto> {
    const keyword = message
      .replace('qué es', '')
      .replace('información sobre', '')
      .replace('?', '')
      .trim();

    if (!keyword) {
      return { response: '¿Sobre qué accesibilidad necesitas información?' };
    }

    const accessibility = await this.accessibilityRepo.findOne({
      where: { accessibility_name: Like(`%${keyword}%`) },
    });

    if (!accessibility) {
      return {
        response: `No tengo información sobre "${keyword}". Intenta con otro término.`,
      };
    }

    return {
      response: `Claro. "${accessibility.accessibility_name}": ${accessibility.description}`,
    };
  }
}
