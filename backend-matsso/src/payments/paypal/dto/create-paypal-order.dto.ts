import { IsArray, IsInt, IsPositive, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
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
