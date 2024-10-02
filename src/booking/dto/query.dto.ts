import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export enum BookingSortBy {
  DATE = 'date',
  PRICE = 'price',
}

export class BookingQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(BookingSortBy)
  sortBy: BookingSortBy = BookingSortBy.DATE;

  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
