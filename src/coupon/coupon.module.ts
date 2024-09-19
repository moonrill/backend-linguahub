import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { Coupon } from './coupon.entity';
import { Event } from '../event/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, Event])],
  providers: [CouponService],
  controllers: [CouponController],
})
export class CouponModule {}
