// Genérico: hoy lo alimentan "mensaje nuevo" (messaging.service.ts) y "tarea
// calificada" (submissions.service.ts / professor-courses.service.ts), pero
// cualquier otro flujo puede llamar a crear() sin tocar este archivo.

import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_NOTIFICACIONES = 30;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: { usuarioId: number; tipo: string; titulo: string; cuerpo?: string; enlace?: string }) {
    return this.prisma.notification.create({
      data: {
        usuario_id: BigInt(data.usuarioId),
        tipo: data.tipo,
        titulo: data.titulo,
        cuerpo: data.cuerpo ?? null,
        enlace: data.enlace ?? null,
      },
    });
  }

  async listar(usuarioId: number) {
    const [items, no_leidas] = await Promise.all([
      this.prisma.notification.findMany({
        where: { usuario_id: BigInt(usuarioId) },
        orderBy: { created_at: 'desc' },
        take: MAX_NOTIFICACIONES,
      }),
      this.prisma.notification.count({
        where: { usuario_id: BigInt(usuarioId), leido_at: null },
      }),
    ]);
    return { items, no_leidas };
  }

  async marcarLeida(usuarioId: number, notificationId: string) {
    const notificacion = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notificacion || Number(notificacion.usuario_id) !== usuarioId) {
      throw new ForbiddenException('No es tu notificación.');
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { leido_at: new Date() },
    });
  }
}
