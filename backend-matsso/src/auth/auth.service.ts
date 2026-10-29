import { Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
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
        cedula: user.cliente?.cedula || null,
        telefono: user.cliente?.telefono || null,
        ciudad: user.cliente?.ciudad || null,
        direccion: user.cliente?.direccion || null,
      },
    };
  }

  /**
   * Renueva el token sin pedir contraseña de nuevo — lo usa el Aula Virtual
   * para mantener la sesión abierta mientras la persona la está usando
   * (sesión "deslizante": se extiende con actividad, no con un tiempo fijo).
   * Requiere un token todavía válido (JwtAuthGuard ya lo exige antes de
   * llegar aquí) — no sirve para resucitar uno vencido.
   */
  async refresh(userId: number) {
    const user = await this.prisma.usuarioWeb.findUnique({
      where: { id: BigInt(userId) },
      include: { cliente: true },
    });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Cuenta no disponible.');
    }

    const payload = {
      sub: Number(user.id),
      correo: user.correo,
      rol: user.rol,
      nombre: user.cliente?.nombre || 'Usuario',
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { correo: { contains: search, mode: 'insensitive' as const } },
            { cliente: { nombre: { contains: search, mode: 'insensitive' as const } } },
            { cliente: { cedula: { contains: search } } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      this.prisma.usuarioWeb.count({ where }),
      this.prisma.usuarioWeb.findMany({
        where,
        include: {
          cliente: { select: { nombre: true, cedula: true, telefono: true, ciudad: true, direccion: true } },
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: Number(u.id),
        correo: u.correo,
        rol: u.rol,
        activo: u.activo,
        nombre: u.cliente?.nombre || '—',
        cedula: u.cliente?.cedula || '—',
        telefono: u.cliente?.telefono || '—',
        ciudad: u.cliente?.ciudad || '—',
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * `silencioso` (default true, el comportamiento de siempre): /forgot-password
   * público nunca debe revelar si un correo existe ni si el envío falló — por
   * eso responde igual pase lo que pase. Pero AdminProfessorsService llama a
   * esto mismo para avisarle a un profesor nuevo que puede poner su
   * contraseña, y ahí SÍ hace falta que un fallo real (correo no existe,
   * Brevo caído, etc.) se note — si no, el sistema interno "crea" al
   * profesor pero nadie se entera por qué nunca le llegó nada.
   */
  async forgotPassword(correo: string, opciones: { silencioso?: boolean } = {}): Promise<void> {
    const silencioso = opciones.silencioso ?? true;

    const user = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
      include: { cliente: true },
    });
    if (!user) {
      if (!silencioso) throw new BadRequestException('No existe ninguna cuenta con ese correo.');
      return; // Responder igual exista o no el correo (evita enumeración de emails)
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // expira en 1 hora

    await this.prisma.usuarioWeb.update({
      where: { correo },
      data: { reset_token: token, reset_token_expires_at: expires },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://sapper-industries.com';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const nombre   = user.cliente?.nombre || correo;

    try {
      await this.emailService.sendPasswordReset({ to: correo, nombre, resetUrl });
    } catch (err: any) {
      this.logger.error(`Error enviando correo de recuperación a ${correo}: ${err?.message}`);
      // /forgot-password público no debe propagarse (evita enumeración); el
      // alta de profesor sí necesita saberlo, para no reportar éxito en falso.
      if (!silencioso) throw new BadRequestException('No se pudo enviar el correo. Intenta de nuevo o revisa el correo escrito.');
    }
  }

  /**
   * Aviso de "te asignaron el curso X", no de "olvidaste tu contraseña" —
   * lo llama AdminCoursesService.asignarProfesor cada vez que un admin
   * vincula un profesor a un curso (al crear la cuenta Y en cada asignación
   * posterior, incluso a cursos distintos). Reusa el mismo mecanismo de
   * token (hash en BD, 30 min) que forgotPassword, pero con la plantilla y
   * el remitente correctos para un profesor, no para el sitio público.
   */
  async enviarBienvenidaProfesor(correo: string, cursoTitulo: string): Promise<{ correo_enviado: boolean; aviso?: string }> {
    correo = correo.trim().toLowerCase();

    const user = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
      include: { cliente: true },
    });
    if (!user || user.activo === false) {
      return { correo_enviado: false, aviso: 'No existe ninguna cuenta activa con ese correo.' };
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    await this.prisma.usuarioWeb.update({
      where: { id: user.id },
      data: { reset_token: token, reset_token_expires_at: expires },
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'https://sapper-industries.com').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const aulaUrl  = (process.env.AULA_VIRTUAL_URL || 'https://aula.sapper-industries.com').replace(/\/$/, '');
    const nombre   = user.cliente?.nombre || correo;

    try {
      await this.emailService.sendProfessorCourseWelcome({ to: correo, nombre, cursoTitulo, aulaUrl, resetUrl });
      return { correo_enviado: true };
    } catch (err: any) {
      this.logger.error(`Error enviando aviso de asignación de curso (usuario ${user.id}): ${err?.message}`);
      return { correo_enviado: false, aviso: 'No se pudo enviar el correo de aviso al profesor.' };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token) throw new BadRequestException('Token requerido.');

    const user = await this.prisma.usuarioWeb.findFirst({
      where: {
        reset_token: token,
        reset_token_expires_at: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('El enlace es inválido o ha expirado. Solicita uno nuevo.');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.usuarioWeb.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires_at: null,
      },
    });
  }

  async register(data: { nombre: string; correo: string; password: string; cedula?: string; telefono?: string; ciudad?: string; direccion?: string }) {
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

      // Si no existe, crear nuevo cliente; si ya existe, actualizar datos de contacto web
      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            nombre: data.nombre,
            cedula: data.cedula || `WEB-${Date.now()}`,
            correo: data.correo,
            telefono: data.telefono || null,
            ciudad: data.ciudad || null,
            direccion: data.direccion || null,
            fecha: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      } else {
        // Actualiza datos de contacto (no sobrescribe campos de examen ni puntajes)
        cliente = await tx.cliente.update({
          where: { id: cliente.id },
          data: {
            correo: data.correo,
            telefono: data.telefono || cliente.telefono,
            ciudad: data.ciudad || cliente.ciudad,
            direccion: data.direccion || cliente.direccion,
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
        cedula: result.cliente.cedula || null,
        telefono: result.cliente.telefono || null,
        ciudad: result.cliente.ciudad || null,
        direccion: result.cliente.direccion || null,
      },
    };
  }
}
