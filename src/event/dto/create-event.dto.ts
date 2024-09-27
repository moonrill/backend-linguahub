import { IsAfterStart } from '#/utils/is-after-start.decorator';
import { IsTodayOrFutureDate } from '#/utils/is-today-or-future-date.decorator';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  @IsTodayOrFutureDate()
  startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  @IsAfterStart('startDate')
  endDate: Date;
}
