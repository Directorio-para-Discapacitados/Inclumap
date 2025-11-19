import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las notificaciones del usuario autenticado',
  })
  async getMyNotifications(@Request() req) {
    const userId = req.user.user_id;
    return await this.notificationService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  async markAsRead(@Param('id') id: string) {
    return await this.notificationService.markAsRead(Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  async deleteNotification(@Param('id') id: string, @Request() req) {
    const userId = req.user.user_id;
    return await this.notificationService.deleteNotification(Number(id), userId);
  }
}
