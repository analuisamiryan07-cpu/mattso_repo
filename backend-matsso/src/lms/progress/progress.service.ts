// Moodles/arquitectura_lms_nube.md §5/§6: "NestJS no confía ciegamente en
// current_time ni total_duration: valida secuencia, saltos anómalos, duración
// conocida y pertenencia del estudiante." Reglas aplicadas aquí:
//
//   1. Pertenencia: assertContentItemUnlockedForStudent ya verifica enrollment
//      + desbloqueo antes de llegar aquí (lo llama el controller).
//   2. Duración conocida: total_duration del cliente se ignora para el cálculo
//      de completado — se usa siempre content_item.video_duration_seconds
//      (dato que fijó el admin al registrar el video en Cloudinary). Si el
//      cliente reporta un total_duration que difiere más de 5s del real, se
//      rechaza el ping — indicio de un video distinto o un cliente alterado.
//   3. Saltos anómalos: current_time no puede superar la duración real + 5s
//      de margen (buffering/redondeo).
//   4. No retrocede: video_seconds_reached solo puede subir. Evita que
//      "rebobinar" para repasar borre el progreso ya alcanzado, y evita que
//      alguien mande un ping bajo para "resetear" y luego uno enorme fuera de
//      la duración real (ya bloqueado por la regla 3 de todas formas).

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';
import { VideoPingDto } from './dto/video-ping.dto';

const COMPLETION_THRESHOLD = 0.95;
const DURATION_TOLERANCE_SECONDS = 5;
const SEEK_TOLERANCE_SECONDS = 5;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  async recordVideoPing(dto: VideoPingDto, usuarioId: number) {
    const { contentItem, enrollmentId } = await this.coursesService.assertContentItemUnlockedForStudent(
      dto.content_item_id,
      usuarioId,
    );

    if (contentItem.item_type !== 'VIDEO') {
      throw new BadRequestException('Este contenido no es un video.');
    }
    if (!contentItem.video_duration_seconds) {
      throw new BadRequestException('El video no tiene duración registrada — contactar al administrador.');
    }

    const realDuration = contentItem.video_duration_seconds;

    if (Math.abs(dto.total_duration - realDuration) > DURATION_TOLERANCE_SECONDS) {
      throw new BadRequestException('La duración reportada no coincide con el video registrado.');
    }
    if (dto.current_time > realDuration + SEEK_TOLERANCE_SECONDS) {
      throw new BadRequestException('Progreso reportado fuera de rango.');
    }

    const existing = await this.prisma.studentProgress.findUnique({
      where: {
        enrollment_id_content_item_id: { enrollment_id: enrollmentId, content_item_id: dto.content_item_id },
      },
    });

    const previousReached = existing?.video_seconds_reached ? Number(existing.video_seconds_reached) : 0;
    const reached = Math.min(Math.max(previousReached, dto.current_time), realDuration);
    const ratio = reached / realDuration;

    const alreadyCompleted = existing?.status === 'COMPLETED';
    const nowCompleted = alreadyCompleted || ratio >= COMPLETION_THRESHOLD;

    const progress = await this.prisma.studentProgress.upsert({
      where: {
        enrollment_id_content_item_id: { enrollment_id: enrollmentId, content_item_id: dto.content_item_id },
      },
      update: {
        video_seconds_reached: reached,
        status: nowCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completed_at: nowCompleted && !alreadyCompleted ? new Date() : existing?.completed_at,
      },
      create: {
        enrollment_id: enrollmentId,
        content_item_id: dto.content_item_id,
        video_seconds_reached: reached,
        status: nowCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completed_at: nowCompleted ? new Date() : null,
      },
    });

    return {
      status: progress.status,
      video_seconds_reached: Number(progress.video_seconds_reached),
      just_completed: nowCompleted && !alreadyCompleted,
    };
  }

  /** Contenido DOCUMENT: no hay señal de "visto" real — se marca al abrirlo, sin validación adicional. */
  async markDocumentRead(contentItemId: string, usuarioId: number) {
    const { contentItem, enrollmentId } = await this.coursesService.assertContentItemUnlockedForStudent(
      contentItemId,
      usuarioId,
    );
    if (contentItem.item_type !== 'DOCUMENT') {
      throw new BadRequestException('Este contenido no es un documento.');
    }

    const progress = await this.prisma.studentProgress.upsert({
      where: { enrollment_id_content_item_id: { enrollment_id: enrollmentId, content_item_id: contentItemId } },
      update: { status: 'COMPLETED', completed_at: new Date() },
      create: { enrollment_id: enrollmentId, content_item_id: contentItemId, status: 'COMPLETED', completed_at: new Date() },
    });
    return { status: progress.status };
  }
}
