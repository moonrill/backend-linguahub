import { Booking } from '#/booking/entities/booking.entity';
import { CouponModule } from '#/coupon/coupon.module';
import { ServiceModule } from '#/service/service.module';
import { TranslatorModule } from '#/translator/translator.module';
import { UserCoupons } from '#/users/entities/user-coupons.entity';
import { UsersModule } from '#/users/users.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, UserCoupons]),
    forwardRef(() => ServiceModule),
    CouponModule,
    forwardRef(() => TranslatorModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
