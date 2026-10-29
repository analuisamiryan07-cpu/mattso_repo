import { IsArray, IsInt, IsPositive, ValidateNested, ArrayNotEmpty, ArrayMaxSize, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { decodeId } from '../../../common/id-hasher';

class OrderItemDto {
  // Mismo patrón que orders/dto/create-order.dto.ts: el cliente manda el ID
  // ofuscado (string), se decodifica antes de validar.
  @Transform(({ value }) => (typeof value === 'string' ? decodeId(value) : null))
  @IsInt()
  @IsPositive()
  id: number;

  @IsInt()
  @IsPositive()
  @Max(10, { message: 'La cantidad máxima por producto es 10.' })
  cantidad: number;
}

export class CreatePaypalOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
