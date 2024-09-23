import { User } from '#/users/entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateTranslatorDto } from './dto/create-translator.dto';
import { Translator, TranslatorStatus } from './entities/translator.entity';

@Injectable()
export class TranslatorService {
  constructor(
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  // TODO: Add language and specialization
  async create(createTranslatorDto: CreateTranslatorDto) {
    try {
      const newTranslator = new Translator();

      newTranslator.status = TranslatorStatus.INACTIVE;
      newTranslator.yearsOfExperience = createTranslatorDto.yearsOfExperience;
      newTranslator.portfolioLink = createTranslatorDto.portfolioLink;
      newTranslator.bank = createTranslatorDto.bank;
      newTranslator.bankAccountNumber = createTranslatorDto.bankAccountNumber;

      // Handle Upload Documents
      const baseUrl = this.configService.get('BASE_URL');
      newTranslator.cv = `${baseUrl}/uploads/documents/cv/${createTranslatorDto.cv}`;
      newTranslator.certificate = `${baseUrl}/uploads/documents/certificate/${createTranslatorDto.certificate}`;

      const user = await this.userRepository.findOneOrFail({
        where: {
          id: createTranslatorDto.userId,
        },
      });

      newTranslator.user = user;

      const insertTranslator = await this.translatorRepository.insert(
        newTranslator,
      );

      user.translator = insertTranslator.identifiers[0].id;

      await this.userRepository.update(user.id, user);

      return await this.translatorRepository.findOneOrFail({
        where: {
          id: insertTranslator.identifiers[0].id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findByUserId(userId: string) {
    try {
      return await this.translatorRepository.findOneOrFail({
        where: {
          user: {
            id: userId,
          },
        },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Translator not found');
      }
    }
  }
}
