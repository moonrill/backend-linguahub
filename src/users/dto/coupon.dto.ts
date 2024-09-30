import { IsEnum, IsOptional } from 'class-validator';

export enum UserCouponStatus {
  AVAILABLE = 'available',
  USED = 'used',
  EXPIRED = 'expired',
  UNAVAILABLE = 'unavailable',
}

export enum CouponSortBy {
  EXPIRED_DATE = 'expiredDate',
  DISCOUNT_PERCENTAGE = 'discountPercentage',
}

export class UserCouponsQueryDto {
  @IsOptional()
  @IsEnum(UserCouponStatus)
  status: UserCouponStatus;

  @IsOptional()
  @IsEnum(CouponSortBy)
  sortBy: CouponSortBy;

  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
