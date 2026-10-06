import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Mismo límite que CertiBot (1–500 caracteres). Si no se cumple, el ValidationPipe
// responde 400 con este mensaje y CertiBot no se llama.
export class SendMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Por favor, envíame un mensaje válido.' })
  @IsNotEmpty({ message: 'Por favor, envíame un mensaje válido.' })
  @MaxLength(500, { message: 'El mensaje es demasiado largo. Escribe hasta 500 caracteres.' })
  message: string;
}
