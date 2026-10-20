import { IsISO8601, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearEventoPersonalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @IsISO8601()
  fecha: string;
}
