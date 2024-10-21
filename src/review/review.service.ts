import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/query.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
  ) {}

  async create(
    bookingId: string,
    userId: string,
    createReviewDto: CreateReviewDto,
  ) {
    try {
      const booking = await this.bookingRepository.findOneOrFail({
        where: {
          id: bookingId,
          user: {
            id: userId,
          },
        },
        relations: ['translator', 'user', 'review'],
      });

      if (booking.user.id !== userId) {
        throw new UnauthorizedException('Unauthorized user');
      }

      if (booking.bookingStatus !== BookingStatus.COMPLETED) {
        throw new BadRequestException(
          'Cannot review booking when not completed',
        );
      }

      if (booking.review) {
        throw new BadRequestException('Cannot review booking twice');
      }

      const newReview = new Review();

      newReview.rating = createReviewDto.rating;
      newReview.comment = createReviewDto.comment;
      newReview.booking = booking;
      newReview.user = booking.user;
      newReview.translator = booking.translator;

      const result = await this.reviewRepository.insert(newReview);

      // Update booking
      booking.review = newReview;
      await this.bookingRepository.save(booking);

      // Update translator rating
      const newRating =
        (booking.translator.rating * booking.translator.reviewsCount +
          createReviewDto.rating) /
        (booking.translator.reviewsCount + 1);

      booking.translator.rating = Number(newRating.toFixed(1));
      booking.translator.reviewsCount += 1;
      await this.translatorRepository.save(booking.translator);

      return await this.reviewRepository.findOneOrFail({
        where: {
          id: result.identifiers[0].id,
        },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Booking not found');
      } else {
        throw error;
      }
    }
  }

  async findAll(paginationDto: PaginationDto, queryDto: ReviewQueryDto) {
    try {
      const { page, limit } = paginationDto;
      const { date, rating } = queryDto;

      const whereClause = {};

      if (rating) {
        whereClause['rating'] = rating;
      }

      const [data, total] = await this.reviewRepository.findAndCount({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        order: {
          createdAt: date,
        },
        relations: ['booking', 'user.userDetail', 'translator.user.userDetail'],
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
}
