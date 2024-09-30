import { IsNotEmpty } from 'class-validator';

export class RejectTranslatorDto {
  @IsNotEmpty()
  reason: string;
}
