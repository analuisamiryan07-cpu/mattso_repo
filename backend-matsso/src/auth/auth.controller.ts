import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Headers,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private checkAdminKey(key: string) {
    if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
  }

  @SkipThrottle()
  @Get('admin/users')
  async listUsers(
    @Headers('x-admin-key') adminKey: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('buscar') search?: string,
  ) {
    this.checkAdminKey(adminKey);
    return this.authService.listUsers(
      page ? Math.max(1, parseInt(page)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit))) : 25,
      search || undefined,
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

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: any) {
    return { user: req.user };
  }
}
