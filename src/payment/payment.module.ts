import { Booking } from '#/booking/entities/booking.entity';
import { GoogleCalendarModule } from '#/google-calendar/google-calendar.module';
import { Translator } from '#/translator/entities/translator.entity';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Translator, Booking]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(
            configService.get<string>('MIDTRANS_SERVER_KEY') + ':',
          ).toString('base64')}`,
        },
      }),
      inject: [ConfigService],
    }),
    GoogleCalendarModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
