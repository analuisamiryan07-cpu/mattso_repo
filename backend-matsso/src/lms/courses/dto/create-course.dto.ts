import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Un curso ya no tiene un solo "delivery_mode": puede ofrecer Moodle,
// Coursera o las dos a la vez, cada una con su propio árbol de módulos
// (ver Module.delivery_mode). "Al menos una de las dos" se valida en el
// service — class-validator no expresa bien una regla entre dos campos.
export class CreateCourseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  producto_id?: number;

  @IsString()
  @IsNotEmpty({ message: 'El título del curso es obligatorio.' })
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  modo_moodle?: boolean;

  @IsOptional()
  @IsBoolean()
  modo_coursera?: boolean;

  // Meses de acceso desde que el estudiante canjea su clave (no desde la
  // compra) — obligatorio en la práctica para poder generar claves después,
  // pero se deja opcional aquí para no romper cursos ya creados sin este dato.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'duracion_meses debe ser mayor a 0.' })
  duracion_meses?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  modo_moodle?: boolean;

  @IsOptional()
  @IsBoolean()
  modo_coursera?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'duracion_meses debe ser mayor a 0.' })
  duracion_meses?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
