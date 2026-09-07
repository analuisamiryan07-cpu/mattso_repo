import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { decodeId } from './id-hasher';

/**
 * Pipe para parámetros de ruta (`@Param('id', ParseHashIdPipe)`). Decodifica el
 * identificador ofuscado a su ID real; si el formato es inválido (longitud, alfabeto,
 * o no corresponde a un hash real emitido por este servicio), rechaza con 400 antes
 * de que la petición llegue al controller — un entero plano como "55" nunca pasa de aquí.
 */
@Injectable()
export class ParseHashIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = decodeId(value);
    if (id === null) {
      throw new BadRequestException('Identificador con formato inválido.');
    }
    return id;
  }
}
