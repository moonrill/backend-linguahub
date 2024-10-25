import { Booking } from '#/booking/entities/booking.entity';
import { User } from '#/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleCalendarService } from './google-calendar.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking])],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
