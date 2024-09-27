import { IsEnum, IsOptional } from 'class-validator';
import { TranslatorStatus } from '../entities/translator.entity';

export class RegistrationQueryDto {
  @IsEnum(TranslatorStatus)
  @IsOptional()
  status: TranslatorStatus;
}
