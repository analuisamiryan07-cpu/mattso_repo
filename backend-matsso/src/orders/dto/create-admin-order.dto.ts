import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// A diferencia de OrderItemDto (checkout público), aquí el id del producto
// viaja SIN ofuscar — es una llamada servidor-a-servidor del sistema
// interno, no un formulario de navegador.
export class AdminOrderItemDto {
  @IsInt()
  @IsPositive()
  producto_id: number;

  @IsInt()
  @IsPositive()
  @Max(10, { message: 'La cantidad máxima por producto es 10.' })
  cantidad: number;
}

export class CreateAdminOrderDto {
  @IsInt()
  @IsPositive()
  usuario_id: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'La orden debe contener al menos un producto.' })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items: AdminOrderItemDto[];

  // Lo que en la práctica se cobró (venta por teléfono) — reemplaza al
  // comprobante de una compra web. No reemplaza el cálculo del total.
  @IsNumber()
  @Min(0)
  monto_pagado_manual: number;
}
