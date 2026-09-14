
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty({ message: 'El título del módulo es obligatorio.' })
  titulo: string;

  // Posición dentro del curso — controla el desbloqueo secuencial
  // (Moodles/arquitectura_lms_nube.md §5). Único junto a course_id en el schema.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence_order: number;
}
