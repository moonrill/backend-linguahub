import { TranslatorSpecializations } from '#/translator/entities/translator-specializations.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { TranslatorModule } from '#/translator/translator.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Specialization } from './entities/specialization.entity';
import { SpecializationController } from './specialization.controller';
import { SpecializationService } from './specialization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Specialization,
      Translator,
      TranslatorSpecializations,
    ]),
    forwardRef(() => TranslatorModule),
  ],
  controllers: [SpecializationController],
  providers: [SpecializationService],
  exports: [SpecializationService],
})
export class SpecializationModule {}
