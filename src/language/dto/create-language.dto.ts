import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateLanguageDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @MaxLength(3)
  @MinLength(2)
  code: string;

  @IsNotEmpty()
  flagImage: string;
}
