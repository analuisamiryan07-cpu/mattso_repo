// graded_by_usuario_id viaja explícito en el body: ManualGrade.graded_by_usuario_id
// referencia public.usuarios_web (la identidad web, rol ADMIN), que NO es la
// misma tabla que usuarios_admin de proyecto_matt (Laravel tiene su propio
// login de backoffice). Laravel debe conocer y enviar el id de UsuarioWeb
// correspondiente al admin que calificó — ver Moodles/lms/docs/DECISIONES.md.

import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeSubmissionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  graded_by_usuario_id: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
