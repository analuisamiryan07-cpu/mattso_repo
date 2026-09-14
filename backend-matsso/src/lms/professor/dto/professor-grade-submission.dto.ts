// Igual que submissions/dto/grade-submission.dto.ts pero sin graded_by_usuario_id:
// aquí quien califica es siempre req.user.id (el profesor autenticado), nunca
// un valor que venga en el body — a diferencia del endpoint M2M, donde Laravel
// sí tiene que decirlo porque no hay un JWT de por medio.

import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProfessorGradeSubmissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
