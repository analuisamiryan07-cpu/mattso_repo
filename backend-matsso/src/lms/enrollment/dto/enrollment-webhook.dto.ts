
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EnrollmentWebhookDto {
  // Identificador único del evento emisor, para trazabilidad en webhook_events
  // (proveedor='LMS_ENROLLMENT'). La idempotencia real de la inscripción la da
  // el índice único [usuario_id, course_id] en la tabla enrollments — esto es
  // una segunda barrera y sirve para auditar reintentos.
  @IsString()
  @IsNotEmpty()
  event_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuario_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  producto_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orden_item_id?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ECOMMERCE', 'MANUAL', 'ADMIN'])
  source?: string;
}
