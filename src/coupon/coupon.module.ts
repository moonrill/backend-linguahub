import { EventModule } from '#/event/event.module';
import { UserCoupons } from '#/users/entities/user-coupons.entity';
import { User } from '#/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../event/entities/event.entity';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon } from './entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, Event, UserCoupons, User]),
    EventModule,
  ],
  providers: [CouponService],
  controllers: [CouponController],
})
export class CouponModule {}
