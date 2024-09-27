import { Event } from '#/event/entities/event.entity';
import { EventService } from '#/event/event.service';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { PaginationDto } from './../utils/pagination.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponQueryDto } from './dto/query.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon, CouponStatus } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private eventService: EventService,
  ) {}

  async create(createCouponDto: CreateCouponDto) {
    try {
      const event = await this.eventService.findById(createCouponDto.eventId);

      const newCoupon = new Coupon();

      newCoupon.name = createCouponDto.name;
      newCoupon.description = createCouponDto.description;
      newCoupon.status = createCouponDto.status;
      newCoupon.expiredAt = createCouponDto.expiredAt;
      newCoupon.discountPercentage = createCouponDto.discountPercentage;
      newCoupon.event = event;

      const insertedCoupon = await this.couponRepository.insert(newCoupon);

      return this.couponRepository.findOneOrFail({
        where: { id: insertedCoupon.identifiers[0].id },
        relations: ['event'],
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto, couponQueryDto: CouponQueryDto) {
    try {
      const { page, limit } = paginationDto;

      let whereClause = {};

      switch (couponQueryDto.status) {
        case CouponStatus.ACTIVE:
          whereClause = { status: CouponStatus.ACTIVE };
          break;
        case CouponStatus.INACTIVE:
          whereClause = { status: CouponStatus.INACTIVE };
          break;
      }

      const [data, total] = await this.couponRepository.findAndCount({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        relations: ['event'],
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
      const data = await this.couponRepository.findOneOrFail({
        where: { id },
        relations: ['event'],
      });

      return data;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Coupon not found');
      } else {
        throw error;
      }
    }
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    try {
      const coupon = await this.findById(id);

      const newCoupon = new Coupon();
      newCoupon.name = updateCouponDto.name;
      newCoupon.description = updateCouponDto.description;
      newCoupon.expiredAt = updateCouponDto.expiredAt;
      newCoupon.discountPercentage = updateCouponDto.discountPercentage;

      await this.couponRepository.update(id, newCoupon);
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findById(id);

      await this.couponRepository.softDelete(id);

      return { statusCode: HttpStatus.OK, message: 'Success delete coupon' };
    } catch (error) {
      throw error;
    }
  }
}
