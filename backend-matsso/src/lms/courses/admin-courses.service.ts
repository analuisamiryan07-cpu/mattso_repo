// Contrato M2M Laravel -> NestJS (Moodles/arquitectura_lms.md §5.B). Todo
// texto libre pasa por sanitizePlainText — mismo patrón que catalog/contact/
// qr-certs (Moodles/HALLAZGOS_SEGURIDAD_CATALOGO_ORDENES.md).

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { sanitizePlainText } from '../../common/sanitize.util';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CourseImageSlot } from './dto/upload-course-image.dto';
import { buildCloudinaryFolder } from './course-cloudinary.util';

@Injectable()
export class AdminCoursesService {
  private readonly logger = new Logger(AdminCoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listCourses() {
    return this.prisma.course.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
  }

  /** Panel general: todos los cursos, cuántos alumnos y cuántos ya completaron todo. */
  async getDashboard() {
    const courses = await this.prisma.course.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { enrollments: true } }, profesor: { select: { correo: true } } },
    });

    return Promise.all(
      courses.map(async (c) => {
        const totalItems = await this.prisma.contentItem.count({
          where: { module: { course_id: c.id }, is_active: true },
        });

        let completados = 0;
        if (totalItems > 0 && c._count.enrollments > 0) {
          const enrollments = await this.prisma.enrollment.findMany({
            where: { course_id: c.id },
            select: { id: true },
          });
          for (const e of enrollments) {
            const hechos = await this.prisma.studentProgress.count({
              where: { enrollment_id: e.id, status: 'COMPLETED' },
            });
            if (hechos === totalItems) completados++;
          }
        }

        return {
          id: c.id,
          titulo: c.titulo,
          modo_moodle: c.modo_moodle,
          modo_coursera: c.modo_coursera,
          profesor_correo: c.profesor?.correo ?? null,
          total_estudiantes: c._count.enrollments,
          total_completados: completados,
        };
      }),
    );
  }

  async getCourseTree(courseId: string, actor: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        profesor: { select: { id: true, correo: true } },
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
    const modoMoodle = dto.modo_moodle ?? false;
    const modoCoursera = dto.modo_coursera ?? false;
    if (!modoMoodle && !modoCoursera) {
      throw new BadRequestException('El curso debe ofrecerse en Moodle, en Coursera, o en ambos.');
    }

    const titulo = sanitizePlainText(dto.titulo)!;
    const cloudinaryFolder = await buildCloudinaryFolder(this.prisma, titulo);

    const course = await this.prisma.course.create({
      data: {
        producto_id: dto.producto_id ? BigInt(dto.producto_id) : null,
        titulo,
        descripcion: sanitizePlainText(dto.descripcion),
        modo_moodle: modoMoodle,
        modo_coursera: modoCoursera,
        cloudinary_folder: cloudinaryFolder,
        duracion_meses: dto.duracion_meses ?? null,
        is_active: dto.is_active ?? true,
      },
    });
    this.logger.log(`[${actor}] creó curso ${course.id} (${course.titulo})`);
    return course;
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, actor: string) {
    const current = await this.ensureCourseExists(courseId);
    const modoMoodle = dto.modo_moodle ?? current.modo_moodle;
    const modoCoursera = dto.modo_coursera ?? current.modo_coursera;
    if (!modoMoodle && !modoCoursera) {
      throw new BadRequestException('El curso debe ofrecerse en Moodle, en Coursera, o en ambos.');
    }

    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(dto.titulo !== undefined && { titulo: sanitizePlainText(dto.titulo) }),
        ...(dto.descripcion !== undefined && { descripcion: sanitizePlainText(dto.descripcion) }),
        ...(dto.modo_moodle !== undefined && { modo_moodle: dto.modo_moodle }),
        ...(dto.modo_coursera !== undefined && { modo_coursera: dto.modo_coursera }),
        ...(dto.duracion_meses !== undefined && { duracion_meses: dto.duracion_meses }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
    this.logger.log(`[${actor}] actualizó curso ${courseId}`);
    return course;
  }

  async createModule(courseId: string, dto: CreateModuleDto, actor: string) {
    const course = await this.ensureCourseExists(courseId);
    const modoHabilitado = dto.delivery_mode === 'TRADICIONAL' ? course.modo_moodle : course.modo_coursera;
    if (!modoHabilitado) {
      throw new BadRequestException(
        `Este curso no tiene habilitada la modalidad ${dto.delivery_mode === 'TRADICIONAL' ? 'Moodle' : 'Coursera'}.`,
      );
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
    const module = await this.prisma.module.create({
      data: {
        course_id: courseId,
        delivery_mode: dto.delivery_mode as any,
        titulo: sanitizePlainText(dto.titulo),
        descripcion: sanitizePlainText(dto.descripcion) ?? null,
        sequence_order: dto.sequence_order,
      },
    });
    this.logger.log(`[${actor}] creó módulo ${module.id} (${dto.delivery_mode}) en curso ${courseId}`);
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
        body_text: sanitizePlainText(dto.body_text) ?? null,
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

  async uploadImagen(courseId: string, slot: CourseImageSlot, file: Express.Multer.File, actor: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { cloudinary_folder: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado.');
    if (!course.cloudinary_folder) {
      // No debería pasar — se calcula siempre al crear el curso — pero si
      // pasa es mejor un error claro que subir a una carpeta genérica.
      throw new BadRequestException('Este curso no tiene una carpeta de Cloudinary asignada.');
    }

    const url = await this.storage.uploadCourseImage(file, course.cloudinary_folder, slot);
    this.logger.log(`[${actor}] subió imagen "${slot}" del curso ${courseId}`);
    return { url };
  }

  /**
   * El profesor califica y sube recursos en Moodle — un curso Coursera puro
   * no necesita uno, pero no se impide asignarlo (podría tener las dos
   * modalidades). Solo se puede asignar una cuenta con rol PROFESOR y activa.
   */
  async asignarProfesor(courseId: string, profesorUsuarioId: number, actor: string) {
    await this.ensureCourseExists(courseId);
    const profesor = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(profesorUsuarioId) },
      select: { id: true, rol: true, activo: true },
    });
    if (!profesor || profesor.rol !== 'PROFESOR') {
      throw new BadRequestException('El usuario indicado no es un profesor.');
    }
    if (!profesor.activo) {
      throw new BadRequestException('Este profesor está desactivado — actívalo antes de asignarlo.');
    }

    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: { profesor_usuario_id: profesor.id },
    });
    this.logger.log(`[${actor}] asignó profesor ${profesorUsuarioId} al curso ${courseId}`);
    return course;
  }

  private async ensureCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, modo_moodle: true, modo_coursera: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado.');
    return course;
  }
}
