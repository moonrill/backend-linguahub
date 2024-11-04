import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus, PaymentType } from '../entities/payment.entity';

export enum PaymentSortBy {
  DATE = 'date',
  PRICE = 'price',
}

export class PaymentQueryDto {
  @IsOptional()
  @IsEnum(PaymentType)
  type: PaymentType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentSortBy)
  sortBy: PaymentSortBy = PaymentSortBy.DATE;

  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
