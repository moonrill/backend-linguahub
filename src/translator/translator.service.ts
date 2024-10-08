import { BookingService } from '#/booking/booking.service';
import { BookingQueryDto } from '#/booking/dto/query.dto';
import { LanguageService } from '#/language/language.service';
import { MailService } from '#/mail/mail.service';
import { QueryServiceRequestDto } from '#/service-request/dto/query.dto';
import { ServiceRequestService } from '#/service-request/service-request.service';
import { ServiceStatus } from '#/service/entities/service.entity';
import { SpecializationService } from '#/specialization/specialization.service';
import { Translator } from '#/translator/entities/translator.entity';
import { User } from '#/users/entities/user.entity';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  EntityNotFoundError,
  Repository,
} from 'typeorm';
import { CreateTranslatorDto } from './dto/create-translator.dto';
import { RegistrationQueryDto } from './dto/registration-query.dto';
import {
  SearchTranslatorDto,
  TranslatorSortBy,
} from './dto/search-translator.dto';
import { UpdateTranslatorDto } from './dto/update-translator.dto';
import { TranslatorLanguages } from './entities/translator-languages.entity';
import { TranslatorSpecializations } from './entities/translator-specializations.entity';
import { TranslatorStatus } from './entities/translator.entity';

@Injectable()
export class TranslatorService {
  constructor(
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    private dataSource: DataSource,
    private languageService: LanguageService,
    @Inject(forwardRef(() => SpecializationService))
    private specializationService: SpecializationService,
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    private mailService: MailService,
    @Inject(forwardRef(() => BookingService))
    private bookingService: BookingService,
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
      cv: createTranslatorDto.cv,
      certificate: createTranslatorDto.certificate,
      user: user,
    });

    return transactionalEntityManager.save(Translator, newTranslator);
  }

  private async saveLanguages(
    languageIds: string[],
    translator: Translator,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const translatorLanguages = await Promise.all(
      languageIds.map(async (languageId) => {
        const language = await this.languageService.findById(languageId);

        // Check if translator already has this language
        const isExists = await transactionalEntityManager.findOne(
          TranslatorLanguages,
          {
            where: {
              translator: { id: translator.id },
              language: { id: language.id },
            },
          },
        );

        // Skip if translator already has this language
        if (isExists) {
          return null;
        }

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

        // Check if translator already has this specialization
        const isExists = await transactionalEntityManager.findOne(
          TranslatorSpecializations,
          {
            where: {
              translator: { id: translator.id },
              specialization: { id: specialization.id },
            },
          },
        );

        // Skip if translator already has this specialization
        if (isExists) {
          return null;
        }

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

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.translatorRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        relations: [
          'user.userDetail',
          'translatorLanguages.language',
          'translatorSpecializations.specialization',
          'reviews',
        ],
      });

      const translators = data.map((translator) =>
        this.destructTranslator(translator),
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: translators,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  destructTranslator(translator: Translator) {
    const { translatorLanguages, translatorSpecializations, user, ...detail } =
      translator;

    const languages = translatorLanguages.map((tl) => ({
      id: tl.language.id,
      name: tl.language.name,
      flagImage: tl.language.flagImage,
    }));
    const specializations = translatorSpecializations.map((ts) => ({
      id: ts.specialization.id,
      name: ts.specialization.name,
    }));
    const { userDetail, email } = user;

    const { id, createdAt, updatedAt, deletedAt, ...restUserDetail } =
      userDetail;

    const translatorDetail = { email, ...restUserDetail, ...detail };

    return {
      ...translatorDetail,
      languages,
      specializations,
    };
  }

  async findById(id: string) {
    try {
      const data = await this.translatorRepository.findOneOrFail({
        where: {
          id,
        },
        relations: [
          'user.userDetail',
          'translatorLanguages.language',
          'translatorSpecializations.specialization',
          'services',
          'services.sourceLanguage',
          'services.targetLanguage',
          'reviews.user.userDetail',
        ],
      });

      const reviewsData = data.reviews.map((review) => {
        const { user, ...restReview } = review;

        return {
          ...restReview,
          client: {
            fullName: user.userDetail.fullName,
            profileImage: user.userDetail.profilePicture,
          },
        };
      });

      const { reviews, ...destructedTranslator } =
        this.destructTranslator(data);

      return { ...destructedTranslator, reviews: reviewsData };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Translator not found');
      }
    }
  }

  async searchByService(
    searchTranslatorDto: SearchTranslatorDto,
    paginationDto: PaginationDto,
  ) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.translatorRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status: TranslatorStatus.APPROVED,
          services: {
            status: ServiceStatus.ACTIVE,
            sourceLanguage: {
              id: searchTranslatorDto.sourceLanguageId,
            },
            targetLanguage: {
              id: searchTranslatorDto.targetLanguageId,
            },
          },
        },
        relations: [
          'user.userDetail',
          'services',
          'services.sourceLanguage',
          'services.targetLanguage',
          'translatorLanguages.language',
          'translatorSpecializations.specialization',
          'reviews',
        ],
      });

      const translatorWithServices = data.map((translator) => {
        const { services, ...detail } = translator;
        const relevantServices = services.filter(
          (service) =>
            service.sourceLanguage.id ===
              searchTranslatorDto.sourceLanguageId &&
            service.targetLanguage.id === searchTranslatorDto.targetLanguageId,
        );

        return {
          ...detail,
          services: relevantServices,
        };
      });

      const destructuredTranslators = translatorWithServices.map((translator) =>
        this.destructTranslator(translator),
      );

      let sortedData = [];

      switch (searchTranslatorDto.sortBy) {
        case TranslatorSortBy.RATING:
          sortedData = destructuredTranslators.sort((a, b) => {
            if (a.rating > b.rating) return -1;
            if (a.rating < b.rating) return 1;
            return 0;
          });
          break;
        case TranslatorSortBy.PRICE:
          sortedData = destructuredTranslators.sort((a, b) => {
            const aMinPrice = Math.min(
              ...a.services.map((s) => s.pricePerHour),
            );
            const bMinPrice = Math.min(
              ...b.services.map((s) => s.pricePerHour),
            );
            return aMinPrice - bMinPrice;
          });
          break;
        case TranslatorSortBy.MOST_REVIEWS:
          sortedData = destructuredTranslators.sort(
            (a, b) => b.reviewsCount - a.reviewsCount,
          );
          break;
        default:
          sortedData = destructuredTranslators;
      }

      const totalPages = Math.ceil(total / limit);

      const result = sortedData.map((translator) => {
        const { services, reviews, ...rest } = translator;
        return rest;
      });

      return {
        data: result,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async getRegistration(
    paginationDto: PaginationDto,
    registrationQueryDto: RegistrationQueryDto,
  ) {
    try {
      const { page, limit } = paginationDto;

      let whereClause = {};

      switch (registrationQueryDto.status) {
        case TranslatorStatus.APPROVED:
          whereClause = {
            status: TranslatorStatus.APPROVED,
          };
          break;
        case TranslatorStatus.PENDING:
          whereClause = {
            status: TranslatorStatus.PENDING,
          };
          break;
        case TranslatorStatus.REJECTED:
          whereClause = {
            status: TranslatorStatus.REJECTED,
          };
          break;
      }

      const [data, total] = await this.translatorRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        where: whereClause,
        relations: ['user.userDetail'],
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateTranslatorStatus(
    id: string,
    status: TranslatorStatus,
    reason?: string,
  ) {
    try {
      const translator = await this.translatorRepository.findOneOrFail({
        where: { id },
        relations: ['user.userDetail'],
      });

      if (translator.status !== TranslatorStatus.PENDING) {
        throw new ConflictException('Translator already approved or rejected');
      }

      if (status === TranslatorStatus.REJECTED && !reason) {
        throw new BadRequestException('Reason is required for rejection');
      }

      // Update the status and set the rejection reason if applicable
      const translatorEntity = new Translator();
      translatorEntity.status = status;

      if (status === TranslatorStatus.REJECTED) {
        translatorEntity.rejectionReason = reason;
      }

      await this.translatorRepository.update(id, translatorEntity);

      await this.mailService.sendTranslatorRegistrationEmail(
        translator,
        status,
        reason,
      );

      return this.translatorRepository.findOneOrFail({
        where: { id },
        relations: ['user.userDetail'],
      });
    } catch (error) {
      throw error;
    }
  }

  async getTranslatorServiceRequests(
    userId: string,
    paginationDto: PaginationDto,
    queryDto: QueryServiceRequestDto,
  ) {
    try {
      const translator = await this.findByUserId(userId);

      const result = await this.serviceRequestService.findAll(
        paginationDto,
        queryDto,
        'translator',
        translator.id,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getTranslatorBookings(
    userId: string,
    paginationDto: PaginationDto,
    queryDto: BookingQueryDto,
  ) {
    try {
      const translator = await this.findByUserId(userId);

      const result = await this.bookingService.findAll(
        paginationDto,
        queryDto,
        'translator',
        translator.id,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateTranslatorDto: UpdateTranslatorDto) {
    try {
      const translator = await this.translatorRepository.findOneOrFail({
        where: { id },
        relations: ['user.userDetail'],
      });

      if (translator.status !== TranslatorStatus.APPROVED) {
        throw new ConflictException(
          'Cannot update. Translator is not approved',
        );
      }

      return this.dataSource.transaction(async (transactionEntityManager) => {
        const translatorEntity = new Translator();

        translatorEntity.yearsOfExperience =
          updateTranslatorDto.yearsOfExperience;
        translatorEntity.portfolioLink = updateTranslatorDto.portfolioLink;
        translatorEntity.bank = updateTranslatorDto.bank;
        translatorEntity.bankAccountNumber =
          updateTranslatorDto.bankAccountNumber;

        await this.saveLanguages(
          updateTranslatorDto.languages,
          translator,
          transactionEntityManager,
        );
        await this.saveSpecializations(
          updateTranslatorDto.specializations,
          translator,
          transactionEntityManager,
        );

        await this.translatorRepository.update(id, translatorEntity);

        return this.translatorRepository.findOneOrFail({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Translator not found');
      } else {
        throw error;
      }
    }
  }
}
