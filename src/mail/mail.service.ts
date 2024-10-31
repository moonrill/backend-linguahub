import { Booking } from '#/booking/entities/booking.entity';
import {
  Translator,
  TranslatorStatus,
} from '#/translator/entities/translator.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailService: MailerService) {}

  async sendTranslatorRegistrationEmail(
    translator: Translator,
    status: TranslatorStatus,
    reason: string = null,
  ) {
    try {
      const subject = 'LinguaHub - Translator Registration Status Update';

      await this.mailService.sendMail({
        subject,
        // TODO: Change this
        to: translator.user.email,
        // to: 'arilramadani245@gmail.com',
        template: 'translator-register',
        context: {
          subject,
          translatorName: translator.user.userDetail.fullName,
          isApproved: status === TranslatorStatus.APPROVED,
          reason,
          status: status.toLowerCase(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async sendServiceRequestEmail(
    subject: string,
    status: 'approved' | 'rejected',
    serviceRequest: Booking,
  ) {
    try {
      let discount = null;

      if (serviceRequest.discountAmount) {
        discount = serviceRequest.discountAmount.toLocaleString('id-ID');
      }

      await this.mailService.sendMail({
        subject,
        // TODO: Change this
        to: serviceRequest.user.email,
        // to: 'gandarafathurrhman@gmail.com',
        template: 'service-request',
        context: {
          subject,
          status: status.toLowerCase(),
          userName: serviceRequest.user.userDetail.fullName,
          isApproved: status === 'approved',
          translatorName: serviceRequest.translator.user.userDetail.fullName,
          serviceName: serviceRequest.service.name,
          bookingDate: serviceRequest.bookingDate,
          startAt: serviceRequest.startAt.slice(0, 5),
          endAt: serviceRequest.endAt.slice(0, 5),
          duration: serviceRequest.duration,
          location: serviceRequest.location,
          serviceFee: serviceRequest.serviceFee.toLocaleString('id-ID'),
          systemFee: serviceRequest.systemFee.toLocaleString('id-ID'),
          discountAmount: discount,
          totalPrice: serviceRequest.totalPrice.toLocaleString('id-ID'),
          rejectionReason: serviceRequest.rejectionReason,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
