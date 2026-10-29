import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Logger,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CertificatesService } from './certificates.service';

@Controller('api/certificates')
export class CertificatesController {
  private readonly logger = new Logger(CertificatesController.name);

  constructor(private readonly svc: CertificatesService) {}

  @Get('health')
  @SkipThrottle({ global: true })
  health() {
    return { configured: this.svc.isConfigured() };
  }

  @Get('search')
  // Antes usaba el nombre 'default', que no existe en ThrottlerModule (se llama 'global'),
  // así que este límite no se aplicaba.
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  async searchByName(@Query('nombre') nombre: string) {
    if (!this.svc.isConfigured()) {
      throw new ServiceUnavailableException('Servicio de certificados no disponible.');
    }

    const clean = (typeof nombre === 'string' ? nombre : '').replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').trim();
    if (!clean || clean.length < 3) {
      throw new BadRequestException('Ingresa al menos 3 letras del nombre.');
    }
    if (clean.length > 100) {
      throw new BadRequestException('Nombre demasiado largo.');
    }

    try {
      const files = await this.svc.getCertificatesByName(clean);

      if (files.length === 0) {
        throw new NotFoundException('No se encontraron certificados para ese nombre.');
      }

      return { nombre: clean, total: files.length, certificados: files };
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      // El detalle va solo al log del servidor, nunca al cliente.
      this.logger.error(`Drive API error: ${err?.message ?? err}`);
      throw new ServiceUnavailableException('No se pudo consultar los certificados. Intenta más tarde.');
    }
  }
}
