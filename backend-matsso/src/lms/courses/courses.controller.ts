//
// Rutas del estudiante — reutiliza JwtAuthGuard, el mismo guard que ya protege
// /api/ordenes y /api/auth/profile. No se crea un guard nuevo para esto:
// "estudiante" y "usuario web logueado" son el mismo concepto en este sistema
// (no hay Supabase Auth separado — ver Moodles/lms/docs/DECISIONES.md).

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CoursesService } from './courses.service';

@UseGuards(JwtAuthGuard)
@Controller('api/lms/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listMyCourses(@Req() req: any) {
    return this.coursesService.listMyCourses(req.user.id);
  }

  @Get(':courseId')
  getCourseDetail(@Param('courseId') courseId: string, @Req() req: any) {
    return this.coursesService.getCourseDetail(courseId, req.user.id);
  }
}
