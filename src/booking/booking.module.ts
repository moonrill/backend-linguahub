import { PaymentModule } from '#/payment/payment.module';
import { TranslatorModule } from '#/translator/translator.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    forwardRef(() => TranslatorModule),
    PaymentModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
