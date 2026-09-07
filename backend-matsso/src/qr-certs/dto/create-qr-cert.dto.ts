import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength, Validate } from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'expiracionNoAnteriorAEmision', async: false })
class ExpiracionNoAnteriorAEmision implements ValidatorConstraintInterface {
  validate(fecha_expiracion: string, args: ValidationArguments) {
    const { fecha_emision } = args.object as CreateQrCertDto;
    if (!fecha_emision || !fecha_expiracion) return true; // lo cubren los @IsISO8601/@IsNotEmpty
    return new Date(fecha_expiracion).getTime() >= new Date(fecha_emision).getTime();
  }
  defaultMessage() {
    return 'La fecha de expiración no puede ser anterior a la fecha de emisión.';
  }
}

export class CreateQrCertDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del certificado es obligatorio.' })
  @MaxLength(200)
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El certificado es obligatorio.' })
  @MaxLength(200)
  certificado: string;

  @IsNotEmpty({ message: 'La fecha de emisión es obligatoria.' })
  @IsISO8601({}, { message: 'La fecha de emisión debe ser una fecha ISO 8601 válida (AAAA-MM-DD).' })
  fecha_emision: string;

  @IsNotEmpty({ message: 'La fecha de expiración es obligatoria.' })
  @IsISO8601({}, { message: 'La fecha de expiración debe ser una fecha ISO 8601 válida (AAAA-MM-DD).' })
  @Validate(ExpiracionNoAnteriorAEmision)
  fecha_expiracion: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;
}
