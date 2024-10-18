import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '../entities/payment.entity';

export enum PaymentSortBy {
  DATE = 'date',
  PRICE = 'price',
}

export class PaymentQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentSortBy)
  sortBy: PaymentSortBy = PaymentSortBy.DATE;

  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
