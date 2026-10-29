
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { SubmissionsService } from './submissions.service';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

// Mismo criterio que orders.controller.ts: PDF/DOCX/imagen para entregables de
// tareas QHSE (informes, evidencias fotográficas).
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

// Verificación del contenido real del archivo (no solo el tipo declarado por
// el navegador, que el cliente controla). DOCX es un ZIP ("PK\x03\x04").
const MAGIC_BYTES: Record<string, (b: Buffer) => boolean> = {
  'application/pdf': (b) => b.length > 4 && b.subarray(0, 5).toString('latin1') === '%PDF-',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) =>
    b.length > 3 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  'image/jpeg': (b) => b.length > 2 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length > 7 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
};

@Controller('api/lms')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post('content/:contentItemId/submissions')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no permitido. Solo PDF, DOCX, JPG o PNG.'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 5, fieldSize: 8 * 1024 },
    }),
  )
  async createSubmission(
    @Param('contentItemId') contentItemId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('comentario') comentario?: string,
  ) {
    if (!file) throw new BadRequestException('El archivo de la entrega es obligatorio.');
    if (!MAGIC_BYTES[file.mimetype]?.(file.buffer)) {
      throw new BadRequestException('El contenido del archivo no corresponde a su tipo (PDF, DOCX, JPG o PNG).');
    }
    if (comentario !== undefined && typeof comentario !== 'string') {
      throw new BadRequestException('Comentario inválido.');
    }
    return this.submissionsService.createSubmission(contentItemId, req.user.id, file, comentario);
  }

  @UseGuards(LmsM2mGuard)
  @Get('admin/submissions/pending')
  listPending() {
    return this.submissionsService.listPendingSubmissions();
  }

  // POST, no PATCH: coincide con el contrato original de
  // Moodles/arquitectura_lms.md ("POST /api/admin/submissions/{id}/grade").
  @UseGuards(LmsM2mGuard)
  @Post('admin/submissions/:submissionId/grade')
  gradeSubmission(@Param('submissionId') submissionId: string, @Body() dto: GradeSubmissionDto) {
    return this.submissionsService.gradeSubmission(submissionId, dto);
  }
}
