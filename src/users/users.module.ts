import { BookingModule } from '#/booking/booking.module';
import { PaymentModule } from '#/payment/payment.module';
import { Role } from '#/role/entities/role.entity';
import { RoleModule } from '#/role/role.module';
import { ServiceRequestModule } from '#/service-request/service-request.module';
import { TranslatorModule } from '#/translator/translator.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCoupons } from './entities/user-coupons.entity';
import { UserDetail } from './entities/user-detail.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDetail, Role, UserCoupons]),
    RoleModule,
    PaymentModule,
    forwardRef(() => BookingModule),
    forwardRef(() => TranslatorModule),
    forwardRef(() => ServiceRequestModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
