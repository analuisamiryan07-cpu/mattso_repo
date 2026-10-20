// Mensajería estudiante -> profesor, solo para cursos Moodle (TRADICIONAL)
// con profesor asignado. Una conversación por (curso, estudiante, profesor)
// — todo el intercambio de ese estudiante con el profesor de ESE curso vive
// en una sola fila de Conversation. Por ahora solo el estudiante escribe; la
// bandeja/respuesta del profesor es una fase posterior (ver plan).

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sanitizePlainText } from '../../common/sanitize.util';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** AccessGrant vigente: canjeada, no vencida, no revocada — mismo criterio que CoursesService. */
  private vigenteWhere(usuarioId: number) {
    return {
      usuario_id: BigInt(usuarioId),
      redeemed_at: { not: null },
      revoked_at: null,
      expires_at: { gt: new Date() },
    };
  }

  async listarProfesores(usuarioId: number) {
    const grants = await this.prisma.accessGrant.findMany({
      where: {
        ...this.vigenteWhere(usuarioId),
        course: { modo_moodle: true, profesor_usuario_id: { not: null } },
      },
      include: {
        course: {
          select: {
            id: true,
            titulo: true,
            profesor_usuario_id: true,
            profesor: { select: { cliente: { select: { nombre: true } } } },
          },
        },
      },
    });

    return grants.map((g) => ({
      course_id: g.course.id,
      course_titulo: g.course.titulo,
      profesor_usuario_id: Number(g.course.profesor_usuario_id),
      profesor_nombre: g.course.profesor?.cliente?.nombre || 'Profesor',
    }));
  }

  private async obtenerCursoConProfesorVerificado(usuarioId: number, courseId: string) {
    const grant = await this.prisma.accessGrant.findFirst({
      where: { ...this.vigenteWhere(usuarioId), course_id: courseId },
      include: {
        course: {
          select: { id: true, titulo: true, modo_moodle: true, profesor_usuario_id: true },
        },
      },
    });
    if (!grant) throw new ForbiddenException('No tienes acceso vigente a este curso.');
    if (!grant.course.modo_moodle) throw new BadRequestException('Este curso no es de Moodle.');
    if (!grant.course.profesor_usuario_id) throw new BadRequestException('Este curso todavía no tiene profesor asignado.');
    return grant.course;
  }

  private async obtenerOCrearConversacion(usuarioId: number, courseId: string) {
    const course = await this.obtenerCursoConProfesorVerificado(usuarioId, courseId);
    const conversation = await this.prisma.conversation.upsert({
      where: {
        course_id_estudiante_usuario_id_profesor_usuario_id: {
          course_id: course.id,
          estudiante_usuario_id: BigInt(usuarioId),
          profesor_usuario_id: course.profesor_usuario_id as bigint,
        },
      },
      update: {},
      create: {
        course_id: course.id,
        estudiante_usuario_id: BigInt(usuarioId),
        profesor_usuario_id: course.profesor_usuario_id as bigint,
      },
    });
    return { conversation, course };
  }

  async obtenerConversacion(usuarioId: number, courseId: string) {
    const { conversation } = await this.obtenerOCrearConversacion(usuarioId, courseId);
    const mensajes = await this.prisma.message.findMany({
      where: { conversation_id: conversation.id },
      orderBy: { created_at: 'asc' },
    });
    return {
      conversation_id: conversation.id,
      mensajes: mensajes.map((m) => ({
        id: m.id,
        cuerpo: m.cuerpo,
        es_mio: Number(m.remitente_usuario_id) === usuarioId,
        created_at: m.created_at,
      })),
    };
  }

  async enviarMensaje(usuarioId: number, courseId: string, cuerpoCrudo: string) {
    const cuerpo = sanitizePlainText(cuerpoCrudo);
    if (!cuerpo) throw new BadRequestException('Escribe un mensaje.');

    const { conversation, course } = await this.obtenerOCrearConversacion(usuarioId, courseId);

    const remitente = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(usuarioId) },
      select: { cliente: { select: { nombre: true } } },
    });

    const mensaje = await this.prisma.message.create({
      data: { conversation_id: conversation.id, remitente_usuario_id: BigInt(usuarioId), cuerpo },
    });

    await this.notificationsService.crear({
      usuarioId: Number(course.profesor_usuario_id),
      tipo: 'MENSAJE_NUEVO',
      titulo: `Nuevo mensaje de ${remitente?.cliente?.nombre || 'un estudiante'}`,
      cuerpo: `Curso: ${course.titulo}`,
    });

    return { id: mensaje.id, cuerpo: mensaje.cuerpo, es_mio: true, created_at: mensaje.created_at };
  }
}
