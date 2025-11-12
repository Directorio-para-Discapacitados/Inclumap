// backend/src/maps/maps.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeoapifyResponse {
  results: Array<{
    lat: number;
    lon: number;
    formatted: string;
    country: string;
    city: string;
  }>;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private readonly geoapifyApiKey: string;
  private readonly baseUrl = 'https://api.geoapify.com/v1/geocode';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.geoapifyApiKey = this.configService.get<string>('GEOAPIFY_API_KEY') || '';
    
    if (!this.geoapifyApiKey) {
      this.logger.warn('GEOAPIFY_API_KEY no está configurado en las variables de entorno');
    }
  }

  /**
   * Convierte una dirección en coordenadas (latitud y longitud) usando la API de Geoapify
   * @param address Dirección a geocodificar
   * @returns Promesa que resuelve a { lat, lon } o null si no se encontraron resultados
   */
  async getCoordinates(address: string): Promise<Coordinates | null> {
    if (!address || address.trim().length === 0) {
      this.logger.warn('Dirección vacía proporcionada para geocodificación');
      return null;
    }

    if (!this.geoapifyApiKey) {
      this.logger.error('No se puede realizar geocodificación: API key no configurado');
      throw new InternalServerErrorException('Servicio de geocodificación no configurado');
    }

    try {
      const url = `${this.baseUrl}/search`;
      const params = {
        text: address.trim(),
        apiKey: this.geoapifyApiKey,
        limit: 1, // Solo necesitamos el primer resultado
        format: 'json',
      };

      this.logger.debug(`Geocodificando dirección: "${address}"`);

      const response = await firstValueFrom(
        this.httpService.get<GeoapifyResponse>(url, { params })
      );

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        this.logger.warn(`No se encontraron coordenadas para la dirección: "${address}"`);
        return null;
      }

      const result = response.data.results[0];
      const coordinates: Coordinates = {
        lat: result.lat,
        lon: result.lon,
      };

      this.logger.debug(
        `Geocodificación exitosa: "${address}" -> lat: ${coordinates.lat}, lon: ${coordinates.lon}`
      );

      return coordinates;
    } catch (error) {
      this.logger.error(`Error al geocodificar dirección "${address}":`, error.message);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            this.logger.error('API key de Geoapify inválido o expirado');
            throw new InternalServerErrorException('Servicio de geocodificación no autorizado');
          case 429:
            this.logger.error('Límite de rate de API de Geoapify alcanzado');
            throw new InternalServerErrorException('Servicio de geocodificación temporalmente no disponible');
          case 400:
            this.logger.error(`Parámetros inválidos enviados a Geoapify: ${JSON.stringify(data)}`);
            return null;
          default:
            this.logger.error(`Error HTTP ${status} de Geoapify: ${JSON.stringify(data)}`);
            throw new InternalServerErrorException('Error en el servicio de geocodificación');
        }
      }

      // Error de red u otro error no HTTP
      throw new InternalServerErrorException('Error de conexión con el servicio de geocodificación');
    }
  }

  /**
   * Valida si las coordenadas proporcionadas son válidas
   * @param lat Latitud
   * @param lon Longitud
   * @returns true si las coordenadas son válidas, false en caso contrario
   */
  validateCoordinates(lat: number, lon: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }

  /**
   * Formatea coordenadas para almacenamiento en base de datos
   * @param coordinates Coordenadas a formatear
   * @returns String formateado "lat,lon"
   */
  formatCoordinatesForStorage(coordinates: Coordinates): string {
    return `${coordinates.lat},${coordinates.lon}`;
  }

  /**
   * Parsea coordenadas desde el formato de almacenamiento
   * @param coordinatesString String en formato "lat,lon"
   * @returns Coordenadas parseadas o null si el formato es inválido
   */
  parseCoordinatesFromStorage(coordinatesString: string): Coordinates | null {
    if (!coordinatesString || coordinatesString.trim().length === 0) {
      return null;
    }

    const parts = coordinatesString.trim().split(',');
    if (parts.length !== 2) {
      return null;
    }

    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);

    if (this.validateCoordinates(lat, lon)) {
      return { lat, lon };
    }

    return null;
  }
}