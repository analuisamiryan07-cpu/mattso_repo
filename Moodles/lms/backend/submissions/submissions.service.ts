// Destino final: backend-matsso/src/lms/submissions/submissions.service.ts
//
// Flujo TRADICIONAL (Moodles/arquitectura_lms_nube.md §3): el estudiante sube
// un archivo, un humano lo califica. El progreso NO se marca COMPLETED al
// entregar — solo cuando `gradeSubmission()` registra la nota, tal como
// corresponde a "calificación humana" (no autocompletar por el solo hecho de
// entregar algo).

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CoursesService } from '../courses/courses.service';
import { sanitizePlainText } from '../../common/sanitize.util';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

const MAX_COMENTARIO_LENGTH = 500;

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly coursesService: CoursesService,
  ) {}

  async createSubmission(
    contentItemId: string,
    usuarioId: number,
    file: Express.Multer.File,
    comentario: string | undefined,
  ) {
    const { contentItem, enrollmentId } = await this.coursesService.assertContentItemUnlockedForStudent(
      contentItemId,
      usuarioId,
    );
    if (contentItem.item_type !== 'ASSIGNMENT') {
      throw new BadRequestException('Este contenido no acepta entregas.');
    }

    const cleanComentario = sanitizePlainText(comentario);
    if (cleanComentario && cleanComentario.length > MAX_COMENTARIO_LENGTH) {
      throw new BadRequestException(`El comentario no puede superar ${MAX_COMENTARIO_LENGTH} caracteres.`);
    }

    const previousCount = await this.prisma.studentSubmission.count({
      where: { enrollment_id: enrollmentId, content_item_id: contentItemId },
    });

    // Nota de integración: uploadEntregaTarea() aún no existe en StorageService
    // (solo existe uploadComprobante(), específico de órdenes). Ver
    // Moodles/lms/docs/INTEGRACION.md punto 3 para el método genérico a agregar.
    const fileUrl = await this.storageService.uploadEntregaTarea(file);

    const submission = await this.prisma.studentSubmission.create({
      data: {
        enrollment_id: enrollmentId,
        content_item_id: contentItemId,
        attempt_number: previousCount + 1,
        file_url: fileUrl,
        comentario: cleanComentario ?? null,
      },
    });

    return submission;
  }

  // No recibe/loguea el actor M2M a propósito: es una lectura de alto volumen
  // (polling del panel admin), no una operación que valga la pena auditar
  // como las de escritura en admin-courses.service.ts.
  async listPendingSubmissions() {
    return this.prisma.studentSubmission.findMany({
      where: { grade: null },
      orderBy: { submitted_at: 'asc' },
      include: {
        content_item: { select: { titulo: true, module: { select: { titulo: true, course: { select: { titulo: true } } } } } },
        enrollment: { select: { usuario: { select: { id: true, correo: true } } } },
      },
    });
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.studentSubmission.findUnique({
      where: { id: submissionId },
      include: { grade: true },
    });
    if (!submission) throw new NotFoundException('Entrega no encontrada.');
    if (submission.grade) throw new ConflictException('Esta entrega ya fue calificada.');

    const grader = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(dto.graded_by_usuario_id) },
      select: { id: true },
    });
    if (!grader) throw new NotFoundException('graded_by_usuario_id no corresponde a ningún usuario_web.');

    const [grade] = await this.prisma.$transaction([
      this.prisma.manualGrade.create({
        data: {
          submission_id: submissionId,
          graded_by_usuario_id: BigInt(dto.graded_by_usuario_id),
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
