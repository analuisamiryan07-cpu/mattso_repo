import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { decodeId } from '../../common/id-hasher';

export class OrderItemDto {
  // El cliente manda el ID ofuscado (string, ej. "kV3xQ1a9"), nunca el entero real.
  // Se decodifica ANTES de validar: si no es un hash válido, decodeId da null y las
  // reglas de abajo lo rechazan igual que rechazarían cualquier otro valor inválido —
  // un entero plano como 55 nunca llega a pasar esta transformación como string.
  @Transform(({ value }) => (typeof value === 'string' ? decodeId(value) : null))
  @IsInt({ message: 'El identificador del producto es inválido.' })
  @IsPositive({ message: 'El identificador del producto es inválido.' })
  id: number;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @IsPositive({ message: 'La cantidad debe ser al menos 1.' })
  @Max(10, { message: 'La cantidad máxima por producto es 10.' })
  cantidad: number;

  // precio NO se acepta desde el cliente — se ignora aunque se envíe
}

export class CreateOrderDto {
  @IsArray({ message: 'Los items deben ser una lista.' })
  @ArrayMinSize(1, { message: 'La orden debe contener al menos un producto.' })
  @ArrayMaxSize(20, { message: 'La orden no puede tener más de 20 productos.' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
