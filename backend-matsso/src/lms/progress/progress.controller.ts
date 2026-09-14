
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ProgressService } from './progress.service';
import { VideoPingDto } from './dto/video-ping.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/lms')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // Moodles/arquitectura_lms_nube.md §5: POST /api/progress/video-ping.
  // Namespaced bajo /api/lms para agrupar con el resto de rutas del módulo.
  @Post('progress/video-ping')
  recordVideoPing(@Body() dto: VideoPingDto, @Req() req: any) {
    return this.progressService.recordVideoPing(dto, req.user.id);
  }

  @Post('content/:contentItemId/mark-read')
  markDocumentRead(@Param('contentItemId') contentItemId: string, @Req() req: any) {
    return this.progressService.markDocumentRead(contentItemId, req.user.id);
  }
}
