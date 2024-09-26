import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import { ServiceService } from '#/service/service.service';
import { TranslatorService } from '#/translator/translator.service';
import { UsersService } from '#/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private translatorService: TranslatorService,
    private serviceService: ServiceService,
    private userService: UsersService,
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
      newServiceRequest.totalPrice =
        newServiceRequest.serviceFee + newServiceRequest.systemFee;

      // TODO: Add discount

      const inserted = await this.bookingRepository.insert(newServiceRequest);
      const booking = await this.bookingRepository.findOneOrFail({
        where: { id: inserted.identifiers[0].id },
      });

      return booking;
    } catch (error) {
      throw error;
    }
  }

  private calculateDuration(startAt: string, endAt: string) {
    const start = this.convertToDecimalHours(startAt);
    const end = this.convertToDecimalHours(endAt);

    let duration = end - start;

    // Round up
    return Math.round(duration * 60) / 60;
  }

  private convertToDecimalHours(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }
}
