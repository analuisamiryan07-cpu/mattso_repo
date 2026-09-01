import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsIn(['CERTIFICACION', 'CAPACITACION'])
  tipo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El título no puede quedar vacío.' })
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  descripcion_larga?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0.' })
  precio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Las horas deben ser un número.' })
  @Min(1, { message: 'Las horas deben ser al menos 1.' })
  horas?: number;

  @IsOptional()
  @IsString()
  modalidad?: string;

  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsString()
  horario?: string;

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsOptional()
  activo?: boolean | string;

  @IsOptional()
  destacado?: boolean | string;
}
