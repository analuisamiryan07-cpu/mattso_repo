import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(255, { message: 'El nombre no puede superar 255 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombre: string;

  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido.' })
  @MaxLength(255, { message: 'El correo no puede superar 255 caracteres.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  correo: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128, { message: 'La contraseña no puede superar 128 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
  })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}(\d{3})?$/, { message: 'Ingresa una cédula (10 dígitos) o RUC (13 dígitos) válido.' })
  cedula?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7,15}$/, { message: 'El teléfono debe contener entre 7 y 15 dígitos.' })
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;
}
