import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { QrCertsService } from './qr-certs.service';

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
    @Body() body: any,
  ) {
    this.checkAdmin(key);
    return this.service.create(body);
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

// Ruta pública: /api/verificar/:codigo
@Controller('api/verificar')
export class VerificarController {
  constructor(private readonly service: QrCertsService) {}

  @Get(':codigo')
  async verificar(@Param('codigo') codigo: string) {
    return this.service.findByCodigo(codigo);
  }
}
