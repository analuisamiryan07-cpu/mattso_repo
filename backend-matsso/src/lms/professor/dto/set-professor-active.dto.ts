import { IsBoolean } from 'class-validator';

export class SetProfessorActiveDto {
  @IsBoolean()
  activo: boolean;
}
