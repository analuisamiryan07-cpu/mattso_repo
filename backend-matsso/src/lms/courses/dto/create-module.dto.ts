import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty({ message: 'El título del módulo es obligatorio.' })
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // A qué árbol de contenido pertenece este módulo — el curso debe tener esa
  // modalidad habilitada (Course.modo_moodle / modo_coursera), se valida en
  // el service. TRADICIONAL = Moodle, ASINCRONO_VOD = Coursera.
  @IsIn(['TRADICIONAL', 'ASINCRONO_VOD'])
  delivery_mode: string;

  // Posición DENTRO de su modalidad — controla el desbloqueo secuencial
  // (Moodles/mds/arquitectura_lms_nube.md §5). Único junto a
  // (course_id, delivery_mode) en el schema: un curso con las dos
  // modalidades puede tener un módulo 1 de Moodle y un módulo 1 de Coursera.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence_order: number;
}
