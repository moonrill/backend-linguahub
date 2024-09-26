import { Event } from '#/event/entities/event.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const event = await this.eventRepository.findOneBy({
      id: createCouponDto.eventId,
    });
    const coupon = this.couponRepository.create({ ...createCouponDto, event });
    return this.couponRepository.save(coupon);
  }

  findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({ relations: ['event'] });
  }

  findOne(id: string): Promise<Coupon> {
    return this.couponRepository.findOne({
      where: { id },
      relations: ['event'],
    });
  }

  async remove(id: string): Promise<void> {
    await this.couponRepository.delete(id);
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    console.log(updateCouponDto); // Tambahkan log untuk melihat data yang dikirimkan
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    const event = await this.eventRepository.findOneBy({
      id: updateCouponDto.eventId,
    });
    if (!event) {
      throw new NotFoundException(
        `Event with ID ${updateCouponDto.eventId} not found`,
      );
    }

    this.couponRepository.merge(coupon, updateCouponDto);
    return this.couponRepository.save(coupon);
  }
}
