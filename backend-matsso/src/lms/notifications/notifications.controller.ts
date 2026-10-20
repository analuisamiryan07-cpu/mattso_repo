import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('api/lms/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listar(@Req() req: any) {
    return this.notificationsService.listar(req.user.id);
  }

  @Post(':id/leido')
  marcarLeida(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.marcarLeida(req.user.id, id);
  }
}
