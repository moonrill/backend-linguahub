import { LanguageModule } from '#/language/language.module';
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
    ]),
    LanguageModule,
    forwardRef(() => SpecializationModule),
  ],
  controllers: [TranslatorController],
  providers: [TranslatorService],
  exports: [TranslatorService],
})
export class TranslatorModule {}
