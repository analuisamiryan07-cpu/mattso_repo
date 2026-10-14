import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const SESION_RE = /^[A-Za-z0-9-]{8,64}$/;

// Mismo límite que CertiBot (1–500 caracteres). Si no se cumple, el ValidationPipe
// responde 400 con este mensaje y CertiBot no se llama.
export class SendMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Por favor, envíame un mensaje válido.' })
  @IsNotEmpty({ message: 'Por favor, envíame un mensaje válido.' })
  @MaxLength(500, { message: 'El mensaje es demasiado largo. Escribe hasta 500 caracteres.' })
  message: string;

  // Id anónimo de la ventana de chat (memoria de CertiBot). Opcional: si no cumple
  // el formato se descarta (undefined) en vez de rechazar el mensaje.
  @Transform(({ value }) => (typeof value === 'string' && SESION_RE.test(value) ? value : undefined))
  @IsOptional()
  @Matches(SESION_RE)
  sesion?: string;
}
