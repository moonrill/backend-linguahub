import { LanguageService } from '#/language/language.service';
import {
  Translator,
  TranslatorStatus,
} from '#/translator/entities/translator.entity';
import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceStatus } from './entities/service.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    @Inject(forwardRef(() => TranslatorService))
    private translatorService: TranslatorService,
    private languageService: LanguageService,
  ) {}

  async create(createServiceDto: CreateServiceDto, userId: string) {
    try {
      const translator = await this.translatorService.findByUserId(userId);

      if (translator.status !== TranslatorStatus.APPROVED) {
        throw new ForbiddenException(
          'Sorry but you cant create service now. Please check your email for more information.',
        );
      }

      const sourceLanguage = await this.languageService.findById(
        createServiceDto.sourceLanguageId,
      );
      const targetLanguage = await this.languageService.findById(
        createServiceDto.targetLanguageId,
      );

      if (sourceLanguage.id === targetLanguage.id) {
        throw new BadRequestException(
          'Source and target language cannot be same',
        );
      }

      const service = new Service();
      service.name = createServiceDto.name;
      service.sourceLanguage = sourceLanguage;
      service.targetLanguage = targetLanguage;
      service.translator = translator;
      service.pricePerHour = createServiceDto.pricePerHour;
      service.status = ServiceStatus.ACTIVE;

      const insertResult = await this.serviceRepository.insert(service);

      return await this.serviceRepository.findOneOrFail({
        where: {
          id: insertResult.identifiers[0].id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto, price: string) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.serviceRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        relations: {
          sourceLanguage: true,
          targetLanguage: true,
          translator: true,
        },
        order: {
          pricePerHour: price as 'ASC' | 'DESC',
        },
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
      return await this.serviceRepository.findOneOrFail({
        where: {
          id,
        },
        relations: {
          sourceLanguage: true,
          targetLanguage: true,
          translator: true,
        },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Service not found');
      } else {
        throw error;
      }
    }
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    try {
      const oldData = await this.findById(id);

      const sourceLanguage = await this.languageService.findById(
        updateServiceDto.sourceLanguageId,
      );
      const targetLanguage = await this.languageService.findById(
        updateServiceDto.targetLanguageId,
      );

      if (sourceLanguage.id === targetLanguage.id) {
        throw new BadRequestException(
          'Source and target language cannot be same',
        );
      }

      const newService = new Service();

      newService.name = updateServiceDto.name;
      newService.sourceLanguage = sourceLanguage;
      newService.targetLanguage = targetLanguage;
      newService.translator = oldData.translator;
      newService.pricePerHour = updateServiceDto.pricePerHour;

      await this.serviceRepository.update(id, newService);

      return await this.serviceRepository.findOneOrFail({
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async toggleStatus(id: string) {
    try {
      const service = await this.findById(id);
      service.status =
        service.status === ServiceStatus.ACTIVE
          ? ServiceStatus.INACTIVE
          : ServiceStatus.ACTIVE;
      await this.serviceRepository.update(id, service);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findById(id);
      await this.serviceRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete service',
      };
    } catch (error) {
      throw error;
    }
  }
}
