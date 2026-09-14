// Destino final: backend-matsso/src/lms/courses/admin-courses.controller.ts
//
// Rutas M2M consumidas por proyecto_matt (Laravel) — nunca por el navegador
// del estudiante. Protegidas por LmsM2mGuard (x-lms-m2m-key), no por JWT.

import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { AdminCoursesService } from './admin-courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';

@UseGuards(LmsM2mGuard)
@Controller('api/lms/admin')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  @Get('courses')
  listCourses() {
    return this.adminCoursesService.listCourses();
  }

  @Get('courses/:courseId')
  getCourseTree(@Param('courseId') courseId: string, @Req() req: any) {
    return this.adminCoursesService.getCourseTree(courseId, req.m2mActor);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto, @Req() req: any) {
    return this.adminCoursesService.createCourse(dto, req.m2mActor);
  }

  @Patch('courses/:courseId')
  updateCourse(@Param('courseId') courseId: string, @Body() dto: UpdateCourseDto, @Req() req: any) {
    return this.adminCoursesService.updateCourse(courseId, dto, req.m2mActor);
  }

  @Post('courses/:courseId/modules')
  createModule(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto, @Req() req: any) {
    return this.adminCoursesService.createModule(courseId, dto, req.m2mActor);
  }

  // Recibe solo el payload JSON con la referencia de Cloudinary — el video
  // pesado va directo Laravel -> Cloudinary (regla de arquitectura, nunca por
  // aquí). Ver create-content-item.dto.ts.
  @Post('modules/:moduleId/content')
  createContentItem(@Param('moduleId') moduleId: string, @Body() dto: CreateContentItemDto, @Req() req: any) {
    return this.adminCoursesService.createContentItem(moduleId, dto, req.m2mActor);
  }

  @Post('content/:contentItemId/quiz')
  createQuiz(@Param('contentItemId') contentItemId: string, @Body() dto: CreateQuizDto, @Req() req: any) {
    return this.adminCoursesService.createQuiz(contentItemId, dto, req.m2mActor);
  }
}
