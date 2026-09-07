import { IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import { decodeId } from '../../../common/id-hasher';

export class CapturePaypalOrderDto {
  // internalOrderId viaja como el ID ofuscado que devolvió /orders — se decodifica aquí.
  @Transform(({ value }) => (typeof value === 'string' ? decodeId(value) : null))
  @IsInt()
  @IsPositive()
  internalOrderId: number;
}
