import { LanguageService } from '#/language/language.service';
import { SpecializationService } from '#/specialization/specialization.service';
import { User } from '#/users/entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, EntityNotFoundError, Repository } from 'typeorm';
import { CreateTranslatorDto } from './dto/create-translator.dto';
import { TranslatorLanguages } from './entities/translator-languages.entity';
import { TranslatorSpecializations } from './entities/translator-specializations.entity';
import { Translator, TranslatorStatus } from './entities/translator.entity';

@Injectable()
export class TranslatorService {
  constructor(
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    private configService: ConfigService,
    private languageService: LanguageService,
    private specializationService: SpecializationService,
  ) {}

  private async getUser(
    userId: string,
    transactionalEntityManager: EntityManager,
  ): Promise<User> {
    return transactionalEntityManager.findOneOrFail(User, {
      where: { id: userId },
    });
  }

  async create(
    createTranslatorDto: CreateTranslatorDto,
    transactionEntityManager: EntityManager,
  ) {
    try {
      const user = await this.getUser(
        createTranslatorDto.userId,
        transactionEntityManager,
      );
      const newTranslator = await this.createTranslator(
        createTranslatorDto,
        user,
        transactionEntityManager,
      );

      await this.saveLanguages(
        createTranslatorDto.languages,
        newTranslator,
        transactionEntityManager,
      );
      await this.saveSpecializations(
        createTranslatorDto.specializations,
        newTranslator,
        transactionEntityManager,
      );

      await this.updateUserWithTranslator(
        user,
        newTranslator,
        transactionEntityManager,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createTranslator(
    createTranslatorDto: CreateTranslatorDto,
    user: User,
    transactionalEntityManager: EntityManager,
  ): Promise<Translator> {
    const newTranslator = new Translator();
    Object.assign(newTranslator, {
      status: TranslatorStatus.PENDING,
      yearsOfExperience: createTranslatorDto.yearsOfExperience,
      portfolioLink: createTranslatorDto.portfolioLink,
      bank: createTranslatorDto.bank,
      bankAccountNumber: createTranslatorDto.bankAccountNumber,
      cv: this.getDocumentUrl('cv', createTranslatorDto.cv),
      certificate: this.getDocumentUrl(
        'certificate',
        createTranslatorDto.certificate,
      ),
      user: user,
    });

    return transactionalEntityManager.save(Translator, newTranslator);
  }

  private getDocumentUrl(type: 'cv' | 'certificate', filename: string): string {
    const baseUrl = this.configService.get('BASE_URL');
    return `${baseUrl}/uploads/documents/${type}/${filename}`;
  }

  private async saveLanguages(
    languageIds: string[],
    translator: Translator,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const translatorLanguages = await Promise.all(
      languageIds.map(async (languageId) => {
        const language = await this.languageService.findById(languageId);
        const translatorLanguage = new TranslatorLanguages();
        translatorLanguage.translator = translator;
        translatorLanguage.language = language;
        return translatorLanguage;
      }),
    );

    await transactionalEntityManager.save(
      TranslatorLanguages,
      translatorLanguages,
    );
  }

  private async saveSpecializations(
    specializationIds: string[],
    translator: Translator,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const translatorSpecializations = await Promise.all(
      specializationIds.map(async (specializationId) => {
        const specialization = await this.specializationService.findById(
          specializationId,
        );
        const translatorSpecialization = new TranslatorSpecializations();
        translatorSpecialization.translator = translator;
        translatorSpecialization.specialization = specialization;
        return translatorSpecialization;
      }),
    );

    await transactionalEntityManager.save(
      TranslatorSpecializations,
      translatorSpecializations,
    );
  }

  private async updateUserWithTranslator(
    user: User,
    translator: Translator,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    user.translator = translator;
    await transactionalEntityManager.save(User, user);
  }

  async findByUserId(userId: string) {
    try {
      return await this.translatorRepository.findOneOrFail({
        where: {
          user: {
            id: userId,
          },
        },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Translator not found');
      }
    }
  }
}
