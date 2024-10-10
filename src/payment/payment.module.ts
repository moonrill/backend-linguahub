import { Translator } from '#/translator/entities/translator.entity';
import { UsersModule } from '#/users/users.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Translator]),
    forwardRef(() => UsersModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
