import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class GateLoginDto {
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
