import { IsAfterStartTime } from '#/utils/is-after-start-time.decorator';
import { IsFutureDate } from '#/utils/is-future-date.decorator';
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

  // TODO: add coupon
  // @IsOptional()
  // @IsUUID()
  // couponId: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @IsFutureDate({ message: 'Booking date must be in the future' })
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
  @IsAfterStartTime('startAt', { message: 'endAt must be after startAt' })
  endAt: string;

  @IsNotEmpty()
  location: string;

  @IsOptional()
  notes: string;
}
