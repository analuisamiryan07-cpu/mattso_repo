
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerDto {
  @IsUUID()
  question_id: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cada pregunta respondida necesita al menos una opción seleccionada.' })
  @IsUUID('4', { each: true })
  selected_option_ids: string[];
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
