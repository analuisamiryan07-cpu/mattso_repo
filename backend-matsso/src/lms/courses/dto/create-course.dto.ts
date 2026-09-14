
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  @IsIn(['TRADICIONAL', 'ASINCRONO_VOD'])
  delivery_mode: string;

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
  is_active?: boolean;
}
