import { TranslatorSortBy } from '#/translator/dto/search-translator.dto';
import { TranslatorSpecializations } from '#/translator/entities/translator-specializations.entity';
import {
  Translator,
  TranslatorStatus,
} from '#/translator/entities/translator.entity';
import { TranslatorService } from '#/translator/translator.service';
import { PaginationDto } from '#/utils/pagination.dto';
import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, ILike, Repository } from 'typeorm';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { SpecializationQueryDto } from './dto/query.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { Specialization } from './entities/specialization.entity';

@Injectable()
export class SpecializationService {
  constructor(
    @InjectRepository(Specialization)
    private specializationRepository: Repository<Specialization>,
    @InjectRepository(TranslatorSpecializations)
    private translatorSpecializationRepository: Repository<TranslatorSpecializations>,
    @InjectRepository(Translator)
    private translatorRepository: Repository<Translator>,
    @Inject(forwardRef(() => TranslatorService))
    private translatorService: TranslatorService,
  ) {}

  async create(createSpecializationDto: CreateSpecializationDto) {
    try {
      const existName = await this.specializationRepository.findOne({
        where: {
          name: ILike(`%${createSpecializationDto.name}%`),
        },
      });

      if (existName) {
        throw new BadRequestException('Specialization already exist');
      }

      const newSpecialization = new Specialization();

      newSpecialization.name = createSpecializationDto.name;
      newSpecialization.logo = createSpecializationDto.logo;

      const result = await this.specializationRepository.insert(
        newSpecialization,
      );

      return await this.specializationRepository.findOneOrFail({
        where: { id: result.identifiers[0].id },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    queryDto: SpecializationQueryDto,
  ) {
    try {
      const { page, limit } = paginationDto;

      const queryBuilder = this.specializationRepository
        .createQueryBuilder('specialization')
        .leftJoin(
          'specialization.translatorSpecializations',
          'translatorSpecializations',
        )
        .select([
          'specialization.id',
          'specialization.name',
          'specialization.logo',
          'specialization.createdAt',
          'specialization.updatedAt',
        ])
        .addSelect(
          'COUNT(DISTINCT translatorSpecializations.translator_id)',
          'translatorCount',
        )
        .groupBy('specialization.id')
        .orderBy(`specialization.${queryDto.orderBy}`, queryDto.direction);

      const offset = (page - 1) * limit;

      const total = await queryBuilder.getCount();

      const rawData = await queryBuilder
        .offset(offset)
        .limit(limit)
        .getRawAndEntities();

      const transformedData = rawData.entities.map((entity, index) => {
        const rawTranslatorCount = rawData.raw[index].translatorCount;

        return {
          ...entity,
          translatorCount: parseInt(rawTranslatorCount) || 0,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: transformedData,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async findByName(
    name: string,
    paginationDto: PaginationDto,
    sortBy?: TranslatorSortBy, // Optional sorting parameter
  ) {
    try {
      const { page, limit } = paginationDto;

      // Create a query using QueryBuilder
      const query = this.translatorSpecializationRepository
        .createQueryBuilder('translatorSpecialization')
        .leftJoinAndSelect(
          'translatorSpecialization.specialization',
          'specialization',
        )
        .leftJoinAndSelect('translatorSpecialization.translator', 'translator')
        .leftJoinAndSelect('translator.user', 'user')
        .leftJoinAndSelect('user.userDetail', 'userDetail')
        .leftJoinAndSelect('translator.services', 'services')
        .leftJoinAndSelect('services.sourceLanguage', 'sourceLanguage')
        .leftJoinAndSelect('services.targetLanguage', 'targetLanguage')
        .leftJoinAndSelect(
          'translator.translatorLanguages',
          'translatorLanguages',
        )
        .leftJoinAndSelect('translatorLanguages.language', 'language')
        .leftJoinAndSelect(
          'translator.translatorSpecializations',
          'translatorSpecializations',
        )
        .leftJoinAndSelect('translatorSpecializations.specialization', 'spec')
        .leftJoinAndSelect('translator.reviews', 'reviews')
        .where('specialization.name ILIKE :name', { name: `%${name}%` })
        .andWhere('translator.status = :status', {
          status: TranslatorStatus.APPROVED,
        });

      // Apply sorting based on sortBy parameter
      switch (sortBy) {
        case 'rating':
          query.addOrderBy('translator.rating', 'DESC');
          break;
        case 'price':
          query.addOrderBy('services.pricePerHour', 'ASC');
          break;
        case 'mostReviewed':
          query.addOrderBy('translator.reviewsCount', 'DESC');
          break;
        default:
          query.addOrderBy('translator.rating', 'DESC');
      }

      // Apply pagination
      query.skip((page - 1) * limit).take(limit);

      // Execute the query
      const [data, total] = await query.getManyAndCount();

      if (data.length === 0 || !data[0].specialization) {
        throw new NotFoundException('Specialization not found');
      }

      // Destructure translator data
      const destructedTranslators = data.map((ts) =>
        this.translatorService.destructTranslator(ts.translator),
      );

      const totalPages = Math.ceil(total / limit);

      const result = {
        ...data[0].specialization,
        translators: destructedTranslators, // Sorted translators
      };

      return {
        data: result,
        total,
        page,
        totalPages,
        limit,
      };
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Specialization not found');
      } else {
        throw error;
      }
    }
  }

  async findById(id: string) {
    try {
      const data = await this.specializationRepository.findOneOrFail({
        where: {
          id,
        },
      });

      return data;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException('Specialization not found');
      } else {
        throw error;
      }
    }
  }

  async update(id: string, updateSpecializationDto: UpdateSpecializationDto) {
    try {
      const oldData = await this.findById(id);

      const isNameExist = await this.specializationRepository.findOne({
        where: {
          name: ILike(updateSpecializationDto.name),
        },
      });

      if (isNameExist && oldData.name !== updateSpecializationDto.name) {
        throw new BadRequestException('Specialization already exist');
      }

      const newSpecialization = new Specialization();

      newSpecialization.name = updateSpecializationDto.name;

      if (updateSpecializationDto.logo) {
        newSpecialization.logo = updateSpecializationDto.logo;
      }

      await this.specializationRepository.update(id, newSpecialization);

      return await this.specializationRepository.findOneOrFail({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findById(id);

      await this.specializationRepository.softDelete(id);

      await this.translatorSpecializationRepository.softDelete({
        specialization: {
          id,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Success delete specialization',
      };
    } catch (e) {
      throw e;
    }
  }
}
