// Eventos personales del calendario de Moodle — "Nuevo evento" en el
// Aula Virtual. Separado de las fechas límite de tareas/exámenes (esas
// vienen de ContentItem.fecha_limite, ver CoursesService.getLineaDeTiempo).

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizePlainText } from '../../common/sanitize.util';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async listarEventos(usuarioId: number) {
    return this.prisma.personalEvent.findMany({
      where: { usuario_id: BigInt(usuarioId) },
      orderBy: { fecha: 'asc' },
    });
  }

  async crearEvento(usuarioId: number, titulo: string, fecha: string) {
    return this.prisma.personalEvent.create({
      data: {
        usuario_id: BigInt(usuarioId),
        titulo: sanitizePlainText(titulo) || titulo,
        fecha: new Date(fecha),
      },
    });
  }

  async actualizarEvento(usuarioId: number, eventoId: string, titulo: string, fecha: string) {
    const evento = await this.prisma.personalEvent.findUnique({ where: { id: eventoId } });
    if (!evento) throw new NotFoundException('Evento no encontrado.');
    if (Number(evento.usuario_id) !== usuarioId) throw new ForbiddenException('No es tu evento.');
    return this.prisma.personalEvent.update({
      where: { id: eventoId },
      data: { titulo: sanitizePlainText(titulo) || titulo, fecha: new Date(fecha) },
    });
  }

  async eliminarEvento(usuarioId: number, eventoId: string) {
    const evento = await this.prisma.personalEvent.findUnique({ where: { id: eventoId } });
    if (!evento) throw new NotFoundException('Evento no encontrado.');
    if (Number(evento.usuario_id) !== usuarioId) throw new ForbiddenException('No es tu evento.');
    await this.prisma.personalEvent.delete({ where: { id: eventoId } });
    return { ok: true };
  }
}
