import { IsEnum, IsOptional } from 'class-validator';

export enum BookingStatus {
  UNPAID = 'unpaid',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

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
