// Guard para las rutas admin del LMS (Laravel backoffice -> NestJS), separado
// a propósito de `ADMIN_API_KEY` del e-commerce (Moodles/arquitectura_lms_nube.md
// §6: "credenciales M2M separadas, rotables y con permisos mínimos" — si se
// filtra la clave del LMS no se compromete catálogo/órdenes, y viceversa).
//
// También adjunta `req.m2mActor` a partir de `x-lms-m2m-actor` (texto libre,
// p.ej. "laravel-backoffice") para que los services puedan loguear quién
// originó cada operación admin (§5 "auditar quién originó cada operación").

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { safeEqual } from '../../common/secure-compare';

@Injectable()
export class LmsM2mGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Comparación en tiempo constante (antes era `!==`).
    if (!safeEqual(req.headers['x-lms-m2m-key'], process.env.LMS_M2M_API_KEY)) {
      throw new UnauthorizedException('Clave M2M del LMS inválida.');
    }

    // Solo caracteres seguros: este valor termina en los logs.
    const actor = req.headers['x-lms-m2m-actor'];
    req.m2mActor =
      typeof actor === 'string' && actor.trim()
        ? actor.replace(/[^\w.@ -]/g, '').slice(0, 100) || 'desconocido'
        : 'desconocido';

    return true;
  }
}
