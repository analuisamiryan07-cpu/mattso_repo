import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Antes tenía @SkipThrottle(): permitía probar claves de admin sin límite.
  @UseGuards(AdminKeyGuard)
  @Throttle({ global: { limit: 30, ttl: 60000 } })
  @Get('admin/users')
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('buscar') search?: string,
  ) {
    const p = Number.parseInt(page ?? '', 10);
    const l = Number.parseInt(limit ?? '', 10);
    return this.authService.listUsers(
      Number.isFinite(p) ? Math.max(1, p) : 1,
      Number.isFinite(l) ? Math.min(100, Math.max(1, l)) : 25,
      typeof search === 'string' && search ? search : undefined,
    );
  }

  // Máximo 10 intentos de login por minuto para prevenir fuerza bruta
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.correo, dto.password);
  }

  // Máximo 5 registros por minuto por IP
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ global: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.correo);
    // Siempre responder OK — no revelar si el correo existe
    return { message: 'Si el correo está registrado, recibirás el enlace en breve.' };
  }

  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: any) {
    return { user: req.user };
  }

  // Sesión deslizante del Aula Virtual: mientras haya actividad, el
  // frontend llama esto antes de que el token actual venza, y recibe uno
  // nuevo — si no hay actividad, el frontend deja de llamarlo y la sesión
  // se cierra sola (no hay nada que "revocar" aquí, es solo no renovar).
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    return this.authService.refresh(req.user.id);
  }
}
