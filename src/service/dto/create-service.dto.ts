import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  sourceLanguageId: string;

  @IsNotEmpty()
  @IsUUID()
  targetLanguageId: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  pricePerHour: number;
}
