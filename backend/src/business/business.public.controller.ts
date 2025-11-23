import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessAccessibilityEntity } from '../business_accessibility/entity/business_accessibility.entity';
import { RecordViewDto } from './dto/business-statistics.dto';

@ApiTags('business-public')
@Controller('business/public')
export class BusinessPublicController {
  constructor(
    private readonly businessService: BusinessService,
    @InjectRepository(BusinessAccessibilityEntity)
    private readonly businessAccessibilityRepository: Repository<BusinessAccessibilityEntity>,
  ) {}

  @Get('all')
  async getAllPublic(): Promise<any[]> {
    const all = await this.businessService.obtenerNegocios();
    const list = Array.isArray(all) ? all : [];

    const mapPublic = (b: any) => ({
      business_id: b.business_id,
      business_name: b.business_name,
      address: b.address,
      description: b.description,
      average_rating: b.average_rating,
      logo_url: b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      latitude: b.latitude,
      longitude: b.longitude,
      verified: b.verified || false,
      business_categories: Array.isArray(b.business_categories)
        ? b.business_categories.map((bc: any) => ({
            category_id: bc.category?.category_id,
            category_name: bc.category?.name,
          }))
        : [],
    });

    return list.map(mapPublic);
  }

  @Get('search')
  async searchPublic(
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<any[]> {
    const all = await this.businessService.obtenerNegocios();
    const list = Array.isArray(all) ? all : [];

    // Filtrar por categoría si se proporciona
    let filtered = list;
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      console.log('🔍 Filtrando por categoría ID:', categoryIdNum);
      
      if (!isNaN(categoryIdNum)) {
        filtered = filtered.filter((b: any) => {
          const hasCategory = Array.isArray(b.business_categories) &&
            b.business_categories.some(
              (bc: any) => bc.category?.category_id === categoryIdNum,
            );
          
          if (hasCategory) {
            console.log('✅ Negocio encontrado:', b.business_name, 'con categorías:', 
              b.business_categories.map((bc: any) => ({
                id: bc.category?.category_id,
                name: bc.category?.name
              }))
            );
          }
          
          return hasCategory;
        });
        
        console.log(`📊 Negocios filtrados: ${filtered.length} de ${list.length} totales`);
      }
    }

    // Filtrar por texto de búsqueda si se proporciona
    if (q && q.trim()) {
      const qLower = q.trim().toLowerCase();
      filtered = filtered.filter((b: any) => {
        const name = (b.business_name || '').toLowerCase();
        const address = (b.address || '').toLowerCase();
        const accessibilityNames = Array.isArray(b.business_accessibility)
          ? b.business_accessibility
              .map((ba: any) =>
                (ba.accessibility?.accessibility_name || '').toLowerCase(),
              )
              .filter((x: string) => x)
          : [];
        const matchesAccessibility = accessibilityNames.some((acc: string) =>
          acc.includes(qLower),
        );
        return (
          name.includes(qLower) || address.includes(qLower) || matchesAccessibility
        );
      });
    }

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
      latitude: b.latitude,
      longitude: b.longitude,
      coordinates: b.coordinates,
      verified: b.verified || false,
      images: Array.isArray(b.images)
        ? b.images.map((img: any) => ({
            id: img.id,
            url: img.url,
          }))
        : [],
      business_accessibility: Array.isArray(b.business_accessibility)
        ? b.business_accessibility.map((ba: any) => ({
            accessibility_id: ba.accessibility?.accessibility_id,
            accessibility_name: ba.accessibility?.accessibility_name,
            description: ba.accessibility?.description,
          }))
        : [],
      business_categories: Array.isArray(b.business_categories)
        ? b.business_categories.map((bc: any) => ({
            category_id: bc.category?.category_id,
            category_name: bc.category?.name,
          }))
        : [],
    });

    return filtered.map(mapPublic);
  }

  @Get('by-accessibility/:accessibilityId')
  async getByAccessibility(
    @Param('accessibilityId') accessibilityId: string,
  ): Promise<any[]> {
    // Consultar directamente la tabla business_accessibility para obtener los business_id
    const accessibilityIdNum = parseInt(accessibilityId, 10);

    const businessAccessibilities =
      await this.businessAccessibilityRepository.find({
        where: { accessibility: { accessibility_id: accessibilityIdNum } },
        relations: ['business', 'business.user', 'business.user.people', 'business.images'],
      });

    // Mapear a formato público
    return businessAccessibilities.map((ba) => {
      const b = ba.business;
      return {
        business_id: b.business_id,
        business_name: b.business_name,
        address: b.address,
        description: b.description,
        coordinates: b.coordinates,
        latitude: b.latitude,
        longitude: b.longitude,
        average_rating: b.average_rating,
        verified: b.verified || false,
        logo_url:
          b.logo_url ||
          'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        owner_name: b.user?.people
          ? `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim()
          : null,
        images: Array.isArray(b.images)
          ? b.images.map((img: any) => ({
              id: img.id,
              url: img.url,
            }))
          : [],
      };
    });
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
      verified: b.verified || false,
      logo_url:
        b.logo_url || 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      owner_name: b.user?.people
        ? `${b.user.people.firstName || ''} ${b.user.people.firstLastName || ''}`.trim()
        : null,
      images: Array.isArray(b.images)
        ? b.images.map((img: any) => ({
            id: img.id,
            url: img.url,
          }))
        : [],
      business_accessibility: Array.isArray(b.business_accessibility)
        ? b.business_accessibility.map((ba: any) => ({
            id: ba.id ?? ba.business_accessibility_id,
            accessibility_id:
              ba.accessibility?.accessibility_id ?? ba.accessibility_id,
            accessibility_name: ba.accessibility?.accessibility_name ?? ba.name,
            description: ba.accessibility?.description ?? ba.description,
          }))
        : [],
      business_categories: Array.isArray(b.business_categories)
        ? b.business_categories.map((bc: any) => ({
            category_id: bc.category?.category_id,
            category_name: bc.category?.name,
          }))
        : [],
    };
  }

  @Post(':id/view')
  async recordBusinessView(
    @Param('id') id: string,
    @Body() recordViewDto: Partial<RecordViewDto>,
  ): Promise<{ message: string }> {
    const businessId = parseInt(id, 10);
    if (isNaN(businessId)) {
      return { message: 'ID inválido' };
    }

    await this.businessService.recordView({
      business_id: businessId,
      ...recordViewDto,
    });
    
    return { message: 'Vista registrada' };
  }
}
