import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  HttpCode,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { QrCertsService } from './qr-certs.service';
import { CreateQrCertDto } from './dto/create-qr-cert.dto';

// Rutas admin: /api/qr-certs/admin
@Controller('api/qr-certs')
export class QrCertsController {
  constructor(private readonly service: QrCertsService) {}

  private checkAdmin(key: string) {
    if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
  }

  @Get('admin')
  async findAll(@Headers('x-admin-key') key: string) {
    this.checkAdmin(key);
    return this.service.findAll();
  }

  @Post('admin')
  async create(
    @Headers('x-admin-key') key: string,
    @Body() dto: CreateQrCertDto,
  ) {
    this.checkAdmin(key);
    return this.service.create(dto);
  }

  @Delete('admin/:id')
  @HttpCode(200)
  async remove(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
  ) {
    this.checkAdmin(key);
    return this.service.remove(BigInt(id));
  }
}

// Ruta pública: /api/verificar/:codigo — solo se llega escaneando el QR del certificado.
@Controller('api/verificar')
export class VerificarController {
  constructor(private readonly service: QrCertsService) {}

  @Get(':codigo')
  // El throttler de app.module se llama 'global' (con 'default' no se aplicaría).
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  async verificar(@Param('codigo') codigo: string, @Res({ passthrough: true }) res: Response) {
    // Antes de buscar, para que también el 404 lleve la cabecera.
    res.setHeader('X-Robots-Tag', 'noindex');
    return this.service.findByCodigo(codigo);
  }
}
