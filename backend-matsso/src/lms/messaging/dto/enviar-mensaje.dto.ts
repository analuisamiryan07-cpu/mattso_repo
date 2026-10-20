import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EnviarMensajeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  cuerpo: string;
}
