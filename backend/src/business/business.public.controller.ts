import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessService } from './business.service';

@ApiTags('business-public')
@Controller('business/public')
export class BusinessPublicController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('search')
  async searchPublic(@Query('q') q?: string): Promise<any[]> {
    // MVP: reutilizamos obtenerNegocios y filtramos en memoria para exposición pública
    // Retorna solo campos públicos
    const all = await this.businessService.obtenerNegocios();
    const list = Array.isArray(all) ? all : [];

    const mapPublic = (b: any) => ({
      business_id: b.business_id,
      business_name: b.business_name,
      address: b.address,
      average_rating: b.average_rating,
      logo_url:
        b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      owner_email: b.user?.user_email || b.user?.email || null,
      owner_name: b.user?.people
        ? `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim()
        : null,
    });

    if (!q || !q.trim()) {
      return list.map(mapPublic);
    }

    const qLower = q.trim().toLowerCase();
    const filtered = list.filter((b: any) => {
      const name = (b.business_name || '').toLowerCase();
      const address = (b.address || '').toLowerCase();
      return name.includes(qLower) || address.includes(qLower);
    });

    return filtered.map(mapPublic);
  }

  @Get(':id')
  async getPublicById(@Param('id') id: string): Promise<any> {
    const businessId = parseInt(id, 10);
    const all = await this.businessService.obtenerNegocios();
    const b = (all || []).find(
      (x: any) => (x.business_id ?? x.id) === businessId,
    );
    if (!b) return null;
    return {
      business_id: b.business_id,
      business_name: b.business_name,
      address: b.address,
      description: b.description,
      coordinates: b.coordinates,
      latitude: b.latitude,
      longitude: b.longitude,
      average_rating: b.average_rating,
      logo_url:
        b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      owner_name: b.user?.people
        ? `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim()
        : null,
      business_accessibility: Array.isArray(b.business_accessibility)
        ? b.business_accessibility.map((a: any) => ({
            id: a.id ?? a.business_accessibility_id ?? a.accessibility_id,
            name: a.name ?? a.accessibility?.name ?? a.accessibility_name,
            description:
              a.description ??
              a.accessibility?.description ??
              a.accessibility_description,
          }))
        : [],
    };
  }
}
