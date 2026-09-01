import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(200)
  nombre: string;

  @IsEmail({}, { message: 'Correo inválido.' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  asunto?: string;

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MaxLength(2000)
  mensaje: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  num_personas?: string;
}
