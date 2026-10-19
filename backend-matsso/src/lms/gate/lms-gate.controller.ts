import { Controller, Body, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LmsGateService } from './lms-gate.service';
import { GateLoginDto } from './dto/gate-login.dto';

@Controller('api/lms/gate')
export class LmsGateController {
  constructor(private readonly lmsGateService: LmsGateService) {}

  // Para que el formulario de login sepa si mostrar la casilla de Términos
  // o solo el enlace — se llama antes de enviar el login, con lo que ya
  // escribió en el campo de correo.
  @Throttle({ global: { limit: 20, ttl: 60000 } })
  @Get('necesita-terminos')
  necesitaTerminos(@Query('correo') correo: string) {
    return this.lmsGateService.necesitaTerminos((correo ?? '').trim());
  }

  // Mismo límite que /api/auth/login — es un login, mismo riesgo de fuerza bruta.
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: GateLoginDto) {
    return this.lmsGateService.login(dto.correo, dto.password, dto.acepta_terminos);
  }
}
