export class CreateCouponDto {
  name: string;
  description: string;
  status: string;
  expired_at: Date;
  discount_percentage: number;
  eventId: string; // Foreign key
}
