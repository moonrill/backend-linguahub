import { IsEnum, IsOptional } from 'class-validator';

export enum ServiceRequestStatus {
  PENDING = 'pending',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ServiceRequestSortBy {
  DATE = 'date',
  PRICE = 'price',
}

export class QueryServiceRequestDto {
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  status?: ServiceRequestStatus;

  @IsOptional()
  @IsEnum(ServiceRequestSortBy)
  sortBy: ServiceRequestSortBy = ServiceRequestSortBy.DATE;

  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
