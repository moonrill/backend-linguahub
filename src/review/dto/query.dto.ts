import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ReviewQueryDto {
  @IsOptional()
  date?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  ratings?: number[];
}
