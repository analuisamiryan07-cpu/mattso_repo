// Contrato M2M Laravel -> NestJS (Moodles/arquitectura_lms.md §5.B). Todo
// texto libre pasa por sanitizePlainText — mismo patrón que catalog/contact/
// qr-certs (Moodles/HALLAZGOS_SEGURIDAD_CATALOGO_ORDENES.md).

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizePlainText } from '../../common/sanitize.util';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class AdminCoursesService {
  private readonly logger = new Logger(AdminCoursesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listCourses() {
    return this.prisma.course.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
  }

  async getCourseTree(courseId: string, actor: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { sequence_order: 'asc' },
          include: {
            content_items: {
              orderBy: { sequence_order: 'asc' },
              include: { quiz: { include: { questions: { include: { options: true } } } } },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Curso no encontrado.');
    this.logger.log(`[${actor}] consultó árbol completo del curso ${courseId}`);
    return course;
  }

  async createCourse(dto: CreateCourseDto, actor: string) {
    const course = await this.prisma.course.create({
      data: {
        producto_id: dto.producto_id ? BigInt(dto.producto_id) : null,
        titulo: sanitizePlainText(dto.titulo),
        descripcion: sanitizePlainText(dto.descripcion),
        delivery_mode: dto.delivery_mode as any,
        is_active: dto.is_active ?? true,
      },
    });
    this.logger.log(`[${actor}] creó curso ${course.id} (${course.titulo})`);
    return course;
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, actor: string) {
    await this.ensureCourseExists(courseId);
    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(dto.titulo !== undefined && { titulo: sanitizePlainText(dto.titulo) }),
        ...(dto.descripcion !== undefined && { descripcion: sanitizePlainText(dto.descripcion) }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
    this.logger.log(`[${actor}] actualizó curso ${courseId}`);
    return course;
  }

  async createModule(courseId: string, dto: CreateModuleDto, actor: string) {
    await this.ensureCourseExists(courseId);
    const existing = await this.prisma.module.findUnique({
      where: { course_id_sequence_order: { course_id: courseId, sequence_order: dto.sequence_order } },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe un módulo con sequence_order=${dto.sequence_order} en este curso.`);
    }
    const module = await this.prisma.module.create({
      data: { course_id: courseId, titulo: sanitizePlainText(dto.titulo), sequence_order: dto.sequence_order },
    });
    this.logger.log(`[${actor}] creó módulo ${module.id} en curso ${courseId}`);
    return module;
  }

  async createContentItem(moduleId: string, dto: CreateContentItemDto, actor: string) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Módulo no encontrado.');

    const existing = await this.prisma.contentItem.findUnique({
      where: { module_id_sequence_order: { module_id: moduleId, sequence_order: dto.sequence_order } },
    });
    if (existing) {
      throw new BadRequestException(`Ya existe contenido con sequence_order=${dto.sequence_order} en este módulo.`);
    }

    const item = await this.prisma.contentItem.create({
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
    this.logger.log(`[${actor}] creó contenido ${item.id} (${item.item_type}) en módulo ${moduleId}`);
    return item;
  }

  async createQuiz(contentItemId: string, dto: CreateQuizDto, actor: string) {
    const contentItem = await this.prisma.contentItem.findUnique({ where: { id: contentItemId } });
    if (!contentItem) throw new NotFoundException('Contenido no encontrado.');
    if (contentItem.item_type !== 'QUIZ') {
      throw new BadRequestException('El content_item debe ser de tipo QUIZ para adjuntarle un cuestionario.');
    }

    for (const [i, pregunta] of dto.preguntas.entries()) {
      const correctCount = pregunta.opciones.filter((o) => o.is_correct).length;
      if (correctCount === 0) {
        throw new BadRequestException(`Pregunta #${i + 1}: ninguna opción marcada como correcta.`);
      }
      if (pregunta.question_type !== 'MULTIPLE_CHOICE' && correctCount > 1) {
        throw new BadRequestException(
          `Pregunta #${i + 1}: ${pregunta.question_type} debe tener exactamente una opción correcta.`,
        );
      }
      if (pregunta.question_type === 'TRUE_FALSE' && pregunta.opciones.length !== 2) {
        throw new BadRequestException(`Pregunta #${i + 1}: TRUE_FALSE debe tener exactamente 2 opciones.`);
      }
    }

    const quiz = await this.prisma.quiz.create({
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

    this.logger.log(`[${actor}] creó quiz ${quiz.id} (${quiz.questions.length} preguntas) para contenido ${contentItemId}`);
    return quiz;
  }

  private async ensureCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) throw new NotFoundException('Curso no encontrado.');
  }
}
