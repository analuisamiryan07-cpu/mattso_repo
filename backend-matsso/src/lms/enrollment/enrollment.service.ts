//
// Lógica real de inscripción, separada del controller HTTP a propósito:
// - `EnrollmentWebhookController` la llama después de verificar HMAC (llamadas
//   externas / futuras).
// - Una vez integrado, `OrdersService` (o el flujo que aprueba una orden) debe
//   llamar a `enrollFromEcommerce()` directamente, en el mismo proceso, sin
//   pasar por HTTP+HMAC — ver Moodles/lms/docs/INTEGRACION.md punto 4.
//
// Nota sobre `cantidad > 1` (compra corporativa, ver el comentario en el
// schema.prisma sobre Enrollment.orden_item_id): este service inscribe UNA
// persona por llamada. Si una orden tiene cantidad=3, quien dispare la
// inscripción (hoy: a mano vía este mismo endpoint con distintos usuario_id;
// más adelante: un formulario de "roster" del comprador) debe invocarlo una
// vez por persona. No se resuelve aquí — ver DECISIONES.md.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentWebhookDto } from './dto/enrollment-webhook.dto';

export interface EnrollmentResult {
  skipped: boolean;
  reason?: 'no_course_linked' | 'course_inactive';
  enrollment_id?: string;
  already_enrolled?: boolean;
}

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enrollFromEcommerce(dto: EnrollmentWebhookDto): Promise<EnrollmentResult> {
    const course = await this.prisma.course.findUnique({
      where: { producto_id: BigInt(dto.producto_id) },
    });

    // No todos los productos tienen un curso LMS asociado todavía — no es un
    // error, es un no-op idempotente (p.ej. certificaciones sin campus virtual).
    if (!course) {
      this.logger.log(`Producto ${dto.producto_id} sin curso LMS vinculado — se omite.`);
      return { skipped: true, reason: 'no_course_linked' };
    }

    if (!course.is_active) {
      this.logger.warn(`Curso ${course.id} inactivo — se omite inscripción de usuario ${dto.usuario_id}.`);
      return { skipped: true, reason: 'course_inactive' };
    }

    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(dto.usuario_id) },
      select: { id: true },
    });
    if (!usuario) {
      // A diferencia de la arquitectura original (que asumía Supabase Auth y
      // creaba la cuenta al vuelo), este sistema usa UsuarioWeb con contraseña
      // propia: el checkout ya exige sesión (JwtAuthGuard en orders.controller),
      // así que en el flujo real el usuario siempre existe antes de este punto.
      // Si no existe, es una inconsistencia real que debe fallar visiblemente.
      throw new NotFoundException(`UsuarioWeb ${dto.usuario_id} no existe.`);
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        usuario_id_course_id: { usuario_id: BigInt(dto.usuario_id), course_id: course.id },
      },
      update: {}, // reintento del mismo evento: no pisar progreso ni estado ya existentes
      create: {
        usuario_id: BigInt(dto.usuario_id),
        course_id: course.id,
        orden_item_id: dto.orden_item_id ? BigInt(dto.orden_item_id) : null,
        source: (dto.source as any) ?? 'ECOMMERCE',
      },
    });

    const alreadyExisted = enrollment.enrolled_at.getTime() < Date.now() - 2000;

    this.logger.log(
      `Inscripción ${alreadyExisted ? 'ya existía' : 'creada'}: usuario=${dto.usuario_id} curso=${course.id} evento=${dto.event_id}`,
    );

    return {
      skipped: false,
      enrollment_id: enrollment.id,
      already_enrolled: alreadyExisted,
    };
  }

  /** Registro de trazabilidad en la tabla ya existente `public.webhook_events` (schema public, provider genérico). */
  async recordWebhookEvent(eventId: string, payload: unknown, procesado: boolean) {
    await this.prisma.webhookEvent.upsert({
      where: { proveedor_evento_id: { proveedor: 'LMS_ENROLLMENT', evento_id: eventId } },
      update: { procesado, procesado_at: procesado ? new Date() : null },
      create: {
        proveedor: 'LMS_ENROLLMENT',
        evento_id: eventId,
        tipo_evento: 'enrollment.created',
        payload: payload as any,
        procesado,
        procesado_at: procesado ? new Date() : null,
      },
    });
  }

  async wasEventAlreadyProcessed(eventId: string): Promise<boolean> {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { proveedor_evento_id: { proveedor: 'LMS_ENROLLMENT', evento_id: eventId } },
    });
    return !!existing?.procesado;
  }
}
