import { IsEmail, IsHexadecimal, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  correo: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsHexadecimal({ message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.' })
  @Length(64, 64, { message: 'El enlace es inválido o ha expirado. Solicita uno nuevo.' })
  token: string;

  // Misma política que el registro.
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128, { message: 'La contraseña no puede superar 128 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
  })
  password: string;
}
