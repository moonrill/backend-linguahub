import { BookingModule } from '#/booking/booking.module';
import { Booking } from '#/booking/entities/booking.entity';
import { LanguageModule } from '#/language/language.module';
import { ReviewModule } from '#/review/review.module';
import { ServiceRequestModule } from '#/service-request/service-request.module';
import { Service } from '#/service/entities/service.entity';
import { SpecializationModule } from '#/specialization/specialization.module';
import { User } from '#/users/entities/user.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslatorLanguages } from './entities/translator-languages.entity';
import { TranslatorSpecializations } from './entities/translator-specializations.entity';
import { Translator } from './entities/translator.entity';
import { TranslatorController } from './translator.controller';
import { TranslatorService } from './translator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Translator,
      User,
      TranslatorLanguages,
      TranslatorSpecializations,
      Booking,
      Service,
    ]),
    LanguageModule,
    ReviewModule,
    forwardRef(() => BookingModule),
    forwardRef(() => SpecializationModule),
    forwardRef(() => ServiceRequestModule),
  ],
  controllers: [TranslatorController],
  providers: [TranslatorService],
  exports: [TranslatorService],
})
export class TranslatorModule {}
