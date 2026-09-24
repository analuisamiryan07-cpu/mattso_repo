// Rutas M2M consumidas por proyecto_matt (Laravel) — nunca por el navegador
// del estudiante. Protegidas por LmsM2mGuard (x-lms-m2m-key), no por JWT.

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { AdminCoursesService } from './admin-courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UploadCourseImageDto } from './dto/upload-course-image.dto';
import { AsignarProfesorDto } from './dto/asignar-profesor.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

@UseGuards(LmsM2mGuard)
@Controller('api/lms/admin')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  @Get('courses')
  listCourses() {
    return this.adminCoursesService.listCourses();
  }

  // Antes de 'courses/:courseId' — si no, ':courseId' capturaría "dashboard".
  @Get('courses/dashboard')
  getDashboard() {
    return this.adminCoursesService.getDashboard();
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

  @Patch('courses/:courseId/profesor')
  asignarProfesor(@Param('courseId') courseId: string, @Body() dto: AsignarProfesorDto, @Req() req: any) {
    return this.adminCoursesService.asignarProfesor(courseId, dto.profesor_usuario_id, req.m2mActor);
  }

  // Imagen del curso. Va POR AQUÍ (a diferencia del video, que es Laravel ->
  // Cloudinary directo): las imágenes son livianas y esto reusa el mismo
  // patrón ya probado en orders.controller.ts (comprobantes) — validación de
  // magic bytes real, no solo el Content-Type declarado por el cliente.
  @Post('courses/:courseId/imagen')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Tipo de archivo no permitido. Solo imágenes JPG, PNG o WebP.'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImagen(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadCourseImageDto,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('La imagen es obligatoria.');
    const check = MAGIC_BYTES[file.mimetype];
    if (!check || !check(file.buffer)) {
      throw new BadRequestException('El archivo no parece ser una imagen válida.');
    }
    return this.adminCoursesService.uploadImagen(courseId, dto.slot, file, req.m2mActor);
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
