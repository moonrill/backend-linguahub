import { BookingSortBy } from '#/booking/dto/query.dto';
import { BookingRequestStatus } from '#/booking/entities/booking.entity';
import { IsEnum, IsOptional } from 'class-validator';

export class ServiceRequestQueryDto {
  @IsOptional()
  @IsEnum(BookingRequestStatus)
  status?: BookingRequestStatus;

  @IsOptional()
  @IsEnum(BookingSortBy)
  sortBy: BookingSortBy = BookingSortBy.NEWEST;
}
