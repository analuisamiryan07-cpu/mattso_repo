import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LmsM2mGuard } from '../common/lms-m2m.guard';
import { AccessCodesService } from './access-codes.service';
import { GenerateAccessCodeDto } from './dto/generate-access-code.dto';
import { VerifyAccessCodeDto } from './dto/verify-access-code.dto';

@Controller('api/lms')
export class AccessCodesController {
  constructor(private readonly accessCodesService: AccessCodesService) {}

  // ── Sistema interno (M2M) ──────────────────────────────────────────
  @UseGuards(LmsM2mGuard)
  @Post('admin/access-codes')
  generar(@Body() dto: GenerateAccessCodeDto, @Req() req: any) {
    return this.accessCodesService.generar(dto.usuario_id, req.m2mActor);
  }

  @UseGuards(LmsM2mGuard)
  @Delete('admin/access-codes/:usuarioId')
  revocar(@Param('usuarioId') usuarioId: string, @Req() req: any) {
    return this.accessCodesService.revocar(Number(usuarioId), req.m2mActor);
  }

  // ── Estudiante/profesor (JWT) ───────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('access-codes/verify')
  verificar(@Body() dto: VerifyAccessCodeDto, @Req() req: any) {
    return this.accessCodesService.verificar(req.user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('access-codes/status')
  estado(@Req() req: any) {
    return this.accessCodesService.estado(req.user.id);
  }
}
