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

  @IsString()
  @IsNotEmpty({ message: 'La fecha de emisión es obligatoria.' })
  fecha_emision: string;

  @IsString()
  @IsNotEmpty({ message: 'La fecha de expiración es obligatoria.' })
  fecha_expiracion: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}
