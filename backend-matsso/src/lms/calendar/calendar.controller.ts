import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import { CrearEventoPersonalDto } from './dto/crear-evento-personal.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/lms/calendar/eventos')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  listar(@Req() req: any) {
    return this.calendarService.listarEventos(req.user.id);
  }

  @Post()
  crear(@Body() dto: CrearEventoPersonalDto, @Req() req: any) {
    return this.calendarService.crearEvento(req.user.id, dto.titulo, dto.fecha);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: CrearEventoPersonalDto, @Req() req: any) {
    return this.calendarService.actualizarEvento(req.user.id, id, dto.titulo, dto.fecha);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.calendarService.eliminarEvento(req.user.id, id);
  }
}
