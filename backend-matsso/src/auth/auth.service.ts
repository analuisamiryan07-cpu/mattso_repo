import { Injectable, Logger, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { sanitizePlainText } from '../common/sanitize.util';
import { sha256Hex } from '../common/secure-compare';
import { passwordVersion } from './password-version';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const BCRYPT_ROUNDS = 12;
// Hash bcrypt de una contraseña aleatoria: se compara contra él cuando el
// correo no existe, para que el tiempo de respuesta sea el mismo y no se
// pueda averiguar qué correos están registrados midiendo cuánto tarda.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private firmarToken(user: { id: bigint; correo: string; rol: string; password_hash: string }, nombre: string) {
    return this.jwtService.sign({
      sub: Number(user.id),
      correo: user.correo,
      rol: user.rol,
      nombre,
      pv: passwordVersion(user.password_hash),
    });
  }

  async login(correo: string, password: string) {
    if (typeof correo !== 'string' || typeof password !== 'string' || !correo || !password) {
      throw new UnauthorizedException('Correo y contraseña son requeridos.');
    }
    correo = correo.trim().toLowerCase();

    const user = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
      include: { cliente: true },
    });

    // Siempre se ejecuta bcrypt.compare (con un hash falso si no existe el usuario).
    const passwordValid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (user.activo === false) {
      throw new UnauthorizedException('Cuenta desactivada. Contacte soporte.');
    }

    const nombre = user.cliente?.nombre || 'Usuario';
    return {
      access_token: this.firmarToken(user, nombre),
      user: {
        id: Number(user.id),
        correo: user.correo,
        nombre,
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
    if (!user || user.activo === false) {
      throw new UnauthorizedException('Cuenta no disponible.');
    }

    return { access_token: this.firmarToken(user, user.cliente?.nombre || 'Usuario') };
  }

  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const term = search?.slice(0, 100);

    const where = term
      ? {
          OR: [
            { correo: { contains: term, mode: 'insensitive' as const } },
            { cliente: { nombre: { contains: term, mode: 'insensitive' as const } } },
            { cliente: { cedula: { contains: term } } },
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
    if (typeof correo !== 'string' || !correo) {
      if (!silencioso) throw new BadRequestException('Correo inválido.');
      return;
    }
    correo = correo.trim().toLowerCase();

    const user = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
      include: { cliente: true },
    });
    // Responder igual exista o no el correo (evita enumeración de emails) —
    // salvo en modo no-silencioso, donde sí hace falta saberlo.
    if (!user || user.activo === false) {
      if (!silencioso) throw new BadRequestException('No existe ninguna cuenta activa con ese correo.');
      return;
    }

    // El token viaja solo en el correo; en la BD se guarda su hash. Si alguien
    // lee la tabla (backup, réplica, error de RLS) no puede usar los enlaces.
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // expira en 30 minutos

    await this.prisma.usuarioWeb.update({
      where: { id: user.id },
      data: { reset_token: sha256Hex(token), reset_token_expires_at: expires },
    });

    const frontendUrl = (process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://sapper-industries.com')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const nombre   = user.cliente?.nombre || correo;

    try {
      await this.emailService.sendPasswordReset({ to: correo, nombre, resetUrl });
    } catch (err: any) {
      this.logger.error(`Error enviando correo de recuperación (usuario ${user.id}): ${err?.message}`);
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
      data: { reset_token: sha256Hex(token), reset_token_expires_at: expires },
    });

    const frontendUrl = (process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://sapper-industries.com')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
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
        reset_token: sha256Hex(token),
        reset_token_expires_at: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('El enlace es inválido o ha expirado. Solicita uno nuevo.');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // updateMany con el token en la condición: si dos peticiones usan el mismo
    // enlace a la vez, solo una lo consume.
    const { count } = await this.prisma.usuarioWeb.updateMany({
      where: { id: user.id, reset_token: user.reset_token },
      data: {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires_at: null,
      },
    });
    if (count !== 1) throw new BadRequestException('El enlace es inválido o ha expirado. Solicita uno nuevo.');
    // Al cambiar password_hash, todos los JWT anteriores quedan inválidos (ver password-version.ts).
  }

  async register(data: { nombre: string; correo: string; password: string; cedula?: string; telefono?: string; ciudad?: string; direccion?: string }) {
    const correo = data.correo.trim().toLowerCase();
    const nombre = sanitizePlainText(data.nombre) || 'Usuario';
    const ciudad = sanitizePlainText(data.ciudad) || null;
    const direccion = sanitizePlainText(data.direccion) || null;

    const existing = await this.prisma.usuarioWeb.findUnique({
      where: { correo },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este correo.');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Crear cliente y usuario web transaccionalmente
    const result = await this.prisma.$transaction(async (tx) => {
      const existente = data.cedula
        ? await tx.cliente.findUnique({
            where: { cedula: data.cedula },
            include: { usuarios_web: { select: { id: true } } },
          })
        : null;
      let cliente;

      if (existente) {
        // Antes: cualquiera que supiera una cédula podía registrarse con ella,
        // quedar vinculado al cliente existente (y ver sus datos personales) y
        // además sobrescribir su correo. Ahora solo se vincula si el cliente
        // no tiene ya una cuenta web Y el correo coincide con el registrado.
        const yaTieneCuenta = existente.usuarios_web.length > 0;
        const correoCoincide = (existente.correo ?? '').trim().toLowerCase() === correo;
        if (yaTieneCuenta || !correoCoincide) {
          throw new ConflictException(
            'Esta cédula ya está registrada. Si es tuya, inicia sesión o contacta a soporte para vincular tu cuenta.',
          );
        }
        cliente = await tx.cliente.update({
          where: { id: existente.id },
          data: {
            telefono: data.telefono || existente.telefono,
            ciudad: ciudad || existente.ciudad,
            direccion: direccion || existente.direccion,
            updated_at: new Date(),
          },
        });
      } else {
        cliente = await tx.cliente.create({
          data: {
            nombre,
            cedula: data.cedula || `WEB-${crypto.randomUUID()}`,
            correo,
            telefono: data.telefono || null,
            ciudad,
            direccion,
            fecha: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      const usuarioWeb = await tx.usuarioWeb.create({
        data: {
          correo,
          password_hash: passwordHash,
          cliente_id: cliente.id,
          rol: 'ESTUDIANTE',
        },
      });

      return { cliente, usuarioWeb };
    });

    return {
      access_token: this.firmarToken(result.usuarioWeb, result.cliente.nombre),
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
