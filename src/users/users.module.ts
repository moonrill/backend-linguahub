import { RoleModule } from '#/role/role.module';
import { TranslatorModule } from '#/translator/translator.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetail } from './entities/user-detail.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDetail]),
    RoleModule,
    TranslatorModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
