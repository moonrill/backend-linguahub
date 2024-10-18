import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { PaginationDto } from '#/utils/pagination.dto';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { EntityNotFoundError, In, Repository } from 'typeorm';
import { PaymentQueryDto, PaymentSortBy } from './dto/query.dto';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(bookingId: string, userId: string) {
    try {
      // Check if already created payment
      const isPaymentExists = await this.paymentRepository.findOne({
        where: {
          booking: { id: bookingId },
          user: { id: userId },
        },
      });

      if (isPaymentExists) {
        return { token: isPaymentExists.token };
      }

      // Search Booking
      const booking = await this.bookingRepository.findOneOrFail({
        where: {
          id: bookingId,
          user: { id: userId },
        },
        relations: ['translator.user.userDetail', 'user.userDetail'],
      });

      if (booking.bookingStatus !== BookingStatus.UNPAID) {
        throw new BadRequestException('Cannot create payment for paid booking');
      }

      const orderId = randomUUID();

      // Create Midtrans Payment Payload
      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: booking.totalPrice,
        },
        item_details: [
          {
            id: bookingId,
            price: booking.totalPrice,
            quantity: 1,
            name: `${booking.translator.user.userDetail.fullName} - Service`,
          },
        ],
        customer_details: {
          first_name: booking.user.userDetail.fullName,
          email: booking.user.email,
          phone: booking.user.userDetail.phoneNumber,
          billing_address: {
            address: `${booking.user.userDetail.subDistrict}, ${booking.user.userDetail.district}`,
            city: booking.user.userDetail.city,
          },
          credit_card: {
            secure: true,
          },
        },
      };

      const { data } = await lastValueFrom(
        this.httpService.post(
          'https://app.sandbox.midtrans.com/snap/v1/transactions',
          payload,
        ),
      );

      const newPayment = new Payment();

      newPayment.id = orderId;
      newPayment.token = data.token;
      newPayment.amount = booking.totalPrice;
      newPayment.paymentType = PaymentType.CLIENT;
      newPayment.status = PaymentStatus.PENDING;
      newPayment.user = booking.user;
      newPayment.booking = booking;

      await this.paymentRepository.insert(newPayment);

      return data;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Booking not found');
      } else {
        throw error;
      }
    }
  }

  async updatePaymentStatus(data: any) {
    try {
      const paymentId = data.order_id;
      const hash = createHash('sha512')
        .update(
          `${paymentId}${data.status_code}${
            data.gross_amount
          }${this.configService.get('MIDTRANS_SERVER_KEY')}`,
        )
        .digest('hex');

      // Verify signature
      if (data.signature_key !== hash) {
        throw new BadRequestException('Invalid Signature Key');
      }

      const payment = await this.findById(paymentId);

      let responseData = null;
      const transactionStatus = data.transaction_status;
      const fraudStatus = data.fraud_status;
      let bookingStatus = null;
      let paymentStatus = null;

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
          bookingStatus = BookingStatus.IN_PROGRESS;
          paymentStatus = PaymentStatus.PAID;
        }
      } else if (transactionStatus === 'settlement') {
        bookingStatus = BookingStatus.IN_PROGRESS;
        paymentStatus = PaymentStatus.PAID;
      } else if (
        transactionStatus === 'cancel' ||
        transactionStatus === 'deny' ||
        transactionStatus === 'expire'
      ) {
        paymentStatus = PaymentStatus.FAILED;
        bookingStatus = BookingStatus.UNPAID;
      } else if (transactionStatus === 'pending') {
        paymentStatus = PaymentStatus.PENDING;
        bookingStatus = BookingStatus.UNPAID;
      }

      await this.paymentRepository.update(paymentId, { status: paymentStatus });
      await this.bookingRepository.update(payment.booking.id, {
        bookingStatus,
      });

      responseData = await this.paymentRepository.findOneOrFail({
        where: { id: paymentId },
      });

      return {
        statusCode: HttpStatus.OK,
        data: responseData,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    queryDto: PaymentQueryDto,
    type?: 'user' | 'translator',
    id?: string,
  ) {
    try {
      const { page, limit } = paginationDto;
      const { status, sortBy, order } = queryDto;

      const whereClause = {};
      const relations = [
        'booking.service.sourceLanguage',
        'booking.service.targetLanguage',
        'booking.translator.user.userDetail',
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

      const paymentStatus = Object.values(PaymentStatus);

      if (status) {
        whereClause['status'] = status;
      } else {
        whereClause['status'] = In(paymentStatus);
      }

      const orderBy = {};

      switch (sortBy) {
        case PaymentSortBy.DATE:
          orderBy['createdAt'] = order;
          break;
        case PaymentSortBy.PRICE:
          orderBy['amount'] = order;
          break;
      }

      const [data, total] = await this.paymentRepository.findAndCount({
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
