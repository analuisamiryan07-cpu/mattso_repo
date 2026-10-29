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
      // Ya tiene contraseña (era cliente/otra cuenta) — el correo aquí es solo
      // un aviso de bienvenida con el mismo enlace de siempre, no obligatorio
      // para que pueda entrar (ya podía, con la contraseña que ya tenía).
      const avisoEmail = await this.enviarAvisoCorreo(dto.correo);
      return { id: Number(actualizado.id), correo: actualizado.correo, rol: actualizado.rol, creado: false, ...avisoEmail };
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

    // Aquí sí es indispensable: sin este correo el profesor no tiene ninguna
    // forma de poner su contraseña y entrar. Si falla, igual se devuelve el
    // profesor ya creado (no se revierte) pero con el aviso explícito — antes
    // esto fallaba en silencio y nadie se enteraba de que nunca llegó nada.
    const avisoEmail = await this.enviarAvisoCorreo(dto.correo);

    this.logger.log(`[${actor}] creó profesor nuevo ${dto.correo}${avisoEmail.correo_enviado ? ' — se envió correo para definir contraseña' : ' — NO se pudo enviar el correo'}`);
    return { id: Number(nuevo.id), correo: nuevo.correo, rol: nuevo.rol, creado: true, ...avisoEmail };
  }

  /** No deja que un correo que no llega pase desapercibido — ver AuthService.forgotPassword. */
  private async enviarAvisoCorreo(correo: string): Promise<{ correo_enviado: boolean; aviso?: string }> {
    try {
      await this.authService.forgotPassword(correo, { silencioso: false });
      return { correo_enviado: true };
    } catch (err: any) {
      this.logger.error(`No se pudo enviar el correo de bienvenida a ${correo}: ${err?.message}`);
      return {
        correo_enviado: false,
        aviso: 'El profesor se guardó correctamente, pero no se pudo enviar el correo para que defina su contraseña. Pídele que use "¿Olvidaste tu contraseña?" en el sitio con este mismo correo, o avísanos para revisarlo.',
      };
    }
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
