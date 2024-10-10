import { IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { PaymentType } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNotEmpty()
  bookingId: string;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ValidateIf((o) => o.paymentType === PaymentType.CLIENT)
  @IsNotEmpty()
  userId: string;

  @ValidateIf((o) => o.paymentType === PaymentType.TRANSLATOR)
  @IsNotEmpty()
  translatorId: string;
}
