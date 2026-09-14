import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ProfessorCoursesService } from './professor-courses.service';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateModuleDto } from '../courses/dto/create-module.dto';
import { CreateContentItemDto } from '../courses/dto/create-content-item.dto';
import { CreateQuizDto } from '../courses/dto/create-quiz.dto';
import { ProfessorGradeSubmissionDto } from './dto/professor-grade-submission.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROFESOR')
@Controller('api/lms/professor')
export class ProfessorCoursesController {
  constructor(private readonly professorCoursesService: ProfessorCoursesService) {}

  @Get('courses')
  listarMisCursos(@Req() req: any) {
    return this.professorCoursesService.listarMisCursos(req.user.id);
  }

  @Post('courses')
  crearCurso(@Body() dto: CreateCourseDto, @Req() req: any) {
    return this.professorCoursesService.crearCurso(req.user.id, dto);
  }

  @Post('courses/:courseId/modules')
  crearModulo(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto, @Req() req: any) {
    return this.professorCoursesService.crearModulo(req.user.id, courseId, dto);
  }

  @Post('modules/:moduleId/content')
  crearContenido(@Param('moduleId') moduleId: string, @Body() dto: CreateContentItemDto, @Req() req: any) {
    return this.professorCoursesService.crearContenido(req.user.id, moduleId, dto);
  }

  @Post('content/:contentItemId/quiz')
  crearQuiz(@Param('contentItemId') contentItemId: string, @Body() dto: CreateQuizDto, @Req() req: any) {
    return this.professorCoursesService.crearQuiz(req.user.id, contentItemId, dto);
  }

  @Get('submissions/pending')
  listarEntregasPendientes(@Req() req: any) {
    return this.professorCoursesService.listarEntregasPendientes(req.user.id);
  }

  @Post('submissions/:submissionId/grade')
  calificar(@Param('submissionId') submissionId: string, @Body() dto: ProfessorGradeSubmissionDto, @Req() req: any) {
    return this.professorCoursesService.calificar(req.user.id, submissionId, dto);
  }
}
