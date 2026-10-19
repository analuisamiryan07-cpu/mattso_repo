// Portón de entrada al Aula Virtual: valida credenciales (reutiliza
// AuthService.login — mismo bcrypt, mismo JWT que el resto del sitio),
// exige aceptar Términos y Condiciones SOLO la primera vez, y exige que la
// cuenta tenga al menos una orden pagada alguna vez (sin importar si esa
// orden ya tiene una clave generada — eso solo le importa al panel de
// "Generar clave", no a si puede entrar). Sin esto último, cualquier cuenta
// registrada en el sitio público entraría al Aula Virtual aunque nunca haya
// comprado nada — no es "seguridad" real, es solo login.
//
// Orden.estado='PAGADA' cubre los dos métodos de pago reales (PayPal lo
// actualiza en paypal.service.ts al capturar; transferencia lo actualiza
// orders.service.ts al aprobar el comprobante) — por eso se usa ese campo y
// no la tabla `pagos`, que solo existe para PayPal.
//
// Orden de las revisiones (credenciales primero, todo lo demás después) es
// a propósito: revisar "¿tiene orden?" o "¿ya aceptó términos?" ANTES de
// confirmar la contraseña dejaría adivinar correos reales sin saber ninguna
// contraseña. El resultado para quien usa el login es el mismo de todas
// formas: sin alguno de los dos, nunca entra.

import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LmsGateService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /** Para que el formulario sepa si mostrar la casilla de Términos o el enlace simple — sin revelar si la cuenta existe. */
  async necesitaTerminos(correo: string): Promise<{ necesita: boolean }> {
    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
      select: { terminos_aceptados_at: true },
    });
    // Cuenta inexistente -> se trata igual que "todavía no aceptó" (no se
    // revela si ese correo tiene cuenta o no).
    return { necesita: !usuario?.terminos_aceptados_at };
  }

  async login(correo: string, password: string, aceptaTerminos?: boolean) {
    // Si las credenciales son inválidas, AuthService.login ya lanza
    // UnauthorizedException — se deja propagar tal cual.
    const resultado = await this.authService.login(correo, password);
    const usuarioId = BigInt(resultado.user.id);

    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: usuarioId },
      select: { terminos_aceptados_at: true },
    });

    if (!usuario?.terminos_aceptados_at) {
      if (!aceptaTerminos) {
        throw new ForbiddenException('ACEPTA_TERMINOS');
      }
      await this.prisma.usuarioWeb.update({
        where: { id: usuarioId },
        data: { terminos_aceptados_at: new Date() },
      });
    }

    const ordenPagada = await this.prisma.orden.findFirst({
      where: { usuario_id: usuarioId, estado: 'PAGADA' },
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
