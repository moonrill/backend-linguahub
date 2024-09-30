import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import { CouponService } from '#/coupon/coupon.service';
import { ServiceService } from '#/service/service.service';
import { UserCoupons } from '#/users/entities/user-coupons.entity';
import { UsersService } from '#/users/users.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, Repository } from 'typeorm';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import {
  QueryServiceRequestDto,
  ServiceRequestSortBy,
  ServiceRequestStatus,
} from './dto/query.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(UserCoupons)
    private userCouponsRepository: Repository<UserCoupons>,
    private serviceService: ServiceService,
    private userService: UsersService,
    private couponService: CouponService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    queryDto: QueryServiceRequestDto,
  ) {
    try {
      const { page, limit } = paginationDto;

      const whereClause = {};

      if (queryDto.status) {
        whereClause['status'] = queryDto.status;
      } else {
        whereClause['status'] = In([
          ServiceRequestStatus.PENDING,
          ServiceRequestStatus.CANCELLED,
          ServiceRequestStatus.REJECTED,
        ]);
      }

      const orderBy = {};

      switch (queryDto.sortBy) {
        case ServiceRequestSortBy.DATE:
          orderBy['createdAt'] = queryDto.order;
          break;
        case ServiceRequestSortBy.PRICE:
          orderBy['totalPrice'] = queryDto.order;
          break;
      }

      const [data, total] = await this.bookingRepository.findAndCount({
        where: whereClause,
        relations: [
          'translator.user.userDetail',
          'user.userDetail',
          'service.sourceLanguage',
          'service.targetLanguage',
        ],
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
      newServiceRequest.duration = this.calculateDuration(
        createServiceRequestDto.startAt,
        createServiceRequestDto.endAt,
      );
      newServiceRequest.status = BookingStatus.PENDING;

      // Price
      newServiceRequest.serviceFee =
        service.pricePerHour * newServiceRequest.duration;
      newServiceRequest.systemFee = 0.1 * newServiceRequest.serviceFee;

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

        newServiceRequest.discountAmount = discountAmount;
        newServiceRequest.coupon = coupon;
        totalPrice = totalPrice - discountAmount;
      }

      newServiceRequest.totalPrice = totalPrice;

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

    // Round up
    return Math.round(duration * 60) / 60;
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
          'translator.translatorLanguages.language',
          'service.sourceLanguage',
          'service.targetLanguage',
          'coupon',
          'user.userDetail',
        ],
      });

      return data;
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

      if (serviceRequest.status !== BookingStatus.PENDING) {
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
      newServiceRequest.duration = this.calculateDuration(
        updateServiceRequestDto.startAt,
        updateServiceRequestDto.endAt,
      );

      if (updateServiceRequestDto.serviceId) {
        const service = await this.serviceService.findById(
          updateServiceRequestDto.serviceId,
        );

        if (service.translator.id !== serviceRequest.translator.id) {
          throw new BadRequestException('Translator and service not match');
        }

        newServiceRequest.service = service;
        newServiceRequest.serviceFee =
          service.pricePerHour * newServiceRequest.duration;
        newServiceRequest.systemFee = 0.1 * newServiceRequest.serviceFee;
      }

      let totalPrice =
        newServiceRequest.serviceFee + newServiceRequest.systemFee;

      if (updateServiceRequestDto.couponId) {
        // Handle Old Coupon first
        const { coupon: oldCoupon } = serviceRequest;

        if (oldCoupon) {
          const oldUserCoupon = await this.userCouponsRepository.findOne({
            where: {
              user: {
                id: userId,
              },
              coupon: {
                id: oldCoupon.id,
              },
            },
          });

          await this.markCoupon(oldUserCoupon, 'unused');
        }

        const coupon = await this.couponService.findById(
          updateServiceRequestDto.couponId,
        );

        const userCoupon = await this.userCouponsRepository.findOne({
          where: {
            user: {
              id: userId,
            },
            coupon: {
              id: coupon.id,
            },
          },
        });

        this.validateUserCoupon(userCoupon);

        this.couponService.checkCoupon(coupon, 'use');

        const discountAmount = (coupon.discountPercentage / 100) * totalPrice;

        await this.markCoupon(userCoupon, 'used');

        newServiceRequest.discountAmount = discountAmount;
        newServiceRequest.coupon = coupon;
        totalPrice = totalPrice - discountAmount;
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

      if (serviceRequest.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Service request already cancelled');
      }

      await this.bookingRepository.update(
        { id },
        { status: BookingStatus.CANCELLED },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Success cancel service request',
      };
    } catch (error) {
      throw error;
    }
  }
}
