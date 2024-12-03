import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export enum BookingSortBy {
  NEWEST = 'newest',
  BOOKING_DATE = 'bookingDate',
  PRICE = 'price',
}

export class BookingQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(BookingSortBy)
  sortBy: BookingSortBy = BookingSortBy.NEWEST;
}
