// Destino final: backend-matsso/src/lms/progress/dto/video-ping.dto.ts

import { IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class VideoPingDto {
  @IsUUID()
  content_item_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  current_time: number;

  // Se recibe pero NO se usa como fuente de verdad de la duración — el
  // servidor compara contra content_item.video_duration_seconds, que fija el
  // admin al registrar el video. Ver progress.service.ts.
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_duration: number;
}
