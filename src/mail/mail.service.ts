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
        // to: translator.user.email,
        to: 'arilramadani245@gmail.com',
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
}
