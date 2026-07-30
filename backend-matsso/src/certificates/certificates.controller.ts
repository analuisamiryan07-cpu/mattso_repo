import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CertificatesService } from './certificates.service';

@Controller('api/certificates')
export class CertificatesController {
  constructor(private readonly svc: CertificatesService) {}

  @Get('health')
  @SkipThrottle()
  health() {
    return { configured: this.svc.isConfigured() };
  }

  @Get('search')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async searchByName(@Query('nombre') nombre: string) {
    if (!this.svc.isConfigured()) {
      throw new ServiceUnavailableException('Servicio de certificados no disponible.');
    }

    const clean = (nombre ?? '').replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').trim();
    if (!clean || clean.length < 2) {
      throw new BadRequestException('Ingresa al menos 2 letras del nombre.');
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
      // Log para ver el error real en Render logs
      console.error('[Certificates] Drive API error:', err?.message ?? err);
      throw new ServiceUnavailableException(
        'Error al consultar Google Drive: ' + (err?.message ?? 'error desconocido'),
      );
    }
  }
}
