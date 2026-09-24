// Alta/gestión de profesores — exclusivo del sistema interno (M2M). Un
// profesor nunca se crea a sí mismo ni se autoasciende: eso es justo la
// línea que separa "administrador" (global, sistema interno) de "profesor"
// (solo sus propios cursos) que pidió el negocio.

import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { CreateProfessorDto } from './dto/create-professor.dto';

@Injectable()
export class AdminProfessorsService {
  private readonly logger = new Logger(AdminProfessorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /** Para el desplegable de "asignar profesor" del panel de Cursos. */
  async listar() {
    const profesores = await this.prisma.usuarioWeb.findMany({
      where: { rol: 'PROFESOR' },
      select: { id: true, correo: true, activo: true, cliente: { select: { nombre: true } } },
      orderBy: { correo: 'asc' },
    });
    return profesores.map((p) => ({
      id: Number(p.id),
      correo: p.correo,
      nombre: p.cliente?.nombre ?? null,
      activo: p.activo,
    }));
  }

  async crearOAscender(dto: CreateProfessorDto, actor: string) {
    const existente = await this.prisma.usuarioWeb.findUnique({ where: { correo: dto.correo } });

    if (existente) {
      if (existente.rol === 'PROFESOR') {
        throw new ConflictException('Esta cuenta ya es profesor.');
      }
      const actualizado = await this.prisma.usuarioWeb.update({
        where: { id: existente.id },
        data: { rol: 'PROFESOR' },
      });
      this.logger.log(`[${actor}] ascendió a profesor la cuenta existente ${dto.correo}`);
      return { id: Number(actualizado.id), correo: actualizado.correo, rol: actualizado.rol, creado: false };
    }

    // Contraseña aleatoria que nadie conoce — el profesor la define él mismo
    // con el mismo flujo de "olvidé mi contraseña" que ya existe y ya se prueba.
    const passwordAleatoria = randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(passwordAleatoria, 10);

    const nuevo = await this.prisma.usuarioWeb.create({
      data: {
        correo: dto.correo,
        password_hash,
        rol: 'PROFESOR',
        cliente_id: dto.cliente_id ? BigInt(dto.cliente_id) : null,
      },
    });

    await this.authService.forgotPassword(dto.correo);

    this.logger.log(`[${actor}] creó profesor nuevo ${dto.correo} — se envió correo para definir contraseña`);
    return { id: Number(nuevo.id), correo: nuevo.correo, rol: nuevo.rol, creado: true };
  }

  async cambiarActivo(usuarioId: number, activo: boolean, actor: string) {
    const usuario = await this.prisma.usuarioWeb.findUnique({ where: { id: BigInt(usuarioId) } });
    if (!usuario || usuario.rol !== 'PROFESOR') {
      throw new NotFoundException('No existe un profesor con ese id.');
    }
    const actualizado = await this.prisma.usuarioWeb.update({
      where: { id: BigInt(usuarioId) },
      data: { activo },
    });
    this.logger.log(`[${actor}] ${activo ? 'reactivó' : 'desactivó'} al profesor ${usuarioId}`);
    return { id: Number(actualizado.id), activo: actualizado.activo };
  }
}
