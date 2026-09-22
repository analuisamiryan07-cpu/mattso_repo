import { IsNotEmpty, IsString } from 'class-validator';

export class CanjearClaveDto {
  @IsString()
  @IsNotEmpty({ message: 'La clave es obligatoria.' })
  clave: string;
}
