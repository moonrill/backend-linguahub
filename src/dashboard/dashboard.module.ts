import { Booking } from '#/booking/entities/booking.entity';
import { Payment } from '#/payment/entities/payment.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Translator, Payment])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
