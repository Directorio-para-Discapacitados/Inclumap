import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { AccessibilityEntity } from 'src/accessibility/entity/accesibility.entity';
import { Repository, Like } from 'typeorm';
import {
  ChatRequestDto,
  ChatResponseDto,
  BusinessLocationDto,
} from './dto/chat.dto';

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
    const { latitude, longitude } = dto;

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
        return this.findBusinessesByAccessibility(message, latitude, longitude);
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
    userLatitude?: number,
    userLongitude?: number,
  ): Promise<ChatResponseDto> {
    const allAccessibilities = await this.accessibilityRepo.find();

    // Buscar coincidencia flexible: palabra por palabra
    let foundKeyword: string | undefined;
    let foundAccessibility: AccessibilityEntity | undefined;

    for (const accessibility of allAccessibilities) {
      const accessibilityName = accessibility.accessibility_name.toLowerCase();
      const words = accessibilityName.split(/\s+/); // Dividir en palabras

      // Verificar si el mensaje incluye el nombre completo o alguna palabra clave
      if (message.includes(accessibilityName)) {
        foundKeyword = accessibilityName;
        foundAccessibility = accessibility;
        break;
      }

      // Si no, verificar si incluye al menos una palabra significativa (> 3 caracteres)
      for (const word of words) {
        if (word.length > 3 && message.includes(word)) {
          foundKeyword = accessibilityName;
          foundAccessibility = accessibility;
          break;
        }
      }

      if (foundKeyword) break;
    }

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
        'business.latitude',
        'business.longitude',
      ])
      .getMany();

    if (businesses.length === 0) {
      return {
        response: `Lo siento, no encontré negocios registrados con "${foundKeyword}".`,
      };
    }

    // Si el usuario NO proporcionó coordenadas, responder sin distancia
    if (!userLatitude || !userLongitude) {
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

    // Si el usuario SÍ proporcionó coordenadas, calcular distancias
    const businessesWithDistance: BusinessLocationDto[] = businesses
      .filter((b) => b.latitude !== null && b.longitude !== null) // Solo negocios con coordenadas
      .map((b) => {
        const distance = this.calculateDistance(
          userLatitude,
          userLongitude,
          Number(b.latitude),
          Number(b.longitude),
        );

        return {
          id: b.business_id,
          name: b.business_name,
          address: b.address,
          latitude: Number(b.latitude),
          longitude: Number(b.longitude),
          distance: Number(distance.toFixed(2)), // Redondear a 2 decimales
        };
      })
      .sort((a, b) => a.distance - b.distance) // Ordenar por distancia ascendente
      .slice(0, 5); // Limitar a los top 5 más cercanos

    if (businessesWithDistance.length === 0) {
      return {
        response: `Encontré ${businesses.length} ${businesses.length === 1 ? 'lugar' : 'lugares'} con "${foundKeyword}", pero ninguno tiene coordenadas disponibles.`,
      };
    }

    const suggestions = businessesWithDistance.map(
      (b) => `${b.name} - ${b.distance} km (${b.address})`,
    );

    return {
      response: `¡Encontré estos lugares cerca de ti con "${foundKeyword}":`,
      suggestions: suggestions,
      businesses: businessesWithDistance,
    };
  }

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
   * @param lat1 Latitud del punto 1
   * @param lon1 Longitud del punto 1
   * @param lat2 Latitud del punto 2
   * @param lon2 Longitud del punto 2
   * @returns Distancia en kilómetros
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convierte grados a radianes
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
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
