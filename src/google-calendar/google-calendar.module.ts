import { Booking } from '#/booking/entities/booking.entity';
import { User } from '#/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking])],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
  controllers: [GoogleCalendarController],
})
export class GoogleCalendarModule {}
