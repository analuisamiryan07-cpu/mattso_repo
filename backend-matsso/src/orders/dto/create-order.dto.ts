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
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt({ message: 'El ID del producto debe ser un número entero.' })
  @IsPositive({ message: 'El ID del producto debe ser positivo.' })
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
