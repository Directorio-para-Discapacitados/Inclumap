import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessibilityEntity } from '../entity/accesibility.entity';

@Injectable()
export class AccessibilitySeed {
  private readonly logger = new Logger(AccessibilitySeed.name);

  constructor(
    @InjectRepository(AccessibilityEntity)
    private readonly accessibilityRepository: Repository<AccessibilityEntity>,
  ) {}

  async seed() {
    const defaultAccessibilities = [
      {
        accessibility_name: 'Rampa Acceso',
        description: 'Rampa de acceso para sillas de ruedas',
      },
      {
        accessibility_name: 'Baño adaptado',
        description: 'Baño adaptado para personas con movilidad reducida',
      },
      {
        accessibility_name: 'Estacionamiento para discapacitados',
        description: 'Estacionamiento reservado para personas con discapacidad',
      },
      {
        accessibility_name: 'Puertas Anchas',
        description:
          'Las puertas principales y de áreas comunes tienen un ancho libre de al menos 80 cm.',
      },
      {
        accessibility_name: 'Circulación Interior',
        description:
          'Los pasillos son anchos (mín. 1.20m) y están libres de obstáculos.',
      },
      {
        accessibility_name: 'Ascensor Accesible',
        description:
          'Si tiene varios pisos, cuenta con ascensor con botonera accesible y señalización.',
      },
      {
        accessibility_name: 'Pisos',
        description: 'El suelo es firme, nivelado y antideslizante.',
      },
      {
        accessibility_name: 'Barras de Apoyo',
        description:
          'El baño accesible cuenta con barras de apoyo (agarraderas) en el inodoro.',
      },
      {
        accessibility_name: 'Lavamanos Accesible',
        description: 'El baño tiene lavamanos a altura accesible.',
      },
      {
        accessibility_name: 'Mostrador/Caja Accesible',
        description:
          'Existe un punto de atención o pago a altura reducida (aprox. 80 cm).',
      },
      {
        accessibility_name: 'Señalización (SIA)',
        description:
          'Las zonas accesibles (baños, estacionamientos, entrada) están claramente señalizadas con el Símbolo Internacional de Accesibilidad.',
      },
      {
        accessibility_name: 'Señalización Táctil/Braille',
        description:
          'La señalización de espacios clave (ej. baños) está en alto relieve o Braille.',
      },
    ];

    let createdCount = 0;

    for (const accessibilityData of defaultAccessibilities) {
      const exists = await this.accessibilityRepository.findOne({
        where: { accessibility_name: accessibilityData.accessibility_name },
      });

      if (!exists) {
        const accessibility =
          this.accessibilityRepository.create(accessibilityData);
        await this.accessibilityRepository.save(accessibility);
        createdCount++;
        this.logger.log(
          `✓ Accesibilidad creada: ${accessibilityData.accessibility_name}`,
        );
      } else {
        this.logger.log(
          `- Accesibilidad ya existe: ${accessibilityData.accessibility_name}`,
        );
      }
    }

    this.logger.log(
      `Seed completado. ${createdCount} nuevas accesibilidades creadas.`,
    );
  }
}
