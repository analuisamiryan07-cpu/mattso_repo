import { IsArray, IsInt, IsPositive, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { decodeId } from '../../../common/id-hasher';

class OrderItemDto {
  // Mismo patrón que orders/dto/create-order.dto.ts: el cliente manda el ID
  // ofuscado (string), se decodifica antes de validar.
  //
  // @Type(() => String) es obligatorio aquí: el ValidationPipe global usa
  // enableImplicitConversion, que —al no haber otro @Type— convierte el valor
  // a Number ANTES de que corra @Transform (basado en que la propiedad es
  // `id: number`). Eso rompe el hash ("kV3xQ1a9" -> NaN) y decodeId nunca ve
  // el string original. Fijar el tipo a String evita esa conversión implícita.
  @Type(() => String)
  @Transform(({ value }) => (typeof value === 'string' ? decodeId(value) : null))
  @IsInt()
  @IsPositive()
  id: number;

  @IsInt()
  @IsPositive()
  cantidad: number;
}

export class CreatePaypalOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
