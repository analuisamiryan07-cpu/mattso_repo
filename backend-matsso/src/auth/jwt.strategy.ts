import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { passwordVersion } from './password-version';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Sin fallback hardcodeado: validateEnv() impide arrancar sin JWT_SECRET.
      secretOrKey: process.env.JWT_SECRET as string,
      // Solo HS256 — evita ataques de confusión de algoritmo.
      algorithms: ['HS256'],
    });
  }

  /**
   * Además de la firma, se revisa la cuenta en la BD en cada petición:
   * - cuenta desactivada → el token deja de servir de inmediato (no a las 2h).
   * - contraseña cambiada (reset) → los tokens emitidos antes quedan inválidos.
   * - el rol se toma de la BD, no del token (un profesor degradado pierde el permiso al instante).
   */
  async validate(payload: any) {
    const id = Number(payload?.sub);
    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, correo: true, rol: true, activo: true, password_hash: true },
    });

    if (!user || user.activo === false) {
      throw new UnauthorizedException('Sesión no válida.');
    }
    if (payload.pv !== passwordVersion(user.password_hash)) {
      throw new UnauthorizedException('La sesión expiró. Inicia sesión de nuevo.');
    }

    return {
      id,
      correo: user.correo,
      rol: user.rol,
      nombre: payload.nombre,
    };
  }
}
