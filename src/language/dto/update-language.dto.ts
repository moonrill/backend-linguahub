import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateLanguageDto } from './create-language.dto';

export class UpdateLanguageDto extends PartialType(CreateLanguageDto) {
  @IsOptional()
  flagImage?: string;
}
