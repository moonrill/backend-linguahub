import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '#/payment/entities/payment.entity';
import { Translator } from '#/translator/entities/translator.entity';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Translator)
    private readonly translatorRepository: Repository<Translator>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getAdminDashboardData() {
    try {
      const totalClientPayments = await this.paymentRepository.sum('amount', {
        status: PaymentStatus.PAID,
        paymentType: PaymentType.CLIENT,
      });

      const totalTranslatorPayments =
        (await this.paymentRepository.sum('amount', {
          status: PaymentStatus.PAID,
          paymentType: PaymentType.TRANSLATOR,
        })) || 0;

      const { totalEarnings } = await this.bookingRepository
        .createQueryBuilder('booking')
        .select('SUM(booking.systemFee)', 'totalEarnings')
        .where('booking.bookingStatus = :status', {
          status: BookingStatus.COMPLETED,
        })
        .getRawOne();

      const [_, totalBookings] = await this.bookingRepository.findAndCount({
        where: { bookingStatus: BookingStatus.COMPLETED },
      });

      const chartData = [
        { month: 'January', income: 0, expense: 0 },
        { month: 'February', income: 0, expense: 0 },
        { month: 'March', income: 0, expense: 0 },
        { month: 'April', income: 0, expense: 0 },
        { month: 'May', income: 0, expense: 0 },
        { month: 'June', income: 0, expense: 0 },
        { month: 'July', income: 0, expense: 0 },
        { month: 'August', income: 0, expense: 0 },
        { month: 'September', income: 0, expense: 0 },
        { month: 'October', income: 0, expense: 0 },
        { month: 'November', income: 0, expense: 0 },
        { month: 'December', income: 0, expense: 0 },
      ];

      const result = await this.bookingRepository
        .createQueryBuilder('booking')
        .select(
          "TO_CHAR(DATE_TRUNC('month', booking.bookingDate), 'Month')",
          'month',
        )
        .addSelect(`SUM(booking.serviceFee + booking.systemFee)`, 'income')
        .addSelect('COALESCE(SUM(booking.discountAmount), 0)', 'expense')
        .where('booking.bookingStatus = :status', {
          status: BookingStatus.COMPLETED,
        })
        .groupBy(`DATE_TRUNC('month', booking.bookingDate)`)
        .orderBy(`DATE_TRUNC('month', booking.bookingDate)`)
        .getRawMany();

      const monthlyPayment = chartData.map((cd) => {
        const data = result.find((row) => row.month.trim() === cd.month);
        return {
          month: cd.month,
          income: data ? Number(data.income) : 0,
          expense: data ? Number(data.expense) : 0,
        };
      });

      const { couponTotal } = await this.bookingRepository
        .createQueryBuilder('booking')
        .select('COALESCE(SUM(booking.discountAmount), 0)', 'couponTotal')
        .where('booking.bookingStatus = :status', {
          status: BookingStatus.COMPLETED,
        })
        .getRawOne();

      return {
        data: {
          totalClientPayments,
          totalTranslatorPayments,
          totalEarnings: Number(totalEarnings),
          totalBookings,
          monthlyPayment,
          couponTotal: Number(couponTotal),
        },
        statusCode: HttpStatus.OK,
        message: 'Success get admin dashboard data',
      };
    } catch (error) {
      throw error;
    }
  }

  async getTranslatorDashboardData(translatorId: string) {
    try {
      const translator = await this.translatorRepository.findOneOrFail({
        where: {
          id: translatorId,
        },
      });

      const [_, bookingCompletedCount] =
        await this.bookingRepository.findAndCount({
          where: {
            translator: { id: translatorId },
            bookingStatus: BookingStatus.COMPLETED,
          },
        });

      const [__, requestCount] = await this.bookingRepository.findAndCount({
        where: {
          translator: { id: translatorId },
        },
      });

      const translatorEarnings =
        (await this.paymentRepository.sum('amount', {
          translator: { id: translatorId },
          status: PaymentStatus.PAID,
        })) || 0;

      const result = await this.paymentRepository
        .createQueryBuilder('payment')
        .select(
          "TO_CHAR(DATE_TRUNC('month', payment.createdAt), 'Month')",
          'month',
        )
        .addSelect('SUM(payment.amount)', 'income')
        .where('payment.translator.id = :translatorId', { translatorId })
        .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
        .groupBy("DATE_TRUNC('month', payment.createdAt)")
        .orderBy("DATE_TRUNC('month', payment.createdAt)")
        .getRawMany();

      const chartData = [
        { month: 'January', income: 0 },
        { month: 'February', income: 0 },
        { month: 'March', income: 0 },
        { month: 'April', income: 0 },
        { month: 'May', income: 0 },
        { month: 'June', income: 0 },
        { month: 'July', income: 0 },
        { month: 'August', income: 0 },
        { month: 'September', income: 0 },
        { month: 'October', income: 0 },
        { month: 'November', income: 0 },
        { month: 'December', income: 0 },
      ];

      const monthlyIncome = chartData.map((cd) => {
        const data = result.find((row) => row.month.trim() === cd.month);
        return {
          month: cd.month,
          income: data ? Number(data.income) : 0,
        };
      });

      return {
        data: {
          translatorEarnings,
          translatorRating: translator.rating,
          bookingCompletedCount,
          requestCount,
          monthlyIncome,
        },
        statusCode: HttpStatus.OK,
        message: 'Success get translator dashboard data',
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Translator not found');
      } else {
        throw error;
      }
    }
  }
}
