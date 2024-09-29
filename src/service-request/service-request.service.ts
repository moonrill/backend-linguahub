import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import { CouponService } from '#/coupon/coupon.service';
import { ServiceService } from '#/service/service.service';
import { TranslatorService } from '#/translator/translator.service';
import { UserCoupons } from '#/users/entities/user-coupons.entity';
import { UsersService } from '#/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(UserCoupons)
    private userCouponsRepository: Repository<UserCoupons>,
    private translatorService: TranslatorService,
    private serviceService: ServiceService,
    private userService: UsersService,
    private couponService: CouponService,
  ) {}

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

        await this.markCouponAsUsed(userCoupon);

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

  private async markCouponAsUsed(userCoupon: UserCoupons) {
    const userCouponEntity = new UserCoupons();

    userCouponEntity.isUsed = true;
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
}
