import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  NotFoundException,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { QrCertsService } from './qr-certs.service';
import { CreateQrCertDto } from './dto/create-qr-cert.dto';

// Rutas admin: /api/qr-certs/admin
@UseGuards(AdminKeyGuard)
@Controller('api/qr-certs')
export class QrCertsController {
  constructor(private readonly service: QrCertsService) {}

  @Get('admin')
  async findAll() {
    return this.service.findAll();
  }

  @Post('admin')
  async create(
    @Body() dto: CreateQrCertDto,
  ) {
    return this.service.create(dto);
  }

  @Delete('admin/:id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(BigInt(id));
  }
}

// Ruta pública: /api/verificar/:codigo — solo se llega escaneando el QR del certificado.
@Controller('api/verificar')
export class VerificarController {
  constructor(private readonly service: QrCertsService) {}

  // Público: 30 consultas/min por IP para que no se pueda recorrer el espacio de códigos.
  @Throttle({ global: { limit: 30, ttl: 60000 } })
  @Get(':codigo')
  async verificar(@Param('codigo') codigo: string, @Res({ passthrough: true }) res: Response) {
    // Antes de buscar, para que también el 404 lleve la cabecera.
    res.setHeader('X-Robots-Tag', 'noindex');
    if (!/^[a-f0-9]{12}$/i.test(codigo ?? '')) throw new NotFoundException('Certificado no encontrado');
    return this.service.findByCodigo(codigo.toLowerCase());
  }
}
