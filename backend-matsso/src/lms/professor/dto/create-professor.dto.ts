import { IsEmail, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfessorDto {
  @IsEmail()
  correo: string;

  // Opcional: liga la cuenta a un Cliente ya existente (para que su nombre
  // real aparezca en el JWT y en los correos). Sin esto, el sistema muestra
  // "Profesor" o el correo — no se inventa un Cliente nuevo aquí porque
  // Cliente.cedula es obligatoria y única, y no hay una cédula real que poner.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cliente_id?: number;
}
