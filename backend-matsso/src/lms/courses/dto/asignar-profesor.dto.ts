import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AsignarProfesorDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  profesor_usuario_id: number;
}
