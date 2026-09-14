// Lado profesor: un profesor logueado en el Aula Virtual solo puede tocar SUS
// propios cursos — la propiedad se guarda en Course.profesor_usuario_id. No
// puede crear otros profesores, usuarios ni tocar cursos ajenos: eso es lo
// que pidió el negocio (Moodles/lms/docs/REQUISITOS_SISTEMA_INTERNO.md §3) y
// aquí se aplica como verificación real, no como convención de UI.

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizePlainText } from '../../common/sanitize.util';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateModuleDto } from '../courses/dto/create-module.dto';
import { CreateContentItemDto } from '../courses/dto/create-content-item.dto';
import { CreateQuizDto } from '../courses/dto/create-quiz.dto';
import { ProfessorGradeSubmissionDto } from './dto/professor-grade-submission.dto';

@Injectable()
export class ProfessorCoursesService {
  private readonly logger = new Logger(ProfessorCoursesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listarMisCursos(usuarioId: number) {
    return this.prisma.course.findMany({
      where: { profesor_usuario_id: BigInt(usuarioId) },
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
  }

  async crearCurso(usuarioId: number, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        profesor_usuario_id: BigInt(usuarioId),
        producto_id: dto.producto_id ? BigInt(dto.producto_id) : null,
        titulo: sanitizePlainText(dto.titulo),
        descripcion: sanitizePlainText(dto.descripcion),
        delivery_mode: dto.delivery_mode as any,
        is_active: dto.is_active ?? true,
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
    await this.verificarDuenoCurso(usuarioId, courseId);
    const existing = await this.prisma.module.findUnique({
      where: { course_id_sequence_order: { course_id: courseId, sequence_order: dto.sequence_order } },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un módulo con sequence_order=${dto.sequence_order} en este curso.`);
    }
    return this.prisma.module.create({
      data: { course_id: courseId, titulo: sanitizePlainText(dto.titulo), sequence_order: dto.sequence_order },
    });
  }

  /** Verifica que el módulo pertenezca a un curso del profesor. Devuelve el módulo si es válido. */
  private async verificarDuenoModulo(usuarioId: number, moduleId: string) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId }, include: { course: true } });
    if (!module) throw new NotFoundException('Módulo no encontrado.');
    if (module.course.profesor_usuario_id === null || Number(module.course.profesor_usuario_id) !== usuarioId) {
      throw new ForbiddenException('Este módulo no pertenece a uno de tus cursos.');
    }
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
        content_item: { module: { course: { profesor_usuario_id: BigInt(usuarioId) } } },
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
      include: { grade: true, content_item: { include: { module: { include: { course: true } } } } },
    });
    if (!submission) throw new NotFoundException('Entrega no encontrada.');
    if (submission.content_item.module.course.profesor_usuario_id === null
        || Number(submission.content_item.module.course.profesor_usuario_id) !== usuarioId) {
      throw new ForbiddenException('Esta entrega no pertenece a uno de tus cursos.');
    }
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

    return grade;
  }
}
