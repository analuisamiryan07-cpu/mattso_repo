import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Por favor, envíame un mensaje válido.' })
  @MaxLength(500, { message: 'El mensaje es demasiado largo.' })
  message: string;
}
