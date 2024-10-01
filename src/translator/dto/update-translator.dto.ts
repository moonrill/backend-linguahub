import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class UpdateTranslatorDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  yearsOfExperience: number;

  @IsNotEmpty()
  portfolioLink: string;

  @IsNotEmpty()
  bank: string;

  @IsNotEmpty()
  bankAccountNumber: string;

  @IsNotEmpty()
  @IsUUID('4', {
    each: true,
    message: 'Each language must be a valid UUID',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 languages are required' })
  @ArrayUnique()
  languages: string[];

  @IsNotEmpty()
  @IsUUID('4', {
    each: true,
    message: 'Each specialization must be a valid UUID',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 specializations are required' })
  @ArrayUnique()
  specializations: string[];
}
