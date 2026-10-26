// Lado profesor: mismo modelo que EVA PUCE — el admin crea el curso y se lo
// asigna desde el sistema interno (AdminCoursesService.createCourse /
// asignarProfesor). El profesor nunca crea, renombra ni elimina un curso:
// solo entra a administrar el contenido (módulos, tareas, exámenes,
// calificaciones) del/los curso(s) que ya tiene asignados — y únicamente
// del lado Moodle (TRADICIONAL). Coursera es "totalmente independiente"
// (palabras de la usuaria): el profesor no tiene acceso a esa modalidad por
// ningún motivo, ni para verla ni para tocarla, así el curso sea "ambos".
// Toda verificación de abajo aplica esto como código real, no como
// convención de UI — ver también admin-courses.service.ts, que tiene la
// restricción espejo (el sistema interno no puede tocar contenido Moodle).

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizePlainText } from '../../common/sanitize.util';
import { CreateModuleDto } from '../courses/dto/create-module.dto';
import { CreateContentItemDto } from '../courses/dto/create-content-item.dto';
import { CreateQuizDto } from '../courses/dto/create-quiz.dto';
import { ProfessorGradeSubmissionDto } from './dto/professor-grade-submission.dto';
import { NotificationsService } from '../notifications/notifications.service';

const MENSAJE_SOLO_MOODLE = 'No tienes acceso a Coursera — esa modalidad la administra el sistema interno.';

