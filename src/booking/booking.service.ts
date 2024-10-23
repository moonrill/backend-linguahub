import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, Repository } from 'typeorm';
import { BookingQueryDto, BookingSortBy } from './dto/query.dto';
import {
  Booking,
  BookingRequestStatus,
  BookingStatus,
} from './entities/booking.entity';

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

      const whereClause = {
        requestStatus: BookingRequestStatus.APPROVED,
      };
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
          orderBy['bookingDate'] = order;
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
          'review.user.userDetail',
        ],
      });

      const { translator, ...restData } = data;

      const destructedTranslator = this.translatorService.destructTranslator(
        data.translator,
      );

      return {
        ...restData,
        translator: destructedTranslator,
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Booking not found');
      } else {
        throw error;
      }
    }
  }

  async completeBooking(id: string, userId: string) {
    try {
      const booking = await this.findById(id);

      if (booking.user.id !== userId) {
        throw new UnauthorizedException('Unauthorized user');
      }

      if (booking.bookingStatus !== BookingStatus.IN_PROGRESS) {
        throw new BadRequestException('Cannot complete booking');
      }

      await this.bookingRepository.update(booking.id, {
        bookingStatus: BookingStatus.COMPLETED,
      });

      return {
        data: booking,
        statusCode: HttpStatus.OK,
        message: 'Success complete booking',
      };
    } catch (error) {
      throw error;
    }
  }

  // TODO: Handle Refund
  async cancelBooking(id: string, userId: string) {
    try {
      const booking = await this.findById(id);

      if (booking.user.id !== userId) {
        throw new UnauthorizedException('Unauthorized user');
      }

      const disallowedStatus = [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ];

      if (disallowedStatus.includes(booking.bookingStatus)) {
        throw new BadRequestException('Booking cannot be cancelled');
      }

      await this.bookingRepository.update(booking.id, {
        bookingStatus: BookingStatus.CANCELLED,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Success cancel booking',
      };
    } catch (error) {
      throw error;
    }
  }
}
