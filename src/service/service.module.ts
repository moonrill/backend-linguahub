import { Booking } from '#/booking/entities/booking.entity';
import { LanguageModule } from '#/language/language.module';
import { Translator } from '#/translator/entities/translator.entity';
import { TranslatorModule } from '#/translator/translator.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Translator, Booking]),
    forwardRef(() => TranslatorModule),
    LanguageModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
