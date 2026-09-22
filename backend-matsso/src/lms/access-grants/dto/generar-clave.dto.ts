import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerarClaveDto {
  // El id de la compra (OrdenItem), no de la orden completa — una orden
  // puede tener varios cursos, cada uno con su propia clave.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orden_item_id: number;
}
