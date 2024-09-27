import { Role } from '#/role/entities/role.entity';
import { RoleModule } from '#/role/role.module';
import { TranslatorModule } from '#/translator/translator.module';
import { Module } from '@nestjs/common';
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
    TranslatorModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
