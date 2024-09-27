import { IsEnum, IsOptional } from 'class-validator';
import { CouponStatus } from '../entities/coupon.entity';

export class CouponQueryDto {
  @IsEnum(CouponStatus)
  @IsOptional()
  status?: CouponStatus;

  // @IsOptional()
  // search: string;
}
