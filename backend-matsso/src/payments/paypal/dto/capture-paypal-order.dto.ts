import { IsInt, IsPositive } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { decodeId } from '../../../common/id-hasher';

export class CapturePaypalOrderDto {
  // internalOrderId viaja como el ID ofuscado que devolvió /orders — se decodifica aquí.
  //
  // @Type(() => String) es obligatorio: el ValidationPipe global usa
  // enableImplicitConversion, que convertiría el valor a Number antes de que
  // corra @Transform (ver el mismo comentario en create-paypal-order.dto.ts).
  @Type(() => String)
  @Transform(({ value }) => (typeof value === 'string' ? decodeId(value) : null))
  @IsInt()
  @IsPositive()
  internalOrderId: number;
}
