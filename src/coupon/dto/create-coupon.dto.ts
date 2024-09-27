import { IsTodayOrFutureDate } from '#/utils/is-today-or-future-date.decorator';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Max,
} from 'class-validator';
import { CouponStatus } from '../entities/coupon.entity';

export class CreateCouponDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsEnum(CouponStatus)
  status: CouponStatus = CouponStatus.ACTIVE;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @IsTodayOrFutureDate()
  expiredAt: Date;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Max(100)
  discountPercentage: number;

  @IsNotEmpty()
  @IsUUID()
  eventId: string;
}
