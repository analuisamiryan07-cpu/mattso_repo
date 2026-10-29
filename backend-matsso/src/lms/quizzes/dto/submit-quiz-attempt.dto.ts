
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerDto {
  @IsUUID()
  question_id: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cada pregunta respondida necesita al menos una opción seleccionada.' })
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  selected_option_ids: string[];
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
