import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from './create-coupon.dto';

export class UpdateCouponDto extends PartialType(
  OmitType(CreateCouponDto, ['eventId', 'status'] as const),
) {}
