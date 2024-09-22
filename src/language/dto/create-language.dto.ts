import { IsNotEmpty } from 'class-validator';

export class CreateLanguageDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  code: string;
}
