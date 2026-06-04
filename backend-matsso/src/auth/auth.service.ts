import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(correo: string, password: string) {
    if (!correo || !password) {
      throw new UnauthorizedException('Correo y contraseña son requeridos.');
    }

    const user = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
      include: { cliente: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (!user.activo) {
      throw new UnauthorizedException('Cuenta desactivada. Contacte soporte.');
    }

    const payload = {
      sub: Number(user.id),
      correo: user.correo,
      rol: user.rol,
      nombre: user.cliente?.nombre || 'Usuario',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: Number(user.id),
        correo: user.correo,
        nombre: user.cliente?.nombre || 'Usuario',
        rol: user.rol,
      },
    };
  }

  async register(data: { nombre: string; correo: string; password: string; cedula?: string }) {
    const existing = await this.prisma.usuarioWeb.findUnique({
      where: { correo: data.correo },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este correo.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Crear cliente y usuario web transaccionalmente
    const result = await this.prisma.$transaction(async (tx) => {
      // Buscar si ya existe un cliente con esa cédula
      let cliente = null;
      if (data.cedula) {
        cliente = await tx.cliente.findUnique({
          where: { cedula: data.cedula },
        });
      }

      // Si no existe, crear nuevo cliente
      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            nombre: data.nombre,
            cedula: data.cedula || `WEB-${Date.now()}`,
            correo: data.correo,
            fecha: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      // Crear usuario web vinculado al cliente
      const usuarioWeb = await tx.usuarioWeb.create({
        data: {
          correo: data.correo,
          password_hash: passwordHash,
          cliente_id: cliente.id,
          rol: 'ESTUDIANTE',
        },
      });

      return { cliente, usuarioWeb };
    });

    const payload = {
      sub: Number(result.usuarioWeb.id),
      correo: result.usuarioWeb.correo,
      rol: result.usuarioWeb.rol,
      nombre: result.cliente.nombre,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: Number(result.usuarioWeb.id),
        correo: result.usuarioWeb.correo,
        nombre: result.cliente.nombre,
        rol: result.usuarioWeb.rol,
      },
    };
  }
}