@Injectable()
export class ProfessorCoursesService {
  private readonly logger = new Logger(ProfessorCoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listarMisCursos(usuarioId: number) {
    return this.prisma.course.findMany({
      where: { profesor_usuario_id: BigInt(usuarioId) },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            modules: { where: { delivery_mode: 'TRADICIONAL' } },
            enrollments: true,
          },
        },
      },
    });
  }

  async getMiCurso(usuarioId: number, courseId: string) {
    await this.verificarDuenoCurso(usuarioId, courseId);
    return this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { delivery_mode: 'TRADICIONAL' },
          orderBy: { sequence_order: 'asc' },
          include: {
            content_items: {
              orderBy: { sequence_order: 'asc' },
              include: { quiz: { select: { id: true, titulo: true } } },
            },
          },
        },
      },
    });
  }

  /** Lanza ForbiddenException si el curso no existe o no es del profesor. Devuelve el curso si es válido. */
  private async verificarDuenoCurso(usuarioId: number, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso no encontrado.');
    if (course.profesor_usuario_id === null || Number(course.profesor_usuario_id) !== usuarioId) {
      throw new ForbiddenException('Este curso no te pertenece.');
    }
    return course;
  }

  async crearModulo(usuarioId: number, courseId: string, dto: CreateModuleDto) {
    const course = await this.verificarDuenoCurso(usuarioId, courseId);
    if (dto.delivery_mode !== 'TRADICIONAL') throw new ForbiddenException(MENSAJE_SOLO_MOODLE);
    if (!course.modo_moodle) {
      throw new BadRequestException('Este curso no tiene habilitada la modalidad Moodle.');
    }

    const existing = await this.prisma.module.findUnique({
      where: {
        course_id_delivery_mode_sequence_order: {
          course_id: courseId,
          delivery_mode: dto.delivery_mode as any,
          sequence_order: dto.sequence_order,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Ya existe un módulo con sequence_order=${dto.sequence_order} en esta modalidad de este curso.`,
      );
    }
    return this.prisma.module.create({
      data: {
        course_id: courseId,
        delivery_mode: dto.delivery_mode as any,
        titulo: sanitizePlainText(dto.titulo),
        sequence_order: dto.sequence_order,
      },
    });
  }

  /** Verifica que el módulo pertenezca a un curso del profesor Y sea Moodle. Devuelve el módulo si es válido. */
  private async verificarDuenoModulo(usuarioId: number, moduleId: string) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
    if (!module) throw new NotFoundException('Módulo no encontrado.');
    if (module.course.profesor_usuario_id === null || Number(module.course.profesor_usuario_id) !== usuarioId) {
      throw new ForbiddenException('Este módulo no pertenece a uno de tus cursos.');
    }
    if (module.delivery_mode !== 'TRADICIONAL') throw new ForbiddenException(MENSAJE_SOLO_MOODLE);
    return module;
  }

  async crearContenido(usuarioId: number, moduleId: string, dto: CreateContentItemDto) {
    await this.verificarDuenoModulo(usuarioId, moduleId);
    const existing = await this.prisma.contentItem.findUnique({
      where: { module_id_sequence_order: { module_id: moduleId, sequence_order: dto.sequence_order } },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe contenido con sequence_order=${dto.sequence_order} en este módulo.`);
    }
    return this.prisma.contentItem.create({
      data: {
        module_id: moduleId,
        item_type: dto.item_type as any,
        titulo: sanitizePlainText(dto.titulo),
        sequence_order: dto.sequence_order,
        cloudinary_public_id: dto.cloudinary_public_id ?? null,
        cloudinary_url: dto.cloudinary_url ?? null,
        video_duration_seconds: dto.video_duration_seconds ?? null,
        assignment_instructions: sanitizePlainText(dto.assignment_instructions) ?? null,
        fecha_limite: dto.fecha_limite ? new Date(dto.fecha_limite) : null,
      },
    });
  }

  async crearQuiz(usuarioId: number, contentItemId: string, dto: CreateQuizDto) {
    const contentItem = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { module: { include: { course: true } } },
    });
    if (!contentItem) throw new NotFoundException('Contenido no encontrado.');
    if (contentItem.module.course.profesor_usuario_id === null || Number(contentItem.module.course.profesor_usuario_id) !== usuarioId) {
      throw new ForbiddenException('Este contenido no pertenece a uno de tus cursos.');
    }
    if (contentItem.module.delivery_mode !== 'TRADICIONAL') throw new ForbiddenException(MENSAJE_SOLO_MOODLE);
    if (contentItem.item_type !== 'QUIZ') {
      throw new BadRequestException('El content_item debe ser de tipo QUIZ para adjuntarle un cuestionario.');
    }

    for (const [i, pregunta] of dto.preguntas.entries()) {
      const correctCount = pregunta.opciones.filter((o) => o.is_correct).length;
      if (correctCount === 0) throw new BadRequestException(`Pregunta #${i + 1}: ninguna opción marcada como correcta.`);
      if (pregunta.question_type !== 'MULTIPLE_CHOICE' && correctCount > 1) {
        throw new BadRequestException(`Pregunta #${i + 1}: ${pregunta.question_type} debe tener exactamente una opción correcta.`);
      }
      if (pregunta.question_type === 'TRUE_FALSE' && pregunta.opciones.length !== 2) {
        throw new BadRequestException(`Pregunta #${i + 1}: TRUE_FALSE debe tener exactamente 2 opciones.`);
      }
    }

    return this.prisma.quiz.create({
      data: {
        content_item_id: contentItemId,
        titulo: sanitizePlainText(dto.titulo),
        passing_score: dto.passing_score ?? 70,
        max_attempts: dto.max_attempts ?? null,
        time_limit_seconds: dto.time_limit_seconds ?? null,
        questions: {
          create: dto.preguntas.map((p, i) => ({
            enunciado: sanitizePlainText(p.enunciado),
            question_type: p.question_type as any,
            sequence_order: i + 1,
            points: p.points ?? 1,
            options: {
              create: p.opciones.map((o, j) => ({
                texto: sanitizePlainText(o.texto),
                is_correct: o.is_correct,
                sequence_order: j + 1,
              })),
            },
          })),
        },
      },
      include: { questions: { include: { options: true } } },
    });
  }

  async listarEntregasPendientes(usuarioId: number) {
    return this.prisma.studentSubmission.findMany({
      where: {
        grade: null,
        content_item: { module: { delivery_mode: 'TRADICIONAL', course: { profesor_usuario_id: BigInt(usuarioId) } } },
      },
      orderBy: { submitted_at: 'asc' },
      include: {
        content_item: { select: { titulo: true, module: { select: { titulo: true, course: { select: { titulo: true } } } } } },
        enrollment: { select: { usuario: { select: { id: true, correo: true } } } },
      },
    });
  }

  async calificar(usuarioId: number, submissionId: string, dto: ProfessorGradeSubmissionDto) {
    const submission = await this.prisma.studentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        grade: true,
        enrollment: { select: { usuario_id: true } },
        content_item: { include: { module: { include: { course: true } } } },
      },
    });
    if (!submission) throw new NotFoundException('Entrega no encontrada.');
    if (submission.content_item.module.course.profesor_usuario_id === null
        || Number(submission.content_item.module.course.profesor_usuario_id) !== usuarioId) {
      throw new ForbiddenException('Esta entrega no pertenece a uno de tus cursos.');
    }
    if (submission.content_item.module.delivery_mode !== 'TRADICIONAL') throw new ForbiddenException(MENSAJE_SOLO_MOODLE);
    if (submission.grade) throw new BadRequestException('Esta entrega ya fue calificada.');

    const [grade] = await this.prisma.$transaction([
      this.prisma.manualGrade.create({
        data: {
          submission_id: submissionId,
          graded_by_usuario_id: BigInt(usuarioId),
          score: dto.score,
          feedback: sanitizePlainText(dto.feedback) ?? null,
        },
      }),
      this.prisma.studentProgress.upsert({
        where: {
          enrollment_id_content_item_id: {
            enrollment_id: submission.enrollment_id,
            content_item_id: submission.content_item_id,
          },
        },
        update: { status: 'COMPLETED', completed_at: new Date() },
        create: {
          enrollment_id: submission.enrollment_id,
          content_item_id: submission.content_item_id,
          status: 'COMPLETED',
          completed_at: new Date(),
        },
      }),
    ]);

    await this.notificationsService.crear({
      usuarioId: Number(submission.enrollment.usuario_id),
      tipo: 'TAREA_CALIFICADA',
      titulo: `Calificaron "${submission.content_item.titulo}"`,
      cuerpo: `Nota: ${dto.score}`,
      enlace: '/moodle/mis-cursos',
    });

    return grade;
  }
}
