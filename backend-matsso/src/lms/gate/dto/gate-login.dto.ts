import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GateLoginDto {
  @IsString()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // Solo hace falta (y solo se exige) la primera vez que esa cuenta entra al
  // Aula Virtual — ver LmsGateService.login.
  @IsOptional()
  @IsBoolean()
  acepta_terminos?: boolean;
}
