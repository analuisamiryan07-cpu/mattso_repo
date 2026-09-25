// Reemplaza a access-codes (código de 6 dígitos, uno por usuario, para
// siempre). Ahora es una clave JWT por CADA compra de curso — ver
// clave.util.ts y Moodles/lms/docs/DECISIONES.md.
//
// Candado de "esta compra ya se usó": se aparta al GENERAR (no al canjear) —
// contrato acordado con el sistema interno. Revocar una clave sin canjear
// libera el cupo para generar otra sobre la misma compra.

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { addMonths, signClave, verifyClave } from './clave.util';

function esViolacionUnicidad(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

@Injectable()
export class AccessGrantsService {
  private readonly logger = new Logger(AccessGrantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /** Compras de curso, pagadas, de este correo, sin una clave vigente — para el buscador del panel. */
  async listarDisponibles(correo?: string, ordenId?: number) {
    if (!correo && !ordenId) {
      throw new BadRequestException('Indica el correo del comprador o el número de orden.');
    }

    const usuario = correo
      ? await this.prisma.usuarioWeb.findUnique({ where: { correo }, select: { id: true } })
      : null;
    if (correo && !usuario) throw new NotFoundException('No existe un usuario con ese correo.');

    const items = await this.prisma.ordenItem.findMany({
      where: {
        orden: {
          estado: 'PAGADA',
          ...(usuario ? { usuario_id: usuario.id } : {}),
          ...(ordenId ? { id: BigInt(ordenId) } : {}),
        },
        producto: { tipo: 'CURSO', curso: { isNot: null } },
        access_grants: { none: { revoked_at: null } },
      },
      include: {
        orden: { select: { id: true, usuario_id: true, fecha_orden: true } },
        producto: {
          select: {
            titulo: true,
            curso: { select: { id: true, modo_moodle: true, modo_coursera: true, duracion_meses: true } },
          },
        },
      },
      orderBy: { orden: { fecha_orden: 'desc' } },
    });

    return items.map((i) => ({
      orden_item_id: Number(i.id),
      orden_id: Number(i.orden.id),
      usuario_id: Number(i.orden.usuario_id),
      fecha: i.orden.fecha_orden,
      curso_titulo: i.producto.titulo,
      course_id: i.producto.curso!.id,
      modo_moodle: i.producto.curso!.modo_moodle,
      modo_coursera: i.producto.curso!.modo_coursera,
      duracion_meses: i.producto.curso!.duracion_meses,
    }));
  }

  async generar(ordenItemId: number, actor: string) {
    const ordenItem = await this.prisma.ordenItem.findUnique({
      where: { id: BigInt(ordenItemId) },
      include: { orden: true, producto: { include: { curso: true } } },
    });
    if (!ordenItem) throw new NotFoundException('Compra no encontrada.');
    if (ordenItem.orden.estado !== 'PAGADA') {
      throw new BadRequestException('Esta compra todavía no está pagada.');
    }

    const course = ordenItem.producto.curso;
    if (!course) {
      throw new BadRequestException('Este producto no tiene un curso del Aula Virtual vinculado.');
    }
    if (course.duracion_meses == null) {
      throw new BadRequestException(
        'El curso no tiene configurada su duración de acceso — configúrala antes de generar claves.',
      );
    }

    const yaVigente = await this.prisma.accessGrant.findFirst({
      where: { orden_item_id: ordenItem.id, revoked_at: null },
    });
    if (yaVigente) {
      // Ya canjeada: no se puede "recuperar" el token original (nunca se
      // guarda completo), y regenerar invalidaría el acceso ya dado. Hay que
      // revocar y generar una clave nueva a propósito, no en automático.
      if (yaVigente.redeemed_at) {
        throw new ConflictException('Esta compra ya tiene una clave y ya fue canjeada — no se puede reenviar.');
      }
      // Todavía no se canjeó: "generar" de nuevo es simplemente "reenviar" —
      // mismo jti, se vuelve a firmar y a mandar por correo. Resuelve el caso
      // real de "se generó pero se perdió el correo/la copié mal".
      return this.reenviar(yaVigente, actor);
    }

    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: ordenItem.orden.usuario_id },
      select: { id: true, correo: true, cliente: { select: { nombre: true } } },
    });
    if (!usuario) throw new NotFoundException('El comprador de esta orden ya no existe.');

    const jwtId = randomUUID();
    const clave = signClave({
      jti: jwtId,
      sub: usuario.id.toString(),
      course_id: course.id,
      curso_titulo: course.titulo,
      duracion_meses: course.duracion_meses,
      modo_moodle: course.modo_moodle,
      modo_coursera: course.modo_coursera,
    });

    let grant;
    try {
      grant = await this.prisma.accessGrant.create({
        data: {
          usuario_id: usuario.id,
          course_id: course.id,
          orden_item_id: ordenItem.id,
          duracion_meses: course.duracion_meses,
          jwt_id: jwtId,
          generado_por: actor,
        },
      });
    } catch (e) {
      // Índice único parcial (orden_item_id WHERE revoked_at IS NULL): dos
      // llamadas simultáneas sobre la misma compra.
      if (esViolacionUnicidad(e)) {
        throw new ConflictException('Esta compra ya tiene una clave generada.');
      }
      throw e;
    }

    this.emailService
      .sendAccessGrant({
        to: usuario.correo,
        nombre: usuario.cliente?.nombre ?? 'estudiante',
        cursoTitulo: course.titulo,
        duracionMeses: course.duracion_meses,
        clave,
      })
      .catch((err) => this.logger.error('No se pudo enviar el correo de la clave:', err?.message));

    this.logger.log(`[${actor}] generó clave para orden_item=${ordenItem.id} (curso ${course.id}, usuario ${usuario.id})`);

    // La clave también viaja en la respuesta (no solo por correo) — igual
    // que el código de 6 dígitos antes, por si el sistema interno la quiere
    // reenviar por WhatsApp. La nube no maneja WhatsApp.
    return {
      access_grant_id: grant.id,
      usuario_id: Number(usuario.id),
      course_id: course.id,
      clave,
    };
  }

  /** Vuelve a firmar el MISMO jti y lo reenvía por correo — no crea una fila nueva. */
  private async reenviar(grant: { id: string; jwt_id: string; usuario_id: bigint; course_id: string }, actor: string) {
    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: grant.usuario_id },
      select: { id: true, correo: true, cliente: { select: { nombre: true } } },
    });
    if (!usuario) throw new NotFoundException('El comprador de esta orden ya no existe.');

    const course = await this.prisma.course.findUnique({ where: { id: grant.course_id } });
    if (!course || course.duracion_meses == null) {
      throw new BadRequestException('El curso de esta clave ya no está disponible o no tiene duración configurada.');
    }

    const clave = signClave({
      jti: grant.jwt_id,
      sub: usuario.id.toString(),
      course_id: course.id,
      curso_titulo: course.titulo,
      duracion_meses: course.duracion_meses,
      modo_moodle: course.modo_moodle,
      modo_coursera: course.modo_coursera,
    });

    this.emailService
      .sendAccessGrant({
        to: usuario.correo,
        nombre: usuario.cliente?.nombre ?? 'estudiante',
        cursoTitulo: course.titulo,
        duracionMeses: course.duracion_meses,
        clave,
      })
      .catch((err) => this.logger.error('No se pudo reenviar el correo de la clave:', err?.message));

    this.logger.log(`[${actor}] reenvió la clave de orden_item=${grant.id.slice(0, 8)}… (curso ${course.id}, usuario ${usuario.id})`);

    return {
      access_grant_id: grant.id,
      usuario_id: Number(usuario.id),
      course_id: course.id,
      clave,
      reenviada: true,
    };
  }

  /** Historial completo (generadas/canjeadas/revocadas) — para que el sistema interno vea qué pasó con cada clave. */
  async listarHistorial(correo?: string, ordenId?: number) {
    if (!correo && !ordenId) {
      throw new BadRequestException('Indica el correo del comprador o el número de orden.');
    }

    const usuario = correo
      ? await this.prisma.usuarioWeb.findUnique({ where: { correo }, select: { id: true } })
      : null;
    if (correo && !usuario) throw new NotFoundException('No existe un usuario con ese correo.');

    const grants = await this.prisma.accessGrant.findMany({
      where: {
        ...(usuario ? { usuario_id: usuario.id } : {}),
        ...(ordenId ? { orden_item: { orden_id: BigInt(ordenId) } } : {}),
      },
      include: { course: { select: { titulo: true } }, orden_item: { select: { orden_id: true } } },
      orderBy: { generado_at: 'desc' },
    });

    return grants.map((g) => ({
      orden_item_id: Number(g.orden_item_id),
      orden_id: Number(g.orden_item.orden_id),
      curso_titulo: g.course.titulo,
      generado_at: g.generado_at,
      generado_por: g.generado_por,
      estado: g.revoked_at ? 'REVOCADA' : g.redeemed_at ? 'CANJEADA' : 'PENDIENTE',
      redeemed_at: g.redeemed_at,
      expires_at: g.expires_at,
      revoked_at: g.revoked_at,
    }));
  }

  async revocar(ordenItemId: number, actor: string) {
    const grant = await this.prisma.accessGrant.findFirst({
      where: { orden_item_id: BigInt(ordenItemId), revoked_at: null },
    });
    if (!grant) throw new NotFoundException('No hay una clave vigente para esta compra.');
    if (grant.redeemed_at) {
      throw new ConflictException('Esta clave ya fue canjeada por el estudiante, no se puede revocar.');
    }

    await this.prisma.accessGrant.update({ where: { id: grant.id }, data: { revoked_at: new Date() } });
    this.logger.log(`[${actor}] revocó la clave de orden_item=${ordenItemId}`);
    return { ok: true };
  }

  async canjear(usuarioId: number, claveToken: string) {
    let claims;
    try {
      claims = verifyClave(claveToken.trim());
    } catch {
      throw new BadRequestException('Clave inválida o vencida.');
    }

    if (claims.sub !== usuarioId.toString()) {
      // No es "no encontrada" — existe, pero es de otra persona. No se
      // confirma ni se niega más detalle para no dar pistas.
      throw new ForbiddenException('Esta clave no te pertenece.');
    }

    const grant = await this.prisma.accessGrant.findUnique({ where: { jwt_id: claims.jti } });
    if (!grant || grant.revoked_at) {
      throw new BadRequestException('Clave inválida o revocada.');
    }

    const expiresAt = addMonths(new Date(), grant.duracion_meses);

    // updateMany (no update) para que la condición "todavía no canjeada" sea
    // parte del propio UPDATE — así dos canjes simultáneos con la misma
    // clave no pueden pasar los dos: solo uno afecta una fila.
    const resultado = await this.prisma.accessGrant.updateMany({
      where: { id: grant.id, redeemed_at: null },
      data: { redeemed_at: new Date(), expires_at: expiresAt },
    });
    if (resultado.count !== 1) {
      throw new BadRequestException('Esta clave ya fue utilizada.');
    }

    this.logger.log(`Usuario ${usuarioId} canjeó la clave del curso ${claims.course_id}`);

    return {
      ok: true,
      curso: { id: claims.course_id, titulo: claims.curso_titulo, modo_moodle: claims.modo_moodle, modo_coursera: claims.modo_coursera },
      expires_at: expiresAt,
    };
  }
}
