import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsIn(['CERTIFICACION', 'CAPACITACION'])
  tipo: string;

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  descripcion_larga?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0.' })
  precio: number;

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

  // activo/destacado: proyecto_matt a veces los envía como string ('true'/'1'),
  // el service ya normaliza el valor — no se restringe el tipo aquí a propósito.
  @IsOptional()
  activo?: boolean | string;

  @IsOptional()
  destacado?: boolean | string;
}
