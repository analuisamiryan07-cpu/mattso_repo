// Segundo factor de entrada al Aula Virtual — Moodles/lms/docs/REQUISITOS_SISTEMA_INTERNO.md §4.
// El sistema interno genera la clave (vía M2M); el estudiante la ingresa una
// vez que ya inició sesión con correo/contraseña. No sustituye al JWT — es
// una puerta adicional antes de mostrar "Mis cursos", no protege los
// endpoints de datos en sí (esos ya están protegidos por JwtAuthGuard).

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

const CODE_LENGTH = 6;
const EXPIRES_IN_HOURS = 24;

@Injectable()
export class AccessCodesService {
  private readonly logger = new Logger(AccessCodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private generarCodigo(): string {
    // Numérico de 6 dígitos — fácil de leer/escribir a mano o dictar por WhatsApp.
    return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
  }

  async generar(usuarioId: number, actor: string) {
    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(usuarioId) },
      select: { id: true, correo: true, cliente: { select: { nombre: true } } },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    const code = this.generarCodigo();
    const expiresAt = new Date(Date.now() + EXPIRES_IN_HOURS * 60 * 60 * 1000);

    await this.prisma.accessCode.upsert({
      where: { usuario_id: BigInt(usuarioId) },
      update: { code, used: false, used_at: null, expires_at: expiresAt },
      create: { usuario_id: BigInt(usuarioId), code, expires_at: expiresAt },
    });

    await this.emailService.sendAccessCode({
      to: usuario.correo,
      nombre: usuario.cliente?.nombre ?? 'estudiante',
      code,
    });

    this.logger.log(`[${actor}] generó clave de acceso para usuario ${usuarioId}`);

    // Se devuelve el código también en la respuesta (no solo por correo) para
    // que el sistema interno pueda reenviarlo por WhatsApp si quiere — la nube
    // no maneja WhatsApp.
    return { usuario_id: usuarioId, code, expires_at: expiresAt };
  }

  async revocar(usuarioId: number, actor: string) {
    const existing = await this.prisma.accessCode.findUnique({ where: { usuario_id: BigInt(usuarioId) } });
    if (!existing) throw new NotFoundException('Este usuario no tiene una clave activa.');
    await this.prisma.accessCode.delete({ where: { usuario_id: BigInt(usuarioId) } });
    this.logger.log(`[${actor}] revocó la clave de acceso de usuario ${usuarioId}`);
    return { ok: true };
  }

  async verificar(usuarioId: number, code: string) {
    const registro = await this.prisma.accessCode.findUnique({ where: { usuario_id: BigInt(usuarioId) } });

    if (!registro || registro.used || registro.code !== code.trim() || registro.expires_at < new Date()) {
      throw new BadRequestException('Clave incorrecta, vencida o ya utilizada.');
    }

    await this.prisma.accessCode.update({
      where: { usuario_id: BigInt(usuarioId) },
      data: { used: true, used_at: new Date() },
    });

    return { ok: true };
  }

  /**
   * `used: true` es el marcador permanente de "este estudiante ya pasó el
   * portón alguna vez" — no hace falta guardar nada aparte en el navegador.
   * El frontend llama esto una vez al entrar a /aula-virtual para decidir si
   * mostrar el paso de la clave o saltarlo directo a los cursos.
   */
  async estado(usuarioId: number) {
    const registro = await this.prisma.accessCode.findUnique({
      where: { usuario_id: BigInt(usuarioId) },
      select: { used: true },
    });
    return { desbloqueado: registro?.used ?? false };
  }
}
