import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyAccessCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  code: string;
}
