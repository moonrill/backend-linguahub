import { IsAfterStart } from '#/utils/is-after-start.decorator';
import { IsTodayOrFutureDate } from '#/utils/is-today-or-future-date.decorator';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateServiceRequestDto {
  @IsNotEmpty()
  @IsUUID()
  translatorId: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  couponId: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @IsTodayOrFutureDate()
  bookingDate: Date;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startAt must be in the format HH:mm (e.g., 11:00)',
  })
  startAt: string;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endAt must be in the format HH:mm (e.g., 11:00)',
  })
  @IsAfterStart('startAt')
  endAt: string;

  @IsNotEmpty()
  @Type(() => Number)
  duration: number;

  @IsNotEmpty()
  location: string;

  @IsOptional()
  notes: string;
}
