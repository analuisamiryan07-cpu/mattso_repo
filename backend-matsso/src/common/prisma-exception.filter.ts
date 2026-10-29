import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Traduce errores conocidos de Prisma a respuestas HTTP limpias (400/404/409)
 * en lugar de un 500 genérico, sin exponer detalles internos de la BD.
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor.';

    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Datos de entrada inválidos.';
    } else {
      switch (exception.code) {
        case 'P2025': // registro no encontrado
        case 'P2001':
          status = HttpStatus.NOT_FOUND;
          message = 'Recurso no encontrado.';
          break;
        case 'P2002': // violación de unicidad
          status = HttpStatus.CONFLICT;
          message = 'El recurso ya existe.';
          break;
        case 'P2003': // FK
        case 'P2006':
        case 'P2007':
        case 'P2023': // id con formato inválido (p.ej. UUID mal formado)
          status = HttpStatus.BAD_REQUEST;
          message = 'Datos de entrada inválidos.';
          break;
        default:
          this.logger.error(`Prisma ${exception.code}: ${exception.message.split('\n').pop()}`);
      }
    }

    res.status(status).json({ statusCode: status, message });
  }
}
