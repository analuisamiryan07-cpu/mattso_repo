import { IsInt, IsPositive } from 'class-validator';

export class CapturePaypalOrderDto {
  @IsInt()
  @IsPositive()
  internalOrderId: number;
}
