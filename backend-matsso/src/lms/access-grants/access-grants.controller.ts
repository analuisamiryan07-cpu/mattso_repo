import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { AccessGrantsService } from './access-grants.service';
import { GenerarClaveDto } from './dto/generar-clave.dto';
import { CanjearClaveDto } from './dto/canjear-clave.dto';

@Controller('api/lms')
export class AccessGrantsController {
  constructor(private readonly accessGrantsService: AccessGrantsService) {}

  // ── Sistema interno (Laravel), M2M ─────────────────────────────────────
  @UseGuards(LmsM2mGuard)
  @Get('admin/access-grants/disponibles')
  listarDisponibles(@Query('correo') correo?: string, @Query('orden_id') ordenId?: string) {
    return this.accessGrantsService.listarDisponibles(correo, ordenId ? Number(ordenId) : undefined);
  }

  @UseGuards(LmsM2mGuard)
  @Post('admin/access-grants')
  generar(@Body() dto: GenerarClaveDto, @Req() req: any) {
    return this.accessGrantsService.generar(dto.orden_item_id, req.m2mActor);
  }

  @UseGuards(LmsM2mGuard)
  @Delete('admin/access-grants/:ordenItemId')
  revocar(@Param('ordenItemId') ordenItemId: string, @Req() req: any) {
    return this.accessGrantsService.revocar(Number(ordenItemId), req.m2mActor);
  }

  // ── Estudiante, JWT de sesión — "Añadir curso" en el Aula Virtual ───────
  @UseGuards(JwtAuthGuard)
  @Post('access-grants/canjear')
  canjear(@Body() dto: CanjearClaveDto, @Req() req: any) {
    return this.accessGrantsService.canjear(req.user.id, dto.clave);
  }
}
