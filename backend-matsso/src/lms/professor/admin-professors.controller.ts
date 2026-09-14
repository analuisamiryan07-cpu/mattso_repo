import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { AdminProfessorsService } from './admin-professors.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { SetProfessorActiveDto } from './dto/set-professor-active.dto';

@UseGuards(LmsM2mGuard)
@Controller('api/lms/admin/professors')
export class AdminProfessorsController {
  constructor(private readonly adminProfessorsService: AdminProfessorsService) {}

  @Post()
  crear(@Body() dto: CreateProfessorDto, @Req() req: any) {
    return this.adminProfessorsService.crearOAscender(dto, req.m2mActor);
  }

  @Patch(':usuarioId')
  cambiarActivo(@Param('usuarioId') usuarioId: string, @Body() dto: SetProfessorActiveDto, @Req() req: any) {
    return this.adminProfessorsService.cambiarActivo(Number(usuarioId), dto.activo, req.m2mActor);
  }
}
