import { IsArray, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { PaymentStatus, PaymentType } from '../entities/payment.entity';

export class PaymentExportDto {
  @IsNotEmpty()
  startDate: string;

  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsEnum(PaymentType, { each: true })
  @IsArray()
  paymentType?: PaymentType[];

  @IsNotEmpty()
  @IsEnum(PaymentStatus, { each: true })
  @IsArray()
  status: PaymentStatus[];
}
