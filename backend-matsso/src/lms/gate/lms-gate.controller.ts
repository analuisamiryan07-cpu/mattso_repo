import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LmsGateService } from './lms-gate.service';
import { GateLoginDto } from './dto/gate-login.dto';

@Controller('api/lms/gate')
export class LmsGateController {
  constructor(private readonly lmsGateService: LmsGateService) {}

  // Mismo límite que /api/auth/login — es un login, mismo riesgo de fuerza bruta.
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: GateLoginDto) {
    return this.lmsGateService.login(dto.correo, dto.password);
  }
}
