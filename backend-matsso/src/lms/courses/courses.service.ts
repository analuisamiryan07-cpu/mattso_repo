// Lado estudiante. La regla de oro de la arquitectura (§7): "React... no debe
// decidir por sí mismo que un contenido está completado" — todo el cálculo de
// qué está desbloqueado vive aquí, nunca en el frontend. React solo pinta lo
// que este service ya decidió.
//
// Acceso: ya no depende de "¿existe un Enrollment?" (eso solo significa
// "alguna vez compró esto"). Depende de que exista un AccessGrant VIGENTE
// para ese usuario y ese curso: canjeado (redeemed_at no nulo), no vencido
// (expires_at en el futuro) y no revocado. Un curso puede ofrecer Moodle,
// Coursera o los dos — una sola clave canjeada da acceso a lo que el curso
// tenga habilitado, por eso getCourseDetail recibe el "mode" que se quiere
// ver y filtra los módulos de esa modalidad únicamente.
//
// Regla de desbloqueo secuencial (por modalidad, independiente entre sí):
//   - El módulo 1 (sequence_order más bajo) de esa modalidad siempre está
//     desbloqueado.
//   - Un módulo N>1 se desbloquea solo si TODOS los content_items del módulo
//     anterior (misma modalidad) están COMPLETED.
//   - Dentro de un módulo desbloqueado, el content_item 1 está desbloqueado;
//     el item N>1 se desbloquea solo si el item anterior está COMPLETED.
//   - TRADICIONAL (Moodle): acceso abierto, no exige orden — ver esSecuencial.
//   - Si el módulo está bloqueado, todos sus items se reportan bloqueados y en
//     NOT_STARTED sin importar filas de progreso residuales (defensivo).

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type DeliveryModeValue = 'TRADICIONAL' | 'ASINCRONO_VOD';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /** AccessGrant vigente: canjeada, no vencida, no revocada. */
  private vigenteWhere(usuarioId: number) {
    return {
      usuario_id: BigInt(usuarioId),
      redeemed_at: { not: null },
      revoked_at: null,
      expires_at: { gt: new Date() },
    };
  }

  async listMyCourses(usuarioId: number) {
    const grants = await this.prisma.accessGrant.findMany({
      where: this.vigenteWhere(usuarioId),
      include: { course: true },
      orderBy: { redeemed_at: 'desc' },
    });

    const moodle: any[] = [];
    const coursera: any[] = [];

    for (const grant of grants) {
      const course = grant.course;
      const base = {
        access_grant_id: grant.id,
        course: { id: course.id, titulo: course.titulo, descripcion: course.descripcion },
        redeemed_at: grant.redeemed_at,
        expires_at: grant.expires_at,
      };

      if (course.modo_moodle) {
        moodle.push({ ...base, progreso_pct: await this.progresoPct(course.id, usuarioId, 'TRADICIONAL') });
      }
      if (course.modo_coursera) {
        coursera.push({ ...base, progreso_pct: await this.progresoPct(course.id, usuarioId, 'ASINCRONO_VOD') });
      }
    }

    return { moodle, coursera };
  }

  private async progresoPct(courseId: string, usuarioId: number, mode: DeliveryModeValue): Promise<number> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { usuario_id_course_id: { usuario_id: BigInt(usuarioId), course_id: courseId } },
      select: { id: true },
    });
    if (!enrollment) return 0;

    const totalItems = await this.prisma.contentItem.count({
      where: { module: { course_id: courseId, delivery_mode: mode }, is_active: true },
    });
    if (totalItems === 0) return 0;

    const completedItems = await this.prisma.studentProgress.count({
      where: {
        enrollment_id: enrollment.id,
        status: 'COMPLETED',
        content_item: { module: { course_id: courseId, delivery_mode: mode } },
      },
    });
    return Math.round((completedItems / totalItems) * 100);
  }

  /** Lanza ForbiddenException si el usuario no tiene una clave vigente para este curso. */
  private async assertAccesoVigente(courseId: string, usuarioId: number) {
    const grant = await this.prisma.accessGrant.findFirst({
      where: { ...this.vigenteWhere(usuarioId), course_id: courseId },
    });
    if (!grant) {
      throw new ForbiddenException('No tienes acceso vigente a este curso. Añade tu clave o suscríbete de nuevo.');
    }
    return grant;
  }

  async getCourseDetail(courseId: string, usuarioId: number, mode: DeliveryModeValue) {
    await this.assertAccesoVigente(courseId, usuarioId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { usuario_id_course_id: { usuario_id: BigInt(usuarioId), course_id: courseId } },
    });
    // No debería pasar (la clave se genera a partir de una compra ya
    // inscrita), pero si pasa es una inconsistencia real, no un 403 silencioso.
    if (!enrollment) throw new NotFoundException('No se encontró la inscripción de este curso.');

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { is_active: true, delivery_mode: mode },
          orderBy: { sequence_order: 'asc' },
          include: {
            content_items: {
              where: { is_active: true },
              orderBy: { sequence_order: 'asc' },
              include: { quiz: { select: { id: true, max_attempts: true } } },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Curso no encontrado.');

    const progressRows = await this.prisma.studentProgress.findMany({
      where: { enrollment_id: enrollment.id },
    });
    const progressByContentId = new Map(progressRows.map((p) => [p.content_item_id, p]));

    const attemptCounts = await this.prisma.quizAttempt.groupBy({
      by: ['quiz_id'],
      where: { enrollment_id: enrollment.id },
      _count: { _all: true },
    });
    const attemptsByQuizId = new Map(attemptCounts.map((a) => [a.quiz_id, a._count._all]));

    // Nota real por content_item — "Mis calificaciones" (Moodle) la necesita,
    // no solo el estado COMPLETED/NOT_STARTED.
    const gradeByContentId = new Map<string, { score: number; feedback: string | null }>();

    const submissions = await this.prisma.studentSubmission.findMany({
      where: { enrollment_id: enrollment.id },
      include: { grade: true },
    });
    // "COMPLETED" en StudentProgress solo se marca al calificar — por eso
    // entregado-pero-sin-calificar se ve igual que nunca-entregado si solo
    // se mira `status`. Esto le da al frontend la distinción real.
    const submittedContentIds = new Set(submissions.map((s) => s.content_item_id));
    for (const s of submissions) {
      if (s.grade) gradeByContentId.set(s.content_item_id, { score: Number(s.grade.score), feedback: s.grade.feedback });
    }

    const gradedAttempts = await this.prisma.quizAttempt.findMany({
      where: { enrollment_id: enrollment.id, status: 'GRADED' },
      include: { quiz: { select: { content_item_id: true } } },
      orderBy: { submitted_at: 'desc' },
    });
    for (const a of gradedAttempts) {
      const cid = a.quiz.content_item_id;
      // El primero que aparece por content_item es el intento más reciente (orderBy desc).
      if (!gradeByContentId.has(cid) && a.score != null) {
        gradeByContentId.set(cid, { score: Number(a.score), feedback: null });
      }
    }

    // TRADICIONAL (Moodle): acceso abierto — un Moodle real no obliga a
    // completar todo en orden, el estudiante entra a cualquier recurso o
    // tarea cuando quiera. ASINCRONO_VOD (Coursera): desbloqueo secuencial
    // estricto, como siempre. Es la única diferencia de comportamiento entre
    // los dos modos — el resto de este método es igual para ambos.
    const esSecuencial = mode === 'ASINCRONO_VOD';

    let moduleUnlocked = true;
    const modules = course.modules.map((module) => {
      const thisModuleUnlocked = esSecuencial ? moduleUnlocked : true;
      let itemUnlocked = true;

      const items = module.content_items.map((item) => {
        const progress = progressByContentId.get(item.id);
        const status: ProgressStatus = thisModuleUnlocked ? progress?.status ?? 'NOT_STARTED' : 'NOT_STARTED';
        const unlocked = esSecuencial ? thisModuleUnlocked && itemUnlocked : true;
        itemUnlocked = status === 'COMPLETED';

        return {
          id: item.id,
          item_type: item.item_type,
          titulo: item.titulo,
          sequence_order: item.sequence_order,
          status,
          unlocked,
          video_duration_seconds: item.video_duration_seconds,
          assignment_instructions: item.assignment_instructions,
          grade: gradeByContentId.get(item.id) ?? null,
          entrega_status:
            item.item_type !== 'ASSIGNMENT'
              ? null
              : gradeByContentId.has(item.id)
                ? 'CALIFICADA'
                : submittedContentIds.has(item.id)
                  ? 'PENDIENTE_CALIFICACION'
                  : 'NO_ENTREGADA',
          quiz: item.quiz
            ? {
                id: item.quiz.id,
                max_attempts: item.quiz.max_attempts,
                attempts_used: attemptsByQuizId.get(item.quiz.id) ?? 0,
              }
            : null,
        };
      });

      const allCompleted = items.length > 0 && items.every((i) => i.status === 'COMPLETED');
      moduleUnlocked = allCompleted;

      return {
        id: module.id,
        titulo: module.titulo,
        sequence_order: module.sequence_order,
        unlocked: thisModuleUnlocked,
        content_items: items,
      };
    });

    return {
      enrollment_id: enrollment.id,
      course: {
        id: course.id,
        titulo: course.titulo,
        descripcion: course.descripcion,
        mode,
      },
      modules,
    };
  }

  /**
   * Usado por progress/submissions/quizzes services para validar dueño +
   * desbloqueo antes de aceptar una acción. La modalidad se saca del propio
   * módulo del contenido — el llamante no la conoce de antemano.
   */
  async assertContentItemUnlockedForStudent(contentItemId: string, usuarioId: number) {
    const contentItem = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { module: { select: { course_id: true, delivery_mode: true } } },
    });
    if (!contentItem) throw new NotFoundException('Contenido no encontrado.');

    const detail = await this.getCourseDetail(contentItem.module.course_id, usuarioId, contentItem.module.delivery_mode);
    const flatItem = detail.modules.flatMap((m) => m.content_items).find((i) => i.id === contentItemId);
    if (!flatItem || !flatItem.unlocked) {
      throw new ForbiddenException('Este contenido todavía no está desbloqueado.');
    }

    return { contentItem, enrollmentId: detail.enrollment_id };
  }
}
