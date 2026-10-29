// Crea el Quiz completo (preguntas + opciones) en una sola llamada — así lo
// necesita un formulario admin de "armar cuestionario". No hay endpoints
// separados para editar preguntas sueltas en esta primera pasada; ver
// Moodles/lms/docs/DECISIONES.md.

import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  MaxLength,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  texto: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CreateQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  enunciado: string;

  @IsString()
  @IsIn(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'])
  question_type: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0.01)
  @Max(1000)
  points?: number;

  @IsArray()
  @ArrayMinSize(2, { message: 'Cada pregunta necesita al menos 2 opciones.' })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  opciones: CreateQuizOptionDto[];
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  passing_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  max_attempts?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(86400)
  time_limit_seconds?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'El quiz necesita al menos 1 pregunta.' })
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  preguntas: CreateQuizQuestionDto[];
}
