import { Translator } from '#/translator/entities/translator.entity';
import { UsersService } from '#/users/users.service';
import { PaginationDto } from '#/utils/pagination.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    private userService: UsersService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    try {
      const newPayment = new Payment();

      newPayment.amount = createPaymentDto.amount;
      newPayment.paymentType = createPaymentDto.paymentType;
      newPayment.status = PaymentStatus.PENDING;

      if (createPaymentDto.paymentType === PaymentType.CLIENT) {
        const user = await this.userService.findById(createPaymentDto.userId);

        newPayment.user = user;
      } else if (createPaymentDto.paymentType === PaymentType.TRANSLATOR) {
        const translator = await this.translatorRepository.findOne({
          where: {
            id: createPaymentDto.translatorId,
          },
        });

        if (!translator) {
          throw new NotFoundException('Translator not found');
        }

        newPayment.translator = translator;
      }

      const result = await this.paymentRepository.insert(newPayment);

      return this.paymentRepository.findOneOrFail({
        where: {
          id: result.identifiers[0].id,
        },
      });
    } catch (error) {
      throw new error();
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.paymentRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['user.userDetail', 'translator.user.userDetail', 'booking'],
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
      const data = await this.paymentRepository.findOneOrFail({
        where: { id },
        relations: ['user.userDetail', 'translator.user.userDetail', 'booking'],
      });

      return data;
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException('Payment not found');
      } else {
        throw e;
      }
    }
  }
}
