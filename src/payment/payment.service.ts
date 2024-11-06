import { Booking, BookingStatus } from '#/booking/entities/booking.entity';
import { GoogleCalendarService } from '#/google-calendar/google-calendar.service';
import { Translator } from '#/translator/entities/translator.entity';
import { PaginationDto } from '#/utils/pagination.dto';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { Response } from 'express';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { lastValueFrom } from 'rxjs';
import { Between, EntityNotFoundError, In, Repository } from 'typeorm';
import { PaymentExportDto } from './dto/export.dto';
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
    private readonly googleCalendarService: GoogleCalendarService,
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

  async createTranslatorPayment(booking: Booking) {
    try {
      const uuid = randomUUID();
      const payload = {
        payment_type: 'bank_transfer',
        transaction_details: {
          order_id: uuid,
          gross_amount: booking.serviceFee,
        },
        bank_transfer: {
          bank: booking.translator.bank,
          va_number: booking.translator.bankAccountNumber,
        },
        customer_details: {
          name: booking.translator.user.userDetail.fullName,
          email: booking.translator.user.email,
          phone: booking.translator.user.userDetail.phoneNumber,
        },
        metadata: {
          paymentType: PaymentType.TRANSLATOR,
          bookingId: booking.id,
          translatorId: booking.translator.id,
        },
      };

      // const { data } = lastValueFrom(
      //   this.httpService.post(
      //     'https://app.sandbox.midtrans.com/snap/v2/charge',
      //     payload,
      //   ),
      // );

      // Create payment for translator
      const newPayment = new Payment();

      newPayment.id = uuid;
      newPayment.booking = booking;
      newPayment.translator = booking.translator;
      newPayment.status = PaymentStatus.PENDING;
      newPayment.amount = booking.serviceFee;
      newPayment.paymentType = PaymentType.TRANSLATOR;

      await this.paymentRepository.insert(newPayment);
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
      let paymentMethod = null;

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
          bookingStatus = BookingStatus.IN_PROGRESS;
          paymentStatus = PaymentStatus.PAID;
          paymentMethod = data.payment_type;
        }
      } else if (transactionStatus === 'settlement') {
        bookingStatus = BookingStatus.IN_PROGRESS;
        paymentStatus = PaymentStatus.PAID;
        paymentMethod = data.payment_type;
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

      if (paymentMethod) {
        await this.paymentRepository.update(paymentId, {
          paymentMethod,
        });
      }

      await this.paymentRepository.update(paymentId, { status: paymentStatus });
      await this.bookingRepository.update(payment.booking.id, {
        bookingStatus,
      });

      responseData = await this.paymentRepository.findOneOrFail({
        where: { id: paymentId },
      });

      // Add Booking To Calendar
      if (bookingStatus === BookingStatus.IN_PROGRESS) {
        const booking = await this.bookingRepository.findOneOrFail({
          where: { id: payment.booking.id },
          relations: [
            'translator.user.userDetail',
            'user.userDetail',
            'service.sourceLanguage',
            'service.targetLanguage',
          ],
        });

        await this.googleCalendarService.addBookingToCalendar(
          'client',
          booking,
        );
        await this.googleCalendarService.addBookingToCalendar(
          'translator',
          booking,
        );
      }

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
    role?: 'user' | 'translator',
    id?: string,
  ) {
    try {
      const { page, limit } = paginationDto;
      const { status, sortBy, order, type } = queryDto;

      const whereClause = {};
      const relations = [
        'booking.service.sourceLanguage',
        'booking.service.targetLanguage',
        'booking.translator.user.userDetail',
        'booking.user.userDetail',
      ];

      if (role === 'user') {
        whereClause['user'] = {
          id,
        };
        // relations.splice(3, 1);
      } else if (role === 'translator') {
        whereClause['translator'] = {
          id,
        };
        // relations.splice(2, 1);
      }

      const paymentStatus = Object.values(PaymentStatus);

      if (status) {
        whereClause['status'] = status;
      } else {
        whereClause['status'] = In(paymentStatus);
      }

      const orderBy = {};

      if (type) {
        whereClause['paymentType'] = type;
      }

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

  async generateInvoice(id: string, res: Response) {
    try {
      const payment = await this.paymentRepository.findOneOrFail({
        where: { id },
        relations: ['booking.service', 'user.userDetail'],
      });

      const templatePath = path.resolve(__dirname, 'templates', 'invoice.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      const template = handlebars.compile(templateContent);

      const data = {
        paymentId: payment.id,
        paymentDate: payment.createdAt
          .toLocaleDateString('en-UK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
          .replace('at ', ', '),
        clientName: payment.user.userDetail.fullName,
        clientEmail: payment.user.email,
        clientAddress: `${payment.user.userDetail.street}, ${payment.user.userDetail.city}, ${payment.user.userDetail.province}`,
        clientPhone: payment.user.userDetail.phoneNumber,
        bookingId: payment.booking.id,
        bookingDate: payment.booking.bookingDate.toLocaleString('en-UK', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        serviceName: payment.booking.service.name,
        serviceDuration: `${payment.booking.duration} Hours`,
        servicePrice: `Rp${payment.booking.service.pricePerHour.toLocaleString(
          'id-ID',
        )}`,
        amount: `Rp${payment.booking.serviceFee.toLocaleString('id-ID')}`,
        systemFee: `Rp${payment.booking.systemFee.toLocaleString('id-ID')}`,
        totalAmount: `Rp${payment.amount.toLocaleString('id-ID')}`,
        paymentMethod: payment.paymentMethod,
      };

      if (payment.booking.discountAmount) {
        data['discount'] = `Rp${payment.booking.discountAmount.toLocaleString(
          'id-ID',
        )}`;
      }

      const html = template(data);

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--allow-file-access-from-files',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
        timeout: 120000,
      });

      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(120000);

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      });

      await browser.close();

      const buffer = Buffer.from(pdf);

      const filename = `invoice_${payment.id}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=${filename}`,
      });

      res.end(pdf);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Payment not found');
      } else {
        throw error;
      }
    }
  }

  async refundClientPayment(id: string) {
    try {
      const payment = await this.paymentRepository.findOneOrFail({
        where: {
          booking: { id },
          paymentType: PaymentType.CLIENT,
        },
      });

      const payload = {
        amount: payment.amount,
        reason: 'Cancellation from client',
      };

      lastValueFrom(
        this.httpService.post(
          `https://api.sandbox.midtrans.com/v2/${payment.id}/refund`,
          payload,
        ),
      );

      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.REFUND,
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Payment not found');
      } else {
        throw error;
      }
    }
  }

  async updatePaymentProof(id: string, proof: string) {
    try {
      const payment = await this.paymentRepository.findOneOrFail({
        where: { id },
      });

      await this.paymentRepository.update(id, {
        proof,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Success update proof',
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Booking not found');
      } else {
        throw error;
      }
    }
  }

  async deleteProof(id: string) {
    try {
      const payment = await this.paymentRepository.findOneOrFail({
        where: { id },
      });

      if (!payment.proof) {
        throw new BadRequestException('Proof not found');
      }

      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'uploads',
        'images',
        'proof',
        'payment',
        payment.proof,
      );

      await fs.unlink(filePath);

      await this.paymentRepository.update(payment.id, {
        proof: null,
      });

      return {
        data: payment,
        statusCode: HttpStatus.OK,
        message: 'Success delete proof',
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Booking not found');
      } else {
        throw error;
      }
    }
  }

  async completeTranslatorPayment(id: string, translatorId: string) {
    try {
      const payment = await this.findById(id);

      if (payment.translator.id !== translatorId) {
        throw new ForbiddenException(
          'You are not allowed to complete this payment',
        );
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Only pending payment can be completed');
      }

      await this.paymentRepository.update(id, {
        status: PaymentStatus.PAID,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Success complete payment',
      };
    } catch (error) {
      throw error;
    }
  }

  async export(dto: PaymentExportDto, res: Response, user: any) {
    try {
      const { startDate, endDate, paymentType, status } = dto;

      const whereClause = {
        createdAt: Between(new Date(startDate), new Date(endDate)),
        status: In(status),
      };

      if (user.role === 'translator') {
        whereClause['translator'] = {
          id: user.translatorId,
        };
      }

      if (paymentType) {
        whereClause['paymentType'] = In(paymentType);
      }

      const [payments, total] = await this.paymentRepository.findAndCount({
        where: whereClause,
        relations: [
          'booking.user.userDetail',
          'booking.translator.user.userDetail',
        ],
      });

      const data = {
        generatedAt: new Date()
          .toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
          .replace(' at ', ', '),
        startDate: new Date(startDate).toLocaleDateString('en-UK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        endDate: new Date(endDate).toLocaleDateString('en-UK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        isAdmin: user.role === 'admin',
        totalData: total,
        payments,
      };

      handlebars.registerHelper('formatDate', function (date) {
        return new Date(date)
          .toLocaleString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
          .replace('at ', ', ');
      });

      handlebars.registerHelper('formatCurrency', function (amount) {
        return `Rp${amount.toLocaleString('id-ID')}`;
      });

      handlebars.registerHelper('eq', function (a, b) {
        return a === b;
      });

      const templatePath = path.join(__dirname, 'templates', 'report.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      const compiledTemplate = handlebars.compile(templateContent);
      const html = compiledTemplate(data);

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--allow-file-access-from-files',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
        timeout: 120000,
      });

      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<p></p>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: right; width: 100%; padding: 0 20px;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
      });

      await browser.close();

      const fileName = `payment-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=${fileName}`,
      });

      res.end(pdf);
    } catch (error) {
      res.status(500).send({
        message: 'Error generating payment report',
        error: error.message,
      });
    }
  }
}
