
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

@Controller('api/lms')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @UseGuards(JwtAuthGuard)
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
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async createSubmission(
    @Param('contentItemId') contentItemId: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('comentario') comentario?: string,
  ) {
    if (!file) throw new BadRequestException('El archivo de la entrega es obligatorio.');
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
