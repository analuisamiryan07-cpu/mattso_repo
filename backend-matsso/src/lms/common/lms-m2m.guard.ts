//
// Guard para las rutas admin del LMS (Laravel backoffice -> NestJS), separado
// a propósito de `ADMIN_API_KEY` del e-commerce (Moodles/arquitectura_lms_nube.md
// §6: "credenciales M2M separadas, rotables y con permisos mínimos" — si se
// filtra la clave del LMS no se compromete catálogo/órdenes, y viceversa).
//
// A diferencia del patrón `checkAdminKey()` repetido en catalog/orders/qr-certs
// (un método privado por controller), aquí sí vale un Guard reutilizable: es
// código nuevo, no hay nada existente que romper al centralizarlo.
//
// También adjunta `req.m2mActor` a partir de `x-lms-m2m-actor` (texto libre,
// p.ej. "laravel-backoffice") para que los services puedan loguear quién
// originó cada operación admin, tal como pide la arquitectura (§5 "auditar
// quién originó cada operación"). No es una tabla de auditoría — ver
// Moodles/lms/docs/DECISIONES.md sobre por qué se dejó fuera de este alcance.

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class LmsM2mGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-lms-m2m-key'];

    if (!process.env.LMS_M2M_API_KEY || key !== process.env.LMS_M2M_API_KEY) {
      throw new UnauthorizedException('Clave M2M del LMS inválida.');
    }

    req.m2mActor =
      typeof req.headers['x-lms-m2m-actor'] === 'string'
        ? req.headers['x-lms-m2m-actor'].slice(0, 100)
        : 'desconocido';

    return true;
  }
}
