// Un único DTO para los 4 tipos de contenido (VIDEO/ASSIGNMENT/QUIZ/DOCUMENT):
// los campos que no aplican a un tipo simplemente no se validan más allá de
// ser opcionales. `item_type: QUIZ` se crea vía POST .../content/quiz (ver
// create-quiz.dto.ts), no con este DTO — un Quiz no es un ContentItem con
// video_url, es su propia entidad relacionada 1:1 con el ContentItem.

import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContentItemDto {
  @IsString()
  @IsIn(['VIDEO', 'ASSIGNMENT', 'QUIZ', 'DOCUMENT'])
  item_type: string;

  @IsString()
  @IsNotEmpty({ message: 'El título del contenido es obligatorio.' })
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
  cloudinary_public_id?: string;

  @ValidateIf((o) => o.item_type === 'VIDEO')
  @IsString()
  @IsNotEmpty({ message: 'cloudinary_url es obligatorio para contenido VIDEO.' })
  cloudinary_url?: string;

  // Duración real conocida del video — la valida progress.service.ts contra lo
  // que reporte el cliente en cada ping, en vez de confiar en total_duration.
  @ValidateIf((o) => o.item_type === 'VIDEO')
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'video_duration_seconds debe ser mayor a 0.' })
  video_duration_seconds?: number;

  @ValidateIf((o) => o.item_type === 'ASSIGNMENT')
  @IsString()
  @IsNotEmpty({ message: 'assignment_instructions es obligatorio para contenido ASSIGNMENT.' })
  assignment_instructions?: string;
}
