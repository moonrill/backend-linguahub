import { BookingService } from '#/booking/booking.service';
import { BookingQueryDto } from '#/booking/dto/query.dto';
import { BookingStatus } from '#/booking/entities/booking.entity';
import { LanguageService } from '#/language/language.service';
import { MailService } from '#/mail/mail.service';
import { PaymentQueryDto } from '#/payment/dto/query.dto';
import { PaymentService } from '#/payment/payment.service';
import { ReviewQueryDto } from '#/review/dto/query.dto';
import { ReviewService } from '#/review/review.service';
import { QueryServiceRequestDto } from '#/service-request/dto/query.dto';
import { ServiceRequestService } from '#/service-request/service-request.service';
import { Service, ServiceStatus } from '#/service/entities/service.entity';
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
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(TranslatorLanguages)
    private translatorLanguagesRepository: Repository<TranslatorLanguages>,
    @Inject(forwardRef(() => SpecializationService))
    private specializationService: SpecializationService,
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    @Inject(forwardRef(() => BookingService))
    private bookingService: BookingService,
    private mailService: MailService,
    private languageService: LanguageService,
    private reviewService: ReviewService,
    private paymentService: PaymentService,
    private dataSource: DataSource,
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
          'services',
          'translatorLanguages.language',
          'translatorSpecializations.specialization',
          'reviews',
        ],
        where: {
          status: TranslatorStatus.APPROVED,
        },
        order: {
          reviewsCount: 'DESC',
        },
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
    const { translatorLanguages, translatorSpecializations, ...detail } =
      translator;

    const languages = translatorLanguages.map((tl) => ({
      ...tl.language,
    }));
    const specializations = translatorSpecializations.map((ts) => ({
      ...ts.specialization,
    }));

    let lowestServicePrice;

    if (detail.services && detail.services.length > 0) {
      lowestServicePrice = detail.services.reduce((prev, current) =>
        prev.pricePerHour < current.pricePerHour ? prev : current,
      ).pricePerHour;
    }

    return {
      ...detail,
      languages,
      specializations,
      lowestServicePrice,
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
        order: {
          reviews: {
            createdAt: 'DESC',
          },
          services: {
            pricePerHour: 'ASC',
          },
        },
      });

      data.reviews = data.reviews.slice(0, 5);

      const destructedTranslator = this.destructTranslator(data);

      return { ...destructedTranslator };
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

      // Query to filter and sort at database level
      const query = this.translatorRepository
        .createQueryBuilder('translator')
        .leftJoinAndSelect('translator.user', 'user')
        .leftJoinAndSelect('user.userDetail', 'userDetail')
        .leftJoinAndSelect('translator.services', 'services')
        .leftJoinAndSelect('services.sourceLanguage', 'sourceLanguage')
        .leftJoinAndSelect('services.targetLanguage', 'targetLanguage')
        .leftJoinAndSelect(
          'translator.translatorLanguages',
          'translatorLanguages',
        )
        .leftJoinAndSelect('translatorLanguages.language', 'language')
        .leftJoinAndSelect(
          'translator.translatorSpecializations',
          'translatorSpecializations',
        )
        .leftJoinAndSelect(
          'translatorSpecializations.specialization',
          'specialization',
        )
        .leftJoinAndSelect('translator.reviews', 'reviews')
        .where('translator.status = :status', {
          status: TranslatorStatus.APPROVED,
        })
        .andWhere('services.status = :serviceStatus', {
          serviceStatus: ServiceStatus.ACTIVE,
        })
        .andWhere('sourceLanguage.name ILIKE :sourceLanguage', {
          sourceLanguage: `%${searchTranslatorDto.sourceLanguage}%`,
        })
        .andWhere('targetLanguage.name ILIKE :targetLanguage', {
          targetLanguage: `%${searchTranslatorDto.targetLanguage}%`,
        });

      // Apply sorting
      switch (searchTranslatorDto.sortBy) {
        case TranslatorSortBy.RATING:
          query.addOrderBy('translator.rating', 'DESC');
          break;
        case TranslatorSortBy.PRICE:
          query.addOrderBy('services.pricePerHour', 'ASC');
          break;
        case TranslatorSortBy.MOST_REVIEWED:
          query.addOrderBy('translator.reviewsCount', 'DESC');
          break;
        default:
          query.addOrderBy('translator.rating', 'DESC');
      }

      // Pagination
      query.skip((page - 1) * limit).take(limit);

      const [data, total] = await query.getManyAndCount();

      // Prepare the final result
      const result = data.map((translator) => {
        return this.destructTranslator(translator);
      });

      const totalPages = Math.ceil(total / limit);

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
        default:
          whereClause = {
            status: TranslatorStatus.PENDING,
          };
      }

      const [data, total] = await this.translatorRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        where: whereClause,
        relations: [
          'user.userDetail',
          'translatorLanguages.language',
          'translatorSpecializations.specialization',
        ],
      });

      const totalPages = Math.ceil(total / limit);

      const result = data.map((translator) => {
        return this.destructTranslator(translator);
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
        // Hapus semua languages yang ada
        await transactionEntityManager
          .createQueryBuilder()
          .delete()
          .from('translator_languages')
          .where('translator_id = :translatorId', { translatorId: id })
          .execute();

        // Hapus semua specializations yang ada
        await transactionEntityManager
          .createQueryBuilder()
          .delete()
          .from('translator_specializations')
          .where('translator_id = :translatorId', { translatorId: id })
          .execute();

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

  async findBestTranslators() {
    try {
      const data = await this.translatorRepository.find({
        relations: [
          'bookings',
          'user.userDetail',
          'translatorLanguages.language',
          'translatorSpecializations.specialization',
        ],
        where: {
          status: TranslatorStatus.APPROVED,
        },
      });

      // Hitung jumlah booking dengan status COMPLETED untuk setiap translator
      const translatorsWithCompletedBookings = data.map((t) => {
        const {
          translatorLanguages,
          translatorSpecializations,
          ...translator
        } = t;

        const completedBookingsCount = translator.bookings.filter(
          (booking) => booking.bookingStatus === BookingStatus.COMPLETED,
        ).length;

        // Skor gabungan: kombinasi antara rating dan jumlah booking yang diselesaikan
        const combinedScore =
          translator.rating * 0.6 + completedBookingsCount * 0.4;

        const languages = translatorLanguages.map(
          (translatorLanguage) => translatorLanguage.language,
        );

        const specializations = translatorSpecializations.map(
          (translatorSpecialization) => translatorSpecialization.specialization,
        );

        return {
          ...translator,
          languages,
          specializations,
          completedBookingsCount,
          combinedScore,
        };
      });

      // Urutkan berdasarkan skor gabungan dari yang tertinggi ke yang terendah
      const sortedTranslators = translatorsWithCompletedBookings
        .sort((a, b) => {
          return b.combinedScore - a.combinedScore;
        })
        .slice(0, 3);

      return sortedTranslators;
    } catch (error) {
      throw error;
    }
  }

  async getTranslatorReviews(
    translatorId: string,
    queryDto: ReviewQueryDto,
    paginationDto: PaginationDto,
  ) {
    try {
      const result = await this.reviewService.findAll(
        paginationDto,
        queryDto,
        translatorId,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getServices(paginationDto: PaginationDto, translatorId: string) {
    try {
      const { page, limit } = paginationDto;

      const [data, total] = await this.serviceRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        where: { translator: { id: translatorId } },
        relations: ['sourceLanguage', 'targetLanguage'],
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        totalPages,
        limit,
        page,
      };
    } catch (error) {
      throw error;
    }
  }

  async getTranslatorLanguages(translatorId: string) {
    try {
      const data = await this.translatorLanguagesRepository.find({
        where: { translator: { id: translatorId } },
        relations: ['language'],
      });

      const languages = data.map((d) => d.language);

      return languages;
    } catch (error) {
      throw error;
    }
  }

  async getTranslatorPayments(
    translatorId: string,
    paginationDto: PaginationDto,
    queryDto: PaymentQueryDto,
  ) {
    try {
      const result = await this.paymentService.findAll(
        paginationDto,
        queryDto,
        'translator',
        translatorId,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateBio(id: string, bio: string) {
    try {
      const translator = await this.findById(id);

      const translatorEntity = new Translator();

      translatorEntity.bio = bio;

      await this.translatorRepository.update(id, translatorEntity);

      return this.translatorRepository.findOneOrFail({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }
}
