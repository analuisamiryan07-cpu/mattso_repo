// Lado estudiante. La regla de oro de la arquitectura (§7): "React... no debe
// decidir por sí mismo que un contenido está completado" — todo el cálculo de
// qué está desbloqueado vive aquí, nunca en el frontend. React solo pinta lo
// que este service ya decidió.
//
// Regla de desbloqueo secuencial:
//   - El módulo 1 (sequence_order más bajo) siempre está desbloqueado.
//   - Un módulo N>1 se desbloquea solo si TODOS los content_items del módulo
//     anterior están COMPLETED.
//   - Dentro de un módulo desbloqueado, el content_item 1 está desbloqueado;
//     el item N>1 se desbloquea solo si el item anterior está COMPLETED.
//   - Si el módulo está bloqueado, todos sus items se reportan bloqueados y en
//     NOT_STARTED sin importar filas de progreso residuales (defensivo).

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyCourses(usuarioId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { usuario_id: BigInt(usuarioId) },
      include: {
        course: true,
        progress: { select: { status: true } },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return Promise.all(
      enrollments.map(async (e) => {
        const totalItems = await this.prisma.contentItem.count({
          where: { module: { course_id: e.course_id }, is_active: true },
        });
        const completedItems = e.progress.filter((p) => p.status === 'COMPLETED').length;
        return {
          enrollment_id: e.id,
          status: e.status,
          enrolled_at: e.enrolled_at,
          completed_at: e.completed_at,
          course: {
            id: e.course.id,
            titulo: e.course.titulo,
            descripcion: e.course.descripcion,
            delivery_mode: e.course.delivery_mode,
          },
          progreso_pct: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        };
      }),
    );
  }

  async getCourseDetail(courseId: string, usuarioId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { usuario_id_course_id: { usuario_id: BigInt(usuarioId), course_id: courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('No estás inscrito en este curso.');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { is_active: true },
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
    const esSecuencial = course.delivery_mode === 'ASINCRONO_VOD';

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
        delivery_mode: course.delivery_mode,
      },
      modules,
    };
  }

  /** Usado por progress/submissions/quizzes services para validar dueño + desbloqueo antes de aceptar una acción. */
  async assertContentItemUnlockedForStudent(contentItemId: string, usuarioId: number) {
    const contentItem = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { module: { select: { course_id: true } } },
    });
    if (!contentItem) throw new NotFoundException('Contenido no encontrado.');

    const detail = await this.getCourseDetail(contentItem.module.course_id, usuarioId);
    const flatItem = detail.modules.flatMap((m) => m.content_items).find((i) => i.id === contentItemId);
    if (!flatItem || !flatItem.unlocked) {
      throw new ForbiddenException('Este contenido todavía no está desbloqueado.');
    }

    return { contentItem, enrollmentId: detail.enrollment_id };
  }
}
