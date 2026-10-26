// Rutas del estudiante — reutiliza JwtAuthGuard, el mismo guard que ya protege
// /api/ordenes y /api/auth/profile. No se crea un guard nuevo para esto:
// "estudiante" y "usuario web logueado" son el mismo concepto en este sistema
// (no hay Supabase Auth separado — ver Moodles/lms/docs/DECISIONES.md).

import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CoursesService, DeliveryModeValue } from './courses.service';

const VALID_MODES: DeliveryModeValue[] = ['TRADICIONAL', 'ASINCRONO_VOD'];

@UseGuards(JwtAuthGuard)
@Controller('api/lms/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /** { moodle: [...], coursera: [...] } — cursos con clave vigente, ya separados por modalidad. */
  @Get()
  listMyCourses(@Req() req: any) {
    return this.coursesService.listMyCourses(req.user.id);
  }

  // Resumen para el dashboard de 4 tarjetas de "Área Personal" — debe ir
  // ANTES de ':courseId' (Nest resuelve rutas en orden de declaración, si no
  // "resumen" se interpretaría como un courseId).
  @Get('resumen')
  getResumenModalidad(@Query('mode') mode: string, @Req() req: any) {
    if (!VALID_MODES.includes(mode as DeliveryModeValue)) {
      throw new BadRequestException('mode debe ser TRADICIONAL o ASINCRONO_VOD.');
    }
    return this.coursesService.getResumenModalidad(req.user.id, mode as DeliveryModeValue);
  }

  // Línea de tiempo / calendario de Moodle — mismo motivo que 'resumen', debe
  // ir ANTES de ':courseId'.
  @Get('linea-de-tiempo')
  getLineaDeTiempo(@Req() req: any) {
    return this.coursesService.getLineaDeTiempo(req.user.id);
  }

  // ?mode=TRADICIONAL (Moodle) | ASINCRONO_VOD (Coursera) — un curso "ambos"
  // necesita saber cuál de sus dos árboles de contenido se está pidiendo.
  @Get(':courseId')
  getCourseDetail(@Param('courseId') courseId: string, @Query('mode') mode: string, @Req() req: any) {
    if (!VALID_MODES.includes(mode as DeliveryModeValue)) {
      throw new BadRequestException('mode debe ser TRADICIONAL o ASINCRONO_VOD.');
    }
    return this.coursesService.getCourseDetail(courseId, req.user.id, mode as DeliveryModeValue);
  }

  /** Pestaña "Participantes" — otros estudiantes vigentes en este mismo curso. */
  @Get(':courseId/participantes')
  listarParticipantes(@Param('courseId') courseId: string, @Req() req: any) {
    return this.coursesService.listarParticipantes(courseId, req.user.id);
  }
}
