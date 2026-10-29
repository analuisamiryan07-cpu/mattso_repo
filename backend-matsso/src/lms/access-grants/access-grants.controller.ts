import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { AccessGrantsService } from './access-grants.service';
import { GenerarClaveDto } from './dto/generar-clave.dto';
import { CanjearClaveDto } from './dto/canjear-clave.dto';

function parseOrdenId(v?: string): number | undefined {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

@Controller('api/lms')
export class AccessGrantsController {
  constructor(private readonly accessGrantsService: AccessGrantsService) {}

  // ── Sistema interno (Laravel), M2M ─────────────────────────────────────
  @UseGuards(LmsM2mGuard)
  @Get('admin/access-grants/disponibles')
  listarDisponibles(@Query('correo') correo?: string, @Query('orden_id') ordenId?: string) {
    return this.accessGrantsService.listarDisponibles(correo, parseOrdenId(ordenId));
  }

  // Historial (generadas/canjeadas/revocadas) — para no "perder" una clave:
  // si no se canjeó, generar() de nuevo la reenvía, no da error.
  @UseGuards(LmsM2mGuard)
  @Get('admin/access-grants/historial')
  listarHistorial(@Query('correo') correo?: string, @Query('orden_id') ordenId?: string) {
    return this.accessGrantsService.listarHistorial(correo, parseOrdenId(ordenId));
  }

  @UseGuards(LmsM2mGuard)
  @Post('admin/access-grants')
  generar(@Body() dto: GenerarClaveDto, @Req() req: any) {
    return this.accessGrantsService.generar(dto.orden_item_id, req.m2mActor);
  }

  @UseGuards(LmsM2mGuard)
  @Delete('admin/access-grants/:ordenItemId')
  revocar(@Param('ordenItemId', ParseIntPipe) ordenItemId: number, @Req() req: any) {
    return this.accessGrantsService.revocar(ordenItemId, req.m2mActor);
  }

  // ── Estudiante, JWT de sesión — "Añadir curso" en el Aula Virtual ───────
  // 10 intentos/min: evita probar claves por fuerza bruta.
  @UseGuards(JwtAuthGuard)
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post('access-grants/canjear')
  canjear(@Body() dto: CanjearClaveDto, @Req() req: any) {
    return this.accessGrantsService.canjear(req.user.id, dto.codigo);
  }
}
