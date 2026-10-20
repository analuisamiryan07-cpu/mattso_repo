import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/lms/messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('profesores')
  listarProfesores(@Req() req: any) {
    return this.messagingService.listarProfesores(req.user.id);
  }

  @Get('conversaciones/:courseId')
  obtenerConversacion(@Param('courseId') courseId: string, @Req() req: any) {
    return this.messagingService.obtenerConversacion(req.user.id, courseId);
  }

  @Post('conversaciones/:courseId/mensajes')
  enviarMensaje(@Param('courseId') courseId: string, @Body() dto: EnviarMensajeDto, @Req() req: any) {
    return this.messagingService.enviarMensaje(req.user.id, courseId, dto.cuerpo);
  }
}
