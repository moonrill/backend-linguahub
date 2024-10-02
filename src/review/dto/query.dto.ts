import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max } from 'class-validator';

export class ReviewQueryDto {
  @IsOptional()
  date?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Max(5)
  rating?: number;
}
