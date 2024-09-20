import { IsNotEmpty, IsString, IsDate, IsEnum, IsInt } from 'class-validator';

export class UpdateCouponDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(['Active', 'Inactive'])
  status: string;

  @IsNotEmpty()
  @IsString()
  expired_at: String;

  @IsNotEmpty()
  @IsInt()
  discount_percentage: number;

  @IsNotEmpty()
  @IsString()
  eventId: string;
}
