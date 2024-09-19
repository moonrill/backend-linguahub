import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Event } from 'src/event/event.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const event = await this.eventRepository.findOneBy({ id: createCouponDto.eventId });
    const coupon = this.couponRepository.create({ ...createCouponDto, event });
    return this.couponRepository.save(coupon);
  }

  findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({ relations: ['event'] });
  }

  findOne(id: string): Promise<Coupon> {
    return this.couponRepository.findOne({ where: { id }, relations: ['event'] });
  }

  async remove(id: string): Promise<void> {
    await this.couponRepository.delete(id);
  }
}
  