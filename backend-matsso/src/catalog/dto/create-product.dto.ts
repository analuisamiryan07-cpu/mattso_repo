import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Matches, MaxLength, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsIn(['CERTIFICACION', 'CAPACITACION', 'CURSO'])
  tipo: string;

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(255)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descripcion_larga?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0.' })
  @Max(100000, { message: 'El precio no puede superar 100000.' })
  precio: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Las horas deben ser un número.' })
  @Min(1, { message: 'Las horas deben ser al menos 1.' })
  horas?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modalidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fecha?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  horario?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(|\d{1,4}|https:\/\/[^\s"'<>]{1,500})$/, {
    message: 'imagen_url debe ser un número de imagen de Cloudinary o una URL https.',
  })
  imagen_url?: string;

  // activo/destacado: proyecto_matt a veces los envía como string ('true'/'1'),
  // el service ya normaliza el valor — no se restringe el tipo aquí a propósito.
  @IsOptional()
  activo?: boolean | string;

  @IsOptional()
  destacado?: boolean | string;
}
