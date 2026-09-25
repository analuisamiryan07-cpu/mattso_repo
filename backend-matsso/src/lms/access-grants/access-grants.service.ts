// Reemplaza a access-codes (código de 6 dígitos, uno por usuario, para
// siempre). Ahora es un código corto por CADA compra de curso — ver
// clave.util.ts y Moodles/lms/docs/DECISIONES.md.
//
// Candado de "esta compra ya se usó": se aparta al GENERAR (no al canjear) —
// contrato acordado con el sistema interno. Revocar una clave sin canjear
// libera el cupo para generar otra sobre la misma compra.

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { addMonths, generarCodigoCorto, signClave } from './clave.util';

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
      // Ya canjeada: no tiene sentido reenviar — el acceso ya se le dio, y
      // reenviar un código que ya no sirve solo confunde.
      if (yaVigente.redeemed_at) {
        throw new ConflictException('Esta compra ya tiene una clave y ya fue canjeada.');
      }
      // Todavía no se canjeó: "generar" de nuevo es simplemente "reenviar" el
      // MISMO código — resuelve el caso real de "se generó pero se perdió el
      // correo, o se copió mal".
      return this.reenviar(yaVigente, actor);
    }

    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: ordenItem.orden.usuario_id },
      select: { id: true, correo: true, cliente: { select: { nombre: true } } },
    });
    if (!usuario) throw new NotFoundException('El comprador de esta orden ya no existe.');

    const jwtId = randomUUID();
    // El JWT sigue existiendo como identificador interno/de auditoría (el
    // jti queda guardado en jwt_id), pero ya no es lo que se le entrega al
    // estudiante ni lo que se compara al canjear — ver canjear() más abajo.
    signClave({
      jti: jwtId,
      sub: usuario.id.toString(),
      course_id: course.id,
      curso_titulo: course.titulo,
      duracion_meses: course.duracion_meses,
      modo_moodle: course.modo_moodle,
      modo_coursera: course.modo_coursera,
    });

    const { grant, codigo } = await this.crearConCodigoUnico(ordenItem.id, usuario.id, course.id, course.duracion_meses, jwtId, actor);

    this.emailService
      .sendAccessGrant({
        to: usuario.correo,
        nombre: usuario.cliente?.nombre ?? 'estudiante',
        cursoTitulo: course.titulo,
        duracionMeses: course.duracion_meses,
        codigo,
      })
      .catch((err) => this.logger.error('No se pudo enviar el correo de la clave:', err?.message));

    this.logger.log(`[${actor}] generó clave para orden_item=${ordenItem.id} (curso ${course.id}, usuario ${usuario.id})`);

    // El código también viaja en la respuesta (no solo por correo) — por si
    // el sistema interno lo quiere reenviar por WhatsApp. La nube no maneja WhatsApp.
    return {
      access_grant_id: grant.id,
      usuario_id: Number(usuario.id),
      course_id: course.id,
      codigo,
    };
  }

  /** Crea la fila con un código único, reintentando si (con probabilidad ínfima) choca con uno ya existente. */
  private async crearConCodigoUnico(
    ordenItemId: bigint,
    usuarioId: bigint,
    courseId: string,
    duracionMeses: number,
    jwtId: string,
    actor: string,
  ) {
    for (let intento = 0; intento < 5; intento++) {
      const codigo = generarCodigoCorto();
      try {
        const grant = await this.prisma.accessGrant.create({
          data: {
            usuario_id: usuarioId,
            course_id: courseId,
            orden_item_id: ordenItemId,
            duracion_meses: duracionMeses,
            jwt_id: jwtId,
            codigo,
            generado_por: actor,
          },
        });
        return { grant, codigo };
      } catch (e) {
        if (esViolacionUnicidad(e)) {
          // orden_item_id (índice parcial) o codigo — reintenta solo si es
          // el código el que chocó; si es la compra, ya no tiene sentido seguir.
          const yaExiste = await this.prisma.accessGrant.findFirst({
            where: { orden_item_id: ordenItemId, revoked_at: null },
            select: { id: true },
          });
          if (yaExiste) throw new ConflictException('Esta compra ya tiene una clave generada.');
          continue; // el código chocó — reintenta con uno nuevo
        }
        throw e;
      }
    }
    throw new Error('No se pudo generar un código único después de varios intentos.');
  }

  /** Reenvía el MISMO código por correo — no crea una fila nueva ni cambia nada. */
  private async reenviar(grant: { id: string; codigo: string | null; usuario_id: bigint; course_id: string }, actor: string) {
    const usuario = await this.prisma.usuarioWeb.findUnique({
      where: { id: grant.usuario_id },
      select: { id: true, correo: true, cliente: { select: { nombre: true } } },
    });
    if (!usuario) throw new NotFoundException('El comprador de esta orden ya no existe.');

    const course = await this.prisma.course.findUnique({ where: { id: grant.course_id } });
    if (!course || course.duracion_meses == null) {
      throw new BadRequestException('El curso de esta clave ya no está disponible o no tiene duración configurada.');
    }
    if (!grant.codigo) {
      // Claves generadas ANTES de este cambio no tienen código — no hay nada
      // que reenviar; hay que revocar y generar una nueva.
      throw new BadRequestException('Esta clave es de un formato anterior sin código — revócala y genera una nueva.');
    }

    this.emailService
      .sendAccessGrant({
        to: usuario.correo,
        nombre: usuario.cliente?.nombre ?? 'estudiante',
        cursoTitulo: course.titulo,
        duracionMeses: course.duracion_meses,
        codigo: grant.codigo,
      })
      .catch((err) => this.logger.error('No se pudo reenviar el correo de la clave:', err?.message));

    this.logger.log(`[${actor}] reenvió la clave de orden_item para curso ${course.id}, usuario ${usuario.id}`);

    return {
      access_grant_id: grant.id,
      usuario_id: Number(usuario.id),
      course_id: course.id,
      codigo: grant.codigo,
      reenviada: true,
    };
  }

  /** Historial completo (generadas/canjeadas/revocadas) — incluye el código para poder mostrarlo/reenviarlo desde el panel. */
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
      codigo: g.codigo,
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

  async canjear(usuarioId: number, codigo: string) {
    const limpio = codigo.trim();
    if (!/^\d{6,12}$/.test(limpio)) {
      throw new BadRequestException('Clave inválida.');
    }

    const grant = await this.prisma.accessGrant.findUnique({
      where: { codigo: limpio },
      include: { course: { select: { titulo: true, modo_moodle: true, modo_coursera: true } } },
    });
    // Mismo mensaje exista o no exista, sea de otra persona o esté revocada —
    // no da pistas de cuáles códigos son reales.
    if (!grant || grant.revoked_at || Number(grant.usuario_id) !== usuarioId) {
      throw new BadRequestException('Clave inválida.');
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

    this.logger.log(`Usuario ${usuarioId} canjeó la clave del curso ${grant.course_id}`);

    return {
      ok: true,
      curso: {
        id: grant.course_id,
        titulo: grant.course.titulo,
        modo_moodle: grant.course.modo_moodle,
        modo_coursera: grant.course.modo_coursera,
      },
      expires_at: expiresAt,
    };
  }
}
