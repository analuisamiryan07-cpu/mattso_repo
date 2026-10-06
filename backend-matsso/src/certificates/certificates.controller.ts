import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CertificatesService } from './certificates.service';

// La búsqueda pública por nombre (GET search) se eliminó: con 2 letras exponía
// certificados de otras personas (LOPDP). La verificación por código único vive
// en /verificar/:codigo y no depende de este módulo.
@Controller('api/certificates')
export class CertificatesController {
  constructor(private readonly svc: CertificatesService) {}

  @Get('health')
  @SkipThrottle()
  health() {
    return { configured: this.svc.isConfigured() };
  }
}
