// Portón de entrada al Aula Virtual: valida credenciales (reutiliza
// AuthService.login — mismo bcrypt, mismo JWT que el resto del sitio) y
// además exige que la cuenta tenga al menos una orden pagada. Sin esto,
// cualquier cuenta registrada en el sitio público entraría al Aula Virtual
// aunque nunca haya comprado nada — no es "seguridad" real, es solo login.
//
// Orden.estado='PAGADA' cubre los dos métodos de pago reales (PayPal lo
// actualiza en paypal.service.ts al capturar; transferencia lo actualiza
// orders.service.ts al aprobar el comprobante) — por eso se usa ese campo y
// no la tabla `pagos`, que solo existe para PayPal.

import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LmsGateService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async login(correo: string, password: string) {
    // Si las credenciales son inválidas, AuthService.login ya lanza
    // UnauthorizedException — se deja propagar tal cual.
    const resultado = await this.authService.login(correo, password);

    const ordenPagada = await this.prisma.orden.findFirst({
      where: { usuario_id: BigInt(resultado.user.id), estado: 'PAGADA' },
      select: { id: true },
    });

    if (!ordenPagada) {
      // No se entrega el token: aunque las credenciales eran correctas, esta
      // cuenta no queda "logueada" para el Aula Virtual.
      throw new ForbiddenException('SIN_INSCRIPCION');
    }

    return resultado;
  }
}
