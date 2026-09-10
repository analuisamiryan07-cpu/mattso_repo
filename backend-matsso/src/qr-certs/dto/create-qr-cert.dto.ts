import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQrCertDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del certificado es obligatorio.' })
  @MaxLength(200)
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El certificado es obligatorio.' })
  @MaxLength(200)
  certificado: string;

  // Texto libre a propósito (ej. "15 de enero de 2025") -- asi lo espera el
  // formulario real y asi se guarda en la columna VARCHAR de la base de
  // datos. No es una fecha ISO parseable; una validacion @IsISO8601() aqui
  // rechaza el 100% de los casos reales.
  @IsString()
  @IsNotEmpty({ message: 'La fecha de emisión es obligatoria.' })
  @MaxLength(50)
  fecha_emision: string;

  @IsString()
  @IsNotEmpty({ message: 'La fecha de expiración es obligatoria.' })
  @MaxLength(50)
  fecha_expiracion: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}
