import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { safeEqual } from './secure-compare';

/**
 * Valida la cabecera `x-admin-key` (llamadas servidor-a-servidor del backoffice)
 * con comparación en tiempo constante. Reemplaza los `checkAdminKey()` que
 * estaban repetidos en cada controller y comparaban con `!==`.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!safeEqual(req.headers['x-admin-key'], process.env.ADMIN_API_KEY)) {
      throw new UnauthorizedException('Clave de administrador inválida.');
    }
    return true;
  }
}
