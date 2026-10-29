// Un único DTO para los 4 tipos de contenido (VIDEO/ASSIGNMENT/QUIZ/DOCUMENT):
// los campos que no aplican a un tipo simplemente no se validan más allá de
// ser opcionales. `item_type: QUIZ` se crea vía POST .../content/quiz (ver
// create-quiz.dto.ts), no con este DTO — un Quiz no es un ContentItem con
// video_url, es su propia entidad relacionada 1:1 con el ContentItem.

import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  MaxLength,
  Matches,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContentItemDto {
  @IsString()
  @IsIn(['VIDEO', 'ASSIGNMENT', 'QUIZ', 'DOCUMENT'])
  item_type: string;

  @IsString()
  @IsNotEmpty({ message: 'El título del contenido es obligatorio.' })
  @MaxLength(255)
  titulo: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence_order: number;

  // Payload que Laravel obtiene subiendo el video directo a Cloudinary
  // (Server-to-Server, regla de arquitectura §"Pipeline de Subida de Video").
  // NestJS solo registra la referencia, nunca recibe el archivo.
  @ValidateIf((o) => o.item_type === 'VIDEO')
  @IsString()
  @IsNotEmpty({ message: 'cloudinary_public_id es obligatorio para contenido VIDEO.' })
  @MaxLength(255)
  cloudinary_public_id?: string;

  @ValidateIf((o) => o.item_type === 'VIDEO')
  @IsString()
  @IsNotEmpty({ message: 'cloudinary_url es obligatorio para contenido VIDEO.' })
  @MaxLength(1000)
  // Solo URLs https de Cloudinary — el reproductor del estudiante carga esta URL directamente.
  @Matches(/^https:\/\/res\.cloudinary\.com\/[^\s"'<>]+$/, {
    message: 'cloudinary_url debe ser una URL https de res.cloudinary.com.',
  })
  cloudinary_url?: string;

  // Duración real conocida del video — la valida progress.service.ts contra lo
  // que reporte el cliente en cada ping, en vez de confiar en total_duration.
  @ValidateIf((o) => o.item_type === 'VIDEO')
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'video_duration_seconds debe ser mayor a 0.' })
  @Max(86400)
  video_duration_seconds?: number;

  @ValidateIf((o) => o.item_type === 'ASSIGNMENT')
  @IsString()
  @IsNotEmpty({ message: 'assignment_instructions es obligatorio para contenido ASSIGNMENT.' })
  @MaxLength(20000)
  assignment_instructions?: string;

  // Texto directo, escrito a mano (no un archivo subido) — para
  // item_type=DOCUMENT.
  @ValidateIf((o) => o.item_type === 'DOCUMENT')
  @IsString()
  @IsNotEmpty({ message: 'body_text es obligatorio para contenido DOCUMENT.' })
  @MaxLength(50000)
  body_text?: string;

  // Opcional, cualquier tipo (sobre todo ASSIGNMENT/QUIZ) — alimenta la línea
  // de tiempo y el calendario de Moodle en el Aula Virtual. Sin fecha límite,
  // el contenido simplemente no aparece en ninguno de los dos.
  @IsOptional()
  @IsISO8601()
  fecha_limite?: string;
}
