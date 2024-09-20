import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty() 
  name: string;
  @IsNotEmpty() 
  description: string; 
  @IsNotEmpty() 
  status: string;
  @IsNotEmpty() 
  expired_at: Date;
  @IsNotEmpty() 
  @IsNumber() 
  discount_percentage: number;
  @IsNotEmpty()
  eventId: string;
}
