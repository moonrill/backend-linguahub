import { Role } from '#/role/entities/role.entity';
import { User } from '#/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [SeederService],
})
export class SeederModule {}
