import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, Repository } from 'typeorm';
import { BookingQueryDto, BookingSortBy } from './dto/query.dto';
import { Booking, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @Inject(forwardRef(() => TranslatorService))
    private translatorService: TranslatorService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    queryDto: BookingQueryDto,
    type?: 'user' | 'translator',
    id?: string,
  ) {
    try {
      const { page, limit } = paginationDto;
      const { status, sortBy, order } = queryDto;

      const whereClause = {};
      const relations = [
        'service.sourceLanguage',
        'service.targetLanguage',
        'translator.user.userDetail',
        'user.userDetail',
      ];

      if (type === 'user') {
        whereClause['user'] = {
          id,
        };
        relations.splice(3, 1);
      } else if (type === 'translator') {
        whereClause['translator'] = {
          id,
        };
        relations.splice(2, 1);
      }

      const bookingStatus = Object.values(BookingStatus);
      if (status) {
        whereClause['bookingStatus'] = status;
      } else {
        whereClause['bookingStatus'] = In(bookingStatus);
      }

      const orderBy = {};

      switch (sortBy) {
        case BookingSortBy.DATE:
          orderBy['createdAt'] = order;
          break;
        case BookingSortBy.PRICE:
          orderBy['totalPrice'] = order;
          break;
      }

      const [data, total] = await this.bookingRepository.findAndCount({
        where: whereClause,
        relations,
        order: orderBy,
        skip: (page - 1) * limit,
        take: limit,
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

  async findById(id: string) {
    try {
      const data = await this.bookingRepository.findOneOrFail({
        where: { id },
        relations: [
          'translator.user.userDetail',
          'translator.translatorSpecializations.specialization',
          'translator.translatorLanguages.language',
          'translator.reviews',
          'service.sourceLanguage',
          'service.targetLanguage',
          'coupon',
          'user.userDetail',
          'review',
        ],
      });

      const { translator, ...restData } = data;

      const {
        services,
        specializations,
        languages,
        reviews,
        ...restTranslator
      } = this.translatorService.destructTranslator(data.translator);

      const destructTranslator = {
        ...restTranslator,
        languages: languages.splice(0, 3),
      };

      return {
        ...restData,
        translator: destructTranslator,
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Booking not found');
      } else {
        throw error;
      }
    }
  }
}
