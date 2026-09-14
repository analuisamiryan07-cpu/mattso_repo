import { IsNotEmpty, IsString } from 'class-validator';

export class GateLoginDto {
  @IsString()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
