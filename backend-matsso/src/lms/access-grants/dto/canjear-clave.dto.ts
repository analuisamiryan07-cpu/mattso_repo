import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CanjearClaveDto {
  @IsString()
  @IsNotEmpty({ message: 'La clave es obligatoria.' })
  @Matches(/^\d{6,12}$/, { message: 'La clave debe ser un código numérico.' })
  codigo: string;
}
