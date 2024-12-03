import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateSpecializationDto } from './create-specialization.dto';

export class UpdateSpecializationDto extends PartialType(
  CreateSpecializationDto,
) {
  @IsOptional()
  logo?: string;
}
