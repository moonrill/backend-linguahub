import { BookingSortBy } from '#/booking/dto/query.dto';
import { BookingRequestStatus } from '#/booking/entities/booking.entity';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryServiceRequestDto {
  @IsOptional()
  @IsEnum(BookingRequestStatus)
  status?: BookingRequestStatus;

  @IsOptional()
  @IsEnum(BookingSortBy)
  sortBy: BookingSortBy = BookingSortBy.DATE;

  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
