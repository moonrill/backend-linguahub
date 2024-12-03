import { BookingSortBy } from '#/booking/dto/query.dto';
import {
  Booking,
  BookingRequestStatus,
  BookingStatus,
} from '#/booking/entities/booking.entity';
import { CouponService } from '#/coupon/coupon.service';
import { MailService } from '#/mail/mail.service';
import { ServiceService } from '#/service/service.service';
import { TranslatorService } from '#/translator/translator.service';
import { UserCoupons } from '#/users/entities/user-coupons.entity';
import { UsersService } from '#/users/users.service';
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
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestQueryDto } from './dto/query.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(UserCoupons)
    private userCouponsRepository: Repository<UserCoupons>,
    @Inject(forwardRef(() => ServiceService))
    private serviceService: ServiceService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    private couponService: CouponService,
    @Inject(forwardRef(() => TranslatorService))
    private translatorService: TranslatorService,
    private mailService: MailService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    queryDto: ServiceRequestQueryDto,
    type?: 'user' | 'translator',
    id?: string,
  ) {
    try {
      const { page, limit } = paginationDto;
      const { status, sortBy } = queryDto;

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

      const serviceRequestStatus = Object.values(BookingRequestStatus);

      if (status) {
        whereClause['requestStatus'] = status;
      } else {
        whereClause['requestStatus'] = In(serviceRequestStatus);
      }

      const orderBy = {};

      switch (sortBy) {
        case BookingSortBy.NEWEST:
          orderBy['createdAt'] = 'desc';
          break;
        case BookingSortBy.BOOKING_DATE:
          orderBy['bookingDate'] = 'desc';
          break;
        case BookingSortBy.PRICE:
          orderBy['totalPrice'] = 'desc';
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

  async create(
    userId: string,
    createServiceRequestDto: CreateServiceRequestDto,
  ) {
    try {
      const user = await this.userService.findById(userId);

      const service = await this.serviceService.findById(
        createServiceRequestDto.serviceId,
      );

      const { translator } = service;

      if (translator.id !== createServiceRequestDto.translatorId) {
        throw new BadRequestException('Translator and service not match');
      }

      const newServiceRequest = new Booking();

      // Booking Relation
      newServiceRequest.translator = translator;
      newServiceRequest.service = service;
      newServiceRequest.user = user;

      // Booking Detail
      newServiceRequest.bookingDate = createServiceRequestDto.bookingDate;
      newServiceRequest.startAt = createServiceRequestDto.startAt;
      newServiceRequest.endAt = createServiceRequestDto.endAt;
      newServiceRequest.location = createServiceRequestDto.location;
      newServiceRequest.notes = createServiceRequestDto.notes;
      newServiceRequest.duration = createServiceRequestDto.duration;
      newServiceRequest.requestStatus = BookingRequestStatus.PENDING;

      // Price
      newServiceRequest.serviceFee =
        service.pricePerHour * newServiceRequest.duration;
      newServiceRequest.systemFee = newServiceRequest.serviceFee * 0.1;

      // Total
      let totalPrice =
        newServiceRequest.serviceFee + newServiceRequest.systemFee;

      // Coupon
      if (createServiceRequestDto.couponId) {
        const coupon = await this.couponService.findById(
          createServiceRequestDto.couponId,
        );

        this.couponService.checkCoupon(coupon, 'use');

        const userCoupon = await this.userCouponsRepository.findOne({
          where: {
            user: {
              id: user.id,
            },
            coupon: {
              id: coupon.id,
            },
          },
        });

        this.validateUserCoupon(userCoupon);

        const discountAmount = (coupon.discountPercentage / 100) * totalPrice;

        await this.markCoupon(userCoupon, 'used');

        newServiceRequest.discountAmount = Math.round(discountAmount);
        newServiceRequest.coupon = coupon;
        totalPrice = totalPrice - discountAmount;
      }

      newServiceRequest.totalPrice = Math.round(totalPrice);

      const inserted = await this.bookingRepository.insert(newServiceRequest);
      const booking = await this.bookingRepository.findOneOrFail({
        where: { id: inserted.identifiers[0].id },
        relations: ['translator', 'service', 'coupon'],
      });

      return booking;
    } catch (error) {
      throw error;
    }
  }

  private validateUserCoupon(userCoupon: UserCoupons) {
    if (!userCoupon) {
      throw new BadRequestException('User has not this coupon');
    }

    if (userCoupon.isUsed) {
      throw new BadRequestException('User has already used this coupon');
    }
  }

  private async markCoupon(userCoupon: UserCoupons, as: 'used' | 'unused') {
    const userCouponEntity = new UserCoupons();

    userCouponEntity.isUsed = as === 'used';
    await this.userCouponsRepository.update(userCoupon.id, userCouponEntity);
  }

  private calculateDuration(startAt: string, endAt: string) {
    const start = this.convertToDecimalHours(startAt);
    const end = this.convertToDecimalHours(endAt);

    const duration = end - start;

    const rounded = Math.round(duration * 60) / 60;

    return Number(rounded.toFixed(1));
  }

  private convertToDecimalHours(time: string) {
    const [hours, minutes] = time.split(':').map(Number);

    return hours + minutes / 60;
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
        ],
      });

      const { translator, ...restData } = data;

      const { services, reviews, ...restTranslator } =
        this.translatorService.destructTranslator(data.translator);

      const destructTranslator = {
        ...restTranslator,
      };

      return {
        ...restData,
        translator: destructTranslator,
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Service request not found');
      } else {
        throw error;
      }
    }
  }

  async update(
    id: string,
    userId: string,
    updateServiceRequestDto: UpdateServiceRequestDto,
  ) {
    try {
      const serviceRequest = await this.findById(id);

      if (serviceRequest.user.id !== userId) {
        throw new UnauthorizedException('Unauthorized user');
      }

      if (serviceRequest.requestStatus !== BookingRequestStatus.PENDING) {
        throw new BadRequestException(
          'Sorry you cant update this service request',
        );
      }

      const newServiceRequest = new Booking();

      newServiceRequest.bookingDate = updateServiceRequestDto.bookingDate;
      newServiceRequest.startAt = updateServiceRequestDto.startAt;
      newServiceRequest.endAt = updateServiceRequestDto.endAt;
      newServiceRequest.location = updateServiceRequestDto.location;
      newServiceRequest.notes = updateServiceRequestDto.notes;
      newServiceRequest.duration = updateServiceRequestDto.duration;

      newServiceRequest.serviceFee = Math.round(
        serviceRequest.service.pricePerHour * newServiceRequest.duration,
      );
      newServiceRequest.systemFee = Math.round(
        0.1 * newServiceRequest.serviceFee,
      );

      let totalPrice =
        newServiceRequest.serviceFee + newServiceRequest.systemFee;

      if (serviceRequest.coupon) {
        const userCoupon = await this.userCouponsRepository.findOne({
          where: {
            user: { id: userId },
            coupon: { id: serviceRequest.coupon.id },
          },
        });

        if (!userCoupon) {
          throw new BadRequestException('User has not this coupon');
        }

        const discountAmount = Math.round(
          (serviceRequest.coupon.discountPercentage * totalPrice) / 100,
        );

        newServiceRequest.coupon = serviceRequest.coupon;
        newServiceRequest.discountAmount = discountAmount;

        totalPrice -= discountAmount;
      }

      newServiceRequest.totalPrice = totalPrice;

      await this.bookingRepository.update(id, newServiceRequest);

      const updatedServiceRequest = await this.findById(id);

      return updatedServiceRequest;
    } catch (error) {
      throw error;
    }
  }

  async cancelRequest(id: string, userId: string) {
    try {
      const serviceRequest = await this.findById(id);

      if (serviceRequest.user.id !== userId) {
        throw new UnauthorizedException('Unauthorized user');
      }

      if (serviceRequest.requestStatus !== BookingRequestStatus.PENDING) {
        throw new BadRequestException(
          'Only pending service request can be cancelled',
        );
      }

      await this.bookingRepository.update(
        { id },
        { requestStatus: BookingRequestStatus.CANCELLED },
      );

      // Restore Coupon
      if (serviceRequest.coupon) {
        const userCoupon = await this.userCouponsRepository.findOne({
          where: {
            user: { id: userId },
            coupon: { id: serviceRequest.coupon.id },
          },
        });

        await this.markCoupon(userCoupon, 'unused');
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Success cancel service request',
      };
    } catch (error) {
      throw error;
    }
  }

  async checkServiceRequest(id: string, translatorId: string) {
    try {
      const serviceRequest = await this.bookingRepository.findOneOrFail({
        where: { id },
        relations: [
          'user.userDetail',
          'translator.user.userDetail',
          'service',
          'coupon',
        ],
      });

      if (serviceRequest.translator.id !== translatorId) {
        throw new UnauthorizedException(
          'You are not authorized to approve this service request',
        );
      }

      if (serviceRequest.requestStatus !== BookingRequestStatus.PENDING) {
        throw new BadRequestException(
          'Only pending service request can be approved',
        );
      }

      return serviceRequest;
    } catch (error) {
      throw error;
    }
  }

  async approve(id: string, userId: string) {
    try {
      const translator = await this.translatorService.findByUserId(userId);
      const serviceRequest = await this.checkServiceRequest(id, translator.id);

      await this.bookingRepository.update(
        { id },
        {
          requestStatus: BookingRequestStatus.APPROVED,
          bookingStatus: BookingStatus.UNPAID,
        },
      );

      await this.mailService.sendServiceRequestEmail(
        'Your Service Request Has Been Approved',
        'approved',
        serviceRequest,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Success approve service request',
      };
    } catch (error) {
      throw error;
    }
  }

  async reject(id: string, userId: string, reason: string) {
    try {
      const translator = await this.translatorService.findByUserId(userId);
      const serviceRequest = await this.checkServiceRequest(id, translator.id);

      await this.bookingRepository.update(
        { id },
        {
          requestStatus: BookingRequestStatus.REJECTED,
          rejectionReason: reason,
        },
      );

      await this.mailService.sendServiceRequestEmail(
        'Your Service Request Has Been Rejected',
        'rejected',
        serviceRequest,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Success reject service request',
      };
    } catch (error) {
      throw error;
    }
  }
}
